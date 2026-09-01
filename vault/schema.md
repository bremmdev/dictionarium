# Schema: one row = one lemma

Latin dictionaries do not file inflected forms. You will not find _currunt_ or _rīdent_. Words have dozens of forms, so a dictionary stores one canonical form — the **lemma** — plus just enough extra to reconstruct the rest.

That is the design of this schema. Inflected forms are a later layer. Wiktionary is the north star for how rich an entry can eventually become; this table is the skeleton.

The app will be public — read-only lookup for everyone, an authenticated admin panel for editing.

## Filing conventions

| Word type       | Filed as                       | Example                           |
| --------------- | ------------------------------ | --------------------------------- |
| Verb            | the four principal parts       | _currō, currere, cucurrī, cursum_ |
| Noun            | nominative + genitive + gender | _puella, puellae, f._             |
| Everything else | the word itself                | _quoque_                          |

On the row:

- **lemma** is the canonical headword (1st principal part of a verb; nominative of a noun; the word itself otherwise).
- **principal_parts** holds the rest of the dictionary filing: all four parts for a verb, the genitive for a noun. Null when the lemma is the whole filing.
- **gender** is its own column on nouns (`m` / `f` / `n`), not buried in the principal-parts string.

## Store what you query by

The genitive already encodes declension (_-ae_ → 1st, _-ī_ → 2nd, _-is_ → 3rd…). A verb’s infinitive already encodes conjugation. Store both **declension** and **conjugation** anyway, so the app can filter and group — “show me every 3rd-declension noun” — which is the backbone of quiz mode later.

Rule of thumb: store what you want to query by, even if it is derivable.

The counterpart rule: do not store the same fact twice when the copies can drift. That is why `meaning_en` _moved_ to the [senses](#senses) table instead of being duplicated onto the entry — a headword’s core meaning is simply its first sense, and the UI reads it as `senses[0]`.

Both columns are **text, not integer**, and that decision has now paid out — see [The inflection vocabulary](#the-inflection-vocabulary).

## Macrons

Display _labōrō_; search for `laboro`. Two columns, always:

| Column        | Role                         | Example  |
| ------------- | ---------------------------- | -------- |
| `lemma`       | display form, with macrons   | `labōrō` |
| `lemma_plain` | search key, macrons stripped | `laboro` |

`lemma_plain` is deliberately **not** unique: different words can share it — _liber_ (book) and _līber_ (free) both search as `liber` — and search should return both.

## Unique on `lemma`

`lemma` — the macronned form — carries a unique constraint, so seed scripts can be idempotent:

```ts
await db.insert(entries).values([...])
  .onConflictDoUpdate({ target: [entries.lemma], set: { /* excluded.* */ } });
```

The seed is a statement of what a word **is**, so re-running it has to overwrite the row it finds, not skip it. Otherwise every correction made to a lemma already in the table is silently ignored. The `set` reads from `excluded.`

Run it as often as you like, extend it, rerun it; no duplicates. A caveat:

- **True homographs will eventually break this.** A few words are spelled identically, macrons included, yet are different words: _volō, velle_ (to want) vs _volō, volāre_ (to fly); _cum_ the preposition vs _cum_ the conjunction. Planned fix when the first one actually shows up: a `homonym` integer column (default 1 — the dictionary superscripts volō¹ / volō²), unique becomes `(lemma, homonym)`.

## `entries`

| Column            | Required | Notes                                                                              |
| ----------------- | -------- | ---------------------------------------------------------------------------------- |
| `id`              | yes      | surrogate key                                                                      |
| `lemma`           | yes      | display lemma, macrons kept; **unique**                                            |
| `lemma_plain`     | yes      | macron-stripped search key                                                         |
| `part_of_speech`  | yes      | `verb`, `noun`, `adverb`, …                                                        |
| `principal_parts` | no       | four parts (verb) or genitive (noun)                                               |
| `gender`          | no       | nouns: `m` / `f` / `n`                                                             |
| `declension`      | no       | text — `1`…`5`, `1-2`, `indeclinable`; NULL only where the question does not apply |
| `conjugation`     | no       | text — `1`…`4`, `3io`, `irregular`; same NULL rule                                 |
| `notes`           | no       | free text                                                                          |

`meaning_en` used to live here. It moved to `senses` and the column was dropped — see `[senses](#senses)`.

## The inflection vocabulary

Making `declension` text rather than an integer was a bet on outliers, and _septem_ collected it.

Before it, every NULL in the column happened to mean "not applicable" — all the nouns carried a declension, all the verbs a conjugation. That was true by luck of what had been seeded, not by design. _septem_ is the word that ends it: it is a numeral, it is the kind of word that declines, and it never changes shape. Filing it as NULL would make the column say two different things with one empty slot:

| Word     | `declension` | What the NULL would mean                           |
| -------- | ------------ | -------------------------------------------------- |
| _ambulō_ | NULL         | the question does not apply — verbs do not decline |
| _septem_ | NULL         | the question applies, and the answer is _never_    |

NULL in SQL means _no value here_. It cannot tell you whether that is because nobody asked the question or because the answer is nothing — which is exactly the defect `meaning_en` had one column over, a slot holding two facts that a reader has to guess between.

So the fix is a **value, not a column**. No `indeclinable` boolean sitting beside `declension` waiting to contradict it, and no migration — the column has been text since the beginning.

| Value in `declension` | Means                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| `1` … `5`             | declines, and here is which table                                                                   |
| `1-2`                 | an adjective using 1st-declension endings for the feminine, 2nd for the rest (_bonus, bona, bonum_) |
| `indeclinable`        | the word never changes shape                                                                        |
| NULL                  | the question does not apply to this part of speech                                                  |

The column's question was never "which numbered table?" — it is **how does this word inflect?**, and _indeclinable_ is a perfectly good answer to that, where NULL is not an answer at all. `conjugation` already worked this way: `irregular` is the same move, made earlier.

It is not a numeral problem, either. The grammar has a named class for it: "A few adjectives are indeclinable: _damnās, frūgī, nēquam, necesse, tot, quot, aliquot, totidem, potis_" ([A&G §122](https://dcc.dickinson.edu/grammar/latin/indeclinable-adjectives)).

### `numeral` is a filing label, not a grammatical claim

`part_of_speech` gains `numeral`, covering cardinals and ordinals alike. The grammar would not group them: it calls _prīmus_ an adjective of the 1st and 2nd declensions and _septem_ an indeclinable one ([A&G §134](https://dcc.dickinson.edu/grammar/latin/numerals)). But `part_of_speech` is what a reader sees on the card, and _numeral_ is what they are looking for. The grammar goes in `notes`, where it can be a sentence instead of an enum.

Which is why one lesson's worth of numbers produces four different rows:

| Lemma    | `part_of_speech` | `declension`                                                                      |
| -------- | ---------------- | --------------------------------------------------------------------------------- |
| _septem_ | `numeral`        | `indeclinable`                                                                    |
| _mīlle_  | `numeral`        | `indeclinable` (the plural _mīlia_ is a 3rd-decl. neuter noun — a `notes` matter) |
| _prīmus_ | `numeral`        | `1-2`                                                                             |
| _ūnus_   | `numeral`        | `1-2` (with the pronominal genitive _ūnīus_, dative _ūnī_)                        |
| _quot_   | `adjective`      | `indeclinable`                                                                    |

### The invariant this creates

NULL now carries exactly one meaning, and nothing in the schema enforces it. A part of speech that inflects must say **how** — with a number or with the word `indeclinable` — because a forgotten field is otherwise indistinguishable from a deliberate one. That is a job for a `scripts/check-inflection.ts` in the `npm run check` chain, alongside `check-lemmas.ts`. **Not written yet.**

## `senses`

One row per genuinely distinct meaning, one-to-many from `entries`. Shipped in migrations `0001`–`0003`.

| Column       | Required | Notes                                                           |
| ------------ | -------- | --------------------------------------------------------------- |
| `id`         | yes      | surrogate key                                                   |
| `entry_id`   | yes      | FK → `entries.id`, `ON DELETE CASCADE`                          |
| `rank`       | yes      | 1 is the core meaning; the rest follow in dictionary order      |
| `meaning_en` | yes      | the comma-separated glosses of this _one_ sense                 |
| `usage`      | no       | `medical`, `military`, `poetic`, … — a label on this sense only |
| `example_la` | no       | a quotation showing the sense                                   |
| `example_en` | no       | its translation                                                 |

Unique on **(`entry_id`, `rank`)**: one word cannot have two sense number 2s. That single index is both the curation guard and what makes sense-seeding re-runnable.

**Commas within a sense, rows between senses.** _rīdeō_ "to laugh, smile" is one meaning with two English words for it — a gloss, and it stays one string. _auxilium_ "help, aid, assistance" and "remedy, antidote" are two jobs the same word does, and the second one wants the label `medical` hung off it. A comma has nowhere to put that label. The dividing question is not "how many English words?" but "would I ever want to say something about one of these and not the other?"

Two invariants the schema cannot express, and neither is guarded yet:

- every entry has at least one sense — a word with no meaning is not an entry;
- ranks run 1..n with no gaps, because rank 1 _is_ the headline meaning and the UI reads `senses[0]` on the strength of that promise.

UNIQUE `(entry_id, rank)` stops duplicates and says nothing about either. Planned: `scripts/check-senses.ts`. **Not written yet.**

### Relations vs. foreign keys

Two different objects, and one does not imply the other. `.references(() => entries.id, { onDelete: "cascade" })` writes a `FOREIGN KEY` clause into the SQL — the database's rule, enforced by SQLite. `relations()` writes nothing to the database at all; it is a TypeScript description that unlocks `db.query`. Both are needed, plus `{ schema }` handed to `drizzle()` — see [db.md](./db.md).

The cascade only fires when `PRAGMA foreign_keys` is on, which is per-connection and off in a stock SQLite build. `createClient()` pins it. That is why the `sqlite3` CLI can make a cascade look broken while the app's cascade works fine.

### Reading it back is one query, not eleven

`with: { senses: … }` compiles to a correlated subquery that SQLite aggregates into JSON before it reaches Node — not a join, not an N+1. The shape matters: a join returns one row per _sense_, so `limit 10` would cut a word in half and ten result rows could be four words. The subquery keeps one row per entry, which is what `MAX_RESULTS` was always counting.

## Later

Inflected forms are not rows. When they arrive, they hang off a lemma — they do not replace it.

The same pattern governs meanings — `senses` did exactly this, and is [done](#senses). Next up, roughly in order:

1. **The two guard scripts** — `check-senses.ts` and `check-inflection.ts`, and widening `npm run check` to actually run them (and `check:lemmas`, which exists but was never wired into the chain — a guard outside the gate is a guard that is off).
2. **Admin panel + auth** (leaning toward a single admin password/session — no user accounts), replacing Drizzle Studio as the editing tool. With senses in place, adding a second meaning means editing a seed file and re-running it, which is friction that will quietly stop words getting added at all.
3. **Railway deploy**, SQLite file on a mounted volume (`DB_FILE_NAME` already supports this). Open question that belongs there rather than here: _when_ `drizzle-kit migrate` runs — at build time, at boot, or by hand.

Parked: the `homonym` column (above), synonym cross-references between entries, proper treatment of prepositions and the case they govern (_in_ + abl, _ad_ + acc — currently not seeded), spaced-repetition quiz mode as a separate private layer.

## Operations

The database is a SQLite file at `src/db/dictionarium.db` (override with `DB_FILE_NAME`); connection details in [db.md](./db.md). Schema: `src/db/schema.ts`. Seed: `npx tsx scripts/seed.ts`. Browse: `npm run db:studio`.

### Migrations, not push

The schema is applied by a migration chain in `drizzle/`, generated from `schema.ts`:

```sh
npm run db:generate   # diff schema.ts against the last snapshot → drizzle/NNNN_*.sql
npm run db:migrate    # apply what has not been applied
```

`push` is not a beginner's tool that got outgrown — the Drizzle docs are explicit that teams run it in production. It was dropped because of what it _takes as input_: it reads the TypeScript schema, compares it with the live database, and applies the difference. Every input to that is a **shape**. Nowhere in it is there a place to say "and the contents of this column must end up over there". Asked to add `senses` and drop `meaning_en` in one go, push would do both, and the words would be gone.

**Expand → backfill → contract.** The move off `meaning_en` was three migrations rather than one edit, and only the middle one is about data:

| Step     | Migration                                                      | Safe against a running app?            |
| -------- | -------------------------------------------------------------- | -------------------------------------- |
| Expand   | `0001_add_senses` — add the new shape, leave the old one alone | yes — old code does not know it exists |
| Backfill | `0002_backfill_senses` — copy the data across                  | yes — nothing reads the new table yet  |
| Contract | `0003_drop_entries_meaning`                                    | only after the new code is deployed    |

The reason to keep them apart is the moment _between_ them. On a laptop that moment lasts a second; on Railway, with a server holding the file open, old code asking for a dropped `meaning_en` does not degrade, it 500s.

**A migration must never guess.** The backfill is hand-written SQL (`db:generate --custom`) and it is deliberately dumb:

```sql
INSERT INTO senses (entry_id, rank, meaning_en)
SELECT id, 1, meaning_en FROM entries;
```

Splitting `meaning_en` on commas is four characters away and it is the wrong thing to do — it would turn _rīdeō_ "to laugh, smile" into two senses of a word that has one, silently, across every row, with nothing to diff against. The comma is a judgement, not a delimiter. Splitting is editorial work, and it happens in `seed.ts` one word at a time, where the word is visible while the decision is made.

**`0000_baseline`.** The chain starts by describing the database that `push` had already built: generate the baseline, delete the `.db`, replay from zero, reseed. That trick works only because the data is derived — `seed.ts` holds every word. **It expires the day the admin panel ships**, when the `.db` becomes the only copy of anything hand-entered. Which is the reason for adopting migrations one lesson before needing them.

### Backups

Under WAL a committed write lives in the `-wal` sidecar until a checkpoint folds it in, so use VACCUUM for backups:

```sh
sqlite3 src/db/dictionarium.db "VACUUM INTO 'src/db/dictionarium.db.bak'"
```

`VACUUM INTO` reads through a real transaction, so it sees the WAL and writes one consistent file. Corollary: the database is three files, so deleting it is `rm src/db/dictionarium.db*`.
