---
tags:
  - lifecycle
  - decisions
status: active
---

# Decision Statuses

Every decision in the context matrix must have a status.

| Status | Meaning |
| --- | --- |
| `confirmed` | Can enter canonical contract. |
| `candidate` | Can appear in a draft only. |
| `missing` | Must feed clarification. |
| `conflicted` | Must be resolved before approval. |
| `blocked` | Stops lifecycle until removed. |

## Core Rule

Inference produces `candidate`, not `confirmed`.

## Related

- [[Evidence Levels]]
- [[Context Matrix]]
- [[No Canonical Contract From Inference]]

