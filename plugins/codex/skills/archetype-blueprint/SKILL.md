---
name: archetype-blueprint
description: Use when turning product briefs, screenshots, brand material, or existing frontend context into an Archetype contract package.
---

# Archetype Blueprint

Generate an `archetype-output` package before frontend implementation starts.

## Workflow

1. Identify product domain, target users, target stack, core flows, visual evidence, brand constraints, backend/API assumptions, and existing repo constraints.
2. Create or update `archetype.intake.json`.
3. Prefer MCP tool `archetype_create_intake` when creating a fresh intake from user context.
4. Prefer MCP tool `archetype_generate_package` with `outputDir: "archetype-output"`.
5. Run MCP tool `archetype_summarize_package`.
6. Use MCP tool `archetype_read_artifact` when specific generated files are needed.
7. If MCP is unavailable, use the CLI fallback:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype summarize --out archetype-output --json
```

## Output

Report output directory, readiness score, blockers, warnings, assumptions, missing evidence, and whether implementation can proceed.
