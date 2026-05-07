---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - regression
status: active
scope_id: HL-14
---

# Scope 14 - Marketing Dashboard Replay

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define the regression case that exposed the lifecycle failure.

## Input

```txt
/archetype "I want to build an admin dashboard for a marketing team"
```

## Expected State

```txt
ready_for_clarification
```

## Confirmed Facts

- Product surface: admin dashboard.
- Domain hint: marketing.

## Candidate Assumptions

- Possible users: campaign operator, marketing executive, growth analyst, agency admin.
- Possible routes: campaigns, reports, budget, settings.
- Possible data: campaigns, spend, ROAS, CAC, channel performance.
- Possible visual direction: dense operational dashboard.

## Missing Blockers

- Primary user.
- Must-have workflows.
- Target repo or stack.
- Mock/API/backend boundary.
- Design direction or permission to create one.
- Test and Playwright permission.
- Assumption approval.

## Correct Next Question

```txt
Who is the primary user of this marketing admin dashboard?
```

## Exit Condition

The regression cannot produce a canonical spec, tests, or implementation instructions.

