# Migrating production

How a migration in `drizzle/` reaches the database on the Railway volume, and in which order relative to the deploy. Locally nothing changes: `npm run db:migrate`.

## Why not `npm run db:migrate` in the container

It used to work. Since Railway changed its build (2026-11), the container has:

- no `npm`, `npx` or `git` on the `PATH` of a `railway ssh` session;
- `node`, but only at its full path, `/mise/installs/node/<version>/bin/node`;
- the whole repo in `/app`, with `drizzle/`, `scripts/` and `node_modules` (seen 2026-11-23);
- `DB_FILE_NAME=/data/dictionarium.db` and `DB_BACKUP_DIR=/data/backups` in the environment.

`db:migrate` would not run even with npm: it is `arca run -- drizzle-kit migrate`, and the container has no arca (on Railway the secrets are Railway variables). drizzle-kit is a dev dependency on top of that.

So `scripts/migrate.mjs` does what `drizzle-kit migrate` does, with nothing but node and better-sqlite3:

- reads `drizzle/meta/_journal.json` and runs every migration newer than the newest row in `__drizzle_migrations`, split on `--> statement-breakpoint`;
- records each in `__drizzle_migrations` with the same hash and `created_at` drizzle-kit writes, so the two stay interchangeable;
- does it all in one transaction, so a failure changes nothing;
- is a dry run unless given `--apply`, and with `--apply` first writes a backup, `pre-<tag>-<time>.db`, to `DB_BACKUP_DIR`. Retention only evicts `dictionarium-*.db`, so these stay until deleted by hand.

Tested against the 2026-10-14 production backup: from 0008 it applied 0009–0012 and left a schema, and migration rows, identical to the ones drizzle-kit built locally.

## The rule: the database first, then the code

Drizzle names every column of `schema.ts` in its queries, even in `select().from(entries)`. So code that knows a column fails ("no such column") on a database that does not have it. On 2026-11-23, 0012's code went live before its migration, and until the migration ran every query on `entries` named a column that was not there.

The other way round is safe. Old code never names a column it does not know, so a database that is one migration ahead is invisible to it. That is the expand step of [expand → backfill → contract](./schema.md#migrations-not-push).

The container only has the `drizzle/` folder of the commit it was built from. A migration has to be **deployed before it can be applied**, so "migrate before deploying" means two deploys:

1. the migration on its own;
2. the code that reads it.

## Step by step: adding a column or a table

Locally, as usual: change `schema.ts`, `npm run db:generate -- --name <what>`, `npm run db:migrate`, build the feature, `npm run check`.

### 1. Push the migration alone

Commit only the files `db:generate` wrote, and leave `schema.ts` and the code uncommitted:

```sh
git add drizzle/
git commit -m "db: add <what> (migration NNNN)"
git push
```

Railway deploys it. Nothing runs the migration, and the code is unchanged, so the site is unaffected.

### 2. Apply it

```sh
railway ssh
```

Then, in the container:

```sh
NODE=$(ls -d /mise/installs/node/*/bin/node | tail -1)
cd /app
$NODE scripts/migrate.mjs           # dry run: check "Pending" is exactly your migration
$NODE scripts/migrate.mjs --apply   # backup, then apply
$NODE scripts/migrate.mjs           # "Up to date. Nothing to run."
```

What a good run looks like:

```
Database: /data/dictionarium.db
Last applied: 0012_add_stem_class
Pending: 1

-- 0013_add_<what>
ALTER TABLE `entries` ADD `<what>` text;

Backup: /data/backups/pre-0013_add_<what>-2026-12-01T10-00-00-000Z.db
Applied: 0013_add_<what>
```

Stop if the dry run lists anything other than what you expect.

### 3. Push the code

```sh
git add -A
git commit -m "<feature>"
git push
```

### 4. Data at the desk

Values the new column needs are filled at `/admin`; `/admin/health` lists the rows still missing one. A migration must never guess them ([schema.md](./schema.md#migrations-not-push)).

## Removing or renaming something

The contract step goes the other way round: first deploy the code that no longer reads the old column, then push and apply the migration that drops it. Dropping first would 500 the code still reading it.

## When something goes wrong

- **The script fails.** The transaction rolled back, so the database is as it was. Read the error, fix the migration locally, push, and run it again.
- **`No migrations at /app/drizzle`.** The image no longer contains the repo. Check `ls /app`; the build changed again.
- **`node: not found`.** Railway moved to another node version. `ls /mise/installs/node/` shows it; the `NODE=` line above picks the newest.
- **The code went out first anyway.** Apply the migration straight away, as in step 2. The running app picks up the new column on its next query, with no redeploy.
- **The data needs to go back.** The `pre-*.db` backup is on the volume. Download it, and the latest daily dump, as in [db.md](./db.md#keeping-an-offsite-copy) before deciding anything.
