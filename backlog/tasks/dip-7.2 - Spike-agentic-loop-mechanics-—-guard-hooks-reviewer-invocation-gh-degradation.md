---
id: DIP-7.2
title: >-
  Spike: agentic loop mechanics — guard hooks, reviewer invocation, gh
  degradation
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 12:39'
labels:
  - story
dependencies: []
references:
  - skills/flow-deliver/reference/review-and-pr.md
parent_task_id: DIP-7
priority: high
type: spike
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Prove the three mechanisms the agentic close-out depends on, and freeze their contracts so DIP-7.6, DIP-7.9 and DIP-7.10 can be built in parallel without agreeing on anything at the last minute: a plugin PreToolUse hook that blocks the wrong git commands without blocking the delivery skill's own, a deterministic way for a skill to invoke a plugin-shipped reviewer agent, and gh detection that degrades instead of failing.

The risk being retired here is a guard hook that blocks legitimate delivery commits — which would break every story in the epic, including the ones fixing it.

Type: spike
Branch: DIP-7.2/agentic-loop-mechanics
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Evidence that a plugin-shipped PreToolUse hook can block a Bash git command, and that it exits 0 blocking nothing in a repo with no .claude/backlog-workflow.json
- [x] #2 Confirmed that the guards do not block the delivery skill's own legitimate commit and push commands; the discriminating condition is written down precisely enough to implement
- [x] #3 The mechanism a skill uses to invoke a plugin-shipped agent is verified and recorded, including how the agent is addressed and what context it does and does not receive
- [x] #4 Review loop policy frozen: what counts as a blocking finding, the maximum number of review rounds, and what happens at the cap
- [x] #5 The reviewer's verdict format is specified concretely enough that DIP-7.9 can emit it and DIP-7.6 can consume it without further negotiation
- [x] #6 gh availability and auth detection decided, with the exact degradation-to-link behaviour recorded
- [x] #7 Decision and rationale recorded in skills/flow-deliver/reference/review-and-pr.md, and explicitly approved by the user before the story closes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Prototype a throwaway PreToolUse guard and probe which git invocations it sees; find the discriminating condition between a story-branch commit and a base-branch commit.
2. Verify the no-config no-op path.
3. Invoke a throwaway plugin agent from a skill context and record exactly how it is addressed and what it receives.
4. Decide the verdict schema and loop cap.
5. Probe gh present/absent/unauthenticated.
6. Write the reference doc, present, get approval, close.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Type: spike. Prototype hooks must not be left wired into hooks/hooks.json — DIP-7.10 owns that file.

The review cap matters: an uncapped reviewer loop is how an autonomous run burns a session without converging. Pick a small number and an explicit escalation, not "until it passes".

Verify: the reference doc answers every acceptance criterion with the command output or transcript that proves it.

Findings (mechanics proven via a throwaway PreToolUse guard + payload driver in a scratch repo; design contracts decided with the user):
- AC#1: plugin PreToolUse/Bash hook blocks git (DENY via hookSpecificOutput.permissionDecision or exit 2) and no-ops (exit 0) when <cwd>/.claude/backlog-workflow.json is absent — that absence check is the guard's first line.
- AC#2: discriminator = branch identity. Delivery always runs on <id>/<slug>; guard denies commit/push only when current branch == base (or push names base). Story-branch commit/add-scoped/push all ALLOW (proven). Five rules: no-commit-on-base, no-push-base, scoped-staging (blocks add -A/./--all), never-no-verify, no-host-cli-in-link-mode. Guard is crash-safe (try/catch -> exit 0) and fail-open.
- AC#3: plugin agents live in agents/<name>.md and are addressable as <plugin>:<name> (verified: caveman:cavecrew-reviewer is a live selectable type). Reviewer ships as agents/story-reviewer.md, invoked as dipsaus-ai:story-reviewer, read-only (tools: Read/Grep/Bash), fed only diff + story outcome/ACs/References, never the implementer's reasoning.
- AC#4: blocking = unmet AC OR scope violation only; advisory = everything else (recorded, never blocks). Cap = 3 rounds then escalate to user (push withheld). review.enabled:false skips the gate.
- AC#5: JSON verdict object {verdict, criteria[], scopeViolations[], findings[]}; verdict=block iff any criterion met:false or scopeViolations non-empty. No prose parsing (avoids the DIP-4.2 last-line fragility).
- AC#6: create mode probes command -v gh then gh auth status; either fails -> degrade to link with a reason, never fail the story.
Full record with raw output: skills/flow-deliver/reference/review-and-pr.md
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Spike resolved: guard mechanics proven by a throwaway PreToolUse guard driven with crafted payloads in a scratch repo (denies commit-on-base / push-base / add -A / --no-verify / gh-in-link-mode; allows story-branch commits; no-ops without a config file; crash-safe and fail-open). Discriminator for AC#2 is branch identity: block commit/push only when on/pushing the base branch. Plugin agents are addressable as <plugin>:<name> (verified live), so the reviewer ships as agents/story-reviewer.md invoked as dipsaus-ai:story-reviewer, read-only, fed only the diff + story contract. Frozen contracts: blocking = unmet-AC-or-scope-violation only; 3-round cap then escalate; JSON verdict object {verdict, criteria, scopeViolations, findings} with verdict=block iff any criterion unmet or any scope violation; pr.mode create probes gh + gh auth status and degrades to link, never failing the story. Full record: skills/flow-deliver/reference/review-and-pr.md. Feeds DIP-7.6, DIP-7.9, DIP-7.10.
<!-- SECTION:FINAL_SUMMARY:END -->
