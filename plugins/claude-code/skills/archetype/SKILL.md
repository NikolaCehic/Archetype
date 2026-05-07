---
name: archetype
description: Use when a user asks Archetype in natural language to turn @attached files, screenshots, briefs, brand notes, or repo context into a frontend plan and implementation loop without learning CLI or plugin commands.
---

# Archetype

Use this as the user-facing front door for `/archetype` or natural-language Archetype requests. The user should be able to provide only a project idea. Archetype owns clarification, optional-material intake, contract generation, tests-first implementation, verification, and revision.

Examples:

- `/archetype "I want to build a premium B2B analytics app for marketing teams."`
- `/archetype "Create a patient intake portal for a small clinic."`
- `Archetype: redesign this repo as a contract-driven onboarding app.`

## Interaction Contract

- Treat every `@file`, `@folder`, screenshot, design file, or mentioned repo path as source material.
- Read imported files yourself. Never ask the user to paste content from files they already attached.
- Do not ask the user to choose internal commands such as blueprint, implement, generate, validate, or verify.
- Do not require the user to say "ask me what is missing" or "implement and verify"; that is the default `/archetype` lifecycle.
- Ask exactly one clarification question at a time when essential context is missing.
- Ask the user to optionally provide materials after the initial idea: designs, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, API docs, route maps, existing repo files, or test policy.
- After the user answers, update the intake/context matrix with `archetype_answer_clarification`, then either ask the next single question or continue through blueprint, implementation, verification, and revision without requiring another handoff prompt.
- Report progress in human terms: context gathered, missing decisions, contract ready, implementation started, verification result.

## One-Question Clarification

Never ask a grouped form. Read `lifecycle/clarification-turn.json` and ask only `current_question.question`.

The selection order is highest implementation impact among missing, conflicted, or blocked required decisions. After the answer, call `archetype_answer_clarification` or update the intake equivalently, regenerate the context matrix, and repeat until the next lifecycle gate is safe.

If the answer is obvious from imported material, use the material as evidence in the intake instead of asking. Do not turn inference into a canonical answer without user approval.

## Self-Contained Pipeline

1. Treat the initial idea as `start`.
2. If setup is uncertain, call MCP tool `archetype_release_doctor` and continue only if the package, plugin, MCP, docs, and lifecycle readiness surface is pass.
3. Clarify missing context one question at a time and ask for optional materials.
4. Normalize the user's natural language and `@` imported context into `archetype.intake.json`.
5. Prefer MCP tool `archetype_create_intake`. Pass imported materials through the `materials` array with labels, paths, content excerpts, and source types.
6. Generate `archetype-output` with MCP tool `archetype_generate_package`.
7. Read `lifecycle/context-completion.json`, `lifecycle/clarification-turn.json`, `lifecycle/implementation-phases.json`, `lifecycle/contract-state.json`, `lifecycle/execution-state.json`, and `lifecycle/lifecycle-report.md`.
8. Summarize readiness with `archetype_summarize_package`.
9. If clarification blockers exist, ask only the current question, apply the answer with `archetype_answer_clarification`, regenerate, and repeat.
10. If the package is `draft_contract`, read `lifecycle/implementation-phases.json`, `draft/product-model.draft.json`, `draft/experience-architecture.draft.json`, `draft/design-system.draft.json`, `draft/frontend-contract.draft.json`, `draft/assumption-ledger.md`, `draft/specialist-review.json`, `governance/frontend-practice-skills.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, and `draft/contract-approval-request.json`.
11. For a draft contract, present confirmed facts, candidate assumptions, unresolved unknowns, risks, blockers, warnings, and recommendations. Ask for approval or edits. Do not read or invent canonical spec files because they are intentionally absent.
12. Generate the canonical package only after human approval is captured in the intake.
13. Once approved, read `spec/archetype-spec.md` and `spec/archetype-spec.json` as the canonical source of truth.
14. Once approved, read `lifecycle/approval-decision.json`, `reviews/specialist-review-summary.md`, `test-first/test-first-contract.json`, `test-first/test-first-plan.md`, `test-first/test-quality-standard.json`, and `test-results/initial-red-test-run.md`.
15. Read `lifecycle/implementation-phases.json`, `governance/frontend-practice-skills.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, `verification/playwright-verification-contract.json`, and `verification/playwright-verification-plan.md` before implementation so phase gates, convergence no-answers, browser proof obligations, marker-only test blockers, forbidden lifecycle behaviors, and frontend practice gates are known up front.
16. Create the smoke, E2E, UI, integration, and unit tests declared in the test-first contract before writing product UI.
17. Preserve the initial red test result.
18. Continue with implementation workflow from `implement`.
19. Verify the target with `verify`.
20. Check `lifecycle/execution-state.json`, `lifecycle/final-readiness-report.md`, `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, and `10-revision/repair-task-queue.json`.
21. If verification fails, call `archetype_plan_repair`, patch implementation tasks first, revise the contract only when user-approved evidence proves the spec is wrong, then verify again.

## Specialist Roles

Use the matching file in `agents/` when the lifecycle needs a product architect, experience architect, frontend architect, design-system architect, frontend practice enforcer, strict TypeScript developer, pixel-perfect developer, accessibility specialist, test-first developer, contract verifier, repair planner, or QA specialist. Each role defines authority, inputs, outputs, blockers, and handoff rules. No agent can approve its own work.

## Fallback

If MCP is unavailable, use the CLI internally. Do not make the user run these commands manually.

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype validate --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype verify-target --out archetype-output --target . --skip-install --json
```

## Completion Standard

The user should experience Archetype as one guided agent workflow:

```txt
natural-language /archetype idea
        -> clarification and optional material request
        -> context completion
        -> draft contract review and human approval
        -> canonical spec and contract generation
        -> tests first
        -> frontend implementation
        -> Playwright-backed verification
        -> fixes or final report
```

Do not end by telling the user what to tell Claude Code next. Claude Code is already in the loop.
