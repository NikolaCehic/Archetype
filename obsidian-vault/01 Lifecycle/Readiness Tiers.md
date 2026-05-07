---
tags:
  - lifecycle
  - readiness
  - gates
status: active
---

# Readiness Tiers

Readiness is not one boolean.

| Tier | Meaning |
| --- | --- |
| `ready_for_clarification` | Archetype has an idea and can ask the next question. |
| `ready_for_contract_draft` | Enough context exists to propose a draft with candidates marked. |
| `ready_for_contract_approval` | Draft is reviewed and blockers are resolved or exposed. |
| `ready_for_test_authoring` | User approved the contract or assumption set. |
| `ready_for_implementation` | Tests exist, red evidence is captured, implementation rules are canonical. |
| `ready_for_qa` | Implementation claims to satisfy contract and tests can run. |
| `ready_for_completion` | QA, Playwright evidence, contract drift, and repair queue are clean. |

## Enforcement Rule

```txt
readyForFrontendAgent = ready_for_implementation
```

It must never be true during [[Clarification UX]].

## Related

- [[Phase 1 - Non-Negotiable Enforcement]]
- [[Gate Report]]

