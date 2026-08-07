---
id: DIP-7.9
title: Reviewer subagent (agents/story-reviewer.md) with a structured verdict
status: To Do
assignee: []
created_date: '2026-08-07 10:49'
updated_date: '2026-08-07 10:49'
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
- [ ] #1 agents/story-reviewer.md exists with frontmatter restricting it to read-only tools
- [ ] #2 Its prompt takes the story outcome, acceptance criteria and References plus a diff, and returns a per-criterion met/not-met judgement, any scope violations against the declared References, and findings split into blocking and advisory
- [ ] #3 It receives no part of the implementing agent's conversation or reasoning
- [ ] #4 The verdict format matches exactly what DIP-7.6 consumes, as frozen in DIP-7.2
- [ ] #5 The agent is discovered when the plugin is installed, verified by listing available agent types
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
<!-- SECTION:NOTES:END -->
