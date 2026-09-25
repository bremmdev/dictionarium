# Schema: one row = one lemma

Latin dictionaries do not file inflected forms. You will not find _currunt_ or _rīdent_. Words have dozens of forms, so a dictionary stores one canonical form — the **lemma** — plus just enough extra to reconstruct the rest.

That is the design of this schema. Inflected forms are a later layer. Wiktionary is the north star for how rich an entry can eventually become; this table is the skeleton.

The app will be public — read-only lookup for everyone, an authenticated admin panel for editing.

## Filing conventions

| Word type       | Filed as                       | Example                           |
| --------------- | ------------------------------ | --------------------------------- |
| Verb            | the four principal parts       | _currō, currere, cucurrī, cursum_ |
| Noun            | nominative + genitive + gender | _puella, puellae, f._             |
| Adjective       | one form per termination       | _ācer, ācris, ācre_               |
| Everything else | the word itself                | _quoque_                          |

On the row:

- **lemma** is the canonical headword (1st principal part of a verb; nominative of a noun; the word itself otherwise).
- **principal_parts** holds the dictionary filing: all four parts for a verb, the genitive for a noun, one form per termination for an adjective. Null when the lemma is the whole filing — which for an adjective means only the indeclinable ones.
- The lemma repeats inside the string wherever a dictionary prints it there. A verb's first principal part is its lemma and always was; an adjective's masculine is the same, and _bonus, bona, bonum_ is the line a reader expects. A noun is the exception, because _puella, puellae_ is filed as a nominative and a genitive rather than as one run-on line.
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
| `principal_parts` | no       | four parts (verb), genitive (noun), or the terminations (adjective)                |
| `gender`          | no       | nouns: `m` / `f` / `n`                                                             |
| `declension`      | no       | text — `1`…`5`, `1-2`, `indeclinable`; NULL only where the question does not apply |
| `terminations`    | no       | 3rd-declension adjectives: `1` / `2` / `3`; same NULL rule                         |
| `conjugation`     | no       | text — `1`…`4`, `3io`, `irregular`; same NULL rule                                 |
| `notes`           | no       | free text                                                                          |

`meaning_en` used to live here. It moved to `senses` and the column was dropped — see `[senses](#senses)`.

### `created_at`

Nullable unix seconds, added after the app went live. NULLs mean "filed before this dictionary started keeping a date". Nothing was backfilled, because there is no real date to backfill _with_ — see [analytics.md](./analytics.md#created_at-and-why-the-old-words-are-null), which also explains why the column has no DDL default and could not have one.

The two event tables that arrived with it, `search_events` and `view_events`, are documented there rather than here. They are not part of the dictionary: nothing relates to them, and losing them would cost a chart, not a word.

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

Not every value answers for every part of speech. `DECLENSIONS_BY_PART_OF_SPEECH` in `src/utils/entries/rules.ts` narrows the list, and the form's chips, `parseEntryDraft`, the Wiktionary fill and `check-inflection.ts` all read it:

| Part of speech | Files under                        |
| -------------- | ---------------------------------- |
| `noun`         | `1` … `5`, `indeclinable`          |
| `adjective`    | `1-2`, `3`, `indeclinable`         |
| `numeral`      | `1-2`, `3`, `indeclinable`         |
| `pronoun`      | any — no value fits their system yet |

A noun under `1-2` is a typo, and an adjective under a bare `2` or `4` is in a class no word list can find it in. Pronouns keep the whole list until the column grows a value for the pronominal declension (see below); narrowing them now would be guessing.

The column's question was never "which numbered table?" — it is **how does this word inflect?**, and _indeclinable_ is a perfectly good answer to that, where NULL is not an answer at all. `conjugation` already worked this way: `irregular` is the same move, made earlier.

It is not a numeral problem, either. The grammar has a named class for it: "A few adjectives are indeclinable: _damnās, frūgī, nēquam, necesse, tot, quot, aliquot, totidem, potis_" ([A&G §122](https://dcc.dickinson.edu/grammar/latin/indeclinable-adjectives)).

### `terminations`, and why counting the forms cannot replace it

A 3rd-declension adjective files with one, two or three nominative forms, and the grammar has a name for each class ([A&G §§115–121](https://dcc.dickinson.edu/grammar/latin/adjectives-third-declension)). Printed dictionaries never name it. Lewis & Short files _ācer, cris, cre, adj._ and the OLD files _ACER ~cris ~cre, a._ — the forms are the statement, and the reader is expected to count.

So the first question was whether this column is a column at all, or whether `principal_parts` already holds the answer. It does not:

| Lemma    | `principal_parts`   | Forms | Class               |
| -------- | ------------------- | ----- | ------------------- |
| _ācer_   | _ācer, ācris, ācre_ | 3     | three-termination   |
| _fortis_ | _fortis, forte_     | 2     | two-termination     |
| _vetus_  | _vetus, veteris_    | 2     | **one**-termination |

_fortis_ and _vetus_ file the same number of forms and are not the same class. The second form of _fortis, forte_ is a neuter; the second form of _vetus, veteris_ is a **genitive**, printed because a one-termination adjective has no separate genders to give and its nominative hides the stem (_veter-_). Counting commas gets _vetus_ wrong, and gets it wrong silently.

That is the whole case for the column. It is the same case `declension` makes one row up — store what you query by — with a harder edge: `declension` is derivable from the genitive and stored anyway for convenience, whereas `terminations` is **not derivable at all** from what the row holds.

| Value in `terminations` | Means                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| `3`                     | one form per gender (_ācer, ācris, ācre_)                          |
| `2`                     | masculine and feminine share a form (_fortis, forte_)              |
| `1`                     | one form for all three, filed with its genitive (_vetus, veteris_) |
| NULL                    | the question does not apply                                        |

**Only `declension = '3'` is asked.** A `1-2` adjective has already answered by being `1-2`: built from 1st- and 2nd-declension endings, it has one form per gender by construction, so a `terminations` beside it would be a second place to say the same thing and a first place to contradict it. An indeclinable adjective is not asked for the opposite reason — it has no terminations to count, and it is the one adjective whose `principal_parts` is NULL.

This makes `terminations` the only column whose applicability turns on **another column's value** rather than on the part of speech. `hasTerminations(partOfSpeech, declension)` is where that is written down, and the form, the validator and `check-inflection.ts` all read it rather than each restating the rule.

It also means the admin form has a field that appears when a _different_ field changes, and two ways to strand an answer instead of one: moving an adjective off `3` leaves a termination count with no question, and moving it onto `indeclinable` leaves a filing with no forms. `clearInapplicable` empties both in the same pass that handles a changed part of speech.

#### What is deliberately not a column

**i-stem vs consonant-stem.** Most 3rd-declension adjectives are i-stems; _vetus_, _pauper_, _dīves_, _prīnceps_ and _particeps_ are not, and decline with ablative singular _-e_ and genitive plural _-um_. Wiktionary says so — its line for _vetus_ reads "third-declension one-termination adjective (non-i-stem)". It stays in `notes` until something generates full paradigms, because it is a handful of exceptions rather than a class to filter on. The line: **terminations is a class, consonant-stem is an exception.**

**Numerals.** _trēs, tria_ is 3rd-declension and files with two forms, but `hasTerminations` asks adjectives only. If a numeral ever needs the answer it is one condition, not a new column.

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

### `determiner` is not one of them

Wiktionary files _alius_, _ūllus_, _nūllus_ and _tōtus_ as **determiners**. This dictionary files them as adjectives, and `determiner` is deliberately absent from `INFLECTS`.

The label is not wrong, it is from another inventory. Wiktionary applies one part-of-speech list across every language it covers, and modern treebanks tag these words `DET` for the same reason: it is a syntactic category that earns its keep when you are comparing Latin with English. The Latin grammars do not use it. A&G [§113](https://dcc.dickinson.edu/grammar/latin/1st-and-2nd-declension-adjectives-genitive-%C4%ABus-dative-%C4%AB) files them under _1st and 2nd Declension Adjectives_ and opens "the following **nine adjectives** with their compounds have the Genitive Singular in **-īus** and the Dative in **-ī** in all genders" — an adjective heading, with the irregularity as the sentence under it. That is exactly the split this schema wants: the label is the class, the oddity is a note. `part_of_speech` is what a reader sees on the card — the same argument `numeral` makes one section up — and a reader who meets _ūllus_ in a sentence is looking up an adjective.

Three things would break if it were added:

1. **The declensions page already teaches them as adjectives.** `Adjectives.tsx` carries all nine as a footnote under _bonus, bona, bonum_: "Nine adjectives break the genitive and dative singular — _ūnus, sōlus, tōtus, nūllus, ūllus, alius, alter, uter_ and _neuter_". A `/verbum/alius` card reading "determiner" would make the dictionary disagree with its own worked example.
2. **The filing rules are written in terms of `adjective`.** `hasPrincipalParts` admits `noun | verb | adjective`, so a determiner's lemma would be its whole filing — and `check-inflection.ts` would report _alius, alia, aliud_ as principal parts that should be NULL. The repair is to widen `hasPrincipalParts` and `hasTerminations` to admit `determiner`, at which point it is `adjective` under a second name, which is the drift the guard exists to catch.
3. **The set does not line up with anything.** What actually distinguishes these words is the **pronominal declension** — genitive singular _-īus_, dative singular _-ī_, in all three genders — and that cuts straight across the filing labels: _ūnus_ is a `numeral` here, _uter_ is a pronoun on Wiktionary, _tōtus_ an adjective. No part of speech selects the nine.

So they file as `adjective`, `1-2`, with the irregularity in `notes` — the same shape as the _ūnus_ row above:

| Lemma   | `principal_parts`    | `notes`                                                        |
| ------- | -------------------- | -------------------------------------------------------------- |
| _ūllus_ | _ūllus, ūlla, ūllum_ | pronominal genitive _ūllīus_, dative _ūllī_                    |
| _alius_ | _alius, alia, aliud_ | neuter _aliud_; _alterīus_ is used for the genitive (A&G §113) |

**What is parked.** When paradigm generation ships it will have to emit _-īus_ / _-ī_ for these words, and `notes` is prose the generator cannot read. The fact belongs in `declension` then — a pronominal value beside `1-2`, the way `indeclinable` is a value rather than a boolean — or in a flag. It does not belong in `part_of_speech`, for reason 3: a generator keyed on the part of speech would miss _ūnus_.

### The invariant this creates

rNULL now carries exactly one meaning, and nothing in the schema enforces it. A part of speech that inflects must say **how** — with a number or with the word `indeclinable` — because a forgotten field is otherwise indistinguishable from a deliberate one.

`scripts/check-inflection.ts` is what enforces it, and the fact it needs is not in the database: _which_ of the two questions applies is a property of the part of speech, not of the row. So the script writes that down.

```ts
pconst INFLECTS: Record<string, "declension" | "conjugation" | "neither"> = {
	noun: "declension",
	numeral: "declension",
	verb: "conjugation",
	adverb: "neither",
	// …
};
```

Five rules fall out of that map — three from the map itself, two more from the filing:

1. the question that applies must be answered, and answered in the vocabulary above — a noun with `declension` NULL is a finding;
2. the question that does not apply must stay NULL — a noun carrying a `conjugation` is a finding too, or NULL goes straight back to meaning two things;
3. **a part of speech the map has never heard of is itself a finding.** Nobody has decided whether it inflects, so neither of its columns can be read either way.

Then the same shape again, one question further down, for the two columns that hold a word's filing rather than its inflection class:

4. a 3rd-declension adjective must say how many terminations it has, and nothing else may carry the answer;
5. a word whose filing is more than its lemma must hold it — a verb's four parts, a noun's genitive, an adjective's terminations — and a word whose lemma is the whole filing must leave it NULL.

The third rule is the one that earns the script. `adjective` and `pronoun` sat in the map for a long time with nothing filed under them; the day the first adjective arrived, either its declension was there or the check named the word. What cannot happen is a new word class slipping past on the reading "both columns are NULL, so presumably it does not inflect" — the script holds no opinion it was not given, and says so rather than guessing.

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

**Commas within a sense, rows between senses.** _rīdeō_ "to laugh, smile" is one meaning with two English words for it — a gloss, and it stays one string. _auxilium_ "help, aid, assistance" and "remedy, antidote" are two jobs the same word does, and the second one wants the label `medical` hung off it. A comma has nowhere to put that label. The dividing question is not "how many English words?" but "would I ever want to say something about one of these and not the other?" A sense is a unit of meaning. A gloss is a short label that points at one.

Two invariants the schema cannot express:

- every entry has at least one sense — a word with no meaning is not an entry;
- ranks run 1..n with no gaps, because rank 1 _is_ the headline meaning and the UI reads `senses[0]` on the strength of that promise.

UNIQUE `(entry_id, rank)` stops duplicates and says nothing about either. `scripts/check-senses.ts` does, reading entries and senses together in the [one query](#reading-it-back-is-one-query-not-eleven) the app already uses, then sorting each entry's ranks and comparing them with `1..n`.

It guards a third thing the column type lets through: `meaning_en` is `NOT NULL`, and `NOT NULL` accepts the empty string. A blank gloss is the same absent meaning wearing a different hat, so it is reported alongside the entries that have no senses at all.

### Relations vs. foreign keys

Two different objects, and one does not imply the other. `.references(() => entries.id, { onDelete: "cascade" })` writes a `FOREIGN KEY` clause into the SQL — the database's rule, enforced by SQLite. `relations()` writes nothing to the database at all; it is a TypeScript description that unlocks `db.query`. Both are needed, plus `{ schema }` handed to `drizzle()` — see [db.md](./db.md).

The cascade only fires when `PRAGMA foreign_keys` is on, which is per-connection and off in a stock SQLite build. `createClient()` pins it. That is why the `sqlite3` CLI can make a cascade look broken while the app's cascade works fine.

### Reading it back is one query, not eleven

`with: { senses: … }` compiles to a correlated subquery that SQLite aggregates into JSON before it reaches Node — not a join, not an N+1. The shape matters: a join returns one row per _sense_, so `limit 10` would cut a word in half and ten result rows could be four words. The subquery keeps one row per entry, which is what `MAX_RESULTS` was always counting.

## Later

Inflected forms are not rows. When they arrive, they hang off a lemma — they do not replace it.

The same pattern governs meanings — `senses` did exactly this, and is [done](#senses). So are the two guard scripts, now in [the check chain](#the-check-chain). Next up, roughly in order:

1. **Admin panel + auth** (leaning toward a single admin password/session — no user accounts), replacing Drizzle Studio as the editing tool. With senses in place, adding a second meaning means editing a seed file and re-running it, which is friction that will quietly stop words getting added at all.
2. **Railway deploy**, SQLite file on a mounted volume (`DB_FILE_NAME` already supports this). Open question that belongs there rather than here: _when_ `drizzle-kit migrate` runs — at build time, at boot, or by hand. The guards add a second one: three of the four read the database, so anything running `npm run check` has to migrate and seed before it can open the gate.

Parked: the `homonym` column (above), synonym cross-references between entries, proper treatment of prepositions and the case they govern (_in_ + abl, _ad_ + acc — currently not seeded), spaced-repetition quiz mode as a separate private layer.

## Operations

The database is a SQLite file at `src/db/dictionarium.db` (override with `DB_FILE_NAME`); connection details in [db.md](./db.md). Schema: `src/db/schema.ts`. Seed: `npx tsx scripts/seed.ts`. Browse: `npm run db:studio`.

### The check chain

`npm run check` is the gate. It runs the four guards, then Biome:

| Guard                 | Alone                      | What it holds                                                                                                                    |
| --------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `check-macrons.ts`    | `npm run check:macrons`    | Latin text is precomposed Latin, never a combining mark or a lookalike — [a11y.md](./a11y.md)                                    |
| `check-lemmas.ts`     | `npm run check:lemmas`     | every `lemma_plain` still equals `normalizeLemma(lemma)` — [search.md](./search.md)                                              |
| `check-senses.ts`     | `npm run check:senses`     | every entry has senses, and their ranks run 1..n — [above](#senses)                                                              |
| `check-inflection.ts` | `npm run check:inflection` | NULL in `declension` / `conjugation` / `terminations` / `principal_parts` means one thing — [above](#the-invariant-this-creates) |

Each names the rows it objects to, and exits non-zero:

```sh
soror (noun): declension is NULL — this word inflects, so say how (1 | 2 | 3 | 4 | 5 | 1-2 | indeclinable)
uxor (noun): conjugation is "2" — this part of speech does not conjugate, so it must be NULL
māter: ranks are [1, 3, 4, 5, 6] — must run 1..5 with no gaps
deus: no senses — a word with no meaning is not an entry
```

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
