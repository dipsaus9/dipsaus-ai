---
id: DIP-3.8
title: Baseline refresh on the fixed harness (billed)
status: Done
assignee: []
created_date: '2026-07-31 08:20'
updated_date: '2026-08-01 07:15'
labels:
  - story
dependencies:
  - DIP-3.1
  - DIP-3.2
  - DIP-3.3
  - DIP-3.4
  - DIP-3.5
  - DIP-3.6
  - DIP-3.7
  - DIP-3.10
references:
  - tests/eval/baseline/
  - tests/eval/README.md
parent_task_id: DIP-3
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fresh review and apply baselines on the leak-free harness, fixed skill, and enriched corpus — the first trustworthy regression floor. README known-limitations rewritten from the new data (timeout section expected to shrink or vanish; durationMs distribution reported to validate the 900s choice).

Type: deliverable
Branch: DIP-3.8/baseline-refresh
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Full review run and full apply run executed on the user explicit command; both baselines written via --update-baseline, approved by the user, committed
- [x] #2 README known-limitations section rewritten from actual results; durationMs distribution summarized with a verdict on the 900s timeout
- [x] #3 Judge 2-1 instability count reported in the story implementation notes
- [x] #4 Repo gates green
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Full review run with --update-baseline (billed, background). 2. Full apply run --mode apply --update-baseline (billed, background). 3. Summarize durationMs distribution + 900s verdict, count judge 2-1 votes. 4. Rewrite README known-limitations from fresh data. 5. Present baseline diffs for user approval, then commit. 6. Close out, push, compare link.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Cost approx one full review matrix plus ~130 agentic apply runs on the grown corpus. Baseline diff policy (named regressions) applies from the new baseline forward; old baselines superseded, kept in git history.

Judge instability (AC3): 8 of the judged apply verdicts decided 2-1 in the full run — 5x comp.config-soup (3 on hard/support-inbox, 2 small-tier), 2x comp.regions-as-slots, 1x comp.variant-compound. Zero 2-1 votes in the filtered re-runs. Two follow-up candidates found: (1) judge votes where the structured verdict field contradicts the vote's own reasoning text (cost variant-compound run 2 its pass); (2) rubric ambiguity on style-only boolean className toggles (sole cause of support-inbox 1/5). durationMs: completed runs min 28s / median 74s / p90 126s / max 325s — nothing between 325s and the 900s cap; all 9 timeouts were one consecutive API-outage window, re-runs clean. Verdict: keep 900s.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Refreshed both baselines on the leak-free harness (K=5, claude-sonnet-5): full review (~250 calls) + full apply (125 agentic runs) with --update-baseline, plus filtered re-runs merging over two API-outage windows (16 review + 9 apply failures, all clean on retry). Review baseline now shows real detection gaps (colocate 2/5, presentational 3/5 mislabeled as mixed-concerns, slots-over-config 3/5); apply baseline strong (23/25 fixtures >=4/5) with composition judging as the remaining weak spot (variant-prop survival, judge verdict-field mismatch, style-boolean rubric ambiguity on support-inbox). durationMs: median 74s / max 325s, nothing between 325s and the 900s cap — 900s confirmed ample. Judge 2-1 count: 8. README known-limitations rewritten from this data. Baselines approved by the user and committed.
<!-- SECTION:FINAL_SUMMARY:END -->
