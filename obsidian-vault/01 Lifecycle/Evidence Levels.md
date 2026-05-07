---
tags:
  - lifecycle
  - evidence
  - traceability
status: active
---

# Evidence Levels

Every lifecycle decision must have an evidence level.

| Level | Meaning | Canonical allowed |
| --- | --- | --- |
| `unknown` | No evidence exists. | No |
| `archetype_inference` | Inferred from category, keywords, or patterns. | No |
| `weak_user_hint` | User hinted, but did not define enough for implementation. | Draft only |
| `explicit_user_answer` | User directly answered. | Yes |
| `imported_material_fact` | Found in imported spec, PRD, screenshot, wireframe, design file, or notes. | Yes |
| `repo_fact` | Proven by the target repository. | Yes |
| `user_confirmed_assumption` | Proposed by Archetype and approved by user. | Yes |

## Canonical Evidence

Only these levels can enter canonical implementation artifacts:

- `explicit_user_answer`
- `imported_material_fact`
- `repo_fact`
- `user_confirmed_assumption`

## Related

- [[No Canonical Contract From Inference]]
- [[Decision Statuses]]
- [[Context Matrix]]

