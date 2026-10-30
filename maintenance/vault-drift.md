# `vault/` agrees with the code

The notes in `vault/` name exact things: files, functions, constants, columns, defaults, env vars. Code moves and the notes don't. Find where they disagree.

1. Read every note in `vault/` and `vault/concepts/`.
2. For each concrete claim, check it against the code:
   - a path exists (`src/utils/health/checks.ts`)
   - a function, constant or type is still exported by that name and from that file (`withFrequency`, `BANDS`, `normalizeLemma`)
   - a value matches (`DEFAULT_RETENTION_DAYS = 365`, the pragma table in `db.md`, the frequency bands)
   - a table in a note still lists what the code has (the checks in `health.md`, the `npm run check` chain)
   - a column or table exists in the Drizzle schema
   - a link to another note or a heading still resolves
3. Where they disagree, **the code is right**. Fix the note: smallest edit, same voice.
4. If the code looks wrong instead, because it breaks a rule the note states as a rule, don't touch either. List it under _Code that breaks a stated rule_ in the PR description.
5. Don't rewrite for style and don't add notes.

PR title: `vault: sync with code YYYY-MM-DD`. The description lists each fix as note, claim, what the code says.
