---
id: DIP-2.12
title: 'Demo-seam behavior tests, apply-baseline refresh and first A/B answer'
status: Done
assignee: []
created_date: '2026-07-24 07:27'
updated_date: '2026-07-31 08:30'
labels:
  - story
dependencies:
  - DIP-2.11
references:
  - tests/eval/fixtures/composition/
  - tests/eval/fixtures/srp/props-cap/
  - tests/eval/fixtures/srp/god-component/
  - tests/eval/runner/
  - tests/eval/baseline/
  - tests/eval/ab/
  - tests/eval/README.md
parent_task_id: DIP-2
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The apply eval grades fairly and the epic gets its founding answer: the seven API-pinning fixtures (composition/regions-as-slots, config-soup, variant-compound, slots-over-config, dashboard-panel, srp/props-cap, srp/god-component) gain a Demo.tsx caller seam whose rendered output the behavior tests pin — the model may refactor the target AND update Demo (product code), but behavior.test.tsx stays pristine-restored — the apply baseline is regenerated and approved on the fixed corpus, and one full skill-on/off A/B run is archived with a per-category summary.

Type: deliverable
Branch: DIP-2.12/demo-seam-ab
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each API-changing fixture has a Demo.tsx caller; behavior tests assert only Demo's rendered output and pass pre-refactor; Demo is listed expected-clean in expected.json and stays within all caps
- [x] #2 Apply prompt/graders treat Demo.tsx as editable product code while behavior.test.tsx remains pristine-restored; runner unit tests updated where logic changes
- [x] #3 Fresh full apply run on the user's command; previously-contradictory fixtures can now pass; new apply baseline approved by the user and committed via --update-baseline; known-limitation note in tests/eval/README.md updated
- [x] #4 Full --mode ab run (both arms, K=5, claude-sonnet-5) on the user's command; report JSON committed under tests/eval/ab/ and a per-category summary added to tests/eval/README.md; epic final summary quotes the headline answer
- [x] #5 Repo bun run lint/typecheck/test untouched and green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Demo.tsx per API-changing fixture (concrete rendered strings, within caps) + retarget behavior tests to Demo output only. 2. expected.json gains Demo entries (expected-clean). 3. Runner: Demo editable in sandbox, pristine-restore stays test-only; README + rubric-facing docs updated. 4. Island suite green pre-refactor. 5. User-run apply --update-baseline, approve, commit. 6. User-run --mode ab; archive JSON to tests/eval/ab/, summary to README. 7. Last story: close epic DIP-2 on this branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Billed runs happen only on the user command (deliver constraint 5): apply refresh ~115 agentic runs; ab ~4-5h, ~2x a baseline day. state.derived-effect verdict flakiness is explicitly OUT of scope (documented known limitation). Demo.tsx must itself satisfy every rule — a sloppy Demo counts against the run via expected.json. Delivering this story closes epic DIP-2.

Demo seams landed: analytics/CTA/collapse evidence renders as Demo output (no spies cross the seam); god-component Demo needed useCallback — an inline analytics callback re-triggered the dashboard's effect every render and hung the suite (the old test's stable vi.fn had masked this). Island suite 24 files/45 tests green; sandbox pristine-restore already test-only, so AC2 needed only the apply-prompt Demo instruction. Review-baseline caveat: Demo files now appear in review prompts, so review rates could shift slightly — if the next full review run shows regressions, refresh the review baseline deliberately.

Apply baseline refreshed and approved as-is (user chose not to rerun the timeout-hit fixtures): Demo seam vindicated — previously-contradictory fixtures now pass. Remaining sub-bar causes split three ways in the README known-limitations: 240s-timeout noise (6 runs), genuine model gaps (effects-cap, server-fetch), judge strictness beyond skill text (variant-compound shared-shell criterion, 0/5) + 9x 2-1 judge instability in one run. Also shipped en route at user request: --concurrency promise pool (default 1), typescript externalized from the vitest transform (sourcemap warning). Follow-up chores noted, out of scope: split tests/unit into hooks/ and eval-runner/ subdirs + tests/README.md layer table.

Closed as-is per user decision (2026-07-31): the 2026-07-25 A/B run is archived under tests/eval/ab/ with an honest contamination note in the README — 24/25 skill-arm composition apply runs died on the 480s timeout, so the headline is not trustworthy. The clean re-answer moved to epic DIP-3 (DIP-3.9, control-arm-only rerun against the DIP-3.8 baseline). Pending review-baseline diff (dashboard-panel 5/5 to 4/5, derived-effect 3/5 to 5/5) committed with this closure.
<!-- SECTION:NOTES:END -->
