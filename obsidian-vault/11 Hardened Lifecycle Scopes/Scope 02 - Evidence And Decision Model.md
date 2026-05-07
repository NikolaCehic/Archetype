---
tags:
  - hardened-lifecycle
  - scope
  - leaf
  - evidence
status: active
scope_id: HL-02
---

# Scope 02 - Evidence And Decision Model

Parent: [[00 Maps/HARDENED_ARCHETYPE_LIFECYCLE Node]]

## Scope

Define which claims may become canonical.

## Evidence Levels

| Level | Meaning | Can become canonical? |
| --- | --- | --- |
| `unknown` | No evidence exists. | No |
| `archetype_inference` | Archetype inferred it from category, keywords, or patterns. | No |
| `weak_user_hint` | The user hinted, but did not define enough for implementation. | Draft only |
| `explicit_user_answer` | The user directly answered the decision. | Yes |
| `imported_material_fact` | Present in imported spec, PRD, screenshot, wireframe, design file, or notes. | Yes |
| `repo_fact` | Proven by the target repository. | Yes |
| `user_confirmed_assumption` | Proposed by Archetype and approved by user. | Yes |

## Canonical Evidence

Only these can enter canonical implementation artifacts:

```txt
explicit_user_answer
imported_material_fact
repo_fact
user_confirmed_assumption
```

## Decision Statuses

```txt
confirmed
candidate
missing
conflicted
blocked
```

## Exit Condition

Inference is treated as candidate evidence only.

