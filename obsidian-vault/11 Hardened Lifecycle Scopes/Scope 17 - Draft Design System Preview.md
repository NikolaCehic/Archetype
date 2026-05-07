---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - design-system
  - review
status: active
scope_id: HL-17
---

# Scope 17 - Draft Design System Preview

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Make draft design systems reviewable in a browser before they can become canonical.

## Required Artifacts

```txt
draft/design-system.draft.json
draft/design-system-preview.html
draft/design-system-review.md
```

## Rules

- The preview HTML is a static human review projection of `draft/design-system.draft.json`.
- The preview HTML is not app implementation.
- The preview HTML is not the source of truth.
- Every visible preview section must trace back to `draft/design-system.draft.json`.
- The preview must include colors, typography, component examples, component states, token tables, patterns, and accessibility review data.
- The user can ask questions or request changes before approval.
- Ambiguous design feedback returns to one clarification question.
- Archetype revises the draft JSON first, then regenerates the preview.
- Canonical design-system generation is blocked until human approval.

## Exit Condition

Draft packages and complete packages expose a browser-viewable design-system preview, validation fails if the preview is missing or untraceable, and the lifecycle still forbids implementation from preview HTML alone.
