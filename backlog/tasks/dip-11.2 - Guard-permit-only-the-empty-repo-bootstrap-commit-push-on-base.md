---
id: DIP-11.2
title: 'Guard: permit only the empty-repo bootstrap commit/push on base'
status: Done
assignee: []
created_date: '2026-08-14 11:07'
updated_date: '2026-08-14 12:57'
labels:
  - story
dependencies: []
references:
  - hooks/backlog-guard/decision.ts
  - hooks/backlog-guard/on-pre-tool-use.ts
  - tests/unit/backlog-guard-decision.test.ts
parent_task_id: DIP-11
type: feature
ordinal: 69000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Teach backlog-guard to permit only the empty-repo bootstrap on the base branch: allow a base commit when HEAD is unborn, and a base push when the remote branch does not yet exist. All other base protection stays.

Type: deliverable
Branch: DIP-11.2/guard-bootstrap-exceptions
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 decide() accepts headUnborn and remoteBranchExists inputs and allows a git commit on base only when headUnborn is true
- [x] #2 decide() allows a git push targeting base only when remoteBranchExists is false; otherwise no-push-base still fires
- [x] #3 The entrypoint computes headUnborn (no commits) and remoteBranchExists (git ls-remote --heads) and passes them to decide; fail-open is preserved
- [x] #4 tests/unit/backlog-guard-decision.test.ts covers unborn+base commit allowed, born+base commit blocked, first push allowed, and subsequent push blocked
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Extend GuardInput with headUnborn and remoteBranchExists. Gate no-commit-on-base and no-push-base on them. Compute in the entrypoint via git rev-list --count HEAD (or an unborn-HEAD check) and git ls-remote --heads origin. Keep the try/catch fail-open posture.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Only these two exceptions; scoped-staging and never-no-verify stay unconditional. Verify: bun run test, bun run typecheck, bun run lint.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
backlog-guard now permits only the empty-repo bootstrap on the base branch. decide() takes two new inputs: headUnborn gates no-commit-on-base (a base commit is allowed only with an unborn HEAD), and remoteBranchExists gates no-push-base (a base push is allowed only when the remote branch does not yet exist). The entrypoint computes both via git rev-parse --verify HEAD and git ls-remote --heads origin <base>, both failing toward the allow side to preserve the hook's fail-open posture. Scoped-staging, never-no-verify and no-host-cli rules stay unconditional. Four new unit tests cover unborn+base commit allowed, born+base commit blocked, first base push allowed, subsequent base push blocked (16 guard tests total).
<!-- SECTION:FINAL_SUMMARY:END -->
