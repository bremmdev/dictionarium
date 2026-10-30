# Maintenance: tasks an agent runs on a schedule

Each file here is the full instruction for one recurring task. The scheduled task in T3 Code holds only a one-line prompt that points at its file, so a task changes by editing the file here, not the schedule.

| Task                            | File                               | When            | Result        |
| ------------------------------- | ---------------------------------- | --------------- | ------------- |
| Dependency updates              | [deps.md](./deps.md)               | Monday 09:00    | PR            |
| `vault/` agrees with the code   | [vault-drift.md](./vault-drift.md) | Tuesday 09:00   | PR            |
| `AGENTS.md` and a11y rules hold | [a11y-rules.md](./a11y-rules.md)   | Wednesday 09:00 | PR            |
| Dead code                       | [dead-code.md](./dead-code.md)     | Thursday 09:00  | PR            |
| New LASLA data                  | [lasla.md](./lasla.md)             | every 30 days   | a note, no PR |

One a day, so no two runs share the machine or edit `package.json` at the same time.

## Rules for every task

- **Start clean.** The run gets a fresh worktree from `origin/main`. Run `npm ci` before anything else.
- **One branch, one PR.** Branch `maintenance/<task>-<YYYY-MM-DD>`. Push it and open a PR against `main`. Never push to `main`.
- **Nothing to do is a result.** If nothing needs changing, open nothing and end with one line saying so.
- **Green before the PR.** `npm run build` and `npm run check` pass on the branch. If they fail on `main` too, say that in the PR rather than fixing unrelated things.
- **Small.** Only what the task asks. Anything else you notice goes in the PR description under _Also noticed_.
- **No deleting** branches, data or files beyond what the task names.
- **Secrets.** Run things through the package scripts, which go through arca. Never read secret values.
- **Before opening a PR**, check for an open PR from an earlier run of the same task. If one exists, update that branch instead of opening a second.

## Setting them up in T3 Code

The schedule has three kinds of trigger: an interval, a time of day (optionally on chosen weekdays), and a webhook. There is no monthly trigger, so the LASLA check uses a 30-day interval.

A fixed-time run that is more than 10 minutes late is **skipped**, not caught up. If T3 Code isn't running on Monday at 09:00, the dependency run waits until next Monday. An interval run that came due while T3 Code was closed runs as soon as it starts again.
