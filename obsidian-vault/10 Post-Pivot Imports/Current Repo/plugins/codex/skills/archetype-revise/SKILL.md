---
name: archetype-revise
description: Use when the user wants to change an existing Archetype contract package.
---

# Archetype Revise

Revise the contract package from updated context instead of hand-editing generated artifacts.

## Workflow

1. Read `archetype.intake.json`, `archetype-output/manifest.json`, and the affected generated artifacts.
2. Capture the user change, affected routes, affected screens, required states, design-system impact, and backend/API discoveries.
3. Update the intake/source context first.
4. Prefer MCP tool `archetype_generate_package` to regenerate `archetype-output`.
5. Run MCP tool `archetype_summarize_package`.
6. Use MCP tool `archetype_plan_repair` when revision follows verification failure, then read `10-revision/repair-task-queue.json`.
7. Use MCP tool `archetype_read_artifact` to inspect changed artifacts.
8. If MCP is unavailable, use CLI fallback:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype summarize --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype repair --out archetype-output --target . --json
```

## Output

Report changed routes, screens, states, tokens, component contracts, acceptance criteria, blockers, warnings, and implementation files that likely need updates.

Do not revise the contract to hide implementation drift. Patch tasks in `10-revision/repair-task-queue.json` first unless the queue proves a user-approved source-material change is required.
