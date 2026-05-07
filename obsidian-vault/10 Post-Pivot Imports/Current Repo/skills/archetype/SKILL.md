---
name: archetype
description: Use when a user asks Archetype in natural language to turn @attached files, screenshots, briefs, brand notes, or repo context into a frontend plan and implementation loop without learning CLI or plugin commands.
---

# Archetype

Use this as the user-facing front door for `$archetype`, `/archetype`, or natural-language Archetype requests. The user should be able to provide only a project idea. Archetype owns clarification, optional-material intake, contract generation, tests-first implementation, verification, and revision.

Examples:

- `$archetype "I want to build a premium B2B analytics app for marketing teams."`
- `/archetype "I want to build a premium B2B analytics app for marketing teams."`
- `/archetype "Create a patient intake portal for a small clinic."`
- `Archetype: redesign this repo as a contract-driven onboarding app.`

## Interaction Contract

- Treat every `@file`, `@folder`, screenshot, design file, or mentioned repo path as source material.
- Read imported files yourself. Never ask the user to paste content from files they already attached.
- Do not ask the user to choose internal commands such as blueprint, implement, generate, validate, or verify.
- Do not require the user to say "ask me what is missing" or "implement and verify"; that is the default `$archetype` or `/archetype` lifecycle.
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
7. Read `lifecycle/context-completion.json`, `lifecycle/clarification-turn.json`, and `lifecycle/lifecycle-report.md`.
8. Read `spec/archetype-spec.md` and `spec/archetype-spec.json` as the canonical source of truth.
9. Summarize readiness with `archetype_summarize_package`.
10. If clarification blockers exist, ask only the current question, apply the answer with `archetype_answer_clarification`, regenerate, and repeat.
11. If ready or warning-only, read `test-first/test-first-contract.json` and `test-first/test-first-plan.md`.
12. Read `verification/playwright-verification-contract.json` and `verification/playwright-verification-plan.md` before implementation so browser proof obligations are known up front.
13. Create the smoke, E2E, UI, integration, and unit tests declared in the test-first contract before writing product UI.
14. Preserve the initial red test result.
15. Continue with implementation workflow from `implement`.
16. Verify the target with `verify`.
17. Check `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, and `10-revision/repair-task-queue.json`.
18. If verification fails, call `archetype_plan_repair`, patch implementation tasks first, revise the contract only when user-approved evidence proves the spec is wrong, then verify again.

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
natural-language Archetype idea
        -> clarification and optional material request
        -> context completion
        -> canonical spec and contract generation
        -> tests first
        -> frontend implementation
        -> Playwright-backed verification
        -> fixes or final report
```

Do not end by telling the user what to tell Codex or Claude Code next. The active coding agent is already in the loop.
