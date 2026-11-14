# Plan: /grammar/pronouns resource page

## Progress

- **2026-11-13, phase 1 done.** Route `/grammar/pronouns` (*Prōnōmina.*), linked from `GRAMMAR_TOPICS`. Sections: *Dēclīnātiō prōnōminālis* (`#pronominal`, the four cells where *ille* / *ipse* part from *bonus*), *Dēmōnstrātīva* (`#demonstratives`: a deixis table with the place adverbs, then *hic*, *iste*, *ille*, *is*), *Ipse et īdem* (`#identity`). Every pronoun has its own anchor (`#hic`, `#idem`). Adjectives' `Paradigm` moved to `declensions/GenderedParadigm.tsx` and is shared; its captions now lead with the lemma ("bonus, bona, bonum, singular"). `FormCell` and the declension `Form` take several alternatives (`eī or iī or ī`). `check:pronouns` holds every cell of a pronoun with a `stem` (*iste*, *ille*, *ipse*) to stem + `PRONOMINAL_ENDINGS` (88 forms), and the nominative singular to the lemma. All forms diffed against Wiktionary with zero mismatches; the place adverbs' macrons too. Rules from A&G §§ 113, 146, 296–298 on Dickinson (the paradigm tables there are images, so forms come from Wiktionary).
  - Order of doublets: *eī, iī, ī* and *eīdem, iīdem, īdem*, as A&G and the school grammars print them. Wiktionary leads with *iī*.
  - Left to the notes rather than the cells: *hībus*, *eumdem*, *ipsud* (medieval), *ipsus*, *ollus*.
  - *hic* without a macron, following Wiktionary; the note explains A&G's *hīc*.
  - Tables are 434px wide on a 375px screen and scroll inside their box, the same as the adjective tables. No page scroll.
- **2026-11-13, phase 2 done.** *Persōnālia* (`#personal`): *ego, nōs*, *tū, vōs* and *suī* as Case / Singular / Plural tables, laid out like the noun paradigms (`#ego`, `#tu`, `#sui`), and a paragraph on *mēcum / nōbīscum* and *-met / tūte*. *suī*'s missing nominative is `null` in the data, a dash on screen and "no form" to a screen reader. *Possessīva* (`#possessives`): full tables for *meus, tuus, suus, noster, vester* through `GenderedParadigm`. `GenderedPronoun.stem` became `pattern: { stem, endings: "pronominal" | "bonus" }`; `check:pronouns` reads *bonus*'s endings off `FIRST_SECOND` rather than restating them (236 forms) and checks that each personal table is headed by its own nominatives. All forms diffed against Wiktionary with zero mismatches. Rules from A&G §§ 142–145, 295, 299, 302 on Dickinson.
  - *nostrī / nostrum* and *vestrī / vestrum* in Wiktionary's order; A&G print no order in text.
  - Left out of the cells: *mēmē, tētē, mēd, tēd, tīs, mīs*, and *mee* beside *mī*. The notes mention *sēsē* only (it is in the cells as an alternative).
- **2026-11-14, phase 4 done** (ahead of phase 3, on request, on `main`). *Adiectīva prōnōminālia* (`#pronominal-adjectives`), after *Ipse et īdem* until phase 3 lands: a table of the nine in UNUS NAUTA order with genitive and dative singular, then *tōtus* (`#totus`) and *alius* (`#alius`) in full. Both sit on `PRONOMINAL_ENDINGS` with the cells that differ marked irregular (*tōtus*, *tōtum* ×2; *alius* and the genitive *alterīus or alīus*), as decided: no -us nominative added to the sheet. `check:pronouns` builds the nine's genitive and dative from the feminine stem and holds them to the full tables (306 forms). Linked from the *bonus* note on /grammar/declensions and from the *Dēclīnātiō prōnōminālis* paragraph. Forms diffed against Wiktionary; rules from A&G § 113 on Dickinson.
  - Only the classical *-īus / -ī* in the cells. Left to the notes: short *-ius* in verse, the occasional *bonus* forms (*aliae*, *aliō*), *neutrī generis*. Left out: *altrīus*, *alis / alid*, Old Latin genitive *ūllī*.
  - The summary table is 445px on a 375px screen and scrolls in its box; no page scroll.

- **2026-11-14, phase 6 done** (on `main`, before phases 3 and 5, on request). No migration: `declension` is text.
  - `DECLENSIONS` gains `irregular`; `DECLENSIONS_BY_PART_OF_SPEECH.pronoun` is `irregular | 1-2`, not `irregular` alone as planned, because *meus* declines as *bonus* and filing it `irregular` would be false.
  - `hasPrincipalParts` admits `pronoun` (never indeclinable): the admin form asks for "Forms" (*hic, haec, hoc*), and `checkInflection` reports a pronoun without them.
  - Wiktionary fill: a pronoun is `irregular` unless Wiktionary says first/second-declension, and files headword + feminine + neuter, else headword + genitive (*nēmō, nēminis*). *ego*, *tū*, *suī* print neither, so the fill warns. *īdem*'s "with an indeclinable portion" no longer lands as "indeclinable" in its notes or declension. Wiktionary files *hic*, *ipse* and *meus* as determiners, so their part of speech stays the editor's to pick.
  - `PrincipalPartList` labels a `1-2` pronoun's three forms by gender; an irregular pronoun's are shown whole (*suī, sibi, sē* has three forms and no genders).
  - `fullTableFor` (`src/utils/entries/tables.ts`), run in `getEntry`, so the table data stays off the client: a pronoun or adjective whose lemma heads a table on /grammar/pronouns gets "Declined in full" under its principal parts; a verb on /grammar/irregular-verbs gets "Conjugated in full", and its compounds "Conjugated like *sum*". Checked on /verbum/ferō (lands on `#fero`) and /verbum/volō (no table, no link). No pronoun is filed locally, so the pronoun links were checked through `fullTableFor` only.

## Placement

Its own route, like the irregular verbs: /grammar/declensions is about the five patterns, and pronouns are looked up one word at a time.

## Sections, in order

| id | Label | Phase |
|---|---|---|
| `pronominal` | *Dēclīnātiō prōnōminālis* | 1 ✓ |
| `personal` | *Persōnālia*: *ego, tū, suī* | 2 ✓ |
| `possessives` | *Possessīva*: *meus, tuus, suus, noster, vester*, with **full paradigms** | 2 ✓ |
| `demonstratives` | *Dēmōnstrātīva*: *hic, iste, ille, is* | 1 ✓ |
| `identity` | *Ipse et īdem* | 1 ✓ |
| `relative` | *quī, quae, quod*; *quis, quid*; the question adjective *quī* | 3 |
| `indefinites` | *aliquis, quīdam, quisque, quisquam, quīvīs / quīlibet*; *quis* after *sī, nisi, num, nē*, as a compounds table | 3 |
| `pronominal-adjectives` | the nine (*ūnus, ūllus, nūllus, sōlus, neuter, alius, uter, tōtus, alter*): *tōtus* in full, *alius* for its exceptions. Link the Adjectives footnote here | 4 ✓ |
| `using` | *hic … ille* "the latter … the former", *suus* against *eius*, *is quī*, *īdem ac / quī*, relative agreement, connecting relative, *-met / -pte / -ce*; correlatives if wanted | 5 |

## Phase 6: the dictionary side (approved 2026-11-13, done 2026-11-14)

- `declension = 'irregular'` for pronouns, mirroring `conjugation = 'irregular'`; narrow `DECLENSIONS_BY_PART_OF_SPEECH.pronoun` to it. The nine adjectives stay `1-2` with notes, as `schema.md` decided.
- Widen `hasPrincipalParts` to pronouns: *hic, haec, hoc*, *ego, meī*.
- A "Full table" link from `/verbum/hic` to `/grammar/pronouns#hic`, and the same for the irregular verbs (`#sum`).
- Prod is migrated and deployed by the user: end the phase with a checklist.
