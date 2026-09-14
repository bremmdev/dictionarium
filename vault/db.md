# Database: one file, one connection, pinned pragmas

The database is a single SQLite file opened by `src/db/index.ts`, which is the only module that constructs a connection. Everything else — the server functions in `src/server/`, the scripts in `scripts/` — imports the `db` it exports.

Two consequences worth naming up front:

- **Config is read once, at first import.** Changing a pragma means restarting the process, not reloading a page.
- **Shutdown is part of the contract.** Nitro handles the signal, this module closes the handle on `exit`, and `railway.json` makes sure the signal reaches Node at all. All three are load-bearing for deployments — see [Shutdown, and who owns the signal](#shutdown-and-who-owns-the-signal).

## Where the file lives

```ts
path.resolve(process.env.DB_FILE_NAME ?? "src/db/dictionarium.db");
```

`path.resolve` matters: without it the path is relative to the process CWD, which is the repo root under `vite dev` but not necessarily under `node .output/server/index.mjs`. `DB_FILE_NAME` is the hook for pointing production at a mounted volume.

`mkdirSync(dirname, { recursive: true })` runs first because SQLite creates the _file_ but not the directories above it — the difference between a fresh clone working and failing on its first query.

## The pragmas

| Setting                  | Value     | Why                                                                                                            |
| ------------------------ | --------- | -------------------------------------------------------------------------------------------------------------- |
| `timeout` (busy_timeout) | `5000`    | A blocked reader waits 5s for the writer's lock instead of failing on the spot with `SQLITE_BUSY`.             |
| `foreign_keys`           | `ON`      | Per-connection, and off in a stock SQLite build.                                                               |
| `journal_mode`           | `WAL`     | Readers do not block the writer, and the writer does not block readers.                                        |
| `synchronous`            | `NORMAL`  | Under WAL, fsync at checkpoints rather than at every commit.                                                   |
| `optimize`               | `0x10002` | The mask SQLite recommends for long-lived connections: refresh planner statistics where a query would benefit. |

**Pin, don't inherit.** `foreign_keys = ON` and `synchronous = NORMAL` are both no-ops against today's better-sqlite3, which compiles with `SQLITE_DEFAULT_FOREIGN_KEYS=1` and `SQLITE_DEFAULT_WAL_SYNCHRONOUS=1` (the latter applies only in WAL mode). Those are properties of a vendored build, not of SQLite. Stating them means a swapped binding cannot quietly turn off constraint enforcement or change durability.

**`synchronous = NORMAL` is a durability trade, not a free win.** Under WAL it cannot corrupt the database; what it risks is losing the last committed transactions on a power cut or OS crash.

**WAL is checked, not assumed.** Setting `journal_mode` does not throw on failure; it returns the mode SQLite actually settled on, and a network filesystem will quietly leave you on `delete`. So the result is read back and a mismatch is logged loudly — otherwise you would believe you had concurrent reads and not have them.

`journal_mode` is stored in the database file and persists across connections, so it is a no-op after the first run. The rest are per-connection and are set every time.

**`optimize` writes.** It updates `sqlite_stat1`, so it throws against a read-only database. Wrapped in a `try/catch` that logs and continues: stale planner statistics are a performance problem, not a reason to refuse to boot.

## The HMR handle

```ts
g.__dictionariumDb ??= createClient();
export const db = drizzle(g.__dictionariumDb, { schema });
```

Vite's dev server re-evaluates modules on change. Module-scope state is discarded, but an open SQLite handle is not — it leaks, and the leaked connections keep their locks. `globalThis` survives module-cache invalidation, so the same handle is reused for the life of the process. The cost: pragma or path changes need a server restart, since `createClient()` no longer runs on reload.

Drizzle is re-wrapped on each evaluation, which is fine — it is a stateless wrapper over the handle.

## Why `drizzle()` gets the handle _and_ the schema

`drizzle()` is overloaded: it takes either a file path or a live `better-sqlite3` handle. Passing the path here would be the quiet disaster — Drizzle would open a **second** connection with none of the pragmas above on it, and `createClient()` would sit unused while the app ran on defaults. Nothing would throw; the app would simply stop having the guarantees this file argues for. The handle is the entire point of the wrapper.

The `{ schema }` second argument is separate and does nothing to the connection. It is what populates `db.query` — the relational query builder used for `with: { senses: ... }`. Without it `db.query` is typed as an empty object: no error, no hint, just nothing there. `import * as schema` matters too, because the `relations()` objects have to be in the namespace alongside the tables.

## No `await` inside a transaction

better-sqlite3 is synchronous, and its transaction wrapper commits on the same tick the callback returns. It refuses a promise outright — `lib/methods/transaction.js`:

```js
before.run(); // BEGIN, or SAVEPOINT if nested
try {
  const result = apply.call(fn, this, arguments);
  if (result && typeof result.then === "function") {
    throw new TypeError("Transaction function cannot return a promise");
  }
  after.run(); // COMMIT
  return result;
} catch (ex) {
  if (db.inTransaction) {
    undo.run(); // ROLLBACK, or ROLLBACK TO
    if (undo !== rollback) after.run(); // ...and RELEASE the savepoint
  }
  throw ex;
}
```

An `await` anywhere in the callback makes it return a promise at the first suspension point. Without that guard `after.run()` would fire immediately — **COMMIT before the awaited work happened**, with everything after the await landing outside the transaction. And `BEGIN` / `COMMIT` are state on the one shared connection this file exports, so anything else running during the await would be swept into the transaction and committed or rolled back with it.

The `throw` is inside the `try`, so the mistake costs a rollback and a loud `TypeError`, not a half-written row.

Drizzle's driver types this honestly — `drizzle-orm/better-sqlite3/session.d.ts`. Note the return: `T`, not `Promise<T>`.

```ts
transaction<T>(transaction: (tx: BetterSQLiteTransaction<...>) => T): T;
```

So inside the callback, statements end in a synchronous terminal:

```ts
return db.transaction((tx) => {
	const existing = tx.select({ ... }).from(entries).where(...).get();
	const [created] = tx.insert(entries).values(columns).returning({ ... }).all();
	tx.insert(senses).values(rows).run();
});
```

**The trap is that `await` compiles.** Drizzle's query builders are thenables, so `await tx.insert(...)` type-checks and reads like every other ORM — and turns the callback async. `.get()` / `.all()` / `.run()` execute on the spot instead. `createEntry` is the worked example, in [editor.md](./editor.md#a-session-at-the-desk).

The rule is scoped to the callback body. `await db.insert(...)` at the top level of a script is fine; there is no transaction open around it.

Two consequences of the same synchronicity:

- **A transaction blocks this process for its whole duration.** Nothing interleaves, which is what makes the guarantee cheap — and why `busy_timeout` above is about _other_ processes, not this one. Keep transactions small anyway; the event loop is stopped while one runs.
- **Nesting produces a `SAVEPOINT`, not a second `BEGIN`.** `db.transaction` inside `db.transaction` is safe: the inner one rolls back to its savepoint, releases it, and rethrows — so the outer transaction can catch and carry on, or let it propagate and roll everything back.

## Operations

WAL adds two sidecar files next to the database, `-wal` and `-shm`, both gitignored. They are part of the database: copying `dictionarium.db` alone, while the server is running, does not give you a consistent backup. Use `VACUUM INTO 'backup.db'` or stop the process first.

### Backups

`src/db/backup.ts` writes a dump on a schedule; `src/db/index.ts` starts it. This is the only backup there is — there is no platform-level snapshot underneath it.

**Why a dump and not a file copy.** Under WAL the database is three files, and a copy taken while the server is writing captures them across a window rather than at an instant. The main file and the `-wal` can then disagree, and on the next open recovery stops at the first frame whose checksum fails. You lose the tail, quietly, and only find out when you restore. Anything that copies the live files — `cp`, `rsync`, a filesystem snapshot — has this window.

`VACUUM INTO` does not. It reads the database through a read transaction and writes a fresh, compacted file, so the result is consistent by construction and carries no sidecars: one file, restorable on its own.

| Variable                   | Default   |                                                                                                           |
| -------------------------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `DB_BACKUP_DIR`            | `backups` | Must point inside the volume mount in production — the container filesystem is discarded on every deploy. |
| `DB_BACKUP_INTERVAL_HOURS` | `24`      | `0` disables the scheduler entirely.                                                                      |
| `DB_BACKUP_KEEP`           | `7`       | How many dumps survive pruning.                                                                           |

**The schedule is anchored to the newest file, not to process start.** On Railway, process start means "whenever we last deployed". A plain 24-hour interval on a service that redeploys twice a day would never produce a single backup. Each tick reads the mtime of the newest dump, sleeps until that plus the interval, and reschedules — so a restart resumes the schedule instead of resetting it.

Two guards around that. The delay has a one-minute floor, so an afternoon of deploys cannot write a backup per boot and evict the retention window; and the timer is `unref`'d, so it is never the reason a process stays alive — the scripts in `scripts/` import the database too, and still exit the moment they are done.

**A backup is complete or absent, never partial.** `VACUUM INTO` fills its target progressively and refuses to overwrite, so a crash halfway through would leave a partial file wearing a finished backup's name. The dump is written as `.partial` and renamed, which is atomic within a filesystem.

**Pruning only considers the `dictionarium-` prefix.** Anything you drop in that directory by hand — `backups/2026-09-05.db`, say — is never a candidate for deletion.

**An empty database is not backed up.** better-sqlite3 creates the file when it is missing, and `src/db/index.ts` creates the directories above it, so a `DB_FILE_NAME` pointing somewhere unreachable does not fail — it quietly produces an empty database. Dumping that would report success and then evict a real copy from the retention window. So `createBackup` refuses a database with no tables at all: even a migrated-but-unseeded one has `__drizzle_migrations`, so an empty schema means the file was conjured rather than found. The scheduler logs the refusal and carries on.

Restoring is a file copy with the process stopped, and it is worth confirming what you copied first:

```sh
sqlite3 backups/dictionarium-....db 'pragma quick_check;'
```

**What this still is not.** The dumps sit on the same volume as the database. They cover a bad migration, a botched bulk edit, a corrupted live file — every failure short of losing the volume, which they do not cover at all, because they go with it. Nothing automated ships a copy anywhere else. That step is deliberately a habit rather than code: see [Keeping an offsite copy](#keeping-an-offsite-copy).

### Keeping an offsite copy

Losing the volume loses the database and every dump beside it, so one copy has to live somewhere else. That is done by hand. The automation was considered and dropped on purpose — one writer, a database measured in tens of kilobytes, and a recurring note is enough machinery for the risk.

```sh
railway volume files list /backups
railway volume files download /backups/dictionarium-....db ./backups/production/
```

**Copy a dump, not the live files.** The three live files are only safe to copy while nothing is writing them, and the dump is safe to copy always. Downloading `dictionarium.db` with its `-wal` and `-shm` does work — open the copy and SQLite replays the WAL — but it is three files that have to arrive as a set, and it is correct only because of an assumption about who is writing. The dump is one file that is consistent by construction. Take the assumption out of the routine.

**The assumption, for when the dump is not an option.** Every write in this app goes through `src/server/entries.ts` — the admin editor. Nothing on the read path writes, so while you are not editing, the live files are static and a copy of them is sound. That is an operational property, not a structural one: a hit counter, a search log, a last-viewed timestamp would each break it silently, and a torn copy does not announce itself. You find out at restore time.

**Remote paths are rooted at the volume, not the container.** The mount is `/data`, but you address the dumps as `/backups/...` — the CLI prepends the mount itself.

```
Failed to list remote directory /data/backup
```

**Do not run the Railway CLI from Git Bash.** MSYS2 rewrites any argument that looks like an absolute POSIX path into a Windows one, before the CLI sees it. It applies to `VAR=/path` too, which is where it does real damage. Both of these have happened here:

```
# railway volume files list /backups
Failed to list remote directory /data/C:/Program Files/Git/backup

# railway variables --set DB_BACKUP_DIR=/data/backups
SQLite: backed up to /app/C:/Program Files/Git/data/backups/dictionarium-....db
```

The first is merely confusing — the error names a path nobody typed. The second is worse, because **nothing fails.** The service stores `C:/Program Files/Git/data/backups`, which is not absolute on Linux, so `path.resolve` hangs it off the working directory and the scheduler cheerfully writes backups to a nonsense path on the container's ephemeral filesystem. Every log line says success, and the volume stays empty. `railway variables` is what shows you the truth.

Use PowerShell, or prefix with `MSYS_NO_PATHCONV=1`, and check the value afterwards rather than assuming it arrived intact.

### Shutdown, and who owns the signal

**Crucial for deployments.** Every release restarts the process, so this path runs on every single deploy. Getting it wrong does not break the app — it makes every successful deploy report itself as a crash, which is worse, because it trains you to ignore the alarm.

**Nitro owns the signals, not this module.** The server layer under Nitro (srvx) registers its own `SIGTERM`/`SIGINT` handlers unconditionally in production — the only escapes are `gracefulShutdown: false` or a `CI`/`TEST` env var, and Nitro's `serve()` passes neither. On a signal it stops accepting connections, drains what is in flight for up to five seconds, and returns. It never calls `process.exit`; once the loop is empty the process exits `0` by itself.

So this module does **not** hook the signal:

```ts
process.once("exit", () => {
  g.__dictionariumDb?.close();
});
```

Racing Nitro for the signal is the bug to avoid. Two listeners on one signal run in registration order, and closing the handle from ours would pull the database out from under a request Nitro is still draining. `"exit"` fires after the loop is already done, so the ordering is settled by construction rather than by luck. The constraint in return is that an `exit` listener has to be synchronous — no cost here, because better-sqlite3 is synchronous anyway.

`close()` runs a final checkpoint and truncates the WAL. This is **not** a data-safety fix: SQLite recovers a live `-wal` on next open, so nothing committed is lost either way. It is about not leaving a growing WAL on the volume across restarts.

The `globalThis` guard is there for the same reason as the handle it protects — HMR re-evaluates the module, and each pass would stack another listener until Node warns about a leak.

### The signal has to reach Node

```json
{ "deploy": { "startCommand": "node .output/server/index.mjs" } }
```

That line in `railway.json` is load-bearing, and worth writing down because the symptom points somewhere else entirely.

Railway sends `SIGTERM` to PID 1. Started via `npm start`, PID 1 is npm, which spawns `sh -c node .output/server/index.mjs`, which spawns Node. The shell has no `SIGTERM` handler, so it dies on the default action; npm reports its child's termination signal and exits non-zero; Node is orphaned two levels down, never signalled at all, and is reaped by `SIGKILL` when the container tears down. Railway sees a non-zero exit and mails "Deploy Crashed!" about a deploy that in fact succeeded.

The tell is a **missing** log line. When Nitro's handler runs it writes `Stopping server gracefully (5s)...` to stderr. A deploy log with `npm error signal SIGTERM` and no such line means the shutdown code never ran at all — the problem is upstream of Node, and no handler code inside the process can fix it. That is the dead end this section exists to prevent: the wrapper is the bug, not the app.

Running Node directly also drops the `npm warn config production` line from the deploy log, which was npm's and never ours.

**The consequence to keep in mind:** Node is now PID 1, and Linux discards signals that PID 1 has registered no handler for. Nitro registers one, so the container still shuts down cleanly — but that handler is now the only thing between a clean exit and waiting out the grace period for a `SIGKILL`. It is a dependency, not a convenience.

### What is still not covered

`SIGKILL` is not catchable, so a container killed after its grace period expires still exits abruptly — safely, per WAL recovery, but without the checkpoint. And because better-sqlite3 is synchronous, a transaction in flight holds the event loop until it returns, so shutdown waits for it to commit or roll back rather than interrupting it.
