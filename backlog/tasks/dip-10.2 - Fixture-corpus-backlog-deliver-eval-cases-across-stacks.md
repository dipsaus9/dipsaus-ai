---
id: DIP-10.2
title: 'Fixture corpus: backlog-deliver eval cases across stacks'
status: Done
assignee: []
created_date: '2026-08-12 06:51'
updated_date: '2026-08-12 07:35'
labels:
  - story
dependencies:
  - DIP-10.1
references:
  - tests/eval/deliver/fixtures/
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 61000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A corpus of self-contained deliver cases, each a starter git repo + a ready story + the expected outcome, spanning ~2-3 stacks (e.g. node/bun, python, a no-pipeline repo). Each case is built to the DIP-10.1 fixture shape.

Type: deliverable
Branch: DIP-10.2/deliver-eval-fixtures
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 At least 4 deliver fixture cases exist, each a self-contained starter repo + one ready story + a recorded expected outcome (branch, which ACs, declared References)
- [x] #2 The corpus spans at least two stacks plus one no-pipeline repo (verify degrades to per-story checks)
- [x] #3 Each fixture is loadable by the runner and torn down cleanly after a run
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Author 4+ fixture repos to the 10.1 shape. 2. Vary stack + difficulty (single-file vs multi-file story). 3. Record expected outcomes.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep fixtures deliberately small but real. Fixtures live under tests/eval/ so they are fenced from CI gates.

Delivered 4 fixture cases under tests/eval/deliver/fixtures/ to the DIP-10.1 shape, refined to machine-readable story.json (title/type/outcome/acs/references/branchSlug -> the runner creates the task via CLI) + expected.json (DeliverExpected minus id: branchSlug/acs/references/reviewEnabled; runner fills branch=<id>/<slug>). Cases: node-add-sum (node/bun, node --test, no deps), python-add-slugify (python/pytest), docs-no-pipeline (no manifest -> verify degrades), node-multi-wire (multi-file: src/shout.js + wire into src/index.js, scope across two files). AC#2: 3 stacks (node, python, none) + the no-pipeline case. AC#3: consistent documented shape (fixtures/README.md) loadable by the runner; copy-and-run teardown demonstrated. Each starter repo is deliberately RED until delivered — verified node-add-sum: ERR_MODULE_NOT_FOUND before, pass 1/fail 0 after adding src/sum.js. Fenced from CI: fixtures/ is oxlint-ignored, tests/eval excluded from root tsconfig, .js fixture tests not matched by the eval vitest project (*.test.ts only). Repo gates green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped the deliver eval fixture corpus: 4 self-contained cases under tests/eval/deliver/fixtures/ spanning node/bun, python and a no-pipeline repo, plus a multi-file node case that exercises cross-file scope. Each case is a deliberately-red starter repo/ (verify goes green only after a correct delivery), a machine-readable story.json the runner turns into a Backlog.md task, and an expected.json that is the DeliverExpected grading contract (DIP-10.3) minus the runtime-assigned id. The format is documented in fixtures/README.md, the fixtures are fenced off from every CI gate, and node-add-sum was verified red-before / green-after. DIP-10.5 wires these into the runner.
<!-- SECTION:FINAL_SUMMARY:END -->
