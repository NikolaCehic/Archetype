---
name: archetype
description: Use when a user asks Archetype in natural language to turn @attached files, screenshots, briefs, brand notes, or repo context into a frontend plan and implementation loop without learning CLI or plugin commands.
---

# Archetype

This is the user-facing front door. The user should be able to write `/archetype` or `@Archetype` with only a project idea. Archetype owns clarification, optional-material intake, contract generation, tests-first implementation, verification, and revision.

Examples:

- `@Archetype "I want to build a premium B2B analytics app for marketing teams."`
- `/archetype "Create a patient intake portal for a small clinic."`
- `Archetype: redesign this repo as a contract-driven onboarding app.`

## Interaction Contract

- Treat every `@file`, `@folder`, screenshot, design file, or mentioned repo path as source material.
- Read imported files yourself. Never ask the user to paste content from files they already attached.
- Do not ask the user to choose internal commands such as blueprint, implement, generate, validate, or verify.
- Do not require the user to say "ask me what is missing" or "implement and verify"; that is the default `/archetype` lifecycle.
- Ask one compact question set only when essential context is missing.
- Ask the user to optionally provide materials after the initial idea: designs, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, API docs, route maps, existing repo files, or test policy.
- After the user answers, continue through blueprint, implementation, verification, and revision without requiring another handoff prompt.
- Report progress in human terms: context gathered, missing decisions, contract ready, implementation started, verification result.

## Missing Context Questions

Ask at most six concise questions, grouped in one message, and only for information not present in the request or imported files:

- What is the product outcome?
- Who are the primary users or roles?
- What target stack or existing frontend repo should be used?
- What are the must-have flows or screens?
- What visual, brand, accessibility, or interaction constraints matter?
- What backend, data, auth, install, or verification permissions are confirmed?

If the answer is obvious from the attached material, infer it and state the assumption instead of asking.

## Self-Contained Pipeline

1. Treat the initial idea as `start`.
2. Clarify missing context and ask for optional materials.
3. Normalize the user's natural language and `@` imported context into `archetype.intake.json`.
4. Prefer MCP tool `archetype_create_intake`. Pass imported materials through the `materials` array with labels, paths, content excerpts, and source types.
5. Generate `archetype-output` with MCP tool `archetype_generate_package`.
6. Read `lifecycle/context-completion.json` and `lifecycle/lifecycle-report.md`.
7. Read `spec/archetype-spec.md` and `spec/archetype-spec.json` as the canonical source of truth.
8. Summarize readiness with `archetype_summarize_package`.
9. If blockers exist, ask for only the missing evidence needed to unblock the contract.
10. If ready or warning-only, read `test-first/test-first-contract.json` and `test-first/test-first-plan.md`.
11. Read `verification/playwright-verification-contract.json` and `verification/playwright-verification-plan.md` before implementation so browser proof obligations are known up front.
12. Create the smoke, E2E, UI, integration, and unit tests declared in the test-first contract before writing product UI.
13. Preserve the initial red test result.
14. Continue with implementation workflow from `archetype-implement`.
15. Verify the target with `archetype-verify`.
16. Check `verification/playwright-evidence.json`, `verification/playwright-evidence.md`, and `10-revision/repair-task-queue.json`.
17. If verification fails, call `archetype_plan_repair`, patch implementation tasks first, revise the contract only when user-approved evidence proves the spec is wrong, then verify again.

## Fallback

If MCP is unavailable, use the CLI internally. Do not make the user run these commands manually.

```bash
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype validate --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype verify-target --out archetype-output --target . --skip-install --json
```

## Completion Standard

The user should experience Archetype as one guided agent workflow:

```txt
natural-language /archetype idea
        -> clarification and optional material request
        -> context completion
        -> canonical spec and contract generation
        -> tests first
        -> frontend implementation
        -> Playwright-backed verification
        -> fixes or final report
```

Do not end by telling the user what to tell Codex next. Codex is already in the loop.
