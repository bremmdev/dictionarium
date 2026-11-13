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
| `pronominal-adjectives` | the nine (*ūnus, ūllus, nūllus, sōlus, neuter, alius, uter, tōtus, alter*): *tōtus* in full, *alius* for its exceptions. Link the Adjectives footnote here | 4 |
| `using` | *hic … ille* "the latter … the former", *suus* against *eius*, *is quī*, *īdem ac / quī*, relative agreement, connecting relative, *-met / -pte / -ce*; correlatives if wanted | 5 |

For phase 4, `PRONOMINAL_ENDINGS` will need a nominative for the *-us* type (*tōtus*), or the check has to mark those cells irregular.

## Phase 6: the dictionary side (approved 2026-11-13)

- `declension = 'irregular'` for pronouns, mirroring `conjugation = 'irregular'`; narrow `DECLENSIONS_BY_PART_OF_SPEECH.pronoun` to it. The nine adjectives stay `1-2` with notes, as `schema.md` decided.
- Widen `hasPrincipalParts` to pronouns: *hic, haec, hoc*, *ego, meī*.
- A "Full table" link from `/verbum/hic` to `/grammar/pronouns#hic`, and the same for the irregular verbs (`#sum`).
- Prod is migrated and deployed by the user: end the phase with a checklist.
