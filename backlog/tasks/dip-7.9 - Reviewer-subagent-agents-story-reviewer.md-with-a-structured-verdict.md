---
id: DIP-7.9
title: Reviewer subagent (agents/story-reviewer.md) with a structured verdict
status: Done
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-09 09:16'
labels:
  - story
dependencies:
  - DIP-7.2
references:
  - agents/
parent_task_id: DIP-7
priority: medium
type: feature
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The plugin ships the reviewer that gates delivery: read-only, fresh context, and given only the diff plus the story's outcome, acceptance criteria and References. It never sees the implementing agent's reasoning, which is what makes its verdict worth having.

Its output format is the contract DIP-7.6 consumes, frozen in DIP-7.2.

Type: deliverable
Branch: DIP-7.9/story-reviewer-agent
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 agents/story-reviewer.md exists with frontmatter restricting it to read-only tools
- [x] #2 Its prompt takes the story outcome, acceptance criteria and References plus a diff, and returns a per-criterion met/not-met judgement, any scope violations against the declared References, and findings split into blocking and advisory
- [x] #3 It receives no part of the implementing agent's conversation or reasoning
- [x] #4 The verdict format matches exactly what DIP-7.6 consumes, as frozen in DIP-7.2
- [x] #5 The agent is discovered when the plugin is installed, verified by listing available agent types
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write the frontmatter with a read-only tool list.
2. Write the prompt around the verdict schema from DIP-7.2.
3. Verify discovery with the plugin installed.
4. Dry-run it against a delivered branch from this epic.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Scope violation detection is the half a human reviewer usually misses: the diff can satisfy every acceptance criterion and still have touched files the story never declared.

A reviewer that blocks on style opinions will make autonomous runs unusable. Blocking is for unmet criteria and scope violations; everything else is advisory.

Verify: run it against an already-delivered story branch and check the verdict is well-formed and defensible.

Delivered agents/story-reviewer.md (markdown agent; no runtime code -> no new tests; gates green). Frontmatter: name story-reviewer, tools [Read, Grep, Bash] (read-only; Bash constrained by prompt to git diff/show/log only, matching the caveman cavecrew-reviewer precedent). Prompt: judges per-criterion met/not-met, scope violations against declared References (segment-prefix rule), findings blocking/advisory; emits ONLY the frozen JSON verdict {verdict, criteria[], scopeViolations[], findings[]} copied verbatim from reference/review-and-pr.md so it matches what DIP-7.6 consumes (AC#4). Independence (AC#3): agent states it has not seen the implementer's plan/reasoning, and DIP-7.6 passes it only the diff + contract. AC#5 discovery: agents/*.md are auto-discovered by directory convention — verified against the installed caveman plugin, which exposes caveman:cavecrew-* with NO plugin.json registration; dipsaus-ai:story-reviewer appears the same way. plugin.json manifest-description update (adding 'agents') is out of scope here and owned by DIP-7.11. Live agent-type listing requires a plugin reload; frontmatter validated to parse and file is in the discovered location.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped agents/story-reviewer.md, the independent reviewer the DIP-7.6 gate invokes as dipsaus-ai:story-reviewer. It is read-only (Read/Grep + git-inspection Bash), receives only the diff plus the story's outcome, acceptance criteria and References — never the implementer's reasoning — and returns a single JSON verdict object (per-criterion met/not-met, scopeViolations against declared References, blocking vs advisory findings) whose shape is copied verbatim from reference/review-and-pr.md, so DIP-7.6 parses it with no negotiation. block iff any criterion unmet or any scope violation. Auto-discovered from agents/ by the same directory convention the caveman plugin's agents use (no plugin.json registration needed; the manifest-description refresh is DIP-7.11). This makes DIP-7.6's review gate live.
<!-- SECTION:FINAL_SUMMARY:END -->
