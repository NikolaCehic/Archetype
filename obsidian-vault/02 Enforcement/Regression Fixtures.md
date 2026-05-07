---
tags:
  - enforcement
  - tests
  - regression
status: active
---

# Regression Fixtures

Regression fixtures prove the lifecycle cannot backslide.

## Required Fixtures

- `vague-marketing-dashboard-intake.json`
- `rich-approved-dashboard-intake.json`
- `unapproved-assumption-intake.json`
- `existing-repo-context-intake.json`

## Required Assertions

- Vague prompt produces clarification package only.
- Vague prompt has `readyForFrontendAgent: false`.
- Vague prompt has no canonical spec.
- Vague prompt has no test-first contract.
- Vague prompt has one `next_question`.
- Inferred routes are candidate only.
- Approved assumptions can become canonical.
- Rich approved context can reach `ready_for_test_authoring`.

## Related

- [[Weak Context]]
- [[Phase 1 - Non-Negotiable Enforcement]]

