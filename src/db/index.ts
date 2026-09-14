import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { scheduleBackups } from "./backup";
import * as schema from "./schema";

const dbFilePath = path.resolve(
	process.env.DB_FILE_NAME ?? "src/db/dictionarium.db",
);

function createClient() {
	// SQLite creates the file but not the directories above it, so make sure the directory exists.
	fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

	const client = new Database(dbFilePath, {
		// Passed straight to sqlite3_busy_timeout: same as better-sqlite3's own default, but the value is a decision,
		timeout: 5000,
	});

	// better-sqlite3 ships SQLITE_DEFAULT_FOREIGN_KEYS=1, so this is a no-op today
	client.pragma("foreign_keys = ON");

	// journal_mode lives in the database file and persists across connections, so this is a no-op after the first run.
	const [row] = client.pragma("journal_mode = WAL") as Array<{
		journal_mode: string;
	}>;

	// Setting WAL does not throw on failure, it reports back the mode it settled
	// on — a network filesystem, for one, will quietly leave us on delete.
	if (row?.journal_mode !== "wal") {
		console.error(
			`SQLite: expected WAL, got "${row?.journal_mode}" for ${dbFilePath}. ` +
			`Readers and writers will block each other.`,
		);
	}

	// Better-sqlite3 sets SQLITE_DEFAULT_SYNCHRONOUS=1, so this is a no-op today;
	client.pragma("synchronous = NORMAL");

	// Refresh query planner statistics, recommended by SQLite for long-lived connections. This writes to sqlite_stat1, and a read-only database would throw here.
	try {
		client.pragma("optimize = 0x10002");
	} catch (err) {
		console.error(`SQLite: PRAGMA optimize failed for ${dbFilePath}.`, err);
	}

	return client;
}

// Dev-only HMR can re-evaluate this module, leaking the previous connection;
// globalThis survives module cache invalidation, so reuse the existing handle.
// Downside: on config changes we need to restart the server to reload the database.
const g = globalThis as typeof globalThis & {
	__dictionariumDb?: Database.Database;
	__dictionariumShutdownHooked?: boolean;
	__dictionariumBackupsScheduled?: boolean;
};

g.__dictionariumDb ??= createClient();

// Scheduled here because this is the module every server entry point already
// imports, and the app has no other startup hook.
if (!g.__dictionariumBackupsScheduled) {
	g.__dictionariumBackupsScheduled = true;
	scheduleBackups(g.__dictionariumDb);
}

// Nitro's server layer already handles SIGTERM/SIGINT: it stops accepting
// connections, drains what is in flight, and lets the event loop empty so the
// process exits 0 on its own. Handling the signal here too would race that drain
// and close the database out from under a request still being served — so hook
// "exit" instead, which runs once the loop is done. close() runs a final WAL
// checkpoint and truncates it, and it is synchronous, which is all an exit
// listener is allowed to be. Guarded on globalThis for the same reason as the
// handle above: HMR re-evaluates this module, and every pass stacks a listener.
if (!g.__dictionariumShutdownHooked) {
	g.__dictionariumShutdownHooked = true;
	process.once("exit", () => {
		g.__dictionariumDb?.close();
	});
}

export const db = drizzle(g.__dictionariumDb, { schema });
