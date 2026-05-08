---
description: Run the full Archetype frontend contract and implementation lifecycle
argument-hint: <product idea, brief, or direction>
---

# Archetype

Run Archetype as one self-contained workflow for:

```txt
$ARGUMENTS
```

Use the `archetype` skill instructions as the operating contract. The user should only need a product idea plus optional materials such as `@SPEC.md`, screenshots, wireframes, PRDs, brand notes, API docs, or repo files.

## Required Behavior

1. Clarify only the missing context that blocks a deterministic frontend contract, exactly one question at a time.
2. Invite optional materials and read any attached `@` files yourself.
3. Prefer MCP tool `archetype_run_lifecycle` with `$ARGUMENTS` and any imported materials. It creates or updates `archetype.intake.json`, safely ingests materials, writes `lifecycle/source-graph.json`, writes `lifecycle/run-state.json`, and returns `nextAction`.
4. Generate `archetype-output` with the Archetype MCP tools when available; when clarification is required, apply each answer with `archetype_run_lifecycle` or `archetype_answer_clarification`.
5. If a `draft_contract` package is generated, read the draft artifacts, point the user to `draft/design-system-preview.html` for browser review, and ask for approval or edits. Do not proceed to canonical spec, tests, or implementation from a draft package.
6. After human approval, regenerate and read the canonical spec, test-first contract, Playwright verification contract, route map, screen inventory, tokens, component contracts, and implementation rules.
7. Create the smoke, E2E, UI, integration, and unit tests before product UI implementation.
8. Preserve the initial red test result, then implement from the generated contract.
9. Verify with Playwright-backed evidence.
10. Repair implementation drift first, and revise the contract only when user-approved evidence proves the spec is wrong.

Use CLI fallbacks internally when MCP is unavailable. Do not ask the user to run `generate`, `validate`, `verify-target`, or `repair` manually.
