# Companion story doc template

One file per story at `.backlog/stories/<PREFIX>-<n>.md`. Fixed headings so any AI can parse
and update it. `backlog-plan` writes it; `backlog-deliver` reads it. Keep it terse and explicit
— it is read by a model, not skimmed by a human.

Omit optional sections that do not apply, but never rename or reorder the ones present.

```markdown
# [<PREFIX>-<n>] <concrete title: what + where>

Type: deliverable | spike
Status: ready | needs-refinement | needs-info

## Outcome
<the one shippable thing this story delivers>

## Done-when
- <objective, checkable criterion 1 — mirrors the subtask's --done-when>
- <criterion 2 …>

## Depends-on
- <PREFIX-n> (or "none")

## Affected area
- <files / directories the work touches — mirrors the subtask --scope>

## Verify
- <command / test / observable that proves done-when, e.g. `bun run check`>
  (optional if a global `verify` in standards.json already covers it)

## Technical notes
<optional: implementation guidance, constraints, links, gotchas>

## Open questions
<optional: unresolved questions. Any entry here forces Status: needs-info and blocks pickup.>
```

## Spike variant

For `Type: spike`, `Done-when` states the decision to reach, and `Outcome` is a recorded
finding rather than code:

```markdown
# [<PREFIX>-<n>] <question to resolve>

Type: spike
Status: ready

## Outcome
<the decision to record, once reached>

## Done-when
- <the question is answered with a documented rationale>
- <options compared / a recommendation chosen>

## Findings
<filled in during delivery: what was learned, sources, the decision>
```
