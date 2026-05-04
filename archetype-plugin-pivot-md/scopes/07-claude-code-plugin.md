# Scope 07 — Claude Code Plugin

## Purpose

Create a Claude Code plugin wrapper around Archetype so users can run blueprint, implementation, and verification workflows inside Claude Code.

The Claude plugin should not replace the core compiler. It should call the CLI/MCP server and guide Claude Code through the workflow.

## Target Structure

```txt
plugins/claude-code/
  .claude-plugin/
    plugin.json
  skills/
    archetype/
      SKILL.md
    blueprint/
      SKILL.md
    implement/
      SKILL.md
    verify/
      SKILL.md
    revise/
      SKILL.md
  agents/
    product-architect.md
    frontend-contract-reviewer.md
  .mcp.json
  assets/
```

## Plugin Manifest

Use `templates/claude-plugin-json.md` as a starting point.

Core manifest fields:

```json
{
  "name": "archetype",
  "description": "Generate frontend implementation contracts from product intent and use them to guide implementation.",
  "version": "0.1.0",
  "author": {
    "name": "Nikola Cehic"
  },
  "homepage": "https://github.com/NikolaCehic/Archetype",
  "repository": "https://github.com/NikolaCehic/Archetype",
  "license": "MIT"
}
```

## Skills

### `/archetype`

Purpose:

```txt
Natural-language front door that accepts user direction plus @imported files and runs blueprint, implementation, verification, and revision as one guided loop.
```

Workflow:

1. Read all `@` imported files, folders, screenshots, and design notes.
2. Ask one compact set of missing-context questions only when essential product, stack, flow, visual, backend, or verification facts are absent.
3. Create or update `archetype.intake.json` with imported materials.
4. Generate the contract package.
5. Continue into implementation and verification without asking the user to choose internal commands.

### `/archetype:blueprint`

Purpose:

```txt
Turn product intent into an Archetype contract package.
```

Workflow:

1. Collect or infer product brief, screenshots, brand notes, constraints, target stack, and existing repo context.
2. Create or update `archetype.intake.json`.
3. Run `archetype_generate_package` through MCP or `archetype generate` through CLI.
4. Inspect readiness score, blockers, and warnings.
5. Summarize generated contract and missing evidence.

### `/archetype:implement`

Purpose:

```txt
Use an existing Archetype contract package to build frontend code.
```

Workflow:

1. Read `archetype-output/implementation-contract.md`.
2. Read route map, screen inventory, design tokens, component contracts, and frontend-agent instructions.
3. Implement only what the contract supports.
4. Do not invent routes, states, or product copy.
5. Run local checks.

### `/archetype:verify`

Purpose:

```txt
Verify frontend implementation against the Archetype contract.
```

Workflow:

1. Run `archetype validate`.
2. Run `archetype verify-target`.
3. Compare routes, screens, states, components, tokens, and acceptance criteria.
4. Return pass/warning/fail report.
5. Suggest concrete fixes.

### `/archetype:revise`

Purpose:

```txt
Revise an existing Archetype contract based on user feedback or implementation discoveries.
```

Workflow:

1. Read current contract package.
2. Capture change request.
3. Update intake/change request.
4. Regenerate affected artifacts.
5. Summarize delta and required implementation changes.

## Subagents

### `product-architect.md`

Role:

```txt
Turns messy product context into structured product model, route map, screens, states, and acceptance criteria.
```

Tool access should be mostly read/write around local files and Archetype tools.

### `frontend-contract-reviewer.md`

Role:

```txt
Strictly reviews whether an Archetype contract is implementable by a coding agent.
```

It should flag:

- missing states
- missing copy
- missing data contracts
- unclear permissions
- ambiguous routes
- unsupported design rules
- unverifiable acceptance criteria

## MCP Config

The plugin should include an `.mcp.json` pointing to the Archetype MCP server.

Example:

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

## Acceptance Criteria

```txt
[ ] Plugin manifest exists.
[ ] Natural-language `/archetype` front door exists.
[ ] Blueprint skill exists.
[ ] Implement skill exists.
[ ] Verify skill exists.
[ ] Revise skill exists.
[ ] Product architect subagent exists.
[ ] Frontend contract reviewer subagent exists.
[ ] Plugin can call Archetype CLI or MCP.
[ ] Imported `@` files are treated as source materials.
[ ] Plugin does not require workbench.
```

## Codex Instruction

When implementing this scope, create the plugin wrapper and skill docs. Do not change core compiler logic unless a missing command prevents the skill from working.
