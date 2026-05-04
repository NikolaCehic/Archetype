# Agent Lifecycle

Archetype is a self-contained agent harness. The user should only need a natural-language idea and optional `@` file imports.

## Flow

```txt
idea
  -> clarify missing context
  -> ask for optional materials
  -> intake source evidence
  -> generate canonical spec
  -> generate test-first contracts
  -> implement tests first
  -> implement frontend from the contract
  -> verify with Playwright evidence
  -> repair implementation drift or revise the contract with approved evidence
```

## Clarify

Clarify means context completion. The agent reads the idea, screenshots, briefs, repo files, `SPEC.md`, `PRD.md`, wireframes, and other optional materials, then asks only for missing decisions that block a deterministic contract.

The user should not need to say:

```txt
Build this frontend. Ask me what is missing, then implement and verify.
```

That is the default lifecycle.

## Context Artifacts

Every generated package includes:

```txt
lifecycle/context-completion.json
lifecycle/lifecycle-report.md
spec/archetype-spec.json
spec/archetype-spec.md
test-first/test-first-contract.json
verification/playwright-verification-contract.json
10-revision/repair-task-queue.json
```

## Agent Rule

Spec-driven development starts from `spec/archetype-spec.json`.

Test-driven implementation starts from `test-first/test-first-contract.json` before product UI code.

Verification is complete only after `verify-target` writes Playwright evidence and the repair queue is empty or every repair task is named and actively being patched.
