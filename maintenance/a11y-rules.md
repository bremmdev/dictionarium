# `AGENTS.md` and accessibility rules hold

`AGENTS.md` and `vault/a11y.md` state rules the checks can't fully enforce. Look for code that breaks them.

Only look at what changed since the last run: `git log --since="8 days ago" -p -- src`. If nothing in `src` changed, stop and say so.

1. **Announcements go through `useAnnounce()`** from `@bremmdev/m7kit`. Flag any new `aria-live`, `role="status"`, `role="alert"` or `<output>`. Rewrite each one to `useAnnounce()`, following `reports/accessibility/announcer-2026-10-10.md`.
2. **Latin carries `lang="la"`** on the smallest element that wraps the whole Latin run. Flag Latin text in JSX without it, and English `aria-label`s placed over visible Latin.
3. **Precomposed characters.** `npm run check:macrons` passes.
4. Everything else in `vault/a11y.md`: read it and check the changed code against each rule.

Fix what has one clear fix. Anything that needs a decision goes in the PR description, not the code.

If anything was found, also add `reports/accessibility/rules-YYYY-MM-DD.md`: what was checked, what was found, what was fixed. Model it on the existing report there.

PR title: `a11y: rules check YYYY-MM-DD`.
