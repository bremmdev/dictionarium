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

`src/server/search.ts` holds both server functions. They are `method: "GET"` because they read: semantically correct, and cacheable at the HTTP layer.

### `searchEntries(q)`

```ts
export const searchEntries = createServerFn({ method: "GET" })
  .validator((q: unknown) => (typeof q === "string" ? q.trim() : ""))
  .handler(async ({ data: q }) => { … });
```

Three things it does, in order:

**Guards on length.** Below `MIN_QUERY_LENGTH` (2) it returns `[]` without touching the database. A single letter matches a large fraction of the dictionary, and the guard lives *in the handler* rather than in the caller so no code path can route around it.

**Strips macrons off the query.** Users type `villa`; the display form is `vīlla`. `stripMacrons` decomposes to NFD, drops every combining mark, and recomposes:

```ts
value.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC").toLowerCase()
```

This has to agree with how `lemma_plain` was written by the seed script — see [schema.md](./schema.md) for why that column exists and why it is deliberately not unique. If the two ever disagree, lookups fail silently rather than erroring, which is the bad kind of bug.

**Ranks prefix matches first.** The `WHERE` is a `%key%` contains-match, so `amo` also finds `clamo`. But a word *starting* with the query is nearly always what the user meant, so the ordering sorts those to the top before falling back to alphabetical:

```sql
case when lemma_plain like 'am%' then 0 else 1 end, lemma_plain
```

Capped at `MAX_RESULTS` (25).

### `getEntryByLemma(lemma)`

Powers the detail page. It looks up by **`lemma`**, the macronned form, not `lemma_plain` — `lemma` carries the UNIQUE constraint, and `lemma_plain` cannot identify a row on its own once *mālum* and *malum* are both in the table.

It normalises to NFC before comparing. A macron in a URL can arrive as one codepoint (`ō`) or as `o` + U+0304, depending on where the link was copied from; without the normalise, `/verbum/ambulo%CC%84` would 404 while looking identical to the working URL.

## Loader behaviour

```ts
loaderDeps: ({ search: { q } }) => ({ q: q ?? "" }),
loader: ({ deps: { q } }) => searchEntries({ data: q }),
staleTime: 60_000,
```

`loaderDeps` is what makes any of this work: it declares `q` as the loader's cache key, so changing `?q=` re-runs the loader and *nothing else does*.

**Where the loader runs depends on how you got there:**

| | What happens |
| --- | --- |
| First load / refresh (SSR) | Loader runs **on the server**, calls the DB directly, result is dehydrated into the HTML. No client fetch. |
| Any in-app navigation | Loader runs **on the client**; `searchEntries` becomes one `GET /_serverFn/…` RPC. No document reload. |

So a client-side search costs exactly the one request you would have made by hand — and `staleTime` means retyping a query or hitting back inside the minute costs zero.

**The component does not unmount** when only the search params change. `useLoaderData()` keeps returning the previous results while the new loader runs, so the old list stays on screen and is dimmed via `isFetching` rather than being replaced by a spinner. This is also why the route-level `pendingComponent` is deliberately unused: it would swap out the whole route including the input, stealing focus mid-typing.

**Stale responses cannot win.** Type `a` → `am` → `amo` quickly and the responses may land out of order. The router discards superseded loader runs. Hand-rolled fetching would need its own sequencing here.

## `q` is optional, on purpose

```ts
validateSearch: (search): { q?: string } => {
  const q = typeof search.q === "string" ? search.q.trim() : "";
  return q === "" ? {} : { q };
}
```

The first version always returned a `q`, defaulting to `""`. That looks harmless and costs every visitor a redirect: the router compares its validated output against the actual URL, finds `/` missing the param it insists on, and **307s to `/?q=`** before rendering anything.

Returning `{}` for an empty search makes bare `/` a fixed point. It also means clearing the box lands back on a clean `/` rather than a stray `/?q=`.

## Client side

`Search.tsx` holds exactly one piece of local state, and it is not the results.

### Draft vs. committed

```ts
const q = route.useSearch({ select: (search) => search.q ?? "" });  // committed
const [value, setValue] = useState(q);                              // draft
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

Enter or the *Quaere* button. Search-as-you-type is a debounced effect away, and if it is ever added it needs `replace: true` so six keystrokes do not leave six entries in the history stack — with the submit handler staying on `replace: false` so Enter still creates a real, bookmarkable entry.

## Structure and announcements

The `<search>` landmark holds **only the controls**. Results are page content and live in their own labelled region beside it:

```tsx
<search><form>…</form></search>

<section aria-labelledby="results-heading" aria-busy={isFetching}>
```

This is what the HTML spec asks for — the `search` element is not for presenting results — and it is the practical choice too. A landmark stretched over the whole page is useless as a jump target; two named landmarks give two useful ones. (The wider language-and-labelling rules live in [a11y.md](./a11y.md).)

The result count is announced through a live region that is **always mounted**:

```tsx
<p aria-live="polite" className="sr-only">{announcement}</p>
```

A live region inserted into the DOM at the same moment its text appears is routinely missed by screen readers. It renders empty and gains text instead. The announcement is also suppressed while `isFetching` — announcing every intermediate state talks over the user.

Focus is never moved to the results. The polite announcement is the affordance; yanking focus out of the input would be hostile. The one place focus *is* moved is the *dēlē* button, which unmounts itself on clear and hands focus back to the input rather than dropping it on `<body>`.

## Results link out

Each row links to `/verbum/$lemma`, carrying the current query along: `/verbum/ambulō?q=am`. The detail page uses it for a back link that restores the search you came from rather than dumping you on an empty page.

Only the lemma is the anchor. Wrapping the whole row was the first attempt and gave every link this accessible name:

> "ambulōverb · 1st conj.ambulō, ambulāre, ambulāvī, ambulātumto walk"

Instead the `<Link>` wraps the lemma alone and stretches its hit area over the row with `after:absolute after:inset-0`. The name is `ambulō`, the `<h3>`s stay clean for heading navigation, and the whole row is still clickable. The tradeoff is that text inside a row is awkward to select — acceptable for a scan-and-click list, where copying happens on the detail page.

## Gotchas

- **`lemma_plain` is not unique.** Nothing here depends on it being unique, but do not reach for it as a key. Detail URLs use `lemma`.
- **Macron normalisation is load-bearing in two places** — `stripMacrons` for search, `normalize("NFC")` for detail lookup — and failures are silent misses, not errors.
- **`validator`, not `inputValidator`.** The latter is deprecated in the installed version and only survives as an alias.
- **The debounce, if added, must use `replace: true`.** Otherwise the back button becomes unusable.
