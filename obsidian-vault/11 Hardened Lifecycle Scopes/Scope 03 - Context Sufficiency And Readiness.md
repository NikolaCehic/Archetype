---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - context
  - readiness
status: active
scope_id: HL-03
---

# Scope 03 - Context Sufficiency And Readiness

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define how Archetype knows whether it may proceed.

## Weak Context

Weak context means:

```txt
The next artifact would depend on unapproved invention.
```

## Required Dimensions

- Product outcome.
- Primary users and roles.
- Must-have workflows or screens.
- Target repo or frontend stack.
- Mock, API, data, auth, and permission boundary.
- Design direction or permission to create one.
- Test and Playwright execution permission.
- Assumption approval.
- Safety, regulated, compliance, or sensitive-data constraints when detected.

## Readiness Tiers

```txt
ready_for_clarification
ready_for_contract_draft
ready_for_contract_approval
ready_for_test_authoring
ready_for_implementation
ready_for_qa
ready_for_completion
```

## Exit Condition

Readiness is tiered and artifact-backed, not a single permissive boolean.

