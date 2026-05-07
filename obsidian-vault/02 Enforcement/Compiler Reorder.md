---
tags:
  - enforcement
  - compiler
status: active
---

# Compiler Reorder

The current compiler builds product and contract artifacts before lifecycle gating.

## Current Order

```txt
infer domain
build evidence
build product
build experience
build design system
build frontend contract
build quality
build lifecycle
build spec
build tests
build playwright contract
```

## Required Order

```txt
normalize sources
build initial evidence
build context matrix
build lifecycle gate report
if needs_clarification: return clarification package
build draft product/experience/design/contract
run specialist review gate
if not approved: return draft package
build canonical spec
build test-first contracts
build implementation artifacts
build verification artifacts
```

## Related

- [[Context Matrix]]
- [[Clarification Package]]
- [[Draft Package]]
- [[Canonical Package]]

