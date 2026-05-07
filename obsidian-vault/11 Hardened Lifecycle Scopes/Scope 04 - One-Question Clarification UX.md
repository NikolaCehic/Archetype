---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - clarification
status: active
scope_id: HL-04
---

# Scope 04 - One-Question Clarification UX

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define how Archetype asks for missing context.

## Rule

Clarification is not a bulk form.

Archetype asks exactly one question at a time, chosen by highest implementation impact.

## Algorithm

1. Read idea, imported files, screenshots, and repo context.
2. Build context matrix.
3. Mark every required decision as confirmed, candidate, missing, conflicted, or blocked.
4. Select the highest-impact missing or conflicted blocker.
5. Ask exactly one question.
6. Update the context matrix from the answer.
7. Repeat until the next lifecycle gate is safe.
8. Present assumptions and candidate decisions for approval.
9. Generate the canonical contract only after approval.

## Default First Question For Vague Marketing Dashboard

```txt
Who is the primary user of this marketing admin dashboard?
```

## Exit Condition

The user-facing flow asks one question and updates context after each answer.

