# Scope 08 — Codex Plugin

## Purpose

Create a Codex plugin wrapper around Archetype so Codex can generate, consume, and verify frontend implementation contracts.

The Codex plugin should use skills and MCP rather than embedding all logic in one huge prompt.

## Target Structure

```txt
plugins/codex/
  .codex-plugin/
    plugin.json
  skills/
    archetype/
      SKILL.md
    archetype-blueprint/
      SKILL.md
    archetype-implement/
      SKILL.md
    archetype-verify/
      SKILL.md
    archetype-revise/
      SKILL.md
  .mcp.json
  assets/
```

## Plugin Manifest

Use `templates/codex-plugin-json.md` as a starting point.

Core fields:

```json
{
  "name": "archetype",
  "version": "0.1.0",
  "description": "Generate and use frontend implementation contracts for coding agents.",
  "author": {
    "name": "Nikola Cehic",
    "url": "https://github.com/NikolaCehic"
  },
  "homepage": "https://github.com/NikolaCehic/Archetype",
  "repository": "https://github.com/NikolaCehic/Archetype",
  "license": "MIT",
  "keywords": ["frontend", "design-system", "agents", "codex", "ui"],
  "skills": "./skills/",
  "mcpServers": "./.mcp.json"
}
```

## Skills

### `archetype`

Use when the user wants a single natural-language Archetype workflow with `@` imported files and no command choreography.

Workflow:

1. Read all `@` imported files, folders, screenshots, and design notes.
2. Ask one compact set of missing-context questions only when essential product, stack, flow, visual, backend, or verification facts are absent.
3. Create or update `archetype.intake.json` with imported materials.
4. Generate the contract package.
5. Continue into implementation and verification without asking the user to choose internal commands.

### `archetype-blueprint`

Use when the user wants to turn a product brief, screenshot set, brand material, or existing frontend context into an Archetype contract.

Workflow:

1. Identify product domain, users, target stack, core flows, visual evidence, and constraints.
2. Create or update `archetype.intake.json`.
3. Call `archetype_generate_package` through MCP or run CLI fallback.
4. Inspect readiness score, blockers, warnings, and assumptions.
5. Summarize the generated contract.

### `archetype-implement`

Use when the user wants Codex to build frontend code from an existing Archetype package.

Workflow:

1. Read `archetype-output/AGENTS.md`.
2. Read `implementation-contract.md`.
3. Read route map, screen inventory, tokens, component contracts, and acceptance criteria.
4. Implement according to the contract.
5. Run project tests/checks.
6. Do not declare success until verification is run.

### `archetype-verify`

Use when the user wants to verify implementation quality against the Archetype contract.

Workflow:

1. Run `archetype validate`.
2. Run `archetype verify-target`.
3. Inspect unresolved blockers.
4. Produce pass/warning/fail summary.
5. Patch issues if the user asked for fixes.

### `archetype-revise`

Use when the user wants to change the generated contract.

Workflow:

1. Read existing output package.
2. Convert requested change into intake update or revision note.
3. Regenerate affected artifacts.
4. Summarize changed routes/screens/components/states.
5. Explain what implementation must be updated.

## MCP Config

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["-y", "@nikolacehic/archetype-mcp"]
    }
  }
}
```

## Fallback Without MCP

If MCP is unavailable, skills should call CLI commands:

```bash
npx @nikolacehic/archetype generate --input archetype.intake.json --out archetype-output
npx @nikolacehic/archetype validate --out archetype-output
npx @nikolacehic/archetype verify-target --out archetype-output --target .
```

## Acceptance Criteria

```txt
[ ] Codex plugin manifest exists.
[ ] Natural-language `archetype` front door exists.
[ ] Blueprint skill exists.
[ ] Implement skill exists.
[ ] Verify skill exists.
[ ] Revise skill exists.
[ ] MCP config exists.
[ ] Skills include CLI fallback.
[ ] Imported `@` files are treated as source materials.
[ ] Generated AGENTS.md supports Codex even without plugin.
```

## Codex Instruction

When implementing this scope, keep skills compact. Do not dump the entire product plan into every `SKILL.md`. Each skill should point to the generated contract files and use MCP/CLI for actions.
