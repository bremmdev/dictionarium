# Database: one file, one connection, pinned pragmas

The database is a single SQLite file opened by `src/db/index.ts`, which is the only module that constructs a connection. Everything else — the server functions in `src/server/`, the scripts in `scripts/` — imports the `db` it exports.

Two consequences worth naming up front:

- **Config is read once, at first import.** Changing a pragma means restarting the process, not reloading a page.
- **Shutdown is part of the contract.** The SIGTERM handler at the bottom of the module is load-bearing for deployments — see [Shutdown is explicit](#shutdown-is-explicit).

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

**`synchronous = NORMAL` is a durability trade, not a free win.** Under WAL it cannot corrupt the database; what it risks is losing the last committed transactions on a power cut or OS crash. Acceptable here because every write comes from a seed script that is idempotent (upsert on `lemma`, and on `(entry_id, rank)` for senses) and can simply be rerun. It would not be acceptable for user-submitted data.

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

## Why `drizzle()` gets the handle *and* the schema

`drizzle()` is overloaded: it takes either a file path or a live `better-sqlite3` handle. Passing the path here would be the quiet disaster — Drizzle would open a **second** connection with none of the pragmas above on it, and `createClient()` would sit unused while the app ran on defaults. Nothing would throw; the app would simply stop having the guarantees this file argues for. The handle is the entire point of the wrapper.

The `{ schema }` second argument is separate and does nothing to the connection. It is what populates `db.query` — the relational query builder used for `with: { senses: ... }`. Without it `db.query` is typed as an empty object: no error, no hint, just nothing there. `import * as schema` matters too, because the `relations()` objects have to be in the namespace alongside the tables.

## No `await` inside a transaction

better-sqlite3 is synchronous, and its transaction wrapper commits on the same tick the callback returns. It refuses a promise outright — `lib/methods/transaction.js`:

```js
before.run();                                   // BEGIN, or SAVEPOINT if nested
try {
	const result = apply.call(fn, this, arguments);
	if (result && typeof result.then === 'function') {
		throw new TypeError('Transaction function cannot return a promise');
	}
	after.run();                                  // COMMIT
	return result;
} catch (ex) {
	if (db.inTransaction) {
		undo.run();                                 // ROLLBACK, or ROLLBACK TO
		if (undo !== rollback) after.run();         // ...and RELEASE the savepoint
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

- **A transaction blocks this process for its whole duration.** Nothing interleaves, which is what makes the guarantee cheap — and why `busy_timeout` above is about *other* processes, not this one. Keep transactions small anyway; the event loop is stopped while one runs.
- **Nesting produces a `SAVEPOINT`, not a second `BEGIN`.** `db.transaction` inside `db.transaction` is safe: the inner one rolls back to its savepoint, releases it, and rethrows — so the outer transaction can catch and carry on, or let it propagate and roll everything back.

## Operations

WAL adds two sidecar files next to the database, `-wal` and `-shm`, both gitignored. They are part of the database: copying `dictionarium.db` alone, while the server is running, does not give you a consistent backup. Use `VACUUM INTO 'backup.db'` or stop the process first.

### Shutdown is explicit

**Crucial for deployments — do not remove this handler.** It is not a tidiness nicety: it is the difference between a deploy that reports success and one that reports a crash. Every release restarts the process, so this code runs on every single deploy, and it is the only thing standing between an ordinary shutdown and a false alarm.

```ts
for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.once(signal, () => {
		g.__dictionariumDb?.close();
		process.exit(0);
	});
}
```

An orchestrator stops a container by sending `SIGTERM`. Node's default action for an unhandled `SIGTERM` is to terminate with exit code 143 (`128 + 15`), and a non-zero exit is how a platform decides a process **crashed** — so without this handler every ordinary shutdown is reported as a failure. On Railway that arrives as a "Deploy Crashed!" email on a deploy that in fact succeeded, because the mounted volume can only be attached to one container at a time: the old container has to be stopped before the new one can start, so it is `SIGTERM`ed on _every_ deploy. The alarm is real and the deployment is fine, which is the worst combination — it trains you to ignore the alarm.

`close()` is what makes the exit worth handling rather than just quieting. It runs a final checkpoint and truncates the WAL, leaving the sidecar files small and the database file current. This is **not** a data-safety fix: SQLite recovers a live `-wal` on next open, so nothing committed is lost either way. It is about not leaving a growing WAL on the volume across restarts.

The `globalThis` guard is there for the same reason as the handle it protects — HMR re-evaluates the module, and each pass would stack another listener until Node warns about a leak.

Two things this cannot cover. `SIGKILL` is not catchable, so a container killed after its grace period expires still exits abruptly (safely, per WAL recovery). And because better-sqlite3 is synchronous, a transaction in flight holds the event loop until it returns — the handler runs after it commits or rolls back, never in the middle of one.
