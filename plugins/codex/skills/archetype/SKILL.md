---
name: archetype
description: Use when a user asks Archetype in natural language to turn @attached files, screenshots, briefs, brand notes, or repo context into a frontend plan and implementation loop without learning CLI or plugin commands.
---

# Archetype

This is the user-facing front door. The user should be able to write `$archetype` or a natural-language Archetype request with only a project idea. Archetype owns clarification, optional-material intake, contract generation, tests-first implementation, verification, and revision.

Examples:

- `$archetype "I want to build a premium B2B analytics app for marketing teams."`
- `Archetype: create a patient intake portal for a small clinic.`
- `Archetype: redesign this repo as a contract-driven onboarding app.`

## Interaction Contract

- Treat every `@file`, `@folder`, screenshot, design file, or mentioned repo path as source material.
- Read imported files yourself. Never ask the user to paste content from files they already attached.
- Do not ask the user to choose internal commands such as blueprint, implement, generate, validate, or verify.
- Do not require the user to say "ask me what is missing" or "implement and verify"; that is the default `$archetype` lifecycle.
- Ask exactly one clarification question at a time when essential context is missing.
- Ask the source-material question as a first-class gate: does the user have `SPEC.md`, SOP, PRD, screenshots, wireframes, design docs, brand notes, API docs, route maps, existing repo files, or test policy, or should Archetype explicitly proceed without source materials?
- Read `agent-context/consumer-plane.json` first whenever it exists. It is the consumer contract for what to say, what to read, what to avoid, and which lifecycle action is legal next.
- Use `review-console/index.html` and `review-console/session.json` as the human review cockpit. The user reviews decisions, not an artifact tree.
- Treat `draft/design-directions.json`, `draft/design-quality-gate.json`, `draft/design-craft-rubric.md`, and `draft/design-system-preview.html` as a hard design review gate. Do not allow reusable preset directions, generic blue-gray SaaS UI, untouched shadcn defaults, or missing component states to pass. Design directions must cite source context, supplied materials when present, and route/screen alignment.
- Read `governance/agent-control-plane.json` whenever it exists. Its gates decide whether the host agent may clarify, draft, approve, canonicalize, author tests, implement, verify, QA, repair, or complete.
- After the user answers, update the intake/context matrix with `archetype_answer_clarification`, then either ask the next single question or continue through blueprint, implementation, verification, and revision without requiring another handoff prompt.
- Prefer MCP tool `archetype_run_lifecycle` as the backing primitive for `$archetype`; then use the returned `consumerPlane`, MCP prompt/resource surfaces, or MCP tool `archetype_consumer_next_action` before falling back to separate intake/generate tools.
- Report progress in human terms: context gathered, missing decisions, contract ready, implementation started, verification result.

## One-Question Clarification

Never ask a grouped form. Read `lifecycle/clarification-turn.json` and ask only `current_question.question`.

The selection order is highest implementation impact among missing, conflicted, or blocked required decisions. After the answer, call `archetype_answer_clarification` or update the intake equivalently, regenerate the context matrix, and repeat until the next lifecycle gate is safe.

If the answer is obvious from imported material, use the material as evidence in the intake instead of asking. Do not turn inference into a canonical answer without user approval.

## Self-Contained Pipeline

1. Treat the initial idea as `start`.
2. If setup is uncertain, call MCP tool `archetype_release_doctor` and continue only if the package, plugin, MCP, docs, and lifecycle readiness surface is pass.
3. Call MCP tool `archetype_run_lifecycle` with the brief and any imported material paths/content. It safely ingests materials, writes `lifecycle/source-graph.json`, writes `lifecycle/run-state.json`, and returns the next action.
4. If MCP cannot call `archetype_run_lifecycle`, normalize the user's natural language and `@` imported context into `archetype.intake.json`.
5. Prefer MCP tool `archetype_create_intake`. Pass imported materials through the `materials` array with labels, paths, content excerpts, and source types.
6. Generate `archetype-output` with MCP tool `archetype_generate_package`.
7. Read `agent-context/consumer-plane.json` first. Then read `agent-context/context-summary.json`, `agent-context/phase-bundles/index.json`, and only the current phase bundle before opening larger artifacts.
7.1. Read `governance/agent-control-plane.json` before any phase transition. If a P0 gate is blocked or failed, follow its `next_action` instead of improvising.
8. Summarize readiness with `archetype_summarize_package`; use compact mode by default and legacy/full entrypoints only when exact source text is required. Use `archetype_consumer_next_action`, MCP resources, or MCP prompts when the host only needs the next user-facing step.
9. If clarification blockers exist, ask only the current question, apply the answer with `archetype_answer_clarification`, regenerate, and repeat.
10. If the package is `draft_contract`, start from `agent-context/phase-bundles/draft-review.json` and `agent-context/phase-bundles/contract-approval.json`, then read the draft artifacts those bundles name.
    Draft review can require `draft/design-system-preview.html`, `draft/design-directions.json`, `draft/design-quality-gate.json`, `draft/design-craft-rubric.md`, `draft/frontend-contract.draft.json`, and `draft/contract-approval-request.json`.
11. For a draft contract, tell the user to open `review-console/index.html`. Present the review console decisions, route proposals, design directions, anti-generic design-quality gate, design preview, approval checklist, confirmed facts, candidate assumptions, unresolved unknowns, risks, blockers, warnings, and recommendations. Ask for approval or edits. Do not read or invent canonical spec files because they are intentionally absent.
12. Generate the canonical package only after proof-bound human approval is captured in the intake. Stop if `governance/agent-control-plane.json` reports canonical parity drift.
13. Once approved, start each downstream phase from `progressive/lazy-contract-index.json` and its compact bundle: `agent-context/phase-bundles/test-first.json`, `agent-context/phase-bundles/implementation.json`, `agent-context/phase-bundles/verification.json`, `agent-context/phase-bundles/qa.json`, and `agent-context/phase-bundles/repair.json`.
14. Read full canonical artifacts only when the active phase bundle lists them as required.
15. Before implementation, make sure the test-first, implementation, and verification bundles name the source files you are about to read; this prevents broad artifact-tree loading and token drift. Prefer `archetype_phase_package` for a small handoff if the host does not need the full package.
    Canonical phase bundles can require `spec/archetype-spec.json`, `test-first/test-first-contract.json`, `test-first/test-quality-standard.json`, `governance/forbidden-behaviors.json`, `lifecycle/approval-decision.json`, `lifecycle/final-readiness-report.md`, `verification/playwright-verification-contract.json`, and `verification/playwright-evidence.json`.
16. Create the smoke, E2E, UI, integration, and unit tests declared in the test-first contract before writing product UI.
17. Preserve the initial red test result.
18. Continue with implementation workflow from `archetype-implement`.
19. Verify the target with `archetype-verify`.
20. Check `lifecycle/execution-state.json`, `lifecycle/final-readiness-report.md`, `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, and `10-revision/repair-task-queue.json`.
21. If verification fails, call `archetype_plan_repair`, patch implementation tasks first, revise the contract only when user-approved evidence proves the spec is wrong, then verify again.

## Specialist Roles

Use the matching file in `agents/` when the lifecycle needs a product architect, experience architect, frontend architect, design-system architect, frontend practice enforcer, strict TypeScript developer, pixel-perfect developer, accessibility specialist, test-first developer, contract verifier, repair planner, or QA specialist. Each role defines authority, inputs, outputs, blockers, and handoff rules. No agent can approve its own work.

## Fallback

If MCP is unavailable, use the CLI internally. Do not make the user run these commands manually.

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype run "natural-language idea" --out archetype-output --force --json
npx --yes --package github:NikolaCehic/Archetype archetype phase-package --out archetype-output --phase draft_review --target archetype-phase-package --force --json
npx --yes --package github:NikolaCehic/Archetype archetype review --draft archetype-output --input archetype.intake.json --decision approve --reviewer "Human reviewer" --out archetype-output-approved --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype verify-target --out archetype-output --target . --skip-install --json
```

## Completion Standard

The user should experience Archetype as one guided agent workflow:

```txt
natural-language $archetype idea
        -> clarification and optional material request
        -> context completion
        -> draft contract review and human approval
        -> canonical spec and contract generation
        -> tests first
        -> frontend implementation
        -> Playwright-backed verification
        -> fixes or final report
```

Do not end by telling the user what to tell Codex next. Do not end by telling the user what to tell Claude Code next. Codex is already in the loop.
