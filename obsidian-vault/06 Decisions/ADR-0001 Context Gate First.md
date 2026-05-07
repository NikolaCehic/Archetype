---
tags:
  - adr
  - context
status: accepted
---

# ADR-0001 Context Gate First

## Decision

Run context sufficiency before canonical product, experience, design, spec, test, or implementation artifacts.

## Reason

The current compiler can detect `needs_clarification` after it has already generated product architecture and tests. That creates false readiness.

## Consequence

The compiler must support clarification-only output packages.

## Related

- [[Context Sufficiency Gate]]
- [[Compiler Reorder]]

