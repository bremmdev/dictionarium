# Schema: one row = one lemma

Latin dictionaries do not file inflected forms. You will not find *currunt* or *rīdent*. Words have dozens of forms, so a dictionary stores one canonical form — the **lemma** — plus just enough extra to reconstruct the rest.

That is the design of this schema. Inflected forms are a later layer. Wiktionary is the north star for how rich an entry can eventually become; this table is the skeleton.

One more ground rule: the database holds **only facts about Latin**. The app will be public — read-only lookup for everyone, an authenticated admin panel for editing — so nothing personal goes in the rows. No “which lesson I learned this in”; the learning journey lives outside the database.

## Filing conventions

| Word type | Filed as | Example |
| --- | --- | --- |
| Verb | the four principal parts | *currō, currere, cucurrī, cursum* |
| Noun | nominative + genitive + gender | *puella, puellae, f.* |
| Everything else | the word itself | *quoque* |

On the row:

- **lemma** is the canonical headword (1st principal part of a verb; nominative of a noun; the word itself otherwise).
- **principal_parts** holds the rest of the dictionary filing: all four parts for a verb, the genitive for a noun. Null when the lemma is the whole filing.
- **gender** is its own column on nouns (`m` / `f` / `n`), not buried in the principal-parts string.

## Store what you query by

The genitive already encodes declension (*-ae* → 1st, *-ī* → 2nd, *-is* → 3rd…). A verb’s infinitive already encodes conjugation. Store both **declension** and **conjugation** anyway, so the app can filter and group — “show me every 3rd-declension noun” — which is the backbone of quiz mode later.

Rule of thumb: store what you want to query by, even if it is derivable.

The counterpart rule: do not store the same fact twice when the copies can drift. That is why `meaning_en` will *move* to the senses table when it arrives (see [Later](#later)) instead of being duplicated on the entry — a headword’s core meaning is simply its first sense.

Both columns are **text, not integer**. Values that will show up:

- declension: `1` … `5`, and later outliers that do not fit a number
- conjugation: `1` … `4`, plus `3io` (mixed 3rd) and `irregular`

## Macrons

Display *labōrō*; search for `laboro`. Two columns, always:

| Column | Role | Example |
| --- | --- | --- |
| `lemma` | display form, with macrons | `labōrō` |
| `lemma_plain` | search key, macrons stripped | `laboro` |

`lemma_plain` is deliberately **not** unique: different words can share it — *liber* (book) and *līber* (free) both search as `liber` — and search should return both.

## Unique on `lemma`

`lemma` — the macronned form — carries a unique constraint, so seed scripts can be idempotent:

```ts
await db.insert(entries).values([...])
  .onConflictDoNothing({ target: [entries.lemma] });
```

Run it as often as you like, extend it, rerun it; no duplicates. Two caveats:

- **True homographs will eventually break this.** A few words are spelled identically, macrons included, yet are different words: *volō, velle* (to want) vs *volō, volāre* (to fly); *cum* the preposition vs *cum* the conjunction. Planned fix when the first one actually shows up: a `homonym` integer column (default 1 — the dictionary superscripts volō¹ / volō²), unique becomes `(lemma, homonym)`.
- **`onConflictDoNothing` only catches exact string matches.** A macron typo (`canto` for `cantō`) inserts a near-duplicate instead of conflicting. The constraint protects against reseeding, not sloppy entry — the admin panel should warn when a new lemma’s `lemma_plain` already exists.

## `entries`

| Column | Required | Notes |
| --- | --- | --- |
| `id` | yes | surrogate key |
| `lemma` | yes | display lemma, macrons kept; **unique** |
| `lemma_plain` | yes | macron-stripped search key |
| `part_of_speech` | yes | `verb`, `noun`, `adverb`, … |
| `principal_parts` | no | four parts (verb) or genitive (noun) |
| `gender` | no | nouns: `m` / `f` / `n` |
| `declension` | no | nouns/adjectives: text (`1`…`5`, …) |
| `conjugation` | no | verbs: text (`1`…`4`, `3io`, `irregular`) |
| `meaning_en` | yes | English gloss |
| `notes` | no | free text |

## Later

Inflected forms are not rows. When they arrive, they hang off a lemma — they do not replace it.

The same pattern governs meanings. Next up, roughly in order:

1. **`senses` table** — one-to-many from `entries`, for words with genuinely distinct meanings (*dūcō*: lead / draw / consider / marry / march an army…). Agreed shape: `entry_id` (FK, cascade delete), `rank` (1 = core meaning, display order), `meaning_en` (comma-separated glosses of that *one* sense — commas within a sense, rows between senses), `usage` (`military`, `vulgar`, `by extension`, …), `example_la`, `example_en`. Unique `(entry_id, rank)` so sense seeding is idempotent too. Migration moves each `entries.meaning_en` into a rank-1 sense row, then drops the column; invariant: every entry has ≥ 1 sense. Curation rule: record only senses actually met in reading — this is a personal corpus, not a Wiktionary mirror.
2. **Public search route**, querying `lemma_plain`.
3. **Admin panel + auth** (leaning toward a single admin password/session — no user accounts), replacing Drizzle Studio as the editing tool.
4. **Railway deploy**, SQLite file on a mounted volume (`DB_FILE_NAME` already supports this).

Parked: the `homonym` column (above), synonym cross-references between entries, proper treatment of prepositions and the case they govern (*in* + abl, *ad* + acc — currently not seeded), spaced-repetition quiz mode as a separate private layer.

## Operations

The database is a SQLite file at `src/db/dictionarium.db` (override with `DB_FILE_NAME`). Schema: `src/db/schema.ts`, applied with `npx drizzle-kit push` (proper migrations start once the schema evolves). Seed: `npx tsx scripts/seed.ts`. Browse: `npx drizzle-kit studio`.
