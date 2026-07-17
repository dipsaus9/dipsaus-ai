# Story authoring template — CLI field mapping

How a drafted story becomes a Backlog.md task. `backlog-plan` drafts these fields in the
interview, then materializes each story with **one `task create`** (plus one `task edit` to
finalize the branch line, since the branch embeds the id that only exists after creation).

**Never write the task file by hand** — the CLI owns the format. This template is about what to
*pass*, not what the file looks like.

## The create call

```bash
backlog task create "<concrete title: what + where>" \
  -p <epicId> \
  -d "<description — see shape below>" \
  --ac "<objective, checkable criterion 1>" \
  --ac "<criterion 2 …>" \
  --ref <path-1> --ref <path-2> \
  --dep <storyId>            # only real prerequisites \
  --plan "<ordered implementation approach, when known>" \
  --notes "<technical notes, constraints, per-story Verify>" \
  -l story --priority <low|medium|high> \
  --plain
```

Then, with the assigned id (e.g. `DIP-4.2`):

```bash
backlog task edit DIP-4.2 -d "<same description, Branch line finalized>"
```

## Description shape

The description carries the three things that have no dedicated field, in this order:

```
<Outcome: the one shippable thing this story delivers — a short paragraph.>

Type: deliverable | spike
Branch: <id>/<slug>
```

- **Type** — `spike` switches `backlog-deliver` to its research/interview flow.
- **Branch** — `<id>/<slug>`, slug 2–4 words from the title, lowercase-hyphenated, no id
  repeated, no type prefix. e.g. `DIP-1.1/two-tier-joke-formatter`. `backlog-deliver` cuts this
  string verbatim — it is the only branch the story is ever allowed to land on.

## Field guidance

- **Acceptance criteria** (`--ac`) — one per done-when item; each must be decidable by a machine
  or a command. Delivery checks them off individually, so keep one assertion per criterion.
- **References** (`--ref`) — the declared scope, one flag per path. Path-shaped
  (`hooks/dad-joke/config.ts`, `skills/backlog-plan/`), never prose. REQUIRED, ≥1 — this is the
  input to the scope-overlap check.
- **Plan** (`--plan`) — the ordered approach, including any within-story sequencing that matters
  (e.g. "the guard test lands as the first commit"). Delivery refines it at pickup.
- **Notes** (`--notes`) — constraints, prior art, gotchas, and **per-story Verify** steps that go
  beyond the repo baseline. Open questions live here too — an open question forces a `needs-info`
  label and blocks pickup.
- **Multi-line text** — real newlines inside quotes (the CLI does not convert `\n`); build the
  argument list programmatically when the text is quoting-hostile. No standalone `---` lines.

## Spike variant

For `Type: spike`, acceptance criteria state the decision to reach, and the outcome is a recorded
finding rather than code:

- **Description**: the question to resolve + `Type: spike` + `Branch:` line (a spike commits its
  recorded findings via the task file, so it gets a branch like any other story).
- **Acceptance criteria**: "the question is answered with a documented rationale", "options
  compared / a recommendation chosen" — still objective and checkable.
- **References**: still REQUIRED. A spike that only produces a decision scopes to its own task
  file (`backlog/tasks/`); a spike that will prototype code scopes to that code too — otherwise
  it can silently collide with a deliverable story touching the same files.
- **Findings**: recorded during delivery via `--append-notes` (evidence, sources) and
  `--final-summary` (the decision + rationale).
