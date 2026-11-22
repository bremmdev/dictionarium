# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **School and college students**, beginner to intermediate, looking words up while working through a course: exercises, adapted readings, homework.
- **Adults learning on their own**, without a teacher, who need the dictionary to explain enough that nobody else has to.
- **The editor**, who also uses the dictionary to learn. There is one admin, and they file every word.

The common job: meet a Latin word, find its lemma, and leave knowing its principal parts, part of speech, how it inflects and what it most often means.

## Product Purpose

Dictionarium Latinum is a Latin–English dictionary for learners ("Verba sub manū", words at hand). You look up a Latin word and get its principal parts, part of speech, inflection and senses in order of use, linked to the grammar that explains its forms. It is working when a learner finds the word, trusts what it says, and can follow the entry into the table that explains the form they met.

## Goal and Milestones

Built for learners and for the editor equally: what serves a stranger looking a word up serves the editor too. Free and non-commercial for good, which the LASLA licence (CC BY-NC-SA) requires anyway.

| Milestone | Done when                                                  | Due                         |
| --------- | ---------------------------------------------------------- | --------------------------- |
| v1        | all 1,004 Core words are filed                             | 31 March 2027 at the latest |
| v2        | 2,000 entries are filed, Core or not                       | set when v1 ships           |
| v3        | every Core and Common word is filed (LASLA ranks 1–3,000) | set when v1 ships           |

- **Only production counts.** A word is filed when it is saved there and passes the desk's checks. That is the whole bar.
- **Core is LASLA's**, as `data/lasla-frequency.json` stands now, matched by the badge rules (`vault/frequency.md`). No exclusions. A spelling LASLA has twice (_tempus_, _ōs_) counts once an entry with that spelling and part of speech is filed. A LASLA rebuild before v1 says how Core changed, and a word already filed stays counted.
- **50 Core words a week**, Monday to Sunday, recalculated monthly from what is left. Filing runs alongside grammar, bugs and maintenance. When the pace slips, the target rises; the deadline stays.
- **In sight on `/admin/stats`** (not built yet): Core filed of 1,004, this week against the target, and the v1 date projected from the last four weeks, marked _Behind_ when it falls after the deadline. No scheduled report.
- **What to file next** comes from the desk (not built yet): Core words on the editor's reading list first, in lesson order, and its other words separately for v2. When _Behind_, the remaining Core words in LASLA rank order instead. The reading list is private and never in the repo.
- **What v1 cannot happen without** is listed under _Before v1_ in `TODO.md`.

## Positioning

- **Hand-filed by one editor.** Every entry is read and filed by a person. Wiktionary only pre-fills the editor's form, the submit is a separate press after review, and nothing is bulk-imported.
- **Macrons and senses by use.** Every long vowel is marked with precomposed characters (enforced by `npm run check:macrons`), and senses are ranked by how often each meaning is used. Position is the rank.
- **Dictionary and grammar together.** Entries link into the conjugation, declension, pronoun and irregular-verb tables. Numbers, proverbs and personal word lists sit beside them.

## Operating Context

- Lookups happen in the middle of other work: a textbook, a worksheet or a reading is open, and the dictionary is the side trip. Phones are a primary context, not a fallback.
- Search lives in the URL (`/?q=`), so results can be shared, bookmarked, refreshed and reached with back/forward (see `vault/search.md`).
- The editor works at `/admin` (entry desk and proverb desk), with `/admin/stats` and `/admin/health` beside it. One password, one sealed cookie (`vault/auth.md`).

## Capabilities and Constraints

- **Public routes:** search (`/`), entry (`/verbum/$lemma/$homonym?`), grammar index plus conjugations, declensions, irregular verbs and pronouns (`/grammar/*`), `/numbers`, `/proverbs`, `/word-list`.
- **Frequency badges** (Core / Common / Uncommon / Rare) come from LASLA's hand-checked classical corpus. A word LASLA cannot place gets no badge rather than a guess (`vault/frequency.md`).
- **Homonyms** are separate entries addressed by number.
- **Analytics** are counted in the app's own SQLite database (`search_events`, `view_events`, `entries.created_at`), with no third-party tool (`vault/analytics.md`).
- **Terminology:** *lemma* (headword), *sense* (one meaning, ranked by position), *principal parts*, *homonym*, *desk* (an editor workspace), *filing* (submitting an entry).
- **Stack:** TanStack Start (React 19), Tailwind CSS 4, the `@bremmdev/m7kit` component library, Drizzle + better-sqlite3, deployed on Railway. Secrets go through arca.
- **Open:** a numbers table in the database and mixed-conjugation verbs (*morior*) are on the TODO list and not built yet.

## Brand Commitments

- **Name:** Dictionarium Latinum. Tagline: *Verba sub manū.* Banner eyebrow: "A dictionary for the Latin student."
- **The chrome speaks English, the words speak Latin.** Latin labels on controls (*Quaere*, *dēlē*, *scrībe*, *exī*) stay as the visible text. English glosses are appended as sr-only content with `lang="en"` and never replace the label (`vault/a11y.md`). Visible English subtitles were considered and rejected.

## Evidence on Hand

- Real entry data in the app database. Test rows are filed through `/admin`; there is no seed script.
- The LASLA frequency data (`data/lasla-frequency.json`) and its documented method (`vault/frequency.md`).
- Accessibility reports in `reports/accessibility/`.
- No testimonials, user counts, endorsements or institutional adoption exist. Do not invent any.

## Product Principles

1. **A person files every word.** Tools can suggest, but every entry gets a human read, and nothing lands unreviewed.
2. **Honest over complete.** If the data is missing, show nothing rather than a guess. No frequency badge is better than a wrong one.
3. **Length matters.** Macrons are content, not decoration. Two words can differ only in vowel length, so long vowels are always marked and always precomposed.
4. **The entry teaches.** An entry should explain its forms, not just gloss them, so it links into the grammar.
5. **At hand, mid-task.** Lookup is a quick side trip from other work. It has to be fast and readable on a phone.

## Accessibility & Inclusion

- WCAG 2.2 AA is the floor.
- Every Latin run carries `lang="la"` on the smallest element that wraps the whole run. Mixed-language labels are hidden content, never `aria-label`.
- Status messages go through M7KIT's shared announcer (`useAnnounce()`), not new live regions (`AGENTS.md`, `vault/a11y.md`).
