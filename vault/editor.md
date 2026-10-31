# Editor: the form fills, a person files

There are two ways a word gets into the dictionary — `/admin` in a browser, `scripts/enrich-entries.ts` in a terminal — and they meet at the same two functions: one that says what a valid entry is, one that reads English Wiktionary. Neither end has rules of its own.

Correcting a word already on file is the same desk, not a second one: `/admin?id=42` is the form with that row read back into it.

Proverbs have a desk of their own beside it — see [The proverb desk](#the-proverb-desk).

Two consequences worth naming up front:

- **Nothing in the form decides what is valid.** `parseEntryDraft` does, and the form calls it for the messages only.
- **Nothing that fills the form decides what is filed.** Wiktionary fills the fields and stops. The submit is a separate press by a person who has read them.

| File                                  | Responsibility                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/routes/admin.tsx`                | A guarded page — see [auth.md](./auth.md). The desk switcher and both desks. `?id=` says which word, `?desk=proverbs` which desk. |
| `src/components/admin/Fields.tsx`     | The inputs, chips and messages both desks are built from.                          |
| `src/components/admin/ProverbForm.tsx`| The proverb desk: add/edit switch, picker, fields.                                 |
| `src/utils/proverbs/form.ts`          | `proverbFormReducer` — the proverb desk's transitions.                             |
| `src/utils/proverbs/rules.ts`         | `parseProverbDraft` and `ANONYMOUS`.                                               |
| `src/server/proverbs.ts`              | `getProverbs`, which lists; `createProverb` and `updateProverb`, which write.      |
| `src/components/admin/EntryForm.tsx`  | Fields, focus, and the live region. Dispatches; decides nothing.                   |
| `src/utils/entries/form.ts`           | `formReducer` — every transition the draft makes, as a pure function.              |
| `src/utils/entries/rules.ts`          | `parseEntryDraft` and the inflection vocabulary — see [schema.md](./schema.md).    |
| `src/utils/entries/wiktionary.ts`     | Looking a lemma up, parsing what comes back, and mapping it onto these columns.    |
| `src/server/entries.ts`               | `createEntry` and `updateEntry`, which write; `suggestEntry`, which does not.       |
| `scripts/enrich-entries.ts`           | The same lookup, many words at a time, printed or written.                         |

## One rulebook, five callers

`parseEntryDraft(input: unknown)` takes whatever arrived and returns the row to write, or throws `EntryValidationError` carrying **every** problem it found at once, keyed by field:

```ts
{ lemma: "A lemma is required — it is the headword.",
  declension: "A noun inflects, so say how (1 | 2 | 3 | 4 | 5 | 1-2 | indeclinable).",
  "senses.1.meaningEn": "Sense 2 has no meaning." }
```

Sense keys are keyed by **position**, because position is the rank. That is the same invariant [schema.md](./schema.md#senses) states and `check-senses.ts` enforces.

| Caller                     | Why it calls                                                              |
| -------------------------- | ------------------------------------------------------------------------- |
| `EntryForm`, on submit     | For the messages. It is a courtesy, not a control.                        |
| `createEntry`, as `.validator` | **The gate.** It runs on every call, whatever the caller.              |
| `updateEntry`, as `.validator` | **The same gate.** An edit is a filing, held to the filing rules.      |
| `check-inflection.ts`      | For the vocabulary only — `INFLECTS`, `DECLENSIONS`, `CONJUGATIONS`.      |
| `check-governs.ts`         | For `GOVERNED_CASES`, the one spelling, and who is asked (`senseGoverns`). |

This is [auth.md](./auth.md#the-boundary-guards-are-ux-middleware-is-the-gate)'s boundary rule again in a different costume. The form is reachable only through a browser; `createEntry` and `updateEntry` are RPCs reachable by their own URL by anyone the session lets in. So the validator on the server function is the real check, and the form's copy exists so a person sees five problems at once instead of one per round trip.

`EntryValidationError.message` is set to the first of the fields. A thrown error crossing the RPC boundary arrives as a plain `Error`, and the message is the only part that survives — enough, because the form has already run the same function before sending.

## A session at the desk

```
type a lemma
  ↓  Quaere       suggestEntry → Wiktionary. Fills every field. Submits nothing.
                  Words already filed under the spelling are skipped, so cum finds the
                  conjunction once the preposition is in. All of them filed? “Iam inest.”
  ↓  read         chips, senses, notes — cut what a learner's dictionary does not want
  ↓  Adde         parseEntryDraft for the messages, then createEntry for real
  ↓  Additum.     the new lemma links to its page; the form empties, ready for the next
```

`createEntry` writes the entry and its senses in **one transaction** — an entry with no senses is not an entry. Where the word goes under its lemma is [Words spelled alike](#words-spelled-alike) below: homonym 1 for a new spelling, the next number for a homograph, a sentence for a word already filed. `UNIQUE` on `(lemma, homonym)` is what actually stops a collision.

`suggestEntry` passes Wiktionary everything filed under the spelling, and gets back a word that is not among them — so a duplicate is caught at Quaere rather than at Adde. When none is left it returns `{ kind: "exists", entries }` and the form lists them, each with a link to edit it. It skips the entry being edited, so an edit can still look its own word up again.

On success the form calls `router.invalidate()`. The word count on the home page comes from a loader and is cached until something says otherwise — this is that something, for the same reason login and logout invalidate in [auth.md](./auth.md#where-the-answer-is-cached).

### Correcting one already filed

```
Ēmendā on /verbum/soror     → /admin?id=42, the row read into the form
  ↓  read          the same fields, answered — Quaere still refills them from scratch
  ↓  Ēmenda        parseEntryDraft for the messages, then updateEntry for real
  ↓  Ēmendātum.    the desk empties and drops back to a new word's, the banner links to the result
```

The edit link on the detail page is shown to an admin and to nobody else, which is presentation and not protection: `/admin` has its own `beforeLoad` guard and `updateEntry` has `authMiddleware`. The row id is the whole address, not the lemma: an edit may rename the word, and _cum_¹ and _cum_² share one. So an edit URL survives a rename, and an id that no longer resolves is a `notFound`, not an empty create form.

`updateEntry` takes the **row id beside the draft** rather than inside it, because the lemma is one of the things an edit may change and so cannot be what identifies the row. In one transaction it checks the row still exists, files a rename under its new lemma by the rules a create follows, renumbers the lemma it left (see [Words spelled alike](#words-spelled-alike)), updates the columns, and then **deletes every sense and writes the submitted rows back**.

That replacement is the design, not an optimisation. Position *is* the rank, so a merge would have to decide which filed row each edited row *is* — and it cannot, because the editor may have reordered them, cut one from the middle, or rewritten a meaning outright. Deleting first is also what makes the new ranks run 1..n by construction, exactly as they do for a create.

### Examples: off unless there is one

`senses.example_la` and `example_en` are a pair of inputs per sense, and they start hidden — most senses carry no example, and two empty boxes on every row is a wall between the editor and the meanings. **Add example** reveals them for one sense and leaves the caret in the Latin box.

Where they start:

| Opening                | The example fields                                              |
| ---------------------- | ---------------------------------------------------------------- |
| A new word             | closed and empty                                                  |
| A fill from Wiktionary | closed and empty — a lookup suggests meanings, never examples     |
| A filed word, editing  | **open where that sense has one**, closed where it does not       |

One invariant holds the whole thing up: **hidden always means empty.** Nothing hides a value — `sense-examples-hidden` clears both boxes as it closes them. So an example that is off screen is never also on its way to the database, and "Remove example" is the way to unfile one.

Two rules in `parseEntryDraft`:

- The Latin example is Latin, rendered under `lang="la"` on the detail page, so it answers to the same script check the lemma does — a Greek `α` hiding in it is refused there, not discovered later by `check:macrons`.
- **A translation needs something to translate.** `example_en` without `example_la` is an error keyed to that sense; the reverse is fine, because a Latin line on its own is an example a reader can work at, while a translation on its own renders as a quotation of nothing.

### Case: off unless there is one — or always, where it is required

A sense's `governs` is a row of case chips, and whether they show follows [who is asked](./schema.md#who-is-asked):

| Word                                   | The case chips on each sense                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| a preposition with several cases (_in_) | **always shown**, offering only the cases ticked under Governs                 |
| a verb, an adjective                   | behind **Add case**, like the examples — open where a sense has one, all four offered |
| everything else, and _ad_              | not there                                                                       |

The examples' invariant holds here too: **hidden always means empty.** "Remove case" clears as it closes, and "Add case" reopens empty. Unticking a case under Governs takes it off every sense in the same pass, because those chips stop rendering — and unticking down to one case empties them all, because a one-case preposition's senses are not asked. Ticking it again does not bring the old answers back.

### Words spelled alike

_cum_ the preposition and _cum_ the conjunction are two entries, numbered by the `homonym` column — see [schema.md](./schema.md#unique-on-lemma-homonym). What makes two entries spelled alike **the same word** is their identity: lemma, part of speech, conjugation, declension and gender (`sameWord` in `src/utils/entries/homographs.ts`). Principal parts are left out: they are hand-edited text, and would stop matching Wiktionary's. A blank is unknown rather than different, so a fill that could not read the declension still matches the word on file.

The rules live in `src/server/filing.ts`, shared by both server functions:

| Filing under a lemma that…            | Result                                                            |
| ------------------------------------- | ----------------------------------------------------------------- |
| has no words                          | homonym 1                                                         |
| has a word with the same identity     | refused with a sentence: *cum is already filed as this preposition.* |
| has only other words, no `homograph`  | `{ kind: "unconfirmed", siblings }` — nothing is written          |
| has only other words, `homograph: true` | the next number: cum²                                          |

`homograph` is the editor's say-so that this is a new word, because without it a second _capiō_ with a mistyped conjugation would quietly become _capiō_². A Quaere fill that skipped words on file gives it, and the form says so: *Also filed under this spelling: cum (preposition). Adde files this one as cum².* An unconfirmed save puts the question in the summary instead, with a **File as cum²** button. Typing a different lemma takes the say-so back, along with the notice and the question.

An edit that keeps its lemma keeps its number; it is refused if its new grammar makes it a sibling's twin. A rename leaves a gap behind, so `closeGaps` renumbers the old lemma 1..n — rename _cum_¹ away and _cum_² becomes the bare `/verbum/cum`. Its page views stay recorded under the number they had.

## The form is a reducer

One user action is one named transition, in `formReducer`. Two rules live there rather than in the event handlers that used to hold them, because a handler is a place every future caller has to remember:

- **`clearInapplicable`** — a question that does not apply has to stay NULL, so picking a new part of speech empties the answers that just stopped applying. A gender typed while *noun* was selected would otherwise ride along into an adverb and be rejected by a rule no longer on screen. Wiktionary's fill runs through the same function: it hands back *bonus, bona, bonum* as principal parts for an adjective, and the reducer drops them. **`clearInapplicableSenses`** is the same rule one level down, run on the cleared draft: the part of speech and the cases under Governs decide what each sense may still say about its case.
- **`withoutSenseErrors`** — adding or removing a sense renumbers every row after it, so the messages from the last submit stop describing the rows they sit beside. Both actions throw them away; no caller has to remember to.

The state beyond the draft itself:

| Field         | Why it is there                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| `mode`        | `create`, or `edit` with the row id. The only thing that differs between the two flows.     |
| `nextSenseId` | Ids are handed out, never reused — a removed row must not be confused with its replacement. |
| `focusSense`  | The row whose meaning should take focus once it has rendered. `focusExample` and `focusCase` do the same for its Latin example and first case chip. |
| `errors`      | Keyed the way `parseEntryDraft` keys them, so each message sits by its input.               |
| `status`      | Where the last **submit** got to: `idle` \| `pending` \| `saved` \| `unconfirmed` \| `failed`. |
| `lookup`      | Where the last **lookup** got to: `idle` \| `pending` \| `filled` \| `exists` \| `failed`.     |
| `homograph`   | The editor's say-so that this is a new word under a lemma already filed.                   |

`saved` carries a `created` flag, which is the whole of the difference the banner shows: *Additum* or *Ēmendātum*. Both empty the desk.

`mode` is why one component serves both flows. The fields, the validation, the focus handling and Quaere are shared rather than reproduced; what a mode picks is the server function the submit calls and the label on the button that calls it.

Both `status` and `lookup` are unions rather than a handful of booleans, and that is not tidiness. Four flags let a failed submit render its error beside the success banner from the previous word — a combination a union cannot express. They are two fields rather than one because a lookup and a submit are different questions and can overlap in time.

## Quaere: Wiktionary fills the fields

`suggestEntry` is a `POST` server function behind `authMiddleware`, and it has to be server-side twice over: the browser cannot call Wiktionary's API (no CORS), and the one-second throttle Wikimedia asks for only means something if every request leaves from the same place.

What the parser makes of a page:

| Wiktionary                          | Filed as                                                              |
| ----------------------------------- | ---------------------------------------------------------------------- |
| headword line                       | `lemma`, with its macrons — the page itself is filed under the plain spelling |
| labelled forms                      | `principal_parts`: four for a verb, the genitive for a noun            |
| "first/second-declension"           | `declension: "1-2"`, the spelling [schema.md](./schema.md#the-inflection-vocabulary) uses |
| "indeclinable"                      | `declension: "indeclinable"` — an answer, not an absence               |
| "third (-iō variant) conjugation"   | `conjugation: "3io"`                                                   |
| a *Proper noun* section             | `part_of_speech: "noun"`, with a warning saying so                     |
| a *Postposition* section (*tenus*)  | `part_of_speech: "preposition"`, with a warning, and "follows its noun" in `notes` |
| a preposition's `(+ accusative, ablative)` | `governs`, in the one spelling: `accusative,ablative`             |
| a second headword line — *in (+ ablative)* … *in (+ accusative)* | read too: its senses follow the first line's, each carrying its line's case |
| a sense's case — `(with dative)`, `[with ablative]`, a `(with ablative):` heading over senses, or a case on the headword line (*meminī*) | that sense's `governs` — see [schema.md](./schema.md#governs-the-case-a-word-takes) |
| an accusative object on its own, or two objects at once (*doceō*) | **nothing** — an ordinary object is not worth marking, and two objects are a construction, said out loud |
| deponency, `m or f`                 | `notes`, where a sentence is allowed                                   |
| the definition list, in order       | senses — its first becomes rank 1, capped at eight                     |
| a definition's leading `(poetic)`   | that sense's `usage`, once grammar labels like `(transitive)` and case phrases like `(with accusative or ablative)` are dropped |
| a heading over definitions — `(figurative):`, `especially:` | read through: its senses are listed in its place, and a label like `figurative` joins each one's `usage` |
| quotations under a definition       | **nothing** — examples are written by a person, never filled              |

**A value this dictionary has no vocabulary for is dropped and said out loud**, never passed through. An unrecognised declension would only be rejected by `parseEntryDraft` a moment later, with the editor wondering where it came from.

### The warnings are the point

A fill with nothing to say shows nothing. Anything else appears above the form as a list:

```
2 Latin entries under this spelling, took the verb. Others: noun
Wiktionary lists 11 definitions, kept 8
Wiktionary calls this a proper noun; filed here as a noun
Wiktionary does not say how this pronoun inflects, so the declension is for you to answer
Wiktionary does not say which case each sense takes, so that is for you to answer
Wiktionary also files this as a postposition — it can follow its noun; that is a note, not a second entry
Sense 1 takes two objects at once (“with accusative ‘someone’ and accusative ‘something’”) — that is an example or a note, not a case
```

The case warnings mark the one place the fill is most often short. Wiktionary marks _noceō_'s dative and _crēdō_'s, but not _ūtor_'s or _fruor_'s ablative at all — a verb that comes back with no case may simply not have been marked.

Each one marks a place where the fill made a choice or fell short. Read them; they are the difference between a research assistant and an oracle.

### Pinned on the command line, preferred in the form

Both ends can name a part of speech — `capio#verb` in the terminal, the chips in the form — and they mean different things by it:

- **Pinned** (`LookupSpec.pinned`, what the script passes): no verb section is a mistake worth stopping for.
- **Preferred** (what `suggestEntry` passes): the chips hold whatever the *last* fill wrote into them, and a radio cannot be unpicked. Pinning there would mean that looking up a verb once left you unable to look up a noun. So an unsatisfiable preference falls back to what the page does have, and warns — including when the part of speech asked for is the one already filed.

## The same thing in bulk

```sh
npx tsx scripts/enrich-entries.ts puella ambulo mater   # rows to read
npx tsx scripts/enrich-entries.ts --file lemmas.txt --json
npx tsx scripts/enrich-entries.ts --file lemmas.txt --write
```

`--write` inserts directly, `onConflictDoNothing` on `(lemma, homonym)`: a word already on file keeps its row and whatever senses someone has curated for it. The script never files a homograph; those go through the form, where the editor confirms them. Use the script to bring in a batch you intend to read through afterwards; use the form when you are filing one word properly. The script's own footer is the honest summary — *Read the glosses before trusting them.*

## What the form says, and to whom

Every outcome is shown in the summary at the top of the form, and a screen reader hears it whichever way it went — but none of the summary is a live region. Each outcome reaches a screen reader one of two ways: announced through M7KIT's shared announcer, or read out by focus moving to the summary.

| Outcome        | Shown            | Heard                       | Focus                                                     |
| -------------- | ---------------- | --------------------------- | --------------------------------------------------------- |
| Entry created  | banner           | announced                   | stays put; the banner links to the new page               |
| Invalid draft  | problems         | read by focus               | moves to the summary — this form is long enough to put its first problem above the fold and its second below it |
| Submit refused | problems         | read by focus               | moves to the summary                                      |
| Fill succeeded | warnings only    | announced, with each warning | stays in the lemma field — the filled fields are the confirmation, to anyone who can see them |
| Fill failed    | banner           | announced                   | stays in the lemma field, which is usually the thing to fix |

Announced, not live, because every banner here is rendered together with its message, and a live region that arrives with its text is routinely missed (the same reason the search keeps its region mounted — [search.md](./search.md#structure-and-announcements)). The announcer's regions already exist; the effects in `EntryForm` hand them each new `status` and `lookup` as it lands. All of it is polite: nothing here is urgent enough to cut off what the screen reader is saying.

Read by focus, because focus is already going there: an announcement as well would read the problems twice. That only works if the problems are on screen when focus lands. A `dispatch` in an event handler renders *after* the handler returns, so the summary was focused while still empty — and the `role="alert"` it used to carry was what actually spoke. The dispatch is wrapped in `flushSync`, which renders first; then focus moves.

A fill with no warnings still announces "Wiktionary filled the form." The fields visibly change for a sighted reader; that line is the same news for someone who is not looking.

The proverb desk does the same: its saved banner is announced, politely, after focus has moved on to where the next proverb starts, and its problems are read by focus.

Adding a sense leaves the caret in the new row's meaning. Removing one hands focus to **Add sense**, because the row it was in is about to unmount. The Latin button labels each carry an English gloss — see [a11y.md](./a11y.md#english-glosses-on-the-latin-buttons).

## The proverb desk

A switcher at the top of `/admin` moves between **Verba** and **Proverbia**. Words is the default and is never written into the URL; `?desk=proverbs` is the other desk, set *beside* `?id` rather than instead of it. Both desks stay mounted and only the inactive one is hidden, so a half-filed word is still there after a look at the proverbs, and the other way round. The loader reads both desks' data whatever is showing (`loaderDeps` is the id only), so switching never loads.

A proverb has no page to start an edit from, so the desk has its own **add / edit** switch and, in edit, a picker listing every proverb on file. The flow is the editor's choice, held in `proverbFormReducer`'s `mode`, and **a save keeps it**:

```
add    Adde      → Additum.     the form empties, still in add; focus in the Latin
edit   pick → Ēmenda → Ēmendātum.  the form empties, still in edit; focus on the picker
```

Switching between add and edit empties the draft: carried into an add, a corrected proverb would be filed a second time as a new one.

`parseProverbDraft` is the gate, called by the form for the messages and by `createProverb` / `updateProverb` as `.validator`, the same split as entries. It derives `text_plain`, holds the Latin to the lemma's script rule, files a typed "Anonymous" as `ANONYMOUS`, and stores `meaning_en` as NULL when it only repeats the translation. **anonymous** is a chip, not a word to type: ticking it removes the author field and empties it, so no name that nobody can see is ever on its way to the database. Beside the author field, a **previous author** dropdown lists every named author already filed (read from the picker's proverbs, so no extra load) and writes into the same field — picking one is typing it, spelled the way it was filed.

The duplicate check runs on **`text_plain`**, not on `text_la`: *Veni, vidi, vici* is *Vēnī, vīdī, vīcī* typed in a hurry, and the UNIQUE on `text_la` would let it through.

## Later

Deleting an entry or a proverb is not built, and neither is reordering senses by anything other than retyping them.

## Gotchas

- **A new admin server function needs `.middleware([authMiddleware])` explicitly.** `suggestEntry` reaches the network on the caller's behalf; unguarded, it is an open Wikimedia proxy with this app's user agent on it.
- **Quaere replaces the whole draft, senses included.** It is not a merge. That is deliberate — what is on screen afterwards is one word's filing rather than two halves of different ones — but it means anything typed before pressing it is gone. It works the same way inside an edit, so it will overwrite a filed word's answers with Wiktionary's.
- **Saving an edit replaces every sense with the rows on screen**, ranked 1..n by position. That is safe only because the form now holds every column a sense has. Add a column to `senses` and it has to reach `handleSubmit`'s `filing` — the senses are mapped field by field there, and one left out of that list is one that silently saves empty on every edit. `governs` is the latest column that had to.
- **A preposition's sense chips offer the entry's cases, not all four.** So a change under Governs is a change to the senses as well — see [Case](#case-off-unless-there-is-one--or-always-where-it-is-required).
- **A saved edit hands the desk back as a new word's.** The form empties and `mode` drops to `create`, then the route is sent to `/admin`. Both halves matter: an emptied form still addressed to a row would file the *next* word typed into it over the one just saved.
- **The form is not keyed by the entry.** It notices a different word arriving and replaces its own draft, because a `key` would remount it — and unmount the confirmation banner at the exact moment a saved edit sends the route back to `/admin`.
- **The fill is capped at eight senses, and Wiktionary's order is the rank order.** Cut rows before saving rather than after: position *is* the rank, so deleting sense 2 later renumbers everything below it.
- **The throttle is per server process.** It is module state in `wiktionary.ts`, so a dev restart resets it and two processes do not know about each other.
- **A lookup failure leaves the form as it was.** Only a success replaces it, which is why a typo costs nothing.
- **`lemma_plain` is never typed.** `parseEntryDraft` derives it, and the form prints what it will be under the lemma field. See [search.md](./search.md#rulests-one-definition-of-a-search-key).
- **`npm run check` still has the last word.** The form holds the same rules at the point of entry, but the guards in [schema.md](./schema.md#the-check-chain) are what catch the rows written before it existed — and anything written around it.
