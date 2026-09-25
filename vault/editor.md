# Editor: the form fills, a person files

There are two ways a word gets into the dictionary — `/admin` in a browser, `scripts/enrich-entries.ts` in a terminal — and they meet at the same two functions: one that says what a valid entry is, one that reads English Wiktionary. Neither end has rules of its own.

Correcting a word already on file is the same desk, not a second one: `/admin?lemma=soror` is the form with that row read back into it.

Two consequences worth naming up front:

- **Nothing in the form decides what is valid.** `parseEntryDraft` does, and the form calls it for the messages only.
- **Nothing that fills the form decides what is filed.** Wiktionary fills the fields and stops. The submit is a separate press by a person who has read them.

| File                                  | Responsibility                                                                     |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/routes/admin.tsx`                | The one guarded page — see [auth.md](./auth.md). A heading and the form. `?lemma=` says which word. |
| `src/components/admin/EntryForm.tsx`  | Fields, focus, and the live region. Dispatches; decides nothing.                   |
| `src/utils/entries/form.ts`           | `formReducer` — every transition the draft makes, as a pure function.              |
| `src/utils/entries/rules.ts`          | `parseEntryDraft` and the inflection vocabulary — see [schema.md](./schema.md).    |
| `src/utils/entries/wiktionary.ts`     | Looking a lemma up, parsing what comes back, and mapping it onto these columns.    |
| `src/server/entries.ts`               | `createEntry` and `updateEntry`, which write; `suggestEntry`, which does not.       |
| `scripts/enrich-entries.ts`           | The same lookup, many words at a time, printed or written.                         |

## One rulebook, four callers

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

This is [auth.md](./auth.md#the-boundary-guards-are-ux-middleware-is-the-gate)'s boundary rule again in a different costume. The form is reachable only through a browser; `createEntry` and `updateEntry` are RPCs reachable by their own URL by anyone the session lets in. So the validator on the server function is the real check, and the form's copy exists so a person sees five problems at once instead of one per round trip.

`EntryValidationError.message` is set to the first of the fields. A thrown error crossing the RPC boundary arrives as a plain `Error`, and the message is the only part that survives — enough, because the form has already run the same function before sending.

## A session at the desk

```
type a lemma
  ↓  Quaere       suggestEntry → Wiktionary. Fills every field. Submits nothing.
  ↓  read         chips, senses, notes — cut what a learner's dictionary does not want
  ↓  Adde         parseEntryDraft for the messages, then createEntry for real
  ↓  Additum.     the new lemma links to its page; the form empties, ready for the next
```

`createEntry` writes the entry and its senses in **one transaction** — an entry with no senses is not an entry. It asks whether the lemma is already on file before inserting, purely so the answer is a sentence (*“capiō” is already in the dictionary.*) rather than a constraint name; `UNIQUE` on `lemma` is what actually stops the duplicate.

On success the form calls `router.invalidate()`. The word count on the home page comes from a loader and is cached until something says otherwise — this is that something, for the same reason login and logout invalidate in [auth.md](./auth.md#where-the-answer-is-cached).

### Correcting one already filed

```
Ēmendā on /verbum/soror     → /admin?lemma=soror, the row read into the form
  ↓  read          the same fields, answered — Quaere still refills them from scratch
  ↓  Ēmenda        parseEntryDraft for the messages, then updateEntry for real
  ↓  Ēmendātum.    the desk empties and drops back to a new word's, the banner links to the result
```

The edit link on the detail page is shown to an admin and to nobody else, which is presentation and not protection: `/admin` has its own `beforeLoad` guard and `updateEntry` has `authMiddleware`. The lemma is the whole address — the same key the detail page is read under — so an edit URL is bookmarkable and a lemma that no longer resolves is a `notFound`, not an empty create form.

`updateEntry` takes the **row id beside the draft** rather than inside it, because the lemma is one of the things an edit may change and so cannot be what identifies the row. In one transaction it checks the row still exists, refuses a rename onto another word's headword with a sentence, updates the columns, and then **deletes every sense and writes the submitted rows back**.

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

## The form is a reducer

One user action is one named transition, in `formReducer`. Two rules live there rather than in the event handlers that used to hold them, because a handler is a place every future caller has to remember:

- **`clearInapplicable`** — a question that does not apply has to stay NULL, so picking a new part of speech empties the answers that just stopped applying. A gender typed while *noun* was selected would otherwise ride along into an adverb and be rejected by a rule no longer on screen. Wiktionary's fill runs through the same function: it hands back *bonus, bona, bonum* as principal parts for an adjective, and the reducer drops them.
- **`withoutSenseErrors`** — adding or removing a sense renumbers every row after it, so the messages from the last submit stop describing the rows they sit beside. Both actions throw them away; no caller has to remember to.

The state beyond the draft itself:

| Field         | Why it is there                                                                            |
| ------------- | ------------------------------------------------------------------------------------------ |
| `mode`        | `create`, or `edit` with the row id. The only thing that differs between the two flows.     |
| `nextSenseId` | Ids are handed out, never reused — a removed row must not be confused with its replacement. |
| `focusSense`  | The row whose meaning should take focus once it has rendered.                              |
| `errors`      | Keyed the way `parseEntryDraft` keys them, so each message sits by its input.               |
| `status`      | Where the last **submit** got to: `idle` \| `pending` \| `saved` \| `failed`.                 |
| `lookup`      | Where the last **lookup** got to: `idle` \| `pending` \| `filled` \| `failed`.                |

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
| deponency, `+ ablative`, `m or f`   | `notes`, where a sentence is allowed                                   |
| the definition list, in order       | senses — its first becomes rank 1, capped at eight                     |
| a definition's leading `(poetic)`   | that sense's `usage`, once grammar labels like `(transitive)` are dropped |
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
```

Each one marks a place where the fill made a choice or fell short. Read them; they are the difference between a research assistant and an oracle.

### Pinned on the command line, preferred in the form

Both ends can name a part of speech — `capio#verb` in the terminal, the chips in the form — and they mean different things by it:

- **Pinned** (`LookupSpec.pinned`, what the script passes): no verb section is a mistake worth stopping for.
- **Preferred** (what `suggestEntry` passes): the chips hold whatever the *last* fill wrote into them, and a radio cannot be unpicked. Pinning there would mean that looking up a verb once left you unable to look up a noun. So an unsatisfiable preference falls back to what the page does have, and warns.

## The same thing in bulk

```sh
npx tsx scripts/enrich-entries.ts puella ambulo mater   # paste-ready seed.ts rows
npx tsx scripts/enrich-entries.ts --file lemmas.txt --json
npx tsx scripts/enrich-entries.ts --file lemmas.txt --write
```

`--write` inserts directly, `onConflictDoNothing` on `lemma`: a word already on file keeps its row and whatever senses someone has curated for it. Use the script to bring in a batch you intend to read through afterwards; use the form when you are filing one word properly. The script's own footer is the honest summary — *Read the glosses before trusting them.*

## What the form says, and to whom

One live region holds every outcome, so a screen reader hears the result whichever way it went:

| Outcome        | Element                | Focus                                                     |
| -------------- | ---------------------- | --------------------------------------------------------- |
| Entry created  | `<output>`             | stays put; the banner links to the new page               |
| Invalid draft  | `role="alert"`         | moves to the summary — this form is long enough to put its first problem above the fold and its second below it |
| Submit refused | `role="alert"`         | moves to the summary                                      |
| Fill succeeded | `<output>`, warnings only | stays in the lemma field — the filled fields are the confirmation, to anyone who can see them |
| Fill failed    | `role="alert"`         | stays in the lemma field, which is usually the thing to fix |

A fill with no warnings still writes one sr-only line into the live region. The fields visibly change for a sighted reader; that line is the same news for someone who is not looking.

Adding a sense leaves the caret in the new row's meaning. Removing one hands focus to **Add sense**, because the row it was in is about to unmount. The Latin button labels each carry an English gloss — see [a11y.md](./a11y.md#english-glosses-on-the-latin-buttons).

## Later

Deleting an entry is not built, and neither is reordering senses by anything other than retyping them.

## Gotchas

- **A new admin server function needs `.middleware([authMiddleware])` explicitly.** `suggestEntry` reaches the network on the caller's behalf; unguarded, it is an open Wikimedia proxy with this app's user agent on it.
- **Quaere replaces the whole draft, senses included.** It is not a merge. That is deliberate — what is on screen afterwards is one word's filing rather than two halves of different ones — but it means anything typed before pressing it is gone. It works the same way inside an edit, so it will overwrite a filed word's answers with Wiktionary's.
- **Saving an edit replaces every sense with the rows on screen**, ranked 1..n by position. That is safe only because the form now holds every column a sense has. Add a column to `senses` and it has to reach `handleSubmit`'s `filing` — the senses are mapped field by field there, and one left out of that list is one that silently saves empty on every edit.
- **A saved edit hands the desk back as a new word's.** The form empties and `mode` drops to `create`, then the route is sent to `/admin`. Both halves matter: an emptied form still addressed to a row would file the *next* word typed into it over the one just saved.
- **The form is not keyed by the entry.** It notices a different word arriving and replaces its own draft, because a `key` would remount it — and unmount the confirmation banner at the exact moment a saved edit sends the route back to `/admin`.
- **The fill is capped at eight senses, and Wiktionary's order is the rank order.** Cut rows before saving rather than after: position *is* the rank, so deleting sense 2 later renumbers everything below it.
- **The throttle is per server process.** It is module state in `wiktionary.ts`, so a dev restart resets it and two processes do not know about each other.
- **A lookup failure leaves the form as it was.** Only a success replaces it, which is why a typo costs nothing.
- **`lemma_plain` is never typed.** `parseEntryDraft` derives it, and the form prints what it will be under the lemma field. See [search.md](./search.md#rulests-one-definition-of-a-search-key).
- **`npm run check` still has the last word.** The form holds the same rules at the point of entry, but the guards in [schema.md](./schema.md#the-check-chain) are what catch the rows written before it existed — and anything written around it.
