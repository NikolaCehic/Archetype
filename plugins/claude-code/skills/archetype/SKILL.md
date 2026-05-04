---
name: archetype
description: Use when a user asks Archetype in natural language to turn @attached files, screenshots, briefs, brand notes, or repo context into a frontend plan and implementation loop without learning CLI or plugin commands.
---

# Archetype

Use this as the user-facing front door for `/archetype` or natural-language Archetype requests. The user should be able to import context with `@` references and describe the desired product in plain language.

Examples:

- `/archetype @docs/product-brief.md @screens/dashboard.png Build the customer analytics frontend from this direction.`
- `Use Archetype with @SPEC.md and @brand-notes.md. Ask me what is missing, then build and verify.`
- `Archetype: redesign this repo using @screens/current.png and @notes/target-ux.md.`

## Interaction Contract

- Treat every `@file`, `@folder`, screenshot, design file, or mentioned repo path as source material.
- Read imported files yourself. Never ask the user to paste content from files they already attached.
- Do not ask the user to choose internal commands such as blueprint, implement, generate, validate, or verify.
- Ask one compact question set only when essential context is missing.
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

1. Normalize the user's natural language and `@` imported context into `archetype.intake.json`.
2. Prefer MCP tool `archetype_create_intake`. Pass imported materials through the `materials` array with labels, paths, content excerpts, and source types.
3. Generate `archetype-output` with MCP tool `archetype_generate_package`.
4. Summarize readiness with `archetype_summarize_package`.
5. If blockers exist, ask for only the missing evidence needed to unblock the contract.
6. If ready or warning-only, read the generated contract entrypoints and continue with the implementation workflow from `implement`.
7. Verify the target with `verify`.
8. If verification fails, patch the implementation or revise the contract, then verify again.

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
natural-language request + @files
        -> clarifying questions only if needed
        -> contract generation
        -> frontend implementation
        -> verification
        -> fixes or final report
```

Do not end by telling the user what to tell Claude Code next. Claude Code is already in the loop.
