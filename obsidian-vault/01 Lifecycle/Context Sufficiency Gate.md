---
tags:
  - lifecycle
  - context
  - gate
status: active
---

# Context Sufficiency Gate

The context gate decides whether Archetype may proceed to the next artifact.

## Required Dimensions

- Product outcome.
- Primary users and roles.
- Must-have workflows or screens.
- Target repo or frontend stack.
- Mock, API, data, auth, and permission boundary.
- Design direction or permission to create one.
- Test and Playwright execution permission.
- Assumption approval.
- Safety or regulated constraints when detected.

## Rule

If any implementation-critical dimension is `unknown`, `archetype_inference`, or unapproved `weak_user_hint`, Archetype must stop and ask a question.

## Outputs

- [[Context Matrix]]
- [[Gate Report]]
- [[Clarification Package]]

## Related

- [[Evidence Levels]]
- [[Decision Statuses]]
- [[Readiness Tiers]]

