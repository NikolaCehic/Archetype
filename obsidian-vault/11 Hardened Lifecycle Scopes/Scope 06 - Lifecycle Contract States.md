---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - state-machine
status: active
scope_id: HL-06
---

# Scope 06 - Lifecycle Contract States

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Modularize lifecycle states 5 through 8.

## 5. Contract Draft

Allowed:

- Propose product model, IA, routes, screens, flows, tokens, components, data contracts, action contracts, form contracts, and verification strategy.
- Mark every unconfirmed item as candidate.

Forbidden:

- Mark inferred items as accepted.
- Produce implementation-ready instructions.
- Tell the agent to write code.

Output:

- `draft/product-model.draft.json`
- `draft/experience-architecture.draft.json`
- `draft/design-system.draft.json`
- `draft/frontend-contract.draft.json`
- `draft/assumption-ledger.md`

## 6. Specialist Review

Allowed:

- Review with specialist agents and frontend best-practice skills.
- Produce blockers, warnings, and recommendations.

Forbidden:

- Let the same role approve the draft it created.
- Convert warning into acceptance without evidence.

## 7. Contract Approval

Allowed:

- Present confirmed facts, candidate assumptions, unresolved unknowns, and risks.
- Ask for approval or edits.

Forbidden:

- Generate canonical spec without approval.
- Hide assumptions in generated artifacts.

## 8. Canonical Spec Generation

Allowed:

- Generate canonical spec and agent contract.
- Freeze route, screen, state, token, component, data, action, form, and verification contracts.

Forbidden:

- Add new product scope not present in approved contract.

Output:

- `spec/archetype-spec.json`
- `spec/archetype-spec.md`
- `frontend-agent-contract/implementation-rules.json`
- `frontend-agent-contract/frontend-agent-instructions.md`
- `frontend-agent-contract/acceptance-criteria.json`

## Exit Condition

Canonical spec is valid, approved, and traceable.

