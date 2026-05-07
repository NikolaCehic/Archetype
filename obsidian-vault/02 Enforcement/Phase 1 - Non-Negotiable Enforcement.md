---
tags:
  - enforcement
  - phase-1
status: active
---

# Phase 1 - Non-Negotiable Enforcement

Goal:

```txt
Weak context cannot produce canonical spec, tests, or implementation instructions.
```

## Work Items

1. Add evidence level and decision status types.
2. Add [[Context Matrix]] builder.
3. Add [[Gate Report]].
4. Reorder compiler so lifecycle gates run before product, experience, design, spec, and test generation.
5. Make `needs_clarification` a hard blocker.
6. Export weak context as [[Clarification Package]] only.
7. Change domain profile decisions from accepted to candidate unless approved.
8. Add `next_question`.
9. Add [[Regression Fixtures]] for the marketing-dashboard failure.
10. Update CLI, MCP, and skills to report lifecycle gate status.

## Acceptance Criteria

- Vague marketing dashboard prompt stops at clarification.
- `readyForFrontendAgent` is false for weak context.
- No canonical spec exists for weak context.
- No test-first contract exists for weak context.
- No implementation instructions exist for weak context.
- User-facing output contains one next question.
- Inferred routes are candidate decisions only.
- The old contradiction cannot occur.

## Related

- [[Current Lifecycle Fallacies]]
- [[Compiler Reorder]]
- [[Non-Negotiable Principles]]

