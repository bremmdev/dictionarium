# Health: the checks, on the live database

`/admin/health` runs every data check against the database the server is using, each time the page loads. Locally that is your copy; in production it is production's, which `npm run check` never sees. Nothing is scheduled or cached: open the page and you have a fresh answer.

The page has two parts: **errors**, which are broken rules, and **second opinions**, which are not.

## Errors

The five checks from [the check chain](./schema.md#the-check-chain), as pure functions in `src/utils/health/checks.ts`:

| Section            | Function          | What it holds                                                  |
| ------------------ | ----------------- | -------------------------------------------------------------- |
| _Clāvēs quaerendī_ | `checkLemmas`     | `lemma_plain` equals `normalizeLemma(lemma)`                   |
| _Homōnyma_         | `checkHomonyms`   | the homonyms of a lemma run 1..n                               |
| _Significātiōnēs_  | `checkSenses`     | every entry has senses, ranked 1..n, none blank                |
| _Flexiō_           | `checkInflection` | NULL in the inflection columns means "not asked", nothing else |
| _Cāsūs_            | `checkGoverns`    | a preposition says which case it takes, and its senses agree   |

`scripts/check-*.ts` are thin wrappers that print what these return, so `npm run check` and the page can't drift apart. `check-macrons` and `check-conjugations` are not on the page: they check source code, which is the same everywhere.

Expect this part to be empty. `parseEntryDraft` refuses a save that breaks these rules, so an error means a row written around the form (Drizzle Studio, the sqlite3 CLI, an old migration) or a rule tightened after the row was filed. Each row links to the word and to its edit form.

## Second opinions: where LiLa disagrees

The frequency badges already match each entry to a word in LiLa ([frequency.md](./frequency.md)). LiLa also records each word's class and gender, so the page compares them with ours. `src/utils/health/lila.ts` does it:

1. **Candidates** are LiLa words with the same spelling (v→u, j→i), a compatible part of speech and compatible vowel lengths, the same three rules as `matchLexeme`. Candidates too rare to count are dropped, using the badges' noise threshold: a candidate stays only with at least 5 tokens and 2% of the top one.
2. **Class.** Verbs: conjugation 1–4 is `v1`–`v4`, `3io` is `v5`, `irregular` is `v6`. Nouns: declension _n_ is `n`_n_. Adjectives: `1-2` is `n6`, `3` is `n7`. Indeclinable means LiLa gives no `n` class. Flagged only if **no** candidate has our class. _volō_ "want" and _volō_ "fly" each match one of LiLa's two _uolo_, so neither is flagged.
3. **Gender**, nouns only. Among the candidates that agree on class, flagged if LiLa gives a gender and none has ours.

Not asked: pronouns and numerals (no class to compare), parts of speech that don't inflect, and words LiLa doesn't have.

These are not errors. LiLa files _ferō_ as irregular and _canis_ as feminine. This dictionary files them as 3rd conjugation and masculine, and both are defensible. So each one has a **Fine as filed** button.

### Fine as filed

The button writes a row to `accepted_disagreements`: the entry, the field (`class` or `gender`), and both values as they stood (`ours` and `theirs`). A disagreement is hidden only while both still match. If you edit the word, or the LiLa data is rebuilt and changes, it comes back for another look. Undo, in the _Accepted_ list, deletes the row. The server works out the values itself (`acceptDisagreement` in `src/db/health.ts`), so the button only says which word and field.

These rows live in each database, so production needs its own decisions.
