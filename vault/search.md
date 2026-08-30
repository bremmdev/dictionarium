# Search: the URL is the state

The home page has one job — take a query, show matching lemmas — and the whole design follows from one decision: **the URL is the only place the current search lives.** There is no `results` state, no `isLoading` flag, no fetch in an effect. `?q=` is the input, the loader is the function, the rendered list is the output.

The obvious alternative is to split it: the loader handles the first paint, then the client calls the server function directly on every subsequent search. That was the original sketch, and it is worse in a way that is not obvious until you are three bugs in. It gives you two sources of truth — loader data and local state — that must be kept in sync, and it hands you back the problems the router already solved: request cancellation, caching, history, and shareable URLs.

## The flow

```
URL ?q=am
  ↓  validateSearch      normalise, drop empty
  ↓  loaderDeps          { q } becomes the cache key
  ↓  loader              searchEntries({ data: q })
  ↓  useLoaderData()     rendered as <Results>
```

Every entry point is the same path. Typing and pressing Enter, landing on a shared link, the back button, the header logo — they all change the URL and re-enter at the top.

## Server side

`src/server/search.ts` holds the server functions. They are `method: "GET"` because they read: semantically correct, and cacheable at the HTTP layer.

What it no longer holds is the rules. How a query becomes a search key, how short is too short, how many rows come back — those moved one level down, to `src/utils/search/rules.ts`, because the request handler was never their only caller.

### `rules.ts`: one definition of a search key

| Caller                    | What it needs the rule for                                 |
| ------------------------- | ---------------------------------------------------------- |
| `searchEntries`           | turning the typed query into the key it matches on          |
| `scripts/seed.ts`         | deriving `lemma_plain` from `lemma` at insert time          |
| `scripts/check-lemmas.ts` | asserting every stored `lemma_plain` still equals the rule  |
| `Results.tsx`             | telling the user how many letters are needed                |

The middle two are the reason it moved. `lemma_plain` is written down one path and read down another; when the two disagree nothing breaks loudly — the query returns nothing and a word has quietly stopped existing. That failure has been flagged here since the column was introduced, and until now it was being prevented by two copies of a four-line function agreeing with each other by hand.

So the seed no longer carries `lemmaPlain` at all. It lists lemmas and derives the key on the way in:

```ts
.values(words.map((w) => ({ ...w, lemmaPlain: normalizeLemma(w.lemma) })))
```

and `npm run check:lemmas` re-derives every row in the table and names the ones that no longer match. That is cheap insurance now, when seeding is the only writer, and the actual point later: the admin panel will write rows no script has seen.

Note what the check proves — that the stored key agrees with the current rule, not that the rule is right. Change `normalizeLemma` and it will report every row as stale, which is the correct answer. The fix then is to rewrite the column, not to soften the check.

`Entry` moved too, from the server module to `#/db/schema`, beside the table it is inferred from. A card that renders a row takes its type from the schema now instead of reaching through the module that queries it.

### `searchEntries(q)`

```ts
export const searchEntries = createServerFn({ method: "GET" })
  .validator((q: unknown) => (typeof q === "string" ? q.trim() : ""))
  .handler(async ({ data: q }) => { … });
```

Three things it does, in order — and the order is the change:

**Normalises the query into a search key.** Users type `villa`; the display form is `vīlla`. `normalizeLemma` decomposes to NFD, drops every combining mark, recomposes, case-folds, and then keeps only what a lemma is allowed to contain:

```ts
value
  .normalize("NFD")
  .replace(/\p{M}/gu, "")
  .normalize("NFC")
  .toLowerCase()
  .replace(/[^a-z ]/g, "");
```

That last filter is not tidiness. The key is interpolated straight into a `LIKE` pattern — `` `%${key}%` `` — where `%` and `_` are wildcards: `%` alone would match the whole table, and `a_o` would match `amo` and `ago` alike. Stripping them at the door means the pattern only ever holds literal characters, and no second place has to remember to escape. The space survives the class on purpose — _alma māter_ is one lemma.

The order inside the function is load-bearing too, in the unobvious direction: `toLowerCase()` has to run **before** `[^a-z ]`, or the character class deletes capitals rather than folding them and `Roma` searches as `oma`.

This is the same function that wrote `lemma_plain` — see [above](#rulests-one-definition-of-a-search-key), and [schema.md](./schema.md) for why that column exists and why it is deliberately not unique. If the two ever disagree, lookups fail silently rather than erroring, which is the bad kind of bug.

**Guards on length — on the key, not on the input.**

```ts
const key = normalizeLemma(q);
if (key.length < MIN_QUERY_LENGTH) return [];
```

Below `MIN_QUERY_LENGTH` (2) it returns `[]` without touching the database, because a single letter matches a large fraction of the dictionary. Measuring the raw query measures how much arrived, never what is in it: `a%` is two characters and one letter, and guarding it first let it through to run a full scan for `a`. Normalising first makes the guard measure the thing that actually reaches SQL.

The guard stays _in the handler_ rather than in the caller, so no code path can route around it. `Results.tsx` imports `MIN_QUERY_LENGTH` as well, but only to say "at least 2 letters" — that is a message, not an enforcement.

**Ranks prefix matches first.** The `WHERE` is a `%key%` contains-match, so `amo` also finds `clamo`. But a word _starting_ with the query is nearly always what the user meant, so the ordering sorts those to the top before falling back to alphabetical:

```sql
case when lemma_plain like 'am%' then 0 else 1 end, lemma_plain
```

Capped at `MAX_RESULTS`.

### Why the full table scan is fine

`LIKE '%key%'` cannot use an index — a leading wildcard leaves a b-tree nothing to seek on — so every search reads every row. `EXPLAIN QUERY PLAN` is blunt about it:

```
SCAN entries | USE TEMP B-TREE FOR ORDER BY
```

`LIMIT 10` does not rescue it, either. The `CASE` in the `ORDER BY` is not index-satisfiable, so every match is materialised and sorted before the limit can apply. This was measured on the real stack — better-sqlite3, this exact query, four senses per entry with an index on `entry_id`, warm cache:

| entries   | lemma-only | + senses join | if search also covered glosses |
| --------- | ---------- | ------------- | ------------------------------ |
| 5,000     | 0.42 ms    | 0.42 ms       | 3.7 ms                         |
| 20,000    | 1.6 ms     | 1.7 ms        | 15 ms                          |
| 50,000    | 5.7 ms     | 7.7 ms        | 102 ms                         |
| 200,000   | 78 ms      | 79 ms         | 432 ms                         |
| 1,000,000 | 393 ms     | 394 ms        | 2,172 ms                       |

The scan is the entire cost. A query matching _zero_ rows costs about 90% of one matching four thousand; row count and row width are the only inputs that move the number. Adding an index on `lemma_plain` is not the fix people expect it to be — the query plan comes back byte-identical.

**The realistic ceiling sits well below where this hurts.** This dictionary is not expected to pass 10–20k lemmas, where a search costs under 2 ms and vanishes next to the RPC round trip wrapped around it. For scale: a student dictionary runs 10–15k headwords, Lewis & Short on the order of 50k.

The number to actually watch is not latency but the fact that **better-sqlite3 is synchronous** — the query blocks the Node event loop for its full duration, so 78 ms at 200k entries is 78 ms the server spends serving nobody. That is the real ceiling, and it sits near 100k rows, not at the point where one user notices a delay.

Two things would move the picture, in opposite directions:

- **Widening search to cover glosses** would make the scan target the senses table — several times the rows, much wider ones. That is the 18× jump in the last column, and it arrives at a size where lemma-only search is still trivial. It is the one change that turns this from a non-issue into a problem.
- **Normalising prose out of `entries`** works the other way. A full scan is page-bound, so a narrower table scans faster: 26 ms versus 49 ms at 200k for the same query. Moving senses and meanings into their own tables makes this query _cheaper_, not more expensive.

If it ever does need fixing, the answer is FTS5 with the trigram tokenizer, not an index:

```sql
CREATE VIRTUAL TABLE entries_fts USING fts5(
  lemma_plain, content='entries', content_rowid='id', tokenize='trigram');
```

Measured at 0.004 ms for 50k and 0.010 ms for 1M — effectively flat. Trigram matches substrings, so the results are identical to `%key%` rather than being narrowed to prefixes; the cost is a mirror table plus triggers to keep it in sync. **The trigger to revisit is search covering meanings, not an entry count.**

### `getEntryByLemma(lemma)`

Powers the detail page. It looks up by **`lemma`**, the macronned form, not `lemma_plain` — `lemma` carries the UNIQUE constraint, and `lemma_plain` cannot identify a row on its own once _mālum_ and _malum_ are both in the table.

It normalises to NFC before comparing. A macron in a URL can arrive as one codepoint (`ō`) or as `o` + U+0304, depending on where the link was copied from; without the normalise, `/verbum/ambulo%CC%84` would 404 while looking identical to the working URL.

## Loader behaviour

```ts
loaderDeps: ({ search: { q } }) => ({ q: q ?? "" }),
loader: ({ deps: { q } }) => searchEntries({ data: q }),
staleTime: 60_000,
```

`loaderDeps` is what makes any of this work: it declares `q` as the loader's cache key, so changing `?q=` re-runs the loader and _nothing else does_.

**Where the loader runs depends on how you got there:**

|                            | What happens                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| First load / refresh (SSR) | Loader runs **on the server**, calls the DB directly, result is dehydrated into the HTML. No client fetch. |
| Any in-app navigation      | Loader runs **on the client**; `searchEntries` becomes one `GET /_serverFn/…` RPC. No document reload.     |

So a client-side search costs exactly the one request you would have made by hand — and `staleTime` means retyping a query or hitting back inside the minute costs zero.

**The component does not unmount** when only the search params change. `useLoaderData()` keeps returning the previous results while the new loader runs, so the old list stays on screen and pulses via `isFetching` (which does not come from where you would expect — see [below](#where-isfetching-comes-from)) rather than being replaced by a spinner. This is also why the route-level `pendingComponent` is deliberately unused: it would swap out the whole route including the input, stealing focus mid-typing.

**Stale responses cannot win.** Type `a` → `am` → `amo` quickly and the responses may land out of order. The router discards superseded loader runs. Hand-rolled fetching would need its own sequencing here.

## `q` is optional, on purpose

```ts
validateSearch: (search): { q?: string } => {
  const q = typeof search.q === "string" ? search.q.trim() : "";
  return q === "" ? {} : { q };
};
```

The first version always returned a `q`, defaulting to `""`. That looks harmless and costs every visitor a redirect: the router compares its validated output against the actual URL, finds `/` missing the param it insists on, and **307s to `/?q=`** before rendering anything.

Returning `{}` for an empty search makes bare `/` a fixed point. It also means clearing the box lands back on a clean `/` rather than a stray `/?q=`.

## Client side

`Search.tsx` holds exactly one piece of local state, and it is not the results.

### Draft vs. committed

```ts
const q = route.useSearch({ select: (search) => search.q ?? "" }); // committed
const [value, setValue] = useState(q); // draft
```

`value` is what is in the box right now; `q` is the search that has actually been run. These are genuinely different facts, not a duplication — the box must stay responsive per keystroke without a navigation per keystroke. Submitting promotes draft to committed:

```ts
navigate({ search: trimmed === "" ? {} : { q: trimmed }, resetScroll: false });
```

### Re-syncing on outside changes

When `q` changes from somewhere other than the form — back/forward, the header logo, a pasted link — the box has to follow:

```ts
const [syncedQ, setSyncedQ] = useState(q);
if (q !== syncedQ) {
  setSyncedQ(q);
  setValue(q);
}
```

This is React's documented "adjust state during render" pattern, not a workaround. An effect would work too but paints one frame with the stale value first.

### Search is submit-driven

Enter or the _Quaere_ button. Search-as-you-type is a debounced effect away, and if it is ever added it needs `replace: true` so six keystrokes do not leave six entries in the history stack — with the submit handler staying on `replace: false` so Enter still creates a real, bookmarkable entry.

### Where `isFetching` comes from

```ts
const isFetching = useRouterState({ select: (s) => s.isLoading });
```

Router state, not match state. The obvious reach is `route.useMatch({ select: (m) => m.isFetching })`, and it is **never true** — not intermittently, not for one frame. Worth understanding, because the same trap is waiting behind any per-match flag on this route.

`loaderDeps` is the cause. The router builds a match id as `route.id + interpolatedPath + JSON.stringify(loaderDeps)`, so declaring `q` as a dep puts it in the match's _identity_: `/?q=am` and `/?q=amo` are two different matches, not one match refetching. And the router only ever publishes `isFetching` onto the match currently on screen — the store write is guarded by `presented.id === match.id`. While the new query loads, the presented match is still the old one under the old id, so the flag is set on an object nothing is rendering. By the time the new match is committed, the loader has resolved and the flag is already back to `false`. It never crosses a render boundary.

The flag does work for a reload of the _same_ match id — `router.invalidate()`, or a stale reload with unchanged deps. Search never does that, because the whole point of the deps is that a new query is a new cache entry. The two features are in direct tension, and the deps win.

`s.isLoading` is `status === "pending"` on the router itself. It is set on the navigation rather than on any one match, so it flips at both the right moments. The cost is that it is router-wide: it is also true while a click through to `/verbum/$lemma` loads, so the list pulses on the way out. That reads as correct here — something _is_ loading — but if it ever needs narrowing, the scope has to come from comparing the pending location, not from the match.

## Structure and announcements

The `<search>` landmark holds **only the controls**. Results are page content and live in their own labelled region beside it:

```tsx
<search><form>…</form></search>

<section aria-labelledby="results-heading" aria-busy={isFetching}>
```

This is what the HTML spec asks for — the `search` element is not for presenting results — and it is the practical choice too. A landmark stretched over the whole page is useless as a jump target; two named landmarks give two useful ones. (The wider language-and-labelling rules live in [a11y.md](./a11y.md).)

The result count is announced through a live region that is **always mounted**:

```tsx
<p aria-live="polite" className="sr-only">
  {announcement}
</p>
```

A live region inserted into the DOM at the same moment its text appears is routinely missed by screen readers. It renders empty and gains text instead. The announcement is also suppressed while `isFetching` — announcing every intermediate state talks over the user.

Focus is never moved to the results. The polite announcement is the affordance; yanking focus out of the input would be hostile. The one place focus _is_ moved is the _dēlē_ button, which unmounts itself on clear and hands focus back to the input rather than dropping it on `<body>`.

## Results link out

Each row links to `/verbum/$lemma`, carrying the current query along: `/verbum/ambulō?q=am`. The detail page uses it for a back link that restores the search you came from rather than dumping you on an empty page.

Only the lemma is the anchor. Wrapping the whole row was the first attempt and gave every link this accessible name:

> "ambulōverb · 1st conj.ambulō, ambulāre, ambulāvī, ambulātumto walk"

Instead the `<Link>` wraps the lemma alone and stretches its hit area over the row with `after:absolute after:inset-0`. The name is `ambulō`, the `<h3>`s stay clean for heading navigation, and the whole row is still clickable. The tradeoff is that text inside a row is awkward to select — acceptable for a scan-and-click list, where copying happens on the detail page.

## Gotchas

- **`lemma_plain` is not unique.** Nothing here depends on it being unique, but do not reach for it as a key. Detail URLs use `lemma`.
- **There is one `normalizeLemma`, in `#/utils/search/rules.ts`.** Search, the seed and `check:lemmas` all call it; a second inlined copy is how `lemma_plain` starts lying. `scripts/enrich-entries.ts` keeps a deliberate copy so it can run standalone — change the rule and you have to change that too, and `npm run check:lemmas` is what catches you if you forget.
- **In `normalizeLemma`, case-fold before filtering.** `[^a-z ]` deletes an uppercase letter rather than lowering it, so putting `.toLowerCase()` last turns `Roma` into `oma` — a query that silently finds nothing, and a `lemma_plain` that is silently wrong.
- **The query is filtered, never escaped.** `%` and `_` cannot reach the `LIKE` pattern because the character class removes them. Widen that class and you have handed every user a wildcard.
- **Macron normalisation is load-bearing in two places** — `normalizeLemma` for search, `normalize("NFC")` for detail lookup — and failures are silent misses, not errors.
- **The debounce, if added, must use `replace: true`.** Otherwise the back button becomes unusable.
- **The senses join, when it lands, must limit _before_ it joins.** `JOIN senses … LIMIT 10` limits sense rows, not entries — ten rows is three words. Limit `entries` in a subquery, then join. It benchmarks fine either way, so performance will not warn you about the bug.
- **Do not add an index on `lemma_plain` hoping to speed up search.** A leading `%` cannot use it; the plan does not change. See [above](#why-the-full-table-scan-is-fine).
- **Do not reach for `useMatch().isFetching` here.** `loaderDeps` makes every query a distinct match, and the flag is only ever written to the match already on screen — so it reads `false` for the entire load. Use router status.
