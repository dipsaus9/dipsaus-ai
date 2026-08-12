---
id: DIP-10.5
title: 'Deliver eval runner mode, baseline and regression diff'
status: Done
assignee: []
created_date: '2026-08-12 06:52'
updated_date: '2026-08-12 08:15'
labels:
  - story
dependencies:
  - DIP-10.2
  - DIP-10.3
  - DIP-10.4
references:
  - tests/eval/runner/run.ts
  - tests/eval/runner/deliver.ts
  - tests/eval/runner/config.ts
  - tests/eval/baseline/
  - tests/eval/README.md
  - tests/unit/
parent_task_id: DIP-10
priority: medium
type: feature
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Wire the fixtures, grader and judge into the runner as test:eval --mode deliver: run the corpus, produce a scorecard + judge report, diff against a committed baseline, and document it in the eval README. --update-baseline rewrites the committed baseline.

Type: deliverable
Branch: DIP-10.5/deliver-eval-runner
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 test:eval --mode deliver runs the deliver corpus end to end and prints a per-case scorecard + judge summary
- [x] #2 Results diff against a committed baseline; --update-baseline rewrites it; the flow is documented in tests/eval/README.md
- [x] #3 The mode reuses the existing retry/pool/report machinery and stays out of the CI unit run
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add the deliver mode to run.ts dispatch. 2. Wire fixtures->deliver->grade->judge->report. 3. Baseline read/write + diff. 4. README section.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on 10.2/10.3/10.4. Edits shared run.ts/config.ts so it serializes after them. Baseline is committed (deterministic parts); billed measurement is DIP-10.6.

Delivered the deliver eval mode. tests/eval/runner/deliver.ts: loadDeliverFixtures, setupCase (throwaway repo + local bare remote + backlog init + task from story.json + config — all real, deterministic), deliverHeadless (the ONE billed seam: invokeClaude runs backlog-deliver; needs the plugin installed per DIP-10.1), captureRun (reads branch/verify/checkedAcs/modifiedFiles/reviewerVerdict from git+backlog), runDeliverCase (setup->deliver->capture->grade->judge-gated->teardown), runDeliver (mapPool at config.concurrency — AC#3 pool reuse; cases isolated). Pure baseline helpers toDeliverBaseline/diffDeliverBaseline/deliverDiffPasses (regression = deterministic pass->fail) + 6 unit tests. run.ts: --mode deliver branch prints per-fixture scorecards + quality, diffs vs baseline/deliver.json, --update-baseline rewrites. README documents the mode + the plugin-install requirement + the DIP-10.6 deferral. HONEST LIMIT (AC#1): the DETERMINISTIC pipeline (setup->capture->grade->teardown) was proven end-to-end via a simulated-delivery smoke (node-add-sum: EVAL-1/add-sum, all 5 dims PASS, clean teardown); the BILLED headless corpus run was not executed here (needs plugin install + billing) — that is DIP-10.6, with review.enabled:false fallback. Retry (AC#3) is a filtered re-run per error record, matching apply-mode. 226 tests green; lint+typecheck clean. Refs amended to add deliver.ts + tests/unit/ (edit --ref replaces — re-passed all, see DIP-8.4).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Wired the deliver eval into a runnable test:eval --mode deliver. tests/eval/runner/deliver.ts materializes each fixture into a throwaway repo with a local bare remote, initialises a backlog and the ready task, runs backlog-deliver headless (the single billed seam), captures the outcome from git+backlog, grades it deterministically (DIP-10.3) and judges quality (DIP-10.4, gated), and tears the sandbox down — cases run concurrently through the shared pool. run.ts gains the deliver branch: per-fixture scorecards + quality, a diff against baseline/deliver.json (regression = deterministic pass->fail), and --update-baseline. The whole deterministic path (setup->capture->grade->teardown) was proven end-to-end with a simulated delivery; the billed headless corpus run over real deliveries is DIP-10.6 (needs the plugin installed, review.enabled:false fallback). 6 new unit tests; README documents it. 226 tests green.
<!-- SECTION:FINAL_SUMMARY:END -->
