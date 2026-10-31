# Frequency: how common a word is

Each entry shows **Core**, **Common**, **Uncommon** or **Rare**, from one source: [LASLA](https://www.lasla.uliege.be/), 1.8 million words of classical Latin (Caesar, Cicero, Virgil, Ovid, Horace, Tacitus, Seneca, Plautus and others), lemmatised and checked by hand at the Université de Liège. A word LASLA cannot place gets no badge. That's a choice: no badge is honest, a guess isn't.

| Band     | LASLA rank  | Seen in LASLA      |
| -------- | ----------- | ------------------ |
| Core     | 1–1,000     | about 270+ times   |
| Common   | 1,001–3,000 | about 62–270 times |
| Uncommon | 3,001–8,000 | about 7–62 times   |
| Rare     | 8,001+      | fewer than 7 times |

The thresholds are `BANDS` in `src/utils/entries/frequency.ts`. Changing them needs nothing else.

## Looked up on read, not stored

There's no column for this. `withFrequency` (`src/server/frequency.ts`) looks every entry up as it is read, for search results, the word list and the detail page. So a new or edited entry is right at once, nothing needs migrating, and improving the matching fixes every entry in one go. The lookup is a `Map` get. The data, `data/lasla-frequency.json` (~710 kB), is imported only by server code and marked `server-only`, so it never reaches the browser.

## Where the data comes from

`scripts/build-frequency.ts` builds the JSON from LASLA's CoNLL-U files, which LASLA publishes linked to the [LiLa LemmaBank](https://lila-erc.eu/):

```
git clone --depth 1 https://github.com/CIRCSE/LASLA
npx tsx scripts/build-frequency.ts path/to/LASLA/conllup
```

- **Counts are LASLA's.** One row per LiLa lemma, ranked by how many tokens are linked to it. Names, punctuation and unanalysed tokens are left out.
- **Headword, vowel lengths and gender are LiLa's.** LASLA's own lemma column does not separate _nam_ from the _-nam_ of _quisnam_. Its gender column has _soror_ as masculine. LiLa's record of the lemma gets both right, and it marks vowel length exactly where homographs need it: _mălum_ "evil" and _mālum_ "apple". The script asks LiLa's SPARQL endpoint once and caches the answers next to the corpus, as `lila-lemmas.json`.

Rebuild only when LASLA publishes new files.

## Matching an entry to a LASLA word

`matchLexeme` takes the entry's `lemma_plain` with v→u and j→i (LASLA writes _nouus_, _iacio_), then narrows the candidates:

1. **Part of speech** must agree. LASLA uses Universal Dependencies tags, so an adjective may be `ADJ` or `DET` (_omnis_, _meus_), and _nam_ is `PART`.
2. **Vowel length** must agree where LiLa marks it. Our lemmas mark every long vowel, so _mālum_ cannot match _mălum_.
3. **Class** must agree for verbs and nouns: conjugation 1–4 is `v1`–`v4`, `3io` is `v5`, `irregular` is `v6`, and declension _n_ is `n`_n_. Adjectives aren't asked, because their class changes with degree (_melior_ is 3rd). _ferō_ is 3rd conjugation to us and irregular to LASLA, so irregular on either side is accepted when nothing matches exactly.
4. **Gender** only chooses between words that are left. _canis_ is masculine to us and feminine to LiLa, and both are right.

If two words are still left and the smaller one is not noise (at least 5 tokens and 2% of the larger), there's no badge. LASLA has two words spelled _tempus_ ("time" and "temple") and two spelled _os_ (_ōs_ and _os_), with no vowel lengths to tell them apart, so neither gets a badge rather than a coin toss.

`npm run report:frequency` lists every entry's band and why each word without a badge has none.

## Known gaps

- **Words LASLA files under another part of speech.** _nihil_ is a pronoun there, so a _nihil_ filed as a noun gets no badge.
- **Post-classical words** aren't in LASLA at all. That's intended: this dictionary is about classical Latin.
- **Words below 10 occurrences** have a rank, but it can't separate them from each other reliably. That's why the bottom band is simply "Rare".

## Licence

LASLA's data is [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). `data/lasla-frequency.json` is derived from it, so it carries the same licence, needs the attribution the detail page's tooltip gives, and only fits a non-commercial site.
