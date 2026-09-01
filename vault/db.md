# Database: one file, one connection, pinned pragmas

The database is a single SQLite file opened by `src/db/index.ts`, which is the only module that constructs a connection. Everything else — the server functions in `src/server/`, the scripts in `scripts/` — imports the `db` it exports.

A consequence worth naming up front:

- **Config is read once, at first import.** Changing a pragma means restarting the process, not reloading a page.

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

## Operations

WAL adds two sidecar files next to the database, `-wal` and `-shm`, both gitignored. They are part of the database: copying `dictionarium.db` alone, while the server is running, does not give you a consistent backup. Use `VACUUM INTO 'backup.db'` or stop the process first.
