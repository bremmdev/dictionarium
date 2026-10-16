# Plan: /conjugations resource page

## Progress

- **2026-10-16, present indicative active done** for all five groups. Live: Persōnae, Filing a verb, The conjugations, Terminātiōnēs (present only), `check:conjugations`, resources menu entry. All 30 forms and 20 principal parts checked against Wiktionary. Not built yet: Tempora (waits until there is more than one tense) and everything from the imperfect onwards.
- **2026-10-16, perfect indicative active done.** Each verb now has a heading plus present-system and perfect-system tables side by side from lg up (to recheck once more tenses join). Per-table notes. `perfectStem` on each verb. `PERFECT_ENDINGS` is shared by every conjugation, and " / " in it marks a genuine alternative (-ērunt / -ēre) that the check also verifies. Filing gained a perfect-stem table. All 35 perfect forms checked against Wiktionary.
- **2026-10-16, Translating the tenses added** (`Translating.tsx`, between the conjugations and Terminātiōnēs). It covers the present (*I greet / am greeting / do greet*), the perfect as present perfect against historical perfect, and the present with *iam* rendered by an English perfect. Checked against Allen & Greenough §§ 160–161, 465–466, 473 and Gildersleeve & Lodge §§ 227, 235–240; the citation is printed on the page. Extend its table as each new tense lands.
- How it differs from the plan below:
  - `principalParts` is a four-part tuple and the lemma is its first item.
  - Verbs carry a single `base` (salūt-, mon-, dūc-, aud-, cap-). `perfect` and `supine` stems get added when those tenses do.
  - Person and tense labels live in `Labels.tsx`.
  - `Table`'s scroll box is now `relative`, so an `sr-only` span in a far column can no longer widen the page on a phone.

## Context

/declensions teaches the five noun patterns. Verbs are the other half of reading Latin and have no resource page. This adds `/conjugations` in the same style: a banner, a jump list, intro sections, one group per conjugation with a full paradigm per example verb, and an endings sheet. The data shape has to hold every conjugation group and every tense, mood and voice from the start, even though the page fills in over several phases. Irregular verbs (sum, possum, volō, nōlō, …) come in a later phase on the same data shape.

Example verbs (dūcō replaces mittō, at the user's request):

| Group | Stem | Verb | Gloss |
|---|---|---|---|
| 1st | ā-stems | salūtō, salūtāre, salūtāvī, salūtātum | greet |
| 2nd | ē-stems | moneō, monēre, monuī, monitum | warn, advise |
| 3rd | consonant stems | dūcō, dūcere, dūxī, ductum | lead |
| 4th | ī-stems | audiō, audīre, audīvī, audītum | hear |
| 3rd -iō (mixed) | short i-stems | capiō, capere, cēpī, captum | take, seize |

Decisions already made by the user:
- **Layout:** one m7kit `Tabs` per verb (Ind. active / Ind. passive / Subj. active / Subj. passive / Cētera). Each panel shows a present-system table and a perfect-system table.
- **Labels:** Latin tense, mood and voice names with a hidden English gloss, using the existing SectionNav pattern (`lang="la"` + `sr-only lang="en"`).

## Files

New, all under `src/components/conjugations/` unless noted:
- `src/routes/conjugations.tsx`: route, `head` meta, banner, page shell. Mirrors `src/routes/declensions.tsx`.
- `Conjugations.utils.ts`: data only, no JSX (same rule as `Declensions.utils.ts`).
- `Persons.tsx`, `Filing.tsx`, `Tenses.tsx`, `Paradigms.tsx`, `Verb.tsx`, `SystemTable.tsx`, `Endings.tsx`. Later `Irregulars.tsx`.
- `scripts/check-conjugations.ts`, plus `check:conjugations` added to the `check` chain in `package.json`.

Changed:
- `src/components/declensions/SectionNav.tsx` → `src/components/SectionNav.tsx`, taking a `sections` prop. Declensions passes its current list; conjugations passes its own. No other change to behaviour or markup.
- `src/components/declensions/Paradigm.tsx`: move its `Cell` (form plus muted "or" alt) into `src/components/FormCell.tsx` and import it from both pages.
- `src/components/ResourcesMenu.tsx`: add `{ to: "/conjugations", label: "Conjugations", description: "Verbs by person and tense", Icon: TableProperties }` after Declensions.
- `src/routeTree.gen.ts`: regenerated (dev server or `npm run generate-routes`). Never hand-edited.

Before touching route files, load the TanStack guidance listed in AGENTS.md: `npx @tanstack/intent@latest load @tanstack/router-core#router-core` and `@tanstack/router-plugin#router-plugin`.

## Data shape (`Conjugations.utils.ts`)

```ts
export const PERSONS = ["1sg", "2sg", "3sg", "1pl", "2pl", "3pl"] as const;
export const TENSES = ["present", "imperfect", "future",
                       "perfect", "pluperfect", "futurePerfect"] as const;
export const SYSTEMS = {
  present: ["present", "imperfect", "future"],
  perfect: ["perfect", "pluperfect", "futurePerfect"],
} as const;
// The subjunctive has no future tenses; SystemTable filters SYSTEMS by this.
export const MOOD_TENSES = {
  indicative: TENSES,
  subjunctive: ["present", "imperfect", "perfect", "pluperfect"],
} as const;

type Form = { form: string; alt?: string; irregular?: true }; // irregular: skip derivation check (dūc)
type TenseForms = Record<Person, Form>;

export type Verb = {
  lemma: string;                 // "salūtō", keys BLURBS/NOTES
  principalParts: string;        // printed as the caption, as a dictionary prints it
  english: string;
  stems: { present: string; perfect: string; supine: string }; // "salūt", "salūtāv", "salūtāt"
  indicative: { active?: Record<IndTense, TenseForms>; passive?: Record<IndTense, TenseForms> };
  subjunctive?: { active?: Record<SubjTense, TenseForms>; passive?: Record<SubjTense, TenseForms> };
  imperative?: { present: { sg: Form; pl: Form }; future: Record<"2sg"|"3sg"|"2pl"|"3pl", Form> };
  infinitive?: Record<"presentActive"|"perfectActive"|"futureActive"|"presentPassive"|"perfectPassive"|"futurePassive", Form>;
  participle?: Record<"present"|"perfect"|"future"|"gerundive", Form>;
  gerund?: Form;   // genitive form shown, "salūtandī"
  supine?: Form;
};

export type ConjugationGroup = {
  conjugation: Conjugation;      // from #/utils/entries/rules, so it matches the dictionary's own vocabulary
  title: string;                 // "First conjugation"
  stem: string;                  // "ā-stems"
  verbs: Verb[];
};

// The endings sheet AND the derivation check both read this, so the two can never drift.
export const ENDINGS: Record<"1"|"2"|"3"|"4"|"3io", {
  indicative: { active: Record<PresentSystemTense, Record<Person,string>>; passive?: … };
  subjunctive?: …;
}>;
// The perfect-system active endings are the same for every conjugation, so one table covers them.
export const PERFECT_ENDINGS: …;
```

Everything except the present indicative active is optional. A phase adds data, and the UI shows only what exists, so the page never displays half-filled tabs.

## Page sections (SectionNav ids)

1. **Persōnae** (`persons`): the six person/number slots and the personal endings (-ō/-m, -s, -t, -mus, -tis, -nt). A passive column (-r, -ris, -tur, -mur, -minī, -ntur) arrives in Phase 3. Short prose: the ending already contains the subject (*salūtō* = I greet), so the pronoun is dropped.
2. **Filing a verb** (`filing`): the four principal parts, using the labels from `PrincipalPartList.tsx` (present, infinitive, perfect, supine). A table reads the conjugation off the infinitive (-āre, -ēre, -ere, -īre, plus -iō + -ere for the mixed group), with columns conjugation / dictionary entry / infinitive / present stem. Then the three stems and which tenses each one builds, as the numbered `STEPS` list copied from `Stems.tsx`.
3. **Tempora** (`tenses`): one table mapping each Latin tense name to its English name, its stem and a rough English example (*salūtābam*, "I was greeting"), plus one paragraph on moods and voices.
4. **The conjugations** (`conjugations`): `Paradigms.tsx` loops over `CONJUGATION_GROUPS` like the declensions `Paradigms.tsx`: an h3 with `(stem)`, a `BLURBS[title]` paragraph, one `<Verb>` per verb, and `NOTES[lemma]` under it. Order: 1, 2, 3, 4, then mixed, because capiō is explained as part third and part fourth.
5. **Terminātiōnēs** (`endings`): rendered from `ENDINGS`, one table per tense with person rows and one column per conjugation. `nowrap`, and `md:[&_table]:table-fixed` as in `declensions/Endings.tsx`. Always fully visible, never tabbed, so find-in-page and print reach every ending.
6. **Verba anōmala** (`irregular`): Phase 5.

**`Verb.tsx`**: an h4 (lemma + English), the principal parts as the caption, then:
- one tab's worth of data → just the tables, no `Tabs`
- two or more → m7kit `Tabs` with one `Tabs.Tab`/`Tabs.Content` per non-empty set. Empty sets are left out with a plain conditional, because Tabs accepts any `ReactNode` children and registers only the tabs that render.

m7kit `Tabs` (0.66.0) details, read from its built source:
- Ids are scoped per instance (`useId` + the encoded label), so every verb can use the same plain labels: `indicative-active`, `indicative-passive`, `subjunctive-active`, `subjunctive-passive`, `cetera`.
- `Tab` spreads its other props onto the button, so `lang="la"` goes on the `Tabs.Tab` itself. The English gloss is a nested `sr-only lang="en"` span.
- Inactive panels are `display: none`. That is acceptable because the endings sheet stays visible.
- The tablist needs `flex-wrap` or `overflow-x-auto` so five tabs fit on a phone.
- Optional: controlled mode could keep all five verbs on the same tab. One `useState` in `Paradigms.tsx` is passed as `value`/`onValueChange` to every `Verb`, so switching dūcō to the subjunctive passive switches the others too. Decide when Tabs first appear in Phase 2.

**`SystemTable.tsx`**: one `Table` per system (caption "Present system" / "Perfect system"). Columns are a person row header plus that system's tenses, filtered by `MOOD_TENSES` for the subjunctive. `nowrap`. Person labels are visible "1st sg." with the full "first person singular" in sr-only content, following the hidden-content pattern from `Endings.tsx`. Inside a panel the two tables sit side by side only at 2xl and stack below that: *salūtāverāmus* in three columns does not fit half of an lg page. Confirm the breakpoint in the browser. The perfect passive cells read *salūtātus sum* / *salūtātī sumus*, and a note under the table says the participle agrees in gender (-us, -a, -um).

**Banner**: H1 *Coniugātiōnēs.* with an Info tooltip: "Conjugations." Literally a *yoking together*: the endings are yoked onto the stem. Use two unused `*-sketch.svg` illustrations, for example `scroll-sketch` and `wreath-sketch`; check that neither is used on another page. `head`: "Conjugations — Dictionarium Latinum" plus a one-line description.

Tab visible labels: *Indicātīvus āctīvum*, *Indicātīvus passīvum*, *Coniūnctīvus āctīvum*, *Coniūnctīvus passīvum*, *Cētera* (gloss: "imperative, infinitives and participles"). Table tense headers: *Praesēns*, *Imperfectum*, *Futūrum*, *Perfectum*, *Plūsquamperfectum*, *Futūrum exāctum*.

## Phases

1. **Skeleton and indicative active**: SectionNav and FormCell extraction, route, banner, resources menu entry, sections 1–3, all five verbs' indicative active (6 tenses), the endings sheet for indicative active, and the check script.
2. **Subjunctive active** (4 tenses). Tabs appear for the first time.
3. **Passive**, indicative and subjunctive, plus the passive column in Persōnae.
4. **Cētera**: imperatives (present and future), the six infinitives, participles, gerund, gerundive, supine.
5. **Irregulars**: *sum* first, because possum is built from it and the perfect passive uses it, then possum, volō, nōlō, mālō, eō, ferō, fīō. All use the same `Verb` type with conjugation `"irregular"`. Only the tabs that exist are rendered: only ferō gets a passive tab, and nōlō gets its own imperative *nōlī, nōlīte*. Derivation check off (`irregular` group). Each verb gets a NOTES entry on what is irregular.

## Macron verification

Every form is entered by hand with precomposed macrons (vault/a11y.md; `check:macrons` already guards against combining marks). Correctness is checked three ways:

1. **Derivation check, committed** (`scripts/check-conjugations.ts`, part of `npm run check`). For every regular verb and every filled cell, rebuild the form as `stems.present + ENDINGS[…]` (or perfect stem + `PERFECT_ENDINGS`, or supine + "-us/-ī" + the form of *sum*). Fail on any mismatch with the handwritten form. Cells marked `irregular` are skipped, as are `alt` forms. The paradigms and the endings sheet are two separately typed copies of the same facts, so a macron typo in either one fails the check.
2. **Wiktionary diff, one-off, not committed**: a scratchpad script that fetches each lemma's conjugation table from the Wiktionary API (same User-Agent and 1 s throttle as `src/utils/entries/wiktionary.ts`) and diffs every cell against the data. Mismatches are listed for the user to rule on.
3. **Convention points**, checked against Allen & Greenough (§§ 184–206) and noted on the page where a reader would trip:
   - A long vowel shortens before final -m, -t, -nt and before -nt-/-nd- anywhere: *salūtat*, *salūtābat*, *salūtant*, *salūtandus*, but *salūtātur*, *salūtāns*, *audiēns*.
   - 3rd conjugation: present passive *dūceris* (short) against future *dūcēris* (long). Future *dūcam, dūcēs, dūcet* against subjunctive *dūcam, dūcās, dūcat*.
   - Perfect 3pl *-ērunt* (alt *-ēre*).
   - Future perfect *-eris, -erimus, -eritis* against perfect subjunctive *-erīs, -erīmus, -erītis*, following the A&G/Wiktionary convention, with a note that Roman usage mixed them.
   - Hidden quantities: *dūxī* long but *ductum* short; *cēpī* long but *captum* short; *monitum* short i.
   - Present passive infinitive *dūcī*, *capī* (not *-erī*). Imperative *dūc* (marked irregular).
   - Alts: *audiī* beside *audīvī*, and *-re* beside *-ris* in the 2sg passive.
   - Irregulars: *nōlō, nōlle* (long ō), *māvīs, māvult*, *fīō* but *fierī, fierem*, *eunt*, *ferris, fertur*.

## Verification

- `npm run check`: macrons, the new conjugation derivation check, biome.
- `npm run dev`, then open `/conjugations` in Chrome:
  - Every SectionNav anchor lands on its section.
  - The resources menu shows the entry, marked current on the page.
  - Tabs switch with the mouse and with ←/→/Home/End, and there are no duplicate ids across the five verbs (`[role=tab]` ids are all unique).
  - Tables scroll inside their own box at 375px and there is no page-level horizontal scroll.
  - Tables sit side by side only at 2xl.
- /declensions looks and behaves the same after the SectionNav and FormCell moves.
- The Wiktionary diff reports zero unexplained mismatches before each phase is called done.
- Prod: no DB or schema change. Deploy is manual (user checklist): merge, deploy, open `/conjugations` on prod.
