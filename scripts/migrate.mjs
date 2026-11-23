/**
 * Applies the drizzle/ migrations the way `drizzle-kit migrate` does, with
 * nothing but node and better-sqlite3, so it runs in the Railway container.
 * A dry run unless given --apply. See vault/migrations.md.
 *
 *   node scripts/migrate.mjs            # what would run
 *   node scripts/migrate.mjs --apply    # back up, then run it
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");

function fail(message) {
	console.error(message);
	process.exit(1);
}

// node_modules if the image kept it, else the copy Nitro ships with the server.
function loadDatabase() {
	for (const from of [root, path.join(root, ".output", "server")]) {
		try {
			return createRequire(path.join(from, "package.json"))("better-sqlite3");
		} catch {}
	}
	fail("better-sqlite3 is not in node_modules or .output/server/node_modules.");
}

// Same default as src/db/index.ts.
const file = path.resolve(process.env.DB_FILE_NAME ?? "src/db/dictionarium.db");
const folder = path.join(root, "drizzle");

if (!existsSync(path.join(folder, "meta", "_journal.json"))) {
	fail(`No migrations at ${folder}.`);
}
// better-sqlite3 would create an empty file, and migrate that instead.
if (!existsSync(file)) fail(`No database at ${file}. Is DB_FILE_NAME right?`);

const journal = JSON.parse(
	readFileSync(path.join(folder, "meta", "_journal.json"), "utf8"),
);
const migrations = journal.entries.map(({ tag, when }) => {
	const sql = readFileSync(path.join(folder, `${tag}.sql`)).toString();
	return {
		tag,
		when,
		hash: createHash("sha256").update(sql).digest("hex"),
		statements: sql
			.split("--> statement-breakpoint")
			.map((s) => s.trim())
			.filter(Boolean),
	};
});

const Database = loadDatabase();
const db = new Database(file, { fileMustExist: true, timeout: 5000 });

const tracked = db
	.prepare(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = '__drizzle_migrations'",
	)
	.get();
if (!tracked) fail(`${file} has no __drizzle_migrations table, so it is not this app's database.`);

// drizzle-kit's rule: everything newer than the newest row runs.
const last = db
	.prepare(
		'SELECT created_at FROM "__drizzle_migrations" ORDER BY created_at DESC LIMIT 1',
	)
	.get()?.created_at;
const lastTag = migrations.find((m) => m.when === Number(last))?.tag;
const pending = migrations.filter(
	(m) => last === undefined || Number(last) < m.when,
);

console.log(`Database: ${file}`);
console.log(`Last applied: ${lastTag ?? last ?? "none"}`);

if (pending.length === 0) {
	console.log("Up to date. Nothing to run.");
	process.exit(0);
}

console.log(`Pending: ${pending.length}`);
for (const m of pending) {
	console.log(`\n-- ${m.tag}`);
	for (const s of m.statements) console.log(s);
}

if (!apply) {
	console.log("\nDry run, nothing changed. Run again with --apply.");
	process.exit(0);
}

const backupDir = path.resolve(
	process.env.DB_BACKUP_DIR ?? path.dirname(file),
);
mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(backupDir, `pre-${pending.at(-1).tag}-${stamp}.db`);
db.exec(`VACUUM INTO '${backup.replaceAll("'", "''")}'`);
console.log(`\nBackup: ${backup}`);

// One transaction, as drizzle-kit: a failure leaves the database as it was.
const insert = db.prepare(
	'INSERT INTO "__drizzle_migrations" ("hash", "created_at") VALUES (?, ?)',
);
db.transaction(() => {
	for (const m of pending) {
		for (const s of m.statements) db.exec(s);
		insert.run(m.hash, m.when);
	}
})();

console.log(`Applied: ${pending.map((m) => m.tag).join(", ")}`);
db.close();
