# Dependency updates

Keep dependencies current in small steps, so no update is ever a big one.

1. `npm outdated` and `npm audit`.
2. Update every patch and minor version within the ranges in `package.json`. Fix anything `npm audit` reports that has a fix within range.
3. **Major versions are not updated.** List them in the PR description, with a link to each changelog and one line on what would break.
4. Leave alone:
   - `nitro`, pinned to an exact beta on purpose. Report a newer beta in the PR, don't apply it.
   - the `overrides` block, unless the advisory it was added for is fixed upstream. Then say so in the PR, and remove nothing.
5. If any `@tanstack/*` package changed, run each `npx @tanstack/intent@latest load …` command listed in `AGENTS.md`. Note in the PR any skill that is new, gone or renamed, and update the list in `AGENTS.md` to match.
6. `npm run build` and `npm run check`. If an update breaks either, drop that one package back and say which and why in the PR.

PR title: `deps: weekly update YYYY-MM-DD`. The description is a table of package, from, to.
