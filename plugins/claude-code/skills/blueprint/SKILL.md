---
name: archetype-blueprint
description: Use when turning product briefs, screenshots, brand notes, or existing frontend context into an Archetype frontend implementation contract package.
---

# Archetype Blueprint

Use this skill for `/archetype:blueprint`.

## Goal

Turn product intent into an `archetype-output` contract package that Claude Code can use before implementation starts.

## Workflow

1. Gather or infer the product brief, target users, target stack, brand notes, screenshots, existing repo context, core flows, and constraints.
2. Prefer MCP tool `archetype_create_intake` to create `archetype.intake.json`.
3. Prefer MCP tool `archetype_generate_package` with `outputDir: "archetype-output"`.
4. Run MCP tool `archetype_summarize_package` and inspect readiness score, blockers, warnings, assumptions, and missing evidence.
5. Use MCP tool `archetype_read_artifact` for `implementation-contract`, `route-map`, `screen-inventory`, `design-tokens`, and `component-contracts` when summarizing next steps.
6. If MCP is unavailable, use the CLI fallback:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype summarize --out archetype-output --json
```

## Rules

- Do not proceed to frontend implementation when blockers exist.
- Do not invent routes, screens, states, copy, tokens, data contracts, or acceptance criteria outside the generated package.
- Treat screenshots and reference images as evidence, not assets to copy.
- Report readiness score, blockers, warnings, output directory, and the files Claude should read next.
