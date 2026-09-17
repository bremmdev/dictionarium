# Analytics: counting in our own database

Three questions, asked by one person about their own dictionary: how many words am I adding, what are people searching for, and what are they reading. No third-party tool. Everything lives in `dictionarium.db` beside `entries` and `senses`: two tables, `search_events` and `view_events`, plus one new column on `entries`.

## The three questions map to two different mechanisms

**Words added is not an event.** It needed a column, not a log. `entries.created_at` already _is_ the record that a word was filed, and writing a second row saying so would be a fact that can disagree with itself. Nothing records anything when a word is created — `createEntry` stamps the column, and the dashboard counts rows.

**Searches and page views are events**, because otherwise nothing about them survives. A search leaves no trace at all, and a page view is not a property of the word.

## Why rows and not counters

A rolled-up counter — `(day, subject) → n`, incremented with UPSERT — is bounded forever and needs no housekeeping. It was not chosen because it can only answer questions you thought of before you started collecting. Rows can be asked anything later: which hour people read at, what one week looked like on its own, which searches came back empty and how often. That flexibility is the whole value at this scale.

The cost is that the tables grow, which `src/db/retention.ts` bounds. See [Retention](#retention) — the cost is larger than it looks.

## Why two tables

A search carries a result count. A view does not. One shared `events` table with a `type` column would therefore carry a column that is NULL for half its rows purely as a consequence of the sharing — exactly the ambiguity [schema.md](./schema.md) works to keep out of this database. Two narrow tables also mean two narrow indexes.

## `created_at`, and why the old words are NULL

`entries.created_at` is nullable, and every word that predates the column has NULL in it. Nothing was backfilled.

Writing that date into every existing row would make the first bar of every chart a spike of a hundred-odd words that never happened, indistinguishable from a real one forever after. `schema.md` already states the rule this follows: **a migration must never guess.** NULL says "filed before we started counting", which is true, and `created_at >= ?` excludes it by construction, so no query has to special-case it. The dashboard reports the NULL count separately rather than letting it vanish.

**The column has no DDL default, and could not have one.** SQLite forbids a non-constant `DEFAULT` in `ALTER TABLE ... ADD COLUMN` — `DEFAULT (unixepoch())` is rejected outright there, which is why `0005_add_entry_created_at.sql` is a bare `ADD created_at integer`. Drizzle's `$defaultFn` stamps the value in JS at insert time instead.

The consequence: **an insert that bypasses Drizzle gets NULL.** The `sqlite3` CLI, Studio's row editor, a hand-written fixup. That is survivable, because NULL already means "unknown" — those words go uncounted rather than counted wrongly — but a bulk import done in raw SQL would be invisible to every "added in period" figure.

## `lemma` is text, not a foreign key

`view_events.lemma` stores the macronned lemma — the URL key — as plain text, with no reference to `entries.id`.

A foreign key with `onDelete: "cascade"` would erase a word's entire readership at the moment you deleted the word, which is backwards: the visits happened. History should not change when the dictionary does. The trade-off accepted in return is that **renaming a lemma splits its history** across the old and new spelling, and the old key shows in the dashboard as itself.

## What counts as a visit

Counting happens on the server, in the `/verbum/$lemma` loader, gated on `cause === "enter"`.

Server-side is what makes an SSR first paint, a shared link and a reader without JavaScript all count. The gate is what keeps that from over-counting, and it does two jobs that are easy to miss:

| `cause`   | What it is                                                                                          | Counted |
| --------- | --------------------------------------------------------------------------------------------------- | ------- |
| `enter`   | arriving at the route                                                                               | yes     |
| `preload` | a hover, under `defaultPreload: "intent"`                                                           | no      |
| `stay`    | a loader re-run on the match already on screen, e.g. from `router.invalidate()` after an admin save | no      |

Without the gate, reading a page of search results with a mouse would count every card the pointer crossed.

**Recording lives in the route, not in `getEntryByLemma`.** That function has three callers — this loader, the `/admin` editor's loader, and any preload — so making the read write would count opening a word to fix a typo as somebody reading it. The cost of keeping them apart is one extra RPC on a client-side navigation, which is not awaited.

Searches need no equivalent guard, and the reason is worth writing down so nobody adds one: the only `<Link to="/">` in the app is the header wordmark, which carries no `q`, and an empty query is already dropped by the `MIN_QUERY_LENGTH` check. A search arrives by form submit into `navigate()`, which is never a preload.

## Who is not counted

**You.** Both recording paths skip when the caller holds an admin session. Without it, the most-read list is largely a record of the last word you edited and the search list a record of you looking for it. Reading the session only decrypts a cookie, so it costs no query.

**Anything that names itself a crawler**, by user agent (`isBotAgent` in `src/utils/analytics/rules.ts`, applied in `visitor.ts`). This is needed _because_ counting is server-side: the same choice that lets a no-JS reader count lets a bot count. Search is not safe from it either — the back link on a detail page points at `/?q=<word>`, so anything following links generates searches as it goes.

A user agent is self-reported, so this is a heuristic: it catches the honest majority and misses anything that would rather not be caught. **These are page views, never people.** There is no cookie, no IP and no session identity, so unique visitors, returning readers and sessions are unavailable by construction — which is also why there is nothing here needing a consent banner. If uniques ever seem worth having, that is the decision that changes the privacy posture, not this one.

`public/robots.txt` closes `/admin` and `/login` to indexers. It deliberately leaves `/verbum/` crawlable: a Latin word is exactly the thing someone searches the web for, and hiding the dictionary to tidy a statistic would be the tail wagging the dog.

## Accuracy: what the numbers are not

**Search counts are a floor.** The home route has `staleTime: 60_000`, so the same search repeated within a minute — including via the back button — never re-runs the loader and never reaches `searchEntries`. Lowering it would fix the count and cost the UX. The dashboard says so on the page rather than presenting a total it cannot deliver.

**Periods are rolling, not calendar.** Every window is `now - N days`, which sidesteps timezones entirely: there is no "which day is it" question to get wrong on a container running UTC while you read the page in Amsterdam. The price is that "this month" is not available as such, only "the last 30 days".

## Where the code lives, and why it is split that way

Four modules, and the seam between them is a build constraint rather than taste:

| Module                    | Holds                                            | Client-visible                         |
| ------------------------- | ------------------------------------------------ | -------------------------------------- |
| `src/server/analytics.ts` | the two server functions, nothing else           | yes — the client keeps their RPC stubs |
| `src/server/recording.ts` | `record`, `recordSearch`, `recordView`           | no                                     |
| `src/server/visitor.ts`   | `isUncounted` — the session and user-agent reads | no                                     |
| `src/db/analytics.ts`     | `summarize` — queries, no request awareness      | no                                     |

A module that exports a server function is bundled for the browser, so **anything else living in it drags its imports along** — `#/db`, and through `visitor.ts` the server-only request helpers from `@tanstack/react-start/server`. TanStack's import-protection plugin refuses that outright, and it refuses it at `vite build`, not in dev: the dev server happily served every one of these paths before the build rejected them. The fix is the same shape as `auth.ts` keeping `useAppSession` over in `session.ts` — everything reached only from inside a handler is stripped from the client graph along with the handler.

So `analytics.ts` is kept deliberately bare. Adding one plain helper to it will break the build, and the error will point at whichever module it imported rather than at the helper.

`summarize()` is in the db layer rather than beside the RPC because it is only queries: no request, no session, nothing to mock. That is what lets the aggregation SQL be run against a database from a `tsx` script, which is the only way to check window boundaries and NULL handling without a browser and a session.

## Writes never break a page

Every insert goes through `record()` in `src/server/recording.ts`, which logs and continues; the session read and the header read are each wrapped too. The posture is the one `scheduleBackups` already takes: loud in the log, invisible on the page. An analytics failure must never be the reason a word cannot be read.

The callbacks are synchronous because better-sqlite3 is, which is what makes the `catch` trustworthy — there is no promise in there to escape it.

## Retention

`src/db/retention.ts`, started at boot by `src/nitro/retention.ts`. `ANALYTICS_RETENTION_DAYS` (default 365, `0` disables).

**The cost being bounded is bigger than the table.** Each backup is a `VACUUM INTO` of the whole file, seven are kept, and they sit on the same volume as the database — so an unbounded event log is not one cost, it is eight, on a database otherwise measured in tens of kilobytes. See [db.md](./db.md#backups).

**The schedule is deliberately simpler than the backup one.** `scheduleBackups` anchors to the newest dump's mtime because a missed backup is a real loss and Railway's redeploys would otherwise reset the clock forever. A missed prune costs nothing — the rows just survive until the next tick — so a plain 24-hour interval needs no catch-up logic and no state on disk to read.

What it does copy verbatim, because all three are load-bearing: the `globalThis` idempotence guard (Vite re-evaluates modules, Nitro re-runs plugins, and two timers deleting from one table would each race the other's read), `.unref()` on the timers, and log-and-continue on failure.

**It is not folded into the backup tick**, tempting as the single timer is — and it would even have the nicety that a dump would never carry rows about to be deleted. Setting `DB_BACKUP_INTERVAL_HOURS=0` would then silently disable retention too, and the table would grow forever with nothing in the log to say why.

## Operations

The dashboard is `/admin/stats`, filed as `src/routes/admin_.stats.tsx`. The trailing underscore opts the route out of nesting, so it serves `/admin/stats` without turning `/admin` into a layout that would need an `<Outlet />` it has no other use for.

`authMiddleware` on `getAnalyticsSummary` is what protects the numbers. The route's `beforeLoad` is a redirect for humans; the RPC is reachable directly whatever page the caller claims to be on — the same point [auth.md](./auth.md) makes about `createEntry`.

**No `scripts/check-*.ts` guard**, and that is a decision rather than an omission. The check chain exists for invariants the schema cannot express — ranks running 1..n, `lemma_plain` matching `normalizeLemma`. The event tables have none: every column is `NOT NULL` and nothing relates to anything.
