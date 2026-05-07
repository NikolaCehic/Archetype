---
tags:
  - enforcement
  - fallacies
status: active
---

# Current Lifecycle Fallacies

## Central Fallacy

```txt
Archetype treats lifecycle guidance as descriptive metadata instead of an execution gate.
```

## Contradiction

Current system can output:

```txt
lifecycle.status = needs_clarification
readyForFrontendAgent = true
```

## Specific Fallacies

1. Lifecycle runs too late.
2. Readiness ignores lifecycle status.
3. Inference becomes accepted decision.
4. Spec generation has no context gate.
5. Tests are generated before approval.
6. Generated tests can be tautological.
7. CLI generates full packages for sparse context.

## Related

- [[Phase 1 - Non-Negotiable Enforcement]]
- [[Compiler Reorder]]
- [[Regression Fixtures]]

