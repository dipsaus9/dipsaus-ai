# Deliver eval fixtures

Each subdirectory is one `backlog-deliver` eval case, in the shape fixed by DIP-10.1
(`../reference/harness.md`). The runner (DIP-10.5) loads a case, materializes it into a throwaway
repo + local bare remote, runs `backlog-deliver` headless, and hands the result to the grader
(DIP-10.3) and judge (DIP-10.4).

## Case layout

```
<case>/
  meta.json              { stack, description, reviewEnabled }
  repo/                  starter repo contents (committed as the initial state)
  story.json             the ready story to create — title, type, outcome, acs[], references[], branchSlug
  backlog-workflow.json  → copied to .claude/backlog-workflow.json in the sandbox
  expected.json          grading contract: { branchSlug, acs[], references[], reviewEnabled }
```

- **`story.json`** is machine-readable so the runner creates the task via the `backlog` CLI
  (`--type`, `--ac` per entry, `--ref` per path). Its `branchSlug` becomes `<id>/<slug>` once the
  CLI assigns the id.
- **`expected.json`** is the `DeliverExpected` contract the grader consumes, minus the id: the
  runner fills `branch = <assigned-id>/<branchSlug>` before grading. `acs` are the 1-based indices
  that must end up checked; `references` are the declared scope; `reviewEnabled` mirrors the config.
- **The starter `repo/` is deliberately red** — its test fails (or its doc lacks the section) until
  the story is delivered. `verify` goes green *only* after a correct delivery, which is what the
  grader's verify dimension measures. A no-pipeline case (`docs-no-pipeline`) has no test; its verify
  degrades to the story's own checks.

## Cases

| Case | Stack | Shape |
|---|---|---|
| `node-add-sum` | node/bun | single-file: add `src/sum.js`, `node --test` goes green |
| `python-add-slugify` | python | add `src/slugify.py`, `pytest` goes green |
| `docs-no-pipeline` | none | add a `## Ports` section to `CONFIG.md`; verify degrades to per-story checks |
| `node-multi-wire` | node/bun | multi-file: add `src/shout.js` **and** wire it into `src/index.js` (scope across two files) |

All cases keep `worktree.enabled: true`, `pr.mode: link` and `parallelism.maxAgents: 1`. Add a case
by copying the layout; keep the starter repo small but genuinely red.
