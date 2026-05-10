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
2. Ask the source-material gate explicitly: `SPEC.md`, SOP, PRD, screenshots, wireframes, design docs, API docs, route maps, repo files, or explicit permission to proceed without source materials. Read any attached `@` files yourself.
3. Prefer MCP tool `archetype_run_lifecycle` with `$ARGUMENTS` and any imported materials. It creates or updates `archetype.intake.json`, safely ingests materials, writes `lifecycle/source-graph.json`, writes `lifecycle/run-state.json`, writes `agent-context/consumer-plane.json`, and returns `nextAction` plus `consumerPlane`.
4. Generate `archetype-output` with the Archetype MCP tools when available; when clarification is required, apply each answer with `archetype_run_lifecycle` or `archetype_answer_clarification`.
5. Read `agent-context/consumer-plane.json` or call `archetype_consumer_next_action` before deciding what to say next. Prefer MCP resources/prompts when the host only needs the current phase, review copy, or test-first handoff.
6. Read `governance/agent-control-plane.json` before every phase transition; blocked or failed P0 gates override host-agent preference.
7. If a `draft_contract` package is generated, read only the artifacts named by the consumer plane, `review-console/session.json`, `progressive/lazy-contract-index.json`, and the draft phase bundles. Point the user to `review-console/index.html` first, then `draft/design-system-preview.html`, `draft/design-directions.json`, `draft/design-quality-gate.json`, and `draft/design-craft-rubric.md` for browser/design review, and ask for approval or edits. Do not proceed to canonical spec, tests, or implementation from a draft package.
7.1. Treat the design-quality gate as blocking: generic blue-gray SaaS UI, untouched shadcn defaults, missing component states, and raw Tailwind visual literals cannot be approved for implementation.
8. Use `archetype_phase_package` or CLI fallback `archetype phase-package --out archetype-output --phase <phase> --target archetype-phase-package --force --json` when a smaller current-phase handoff can replace opening the whole generated output.
9. After proof-bound human approval, regenerate and start from the consumer plane, review console, lazy contract index, host permissions, test-first bundle, implementation bundle, and verification bundle before reading canonical spec, test-first contract, Playwright verification contract, route map, screen inventory, tokens, component contracts, and implementation rules. Stop if the control plane reports canonical parity drift.
10. Create the smoke, E2E, UI, integration, and unit tests before product UI implementation.
11. Preserve the initial red test result, then implement from the generated contract.
12. Verify with Playwright-backed evidence.
13. Repair implementation drift first, and revise the contract only when user-approved evidence proves the spec is wrong.

Use CLI fallbacks internally when MCP is unavailable. Do not ask the user to run `generate`, `validate`, `verify-target`, or `repair` manually.
