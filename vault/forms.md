# Plan: finding a word from its forms

Searching _bonae_ should find _bonus_; _salūtāvit_ and _salūtāverō_ should find _salūtō_. Today neither does. Search matches lemmas only, and its typo suggestions cannot reach an inflected form: _amābat_ is four edits from _amō_ (see [search.md](./search.md)).

## Progress

- **2026-11-17, planned.** Nothing built. The decisions below were made with the user.
- **2026-11-17, phase 1 built.** `src/utils/inflection/`, tier 2 and the card line, `check:forms` and `report:forms`. Against LASLA the lookup finds 99.6% of in-scope tokens of the locally filed words; the misses are _ferō_'s present and imperfect subjunctive (not in its table) and archaic spellings (_seruom_, _aquai_, _huiusce_). Also in: syncopated perfects (_amāsse_, _audiit_), and the perfect system of _possum_, _eō_ and _ferō_ where their tables stop.
- **2026-11-17, phase 2 started.** Done: the passive (present system; the perfect passive is two words, so its participle is what is found), imperatives, the present/perfect/future infinitives that are one word (*fore*), participles, gerund, gerundive and supine, all from new sheets in `endings.ts` that /grammar/conjugations prints on new tabs (see [conjugations.md](./conjugations.md)); deponents and semi-deponents read off the filing (the card prints no voice for them); *faciō* without a passive of its own (`SUPPLETIVE_PASSIVE`); *dīc*, *dūc*, *fac* (`SHORT_IMPERATIVES`); *ferō* in full, *volō*, *nōlō*, *mālō*, and Cētera for the irregular tables; irregular tables matched by lemma *and* infinitive, so *volō, volāre* keeps the rules; compounds of irregulars by prefix per stem (`compoundInflection`); enclitics; form suggestions. A rarer verb reading is dropped from the card when the spelling has a main one (*amāre* is not also "2nd sg. passive"). LASLA: 99.7% of 289,789 in-scope tokens (phase 1: 99.6% of 266,460); the misses are archaic spellings and *faxō*. Still to do: the missing pronouns on /grammar/pronouns, *fīō*, *edō*, and the overrides for *dō*, *ōdī*, *meminī*, *coepī*, *inquam*, *aiō*.
- **2026-11-17, reviewed.** Added: unprefixed forms as fixed forms, the _-ūrus_ 4th part, _-ēre_ and gen. pl. _-um_, æ/œ in the key, the LASLA check moved to phase 1.

## Decisions

- **Generate from the filing; do not strip endings off the query.** The principal parts give every stem exactly: _cucurr-_, _tul-_, _lāt-_, _rēg-_ from _rēgis_. Stripping is ambiguous (_regis_: _rēx_ or _regō_?) and needs a stem index anyway. Generating also gives the macronned form and the analysis to print, and it is the engine full paradigms on entry pages will need.
- **One request, every kind of match, merged.** A query can be a lemma and a form at once (_amor_: the noun, and "I am loved" from _amō_), or a form of several words (_est_: _sum_ and _edō_). There is no mode to switch into. Each result says why it is there.
- **i-stems: both variants for now.** The filing does not say whether a 3rd-declension word is an i-stem, and the rules of thumb fail on _pater_, _māter_, _frāter_, _canis_ and _iuvenis_. So the generator emits both wherever the two differ. The column comes later (see [Later](#later), and `TODO.md`).
- **The nine _-īus_ adjectives are read from `PRONOMINAL_ADJECTIVES`** and `PRONOMINAL_COMPOUNDS` in `src/components/pronouns/Pronouns.utils.ts`, by lemma. A closed class, so no new `declension` value, which [schema.md](./schema.md) had parked as an option.
- **The passive of intransitive verbs is generated.** Nobody meets _venior_ in a text, so it costs search nothing. Full tables on entry pages will need a transitivity answer first.
- **The typo budget stays `maxEditsFor`** for forms too: no suggestion under 4 letters, 1 edit for 4–7, 2 from 8. _salataverissent_ is not a form, and the nearest one, _salūtāvissent_, is 3 edits away, so it gets no suggestion. Accepted.
- **Contains-matches stay** when the query is also a form, under their own heading.

## The engine

`src/utils/inflection/`: pure functions, shared by search, the grammar pages and the checks.

- `stemsOf(entry)`: the stems the filing gives, per part of speech.
- `paradigm(entry)`: every form, with its macrons and its cell (case, number, gender; or person, number, tense, mood, voice; or which non-finite form it is). A genuine alternative is an extra cell marked as a variant.
- **One ending inventory.** `ENDINGS` and `PERFECT_ENDINGS` (`Conjugations.utils.ts`) and `SINGULAR_ENDINGS` / `PLURAL_ENDINGS` (`Declensions.utils.ts`) move here, and the grammar pages import them back. A new set of endings lands on its grammar page and in search together.
- **Fixed forms** for words that are not stem + ending: the tables in `IRREGULAR_VERBS`, `Pronouns.utils.ts` and `DECLENSIONS` in `NumberTheory.utils.ts`, keyed the way `fullTableFor` (`src/utils/entries/tables.ts`) is: by lemma, and for a verb by its infinitive too. By lemma, not by conjugation: _ferō_ is filed as 3rd conjugation, and the 3rd-conjugation rules would invent _ferit_.

### Looked up on read, not stored

The choice [frequency.md](./frequency.md) made, for the same reasons: no forms table, no migration.

- In memory: stem → entries, and fixed form → entries. A handful of keys per entry.
- **Every form starts with a key.** A generated form that no stem is a prefix of is indexed as a fixed form: in practice the lemma and its nominative/vocative (_rēx_ / _rēg-_, _vetus_ / _veter-_, _pater_ / _patr-_). Without it, _paterque_ and _uox_ find nothing, because tier 1 never sees them. A check holds this for every entry.
- Built on the first search, rebuilt after `createEntry` and `updateEntry`, which also clear the memoised paradigms. `PRAGMA data_version`, checked on every search, catches writes from outside the app, such as Studio.
- Improving a rule fixes every entry at once, and shipping it is a deploy, not a backfill.
- Rejected: a forms table (about 170 rows per verb, a backfill for every rule fix, and the drift `lemma_plain` needs a guard against), and every form in one `Map` (fine today, about 100 MB at 15k words).

### A lookup

1. Look up every prefix of the key as a stem, and the key itself as a fixed form.
2. Generate each candidate's paradigm (memoised) and keep the cells whose plain form equals the key.
3. If nothing matched, strip an enclitic (_-que_, _-ne_, _-ve_; _-cum_ after a pronoun) and try again. Only then, so _quoque_, _itaque_, _atque_ and _uterque_ never split. Accepted cost: a query that is itself a form loses its enclitic reading (_tene_ is only _tenē_, never _tē_ + _-ne_).

The key is `normalizeLemma`'s plus v → u, j → i, æ → ae and œ → oe on both sides, since texts print _uideo_, _iam_ and _cælum_ (`normalizeLemma` alone deletes æ: _clum_). That is for form matching only; `lemma_plain` and `check:lemmas` are untouched. A lemma is one of its own forms, so _uilla_ finds _vīlla_ as well.

## Inventory by part of speech

### Nouns

Filed: nominative, genitive, gender, declension.

- Stem: the genitive minus its ending. Nominative and vocative singular come from the lemma.
- Rules: neuter nom. = acc. = voc.; 2nd _-ius_ vocative _fīlī_, with genitive _-ī_ as a variant; _-er_ nouns through the genitive (_puer-ī_, _libr-ī_); 1st dat./abl. pl. _-ābus_ as a variant (_deābus_, _fīliābus_); 2nd gen. pl. _-um_ as a variant (_virum_, _līberum_, _socium_, _nummum_, _fabrum_); 4th neuter _-ū_; _-ubus_ (_lacubus_); 5th _-ēī_ after a vowel (_diēī_), _-eī_ otherwise (_reī_).
- Plural only when the genitive is filed plural (_-ārum_, _-ōrum_, _-um_, _-ium_, _-uum_, _-ērum_): _castra, castrōrum_.
- 3rd declension, both variants where i-stems differ: gen. pl. _-um_ / _-ium_, abl. sg. _-e_ / _-ī_, acc. pl. _-ēs_ / _-īs_, neuter pl. _-a_ / _-ia_, acc. sg. _-em_ / _-im_.
- Overrides by lemma: _deus_, _domus_, _vīs_, _bōs_, _Iuppiter_.
- Indeclinable: the lemma only.

### Adjectives

- `1-2`: stem = feminine minus _-a_ (_bon-_, _pulchr-_, _līber-_).
- `3`, stem by terminations: three, the feminine minus _-is_ (_ācr-_); two, the lemma minus _-is_ (_fort-_); one, the genitive minus _-is_ (_veter-_). Both i-stem and consonant-stem variants, as for nouns.
- The nine with _-īus_ / _-ī_, and _uterque_: from the lists above.
- Comparison (phase 3): _-ior_ / _-ius_; _-issimus_; _-errimus_ from the lemma (_pulcherrimus_); _-illimus_ (_facilis_ and five others); an irregular table (_melior_ / _optimus_, _peior_ / _pessimus_, _maior_ / _maximus_, _minor_ / _minimus_, _plūs_ / _plūrimus_).

### Numerals

_ūnus_ through `PRONOMINAL_ADJECTIVES`. _duo_, _trēs_ and _mīlia_ from the numbers page's `DECLENSIONS`. Ordinals and distributives as `1-2`, plural only when filed plural. The rest are indeclinable.

### Pronouns

- Tables exist for _hic, iste, ille, is, ipse, īdem, ego, tū, suī, meus, noster, tōtus, alius_, and _tuus, suus, vester_ through `DECLINED_LIKE`.
- Missing, to be added to /grammar/pronouns so the page and search share them: _quī_, _quis_ / _quid_, _aliquis_, _quīdam_, _quisque_, _quisquam_, _quīcumque_, _quisquis_, _nēmō_.
- Compounds are the base plus a fixed suffix, with m → n before d (_quendam_, _quōrundam_).
- _-cum_: _mēcum_, _tēcum_, _sēcum_, _nōbīscum_, _vōbīscum_, _quōcum_.

### Verbs

Filed: principal parts, conjugation.

- Stems: the present from the infinitive (the grammar page's `base`), the perfect from the 3rd part, the supine from the 4th. A 4th part in _-ūrus_ (_volō … volitūrus_, _sum … futūrus_) is the future participle only: no supine, no perfect passive participle, no perfect passive.
- Already in the inventory, hand-checked: indicative active in six tenses and subjunctive active in four, for all five groups.
- Missing: the passive of the present system (indicative, three tenses; subjunctive, two); imperatives (_amā_, _amāte_, _amātō_…, and _dīc_, _dūc_, _fac_, _fer_); infinitives (_amāre_, _amārī_, _dūcī_, _amāvisse_); participles (_amāns_, _amātus_, _amātūrus_, declined by the adjective rules); gerundive, gerund, supine. Syncopated perfects as variants (_amāstī_, _amārunt_, _amāsse_, _audiit_), _-ēre_ for _-ērunt_ (_amāvēre_, _fuēre_), and _-re_ for _-ris_. The perfect passive is two words (_amātus est_); its participle is found on its own.
- Read off the filing, no column needed: deponent (_hortor, hortārī, hortātus sum_), semi-deponent (_audeō … ausus sum_), impersonal (a lemma in _-t_: 3rd singular only), no supine (_timeō_: no participles from it), no perfect (_salveō, salvēre_: no perfect system, but the whole present system, so _salvē_ and _salvēte_).
- Irregular: the tables for _sum_, _possum_, _eō_ and _ferō_ exist, active only, and only _sum_ has its subjunctive. To add: _volō_, _nōlō_, _mālō_, _fīō_, _edō_, and overrides for _dō_ (short a), _ōdī_, _meminī_, _coepī_, _inquam_, _aiō_.
- Compounds of irregulars take the prefix per stem from the filed parts: _afferō, attulī, allātum_ puts _af-_, _at-_ and _al-_ on _ferō_'s present, perfect and supine forms. _prōd-_ before a vowel (_prōdest_), _red-_ in _redeō_.
- Mixed conjugation (_morior_, in `TODO.md`) waits for its own filing decision.

### Adverbs, conjunctions, prepositions, interjections, particles

The lemma only. Adverb comparison (_saepius_, _saepissimē_; _melius_, _optimē_) is phase 3.

## Search

One `searchEntries` call, four tiers:

1. exact lemma, as now;
2. form match, new;
3. starts with, then contains, as now;
4. suggestions, only when 1–3 found nothing, as now: from lemmas and from forms.

Tiers 1–3 stay one query, `lemma_plain LIKE %key% OR id IN (formIds)`, with the existing `CASE` ordering gaining a tier for forms. The cap, `matchCount` and "10 of 23" keep working, and a form match is never the one cut. Ties within tiers 1–2 go to the LASLA rank, so _sum_ comes before _edō_ for _est_. `recordSearch` counts form hits in `result_count`.

### Typos in a form

Lemma suggestions cannot reach a form. For form suggestions, the candidates are entries with a stem within one edit of a prefix of the key, and `editDistance` measures the key against their generated forms within `maxEditsFor`'s budget. _salutavisent_ gives "Did you mean _salūtāvissent_ (_salūtō_)?". Lemma and form suggestions share one list, closest first.

## Showing it

- Each card gets a line saying why it is there, unless the query is its lemma: "_rēgis_: gen. sg." under _rēx_, "_regis_: 2nd sg. present indicative active" under _regō_.
- The form in that line carries its macrons and `lang="la"`: _amīcīs_, _īdem_ / _idem_. Two words sharing a plain spelling each show their own.
- Analyses are merged: "gen./dat. sg. fem., nom./voc. pl. fem."; "all genders" when it is all three. Short labels are visible and the full words are sr-only text, as with `PERSON_LABELS`' short and full. Never `aria-label`.
- When tiers 1–2 found something, contains-matches sit under "Other words containing _est_". With contains-matches only, there is no heading, as today.
- The announcement, through `useAnnounce`, says how many results are forms.
- Entry page (phase 3): `entryLink` already carries `?q=`, so `/verbum/bonus?q=bonae` reruns the analysis for that one entry, says what _bonae_ is, and links to the table that explains it.

## Checks

- **The generator does not guess.** A cell it cannot vouch for (no supine, no table for an irregular) is not generated. The i-stem variants are the one stated exception, until the column.
- **The grammar pages are the fixtures.** _salūtō, moneō, dūcō, audiō, capiō_, the declension paradigms, _bonus_, _ācer_, and the pronoun and irregular tables: the generator has to produce each one cell for cell. `check:conjugations` checks the pages against the endings; this checks the generator against the pages.
- **LASLA measures coverage.** For every corpus token whose lemma is filed here, the lookup has to return that lemma, and the misses list the endings still missing. A maintenance script beside `scripts/build-frequency.ts`, run against the local clone, with v → u and j → i as LASLA writes. It is what says the lookup works, so it lands in phase 1. Tokens LASLA files under another lemma for a form not built yet (comparatives under the positive, if that is how it files them) are filtered by LASLA's tags, not counted as misses.

## Phases

1. Engine, shared ending inventory, fixtures, the LASLA check. Nouns, adjectives without comparison, the pronoun and irregular tables, regular verbs in the active, finite forms plus the present and perfect infinitives. Tier 2 and the card line. Finds _bonae_, _amat_, _amāre_, _salūtāvit_, _salūtāverō_, _eundem_.
2. The rest of the verb (passive, imperatives, participles, gerund, gerundive, supine), deponents, compounds of irregulars, the missing irregulars and pronouns, enclitics, v/u, i/j and æ/œ, form suggestions.
3. Comparison, adverb comparison, the line on the entry page, the generated paradigm on the admin desk.

## Later

- **An i-stem column** for 3rd-declension nouns and adjectives, for the reason `terminations` is a column: the filing does not say. Prefilled by the Wiktionary fill, required by `check:inflection`. Until it exists both variants are generated, so a non-word like _patrium_ is described as "gen. pl. of _pater_", and full tables on entry pages wait for it. [schema.md](./schema.md) keeps the adjective exceptions in `notes` "until something generates full paradigms"; this is that point.
- **Transitivity**, before a full table shows a passive.

## When it ships

Update [search.md](./search.md) (the "Inflected forms are not typos" line, the tiers, the card), [schema.md](./schema.md) ("Later", and the i-stem paragraph), and [frequency.md](./frequency.md) if the LASLA script lands beside its build.
