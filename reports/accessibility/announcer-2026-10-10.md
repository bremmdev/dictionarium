# Screen reader announcements: 2026-10-10

## Summary

Status messages now reach screen readers through **M7KIT's shared announcer**, `useAnnounce()` from `@bremmdev/m7kit`. The app already depends on M7KIT. One copy means one queue for everything on the page, M7KIT's own components included.

How the announcer works:

- **Regions:** it keeps one polite and one assertive visually hidden live region, created when the first component that uses it mounts.
- **Messages:** each message is added as a new element, so messages can't overwrite each other, and the same text twice is read twice.
- **Queue:** messages go out 250 ms apart, assertive first.
- **`id`:** a newer message replaces a waiting one with the same `id`.

```tsx
import { useAnnounce } from "@bremmdev/m7kit";

const announce = useAnnounce();
announce("2 results for amo.", { id }); // polite by default
announce("Nōn licet. That password is not right.", { politeness: "assertive" });
```

The app has no modal dialogs, so the routing into dialogs isn't used yet. If you add one later, there are two options, and either way messages land inside the dialog, where a screen reader can still hear them:

- Use M7KIT's `Drawer`, which creates the regions inside itself when it opens.
- Have the components inside it pass their element to `useAnnounce(ref)`, which creates the regions inside the dialog when they mount.

## Inventory

| #   | Location                                                                               | What it announced                                                             | Verdict              | Reason                                                                                                                                                      | What changed                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `search/Results.tsx:36` `<p aria-live="polite" class="sr-only">`                       | "2 results for amo." / "Type at least 2 letters to search." after each search | **Replace**          | Text only for screen readers                                                                                                                                | Region removed. An effect announces each new outcome, with an `id` per instance, and skips the outcome the page loaded with, as before                                                 |
| 2   | `search/Search.tsx:109` `aria-busy` on the results section                             | none (holds announcements back while loading)                                 | **Keep**             | Not a live region; it marks the results as loading                                                                                                          | None. It no longer holds back the count, which is announced only once loading ends                                                                                                     |
| 3   | `wordlist/WordListBuilder.tsx:165` `aria-live="polite"` on the summary                 | "54 nouns of the 1st declension, …" for each new list                         | **Keep**             | Visible text that stays on screen, always mounted, keyed inner bar (each list is a new node)                                                                | None. No defects: not atomic, not hidden, repeats are re-read, no modals                                                                                                               |
| 4   | `wordlist/WordListBuilder.tsx:460` `aria-busy`                                         | none                                                                          | **Keep**             | As row 2                                                                                                                                                    | None                                                                                                                                                                                   |
| 5   | `admin/EntryForm.tsx:367` `<output>` saved banner                                      | "Additum. lupus is in the dictionary."                                        | **Replace**          | Rendered together with its message; it can't be rendered empty in a `space-y-4` summary without leaving a gap                                               | Banner is a `div`; an effect announces each new saved `status` (polite)                                                                                                                |
| 6   | `admin/EntryForm.tsx:390` `role="alert"` problems box                                  | "Nōn licet." plus each problem, after an invalid or refused submit            | **Convert** to focus | Focus already moves to the summary, so an alert as well reads the problems twice                                                                            | `role="alert"` removed. The dispatch runs in `flushSync`, so the problems are on screen before focus lands (see below)                                                                 |
| 7   | `admin/EntryForm.tsx:411` `<output>` lookup filled (hidden line plus visible warnings) | "Wiktionary filled the form." plus warnings                                   | **Replace**          | Mostly text only for screen readers, rendered with its message                                                                                              | The hidden line is gone; the warnings list renders alone; an effect announces the line and the warnings (polite)                                                                       |
| 8   | `admin/EntryForm.tsx:428` `role="alert"` lookup failed                                 | "Nihil inventum. Wiktionary has no Latin entry for …"                         | **Replace**          | Rendered together with its message                                                                                                                          | Box is a plain `div`; announced by the same effect. **Assertive → polite**: a failed lookup doesn't stop the editor                                                                    |
| 9   | `admin/ProverbForm.tsx:222` `<output>` saved banner                                    | "Additum. Fēstīnā lentē is filed among the proverbs."                         | **Replace**          | As row 5. Focus moves to the next field at the same moment, so the message is polite and waits for it                                                       | Banner is a `div`; an effect announces each new saved `status`                                                                                                                         |
| 10  | `admin/ProverbForm.tsx:239` `role="alert"` problems box                                | "Nōn licet." plus each problem                                                | **Convert** to focus | As row 6                                                                                                                                                    | As row 6                                                                                                                                                                               |
| 11  | `routes/login.tsx:132` `role="alert"` password error                                   | "Nōn licet. That password is not right."                                      | **Replace**          | Focus can't carry it: a submit with Enter never leaves the field, so focusing it again reads nothing. The error was also rendered together with its message | `role="alert"` removed; the visible error stays, linked with `aria-describedby`. Each failed attempt calls `announce(…, { politeness: "assertive" })`: a wrong password stops the user |

Also on the page, but outside the app's code:

- **TanStack Devtools** adds a hidden `p[aria-live="polite"]` in development (`@tanstack/devtools`). Chromium ignores it (not visible), and it's removed from production builds. **Keep**.
- **M7KIT's `Button`** sets `aria-busy` while loading; no live region. **Keep**.

### Behavior changes

- **The lookup failure is polite now (row 8)**; it used to be assertive.
- **Invalid and refused submits are read once, by focus (rows 6 and 10)**, instead of by an alert plus focus. Before, focus landed on the summary while it was still empty, so the alert was what spoke.
- **Messages lose `lang="la"`.** The old banners marked their Latin words (_Additum_, _Nōn licet_, the lemma) with `lang="la"`. An announcement is one flat string, so a screen reader with a Latin voice (NVDA with eSpeak) now reads them with the page's English voice. The visible text keeps its `lang`. Recorded in `vault/a11y.md`.

### Seen along the way, not changed

- **Focus is probably lost after Quaere (the lookup) and after a save.** `EntryForm` and `ProverbForm` disable their Quaere and submit buttons while working. `ProverbForm`'s own comment says that drops focus to `<body>`, but `EntryForm`'s lookup comment says focus "stays in the lemma field". The click puts focus on the button, not the field. I didn't verify this here; it's worth a separate look.
- **A stale note in `vault/a11y.md`.** Its "Parked" item still asks for a `role="status"` line for the results. That was already built, and is now done through the announcer, so you may want to delete the item.

## Proposals

None. Every change only affects what screen readers receive: no text, toast or focus target that anyone can see was added, removed or moved. The one focus change is _when_ focus lands (after the summary renders, in the same frame). Where it lands is unchanged.

## Verification

**Checks:**

- `tsc --noEmit` passes.
- `biome check` passes on the changed files.
- `npm run check`:
  - the macron, lemma, sense, inflection and governs checks pass;
  - Biome reports 2 format errors, in `src/db/schema.ts:90` and `src/server/proverbs.ts:22`. Both are trailing whitespace in files this change doesn't touch, so they were already there.
- The project has no test suite. The announcer's own behavior is covered by M7KIT's tests.

**Second inventory:** the only live regions left are rows 2–4, all Keep, which matches the verdicts.

**Browser recorder:** Playwright with Chromium 153, against `vite dev` on a copy of the database with a throwaway admin password (the real database and backups weren't touched). 11 of 11 scenarios passed:

| Scenario                              | Timeline                                                                                                                                                             | Flags                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Search announces the count            | input focused; 881 ms polite "2 results for amo."                                                                                                                    | none                 |
| A page loaded with `?q=amo`           | nothing announced                                                                                                                                                    | none                 |
| Too short a query                     | polite "Type at least 2 letters to search."                                                                                                                          | none                 |
| The same search twice                 | "2 results for amo." at 780 ms and again at 2854 ms                                                                                                                  | none                 |
| Two searches in quick succession      | only "1 result for aqua."                                                                                                                                            | none                 |
| Word list (kept region)               | "54 nouns", then "42 verbs"                                                                                                                                          | none                 |
| Wrong password twice, with Enter      | assertive "Nōn licet. That password is not right." twice                                                                                                             | assertive (intended) |
| Entry desk, invalid submit twice      | focus on the summary **already reading** "Nōn licet. A lemma is required — …", both times; no live message                                                           | none                 |
| Entry desk, lookup finds nothing      | polite "Nihil inventum. Wiktionary has no Latin entry for “xqzvwk”."                                                                                                 | none                 |
| Entry desk, lookup fills, then a save | "Wiktionary filled the form.", then "Additum. lupus is in the dictionary."                                                                                           | none                 |
| Proverb desk, invalid, then a save    | focus on the summary reading "Nōn licet. The Latin is required — …"; then focus in the Latin field and polite "Additum. Testum tertium is filed among the proverbs." | none                 |

Chromium exposed both announcer regions on every page.

A refused submit was also checked by accident: saving the same proverb twice. Focus landed on the summary, which already read "Nōn licet. “Testum recordātōris” is already filed.".

## Manual screen reader test

What the automated checks can't prove:

- that a message is spoken;
- in which order;
- whether VoiceOver cuts it off;
- what Firefox and Safari expose.

Test these combinations:

| Platform | Combination                                                   |
| -------- | ------------------------------------------------------------- |
| Windows  | NVDA + Firefox, NVDA + Chrome, JAWS + Chrome, Narrator + Edge |
| macOS    | VoiceOver + Safari                                            |
| iOS      | VoiceOver + Safari                                            |
| Android  | TalkBack + Chrome                                             |

Scenarios:

1. **Search:**
   - Search _amo_: hear "2 results for amo." after the field.
   - Search it again after clearing: hear it again.
   - Search _a_: hear "Type at least 2 letters to search."
2. **Word list:** build a list, then another. Hear each summary once.
3. **Login:**
   - Enter a wrong password and press Enter: hear "Nōn licet. That password is not right."
   - Do it again: hear it again.
   - Repeat with the **Intrā** button. Check that VoiceOver doesn't cut the message off.
4. **Entry desk:**
   - Press **Adde** with an empty form. Focus moves to the summary, and the problems are read **once**.
   - Repeat, and hear them again.
   - Look up a nonsense word: hear "Nihil inventum. …".
   - Look up a real word: hear "Wiktionary filled the form." and any warnings.
   - Save it: hear "Additum. … is in the dictionary."
5. **Proverb desk:**
   - Submit an empty form: hear the problems once, by focus.
   - Save a proverb: hear the Latin field, then "Additum. … is filed among the proverbs."
6. **Latin voice (NVDA with eSpeak):** confirm the visible Latin is still read in Latin when browsing. Announcements are in the English voice.

NerdeRegion (browser extension) shows which announcements fire, which separates a code bug from a screen reader quirk.

## Files changed

- `package.json` and `package-lock.json`: `@bremmdev/m7kit` `^0.62.0` → `^0.64.0`. This also brings 0.63.0's Windows high-contrast hover styles for `Button`.
- `src/components/search/Results.tsx`
- `src/components/admin/EntryForm.tsx`
- `src/components/admin/ProverbForm.tsx`
- `src/routes/login.tsx`
- `vault/a11y.md`: new section, "Status messages go through one announcer".
- `vault/editor.md`: "What the form says, and to whom".
- `vault/search.md`: "Structure and announcements".
- `AGENTS.md`: an accessibility line above the TanStack Intent block.
