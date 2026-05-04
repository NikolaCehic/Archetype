# Template — Archetype Blueprint Skill

Use this for either Claude Code or Codex skill format. Adjust path/name conventions per host.

```md
---
name: archetype-blueprint
description: Use this when turning product briefs, screenshots, brand notes, or existing frontend context into an Archetype frontend implementation contract.
---

# Archetype Blueprint Skill

You are helping the user generate an Archetype frontend architecture package.

## Workflow

1. Identify product domain, target users, target stack, core flows, visual evidence, brand constraints, and backend/API assumptions.
2. Create or update `archetype.intake.json`.
3. Prefer MCP tool `archetype_generate_package` if available.
4. If MCP is unavailable, run:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output
```

5. Inspect readiness score, blockers, warnings, and assumptions.
6. Summarize generated package.
7. Do not proceed to frontend implementation until the package has enough information to guide routes, screens, states, data contracts, and acceptance criteria.

## Output Discipline

After generation, report:

- output directory
- readiness score
- blockers
- warnings
- main files to read next
- whether implementation can proceed
```
