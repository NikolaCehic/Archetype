---
name: archetype-revise
description: Use when revising an existing Archetype contract package after user feedback or implementation discoveries.
---

# Archetype Revise

Use this skill for `/archetype:revise`.

## Goal

Update the contract package when product context changes, while preserving deterministic handoff to Claude Code.

## Workflow

1. Read the existing `archetype.intake.json` and `archetype-output/manifest.json`.
2. Capture the change request, affected routes, affected screens, state gaps, design-system changes, and backend/API discoveries.
3. Update `archetype.intake.json` directly or use MCP tool `archetype_create_intake` when the change replaces the brief.
4. Regenerate with MCP tool `archetype_generate_package`.
5. Summarize the delta with MCP tool `archetype_summarize_package`.
6. Read important artifacts with MCP tool `archetype_read_artifact`.
7. If MCP is unavailable, use the CLI fallback:

```bash
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx -y -p @nikolacehic/archetype archetype summarize --out archetype-output --json
```

## Rules

- Do not patch generated artifacts by hand as the source of truth.
- Update intake/source context first, then regenerate.
- Report changed routes, screens, states, tokens, component contracts, acceptance criteria, blockers, and warnings.
