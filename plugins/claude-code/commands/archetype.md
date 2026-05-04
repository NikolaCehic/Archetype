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

1. Clarify only the missing context that blocks a deterministic frontend contract.
2. Invite optional materials and read any attached `@` files yourself.
3. Create or update `archetype.intake.json`.
4. Generate `archetype-output` with the Archetype MCP tools when available.
5. Read the canonical spec, test-first contract, Playwright verification contract, route map, screen inventory, tokens, component contracts, and implementation rules.
6. Create the smoke, E2E, UI, integration, and unit tests before product UI implementation.
7. Preserve the initial red test result, then implement from the generated contract.
8. Verify with Playwright-backed evidence.
9. Repair implementation drift first, and revise the contract only when user-approved evidence proves the spec is wrong.

Use CLI fallbacks internally when MCP is unavailable. Do not ask the user to run `generate`, `validate`, `verify-target`, or `repair` manually.
