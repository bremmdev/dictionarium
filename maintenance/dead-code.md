# Dead code

Remove what nothing uses.

1. `npx knip` for unused files, exports, types and dependencies.
2. **Not dead even if knip says so:**
   - `src/routeTree.gen.ts` and anything under `src/routes/` (the router finds those by file name)
   - `scripts/*.ts` (run by name from `package.json` or by hand, as `vault/frequency.md` describes for `build-frequency.ts`)
   - `drizzle/` migrations
   - anything a `vault/` note names
3. For each finding, confirm with a search that nothing imports it, including dynamic `import()` and string references. If you're unsure, leave it and list it.
4. Remove what is confirmed dead. An export that is used only in its own file loses `export` and stays.
5. `npm run build` and `npm run check`.

PR title: `chore: remove dead code YYYY-MM-DD`. The description lists each removal and lists what was left alone, with the reason.
