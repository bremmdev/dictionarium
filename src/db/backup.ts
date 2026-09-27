import fs from "node:fs";
import path from "node:path";
import type Database from "better-sqlite3";

// A backup is a single self-contained file: VACUUM INTO writes a fresh, compacted
// database with no -wal or -shm beside it. That is the whole point of doing this
// rather than copying the live files — any copy of those three catches them mid-write,
// while a file written by VACUUM INTO is consistent by construction.
const backupDir = path.resolve(process.env.DB_BACKUP_DIR ?? "backups");

// An explicitly configured DB_BACKUP_DIR that is not absolute is a mistake rather
// than a choice, and a silent one: path.resolve hangs it off the working directory,
// which on the container is the application and not the volume, so every backup lands
// on a filesystem the next deploy discards while the logs report success. The way to
// produce it is not exotic — Git Bash rewrites `--set DB_BACKUP_DIR=/data/backups`
// into a Windows path before the Railway CLI ever sees it, and `C:/...` is not
// absolute on Linux. Loud, but not fatal: a misfiled backup does not justify
// refusing to boot. The unset default stays relative on purpose, for dev.
const configuredDir = process.env.DB_BACKUP_DIR;
if (configuredDir && !path.isAbsolute(configuredDir)) {
	console.error(
		`SQLite: DB_BACKUP_DIR="${configuredDir}" is not absolute, so backups go to ` +
			`${backupDir} — relative to the working directory, which is probably not ` +
			`the volume you meant.`,
	);
}

// The prefix is load-bearing: pruning only ever considers files that match it, so
// anything dropped in this directory by hand is left alone.
const prefix = "dictionarium-";
const suffix = ".db";

// Never fire a backup in the first minute of a process. Deploys restart the server,
// and a backup on every boot would mean a busy afternoon of deploys evicts every
// older copy from the retention window.
const minDelayMs = 60_000;

// setTimeout keeps its delay in a signed 32-bit integer, and Node turns anything
// longer — about 24.8 days, so DB_BACKUP_INTERVAL_HOURS above 596 — into 1ms with
// a warning. The schedule would then back up as fast as it could reschedule. A
// longer wait is walked in steps of this size instead.
const maxTimerMs = 2 ** 31 - 1;

/** Exported so the retention schedule reads its interval the same way this one does. */
export function envNumber(name: string, fallback: number): number {
	const raw = process.env[name];
	if (raw === undefined || raw === "") return fallback;
	const value = Number(raw);
	if (!Number.isFinite(value) || value < 0) {
		console.error(`SQLite: ignoring ${name}="${raw}", using ${fallback}.`);
		return fallback;
	}
	return value;
}

/**
 * Write a consistent copy of the database and return its path.
 *
 * Blocks the event loop for the duration — better-sqlite3 is synchronous, so this
 * is the same trade every query in the app already makes. If the database ever
 * grows to where that pause is felt, `client.backup()` is the incremental
 * alternative; it yields between page batches but does not compact.
 */
function createBackup(client: Database.Database): string {
	// better-sqlite3 creates the database file when it is missing, and src/db/index.ts
	// creates the directories above it, so a DB_FILE_NAME pointing somewhere unreachable
	// does not fail — it quietly produces an empty database. Backing that up would
	// report success and then evict a real copy from the retention window. No tables at
	// all is the tell: even a migrated-but-unseeded database has __drizzle_migrations.
	const { tables } = client
		.prepare(
			"select count(*) as tables from sqlite_master where type = 'table'",
		)
		.get() as { tables: number };
	if (tables === 0) {
		throw new Error(
			`Refusing to back up ${client.name}: no tables. That path holds an empty ` +
				`database, so check DB_FILE_NAME — it is probably pointing at somewhere ` +
				`this process cannot reach, and the file was created on the spot.`,
		);
	}

	fs.mkdirSync(backupDir, { recursive: true });

	// Seconds resolution, colons swapped out because Windows will not have them in a
	// filename. ISO order is lexicographic order, which is what lets pruning sort by name.
	const stamp = new Date()
		.toISOString()
		.replace(/\.\d+Z$/, "Z")
		.replaceAll(":", "-");
	const target = path.join(backupDir, `${prefix}${stamp}${suffix}`);

	// VACUUM INTO fills its target progressively and refuses to overwrite, so a crash
	// halfway through would leave a partial file wearing a finished backup's name.
	// Write under a temp name and rename — rename is atomic within a filesystem, so
	// every file that matches the backup name is a complete backup.
	const partial = `${target}.partial`;
	fs.rmSync(partial, { force: true });
	try {
		// The target is an expression, so it binds as a parameter: no quote escaping.
		client.prepare("VACUUM INTO ?").run(partial);
		fs.renameSync(partial, target);
	} catch (err) {
		fs.rmSync(partial, { force: true });
		throw err;
	}

	return target;
}

/** Delete all but the newest `keep` backups. Returns the names removed. */
function pruneBackups(keep = envNumber("DB_BACKUP_KEEP", 7)): string[] {
	if (keep <= 0 || !fs.existsSync(backupDir)) return [];

	const names = backupNames().sort();
	const doomed = names.slice(0, Math.max(names.length - keep, 0));
	for (const name of doomed) {
		fs.rmSync(path.join(backupDir, name), { force: true });
	}

	return doomed;
}

function backupNames(): string[] {
	return fs
		.readdirSync(backupDir)
		.filter((name) => name.startsWith(prefix) && name.endsWith(suffix));
}

/** When the newest existing backup was written, or 0 if there is none. */
function newestBackupAt(): number {
	if (!fs.existsSync(backupDir)) return 0;

	let newest = 0;
	for (const name of backupNames()) {
		newest = Math.max(newest, fs.statSync(path.join(backupDir, name)).mtimeMs);
	}
	return newest;
}

/**
 * Back up every DB_BACKUP_INTERVAL_HOURS (0 disables), catching up on boot.
 *
 * The schedule is anchored to the newest backup on disk rather than to process
 * start, because on Railway process start is "whenever we last deployed". A plain
 * 24h interval on a service that redeploys twice a day would never produce a single
 * backup; anchoring to the file means a restart resumes the schedule instead of
 * resetting it.
 */
export function scheduleBackups(client: Database.Database): void {
	// Calling this twice would put two timers on one database, each writing and pruning
	// against the other. Vite re-evaluates modules on change and Nitro re-runs its
	// plugins, so the guard lives on globalThis, which survives module-cache
	// invalidation — module-level state would be discarded along with the old timer's
	// owner but not the timer. Idempotence belongs here rather than at the call site:
	// it is a property of starting a schedule, not of any one caller remembering.
	const g = globalThis as typeof globalThis & {
		__dictionariumBackupsScheduled?: boolean;
	};
	if (g.__dictionariumBackupsScheduled) return;
	g.__dictionariumBackupsScheduled = true;

	const intervalMs = envNumber("DB_BACKUP_INTERVAL_HOURS", 24) * 60 * 60 * 1000;
	if (intervalMs <= 0) return;

	const tick = () => {
		const delay = Math.max(
			newestBackupAt() + intervalMs - Date.now(),
			minDelayMs,
		);

		// unref: this timer must never be the reason a process stays alive. The server
		// is held open by its own listener, so the schedule costs nothing here — and a
		// pending backup cannot hold the process open during a shutdown that is waiting
		// for the event loop to empty.
		setTimeout(
			() => {
				// Not due yet: this was one step of a wait longer than a timer can hold.
				if (delay > maxTimerMs) {
					tick();
					return;
				}

				try {
					const file = createBackup(client);
					const pruned = pruneBackups();
					console.log(
						`SQLite: backed up to ${file}${pruned.length ? `, pruned ${pruned.length} older` : ""}.`,
					);
				} catch (err) {
					// A failed backup is not a reason to take the site down, but it has to be
					// loud — a silent one leaves you believing in copies that do not exist.
					console.error("SQLite: backup failed.", err);
				}
				tick();
			},
			Math.min(delay, maxTimerMs),
		).unref();
	};

	tick();
}
