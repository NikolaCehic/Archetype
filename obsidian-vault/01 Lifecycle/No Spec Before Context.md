---
tags:
  - lifecycle
  - principle
status: active
---

# No Spec Before Context

The canonical spec is implementation authority.

Therefore it cannot exist while required implementation context is missing.

## Enforcement

If readiness tier is earlier than `ready_for_test_authoring`, do not generate:

- `spec/archetype-spec.json`
- `spec/archetype-spec.md`

## Related

- [[Context Sufficiency Gate]]
- [[Canonical Package]]

