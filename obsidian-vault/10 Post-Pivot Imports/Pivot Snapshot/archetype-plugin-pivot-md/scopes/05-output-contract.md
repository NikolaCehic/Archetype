# Scope 05 — Generated Output Contract

## Purpose

Make `archetype-output` directly usable by Claude Code, Codex, and other coding agents even when no plugin is installed.

This is the most important adoption layer.

## Target Output Shape

```txt
archetype-output/
  README.md
  AGENTS.md
  CLAUDE.md
  manifest.json
  readiness-report.md
  implementation-contract.md
  verification-plan.md
  product/
    product-model.json
    user-roles.json
  experience/
    route-map.json
    user-flows.json
  design-system/
    tokens.json
    component-contracts.json
  screens/
    screen-inventory.json
    screen-specs.json
  frontend-agent-contract/
    frontend-agent-instructions.md
    acceptance-criteria.json
    implementation-rules.json
  validation/
    package-validation.json
    simulation-report.md
```

## Required Top-Level Files

### `README.md`

For humans. It should explain what the package is and where to start.

### `AGENTS.md`

For Codex and agentic coding tools.

It should tell the agent which files to read and what rules to follow.

### `CLAUDE.md`

For Claude Code.

It should mirror the agent rules but use Claude Code project-instruction style.

### `manifest.json`

Machine-readable list of artifact IDs and paths.

### `implementation-contract.md`

Human-readable implementation source of truth.

### `verification-plan.md`

Commands and checks required before declaring success.

## Required Agent Rules

Generated `AGENTS.md` and `CLAUDE.md` should include:

```txt
- Read implementation-contract.md before writing code.
- Read route-map.json before creating routes.
- Read screen-inventory.json before creating screens.
- Read tokens.json before styling.
- Read component-contracts.json before creating components.
- Implement loading, empty, error, success, and permission states where required.
- Do not invent routes not present in the route map.
- Do not invent product copy that conflicts with the contract.
- Run verification before claiming completion.
```

## Manifest Format

```json
{
  "schemaVersion": "0.1.0",
  "generatedAt": "2026-05-03T00:00:00.000Z",
  "productName": "Example Product",
  "readinessScore": 84,
  "artifacts": [
    {
      "id": "implementation-contract",
      "path": "implementation-contract.md",
      "type": "markdown",
      "required": true
    },
    {
      "id": "route-map",
      "path": "experience/route-map.json",
      "type": "json",
      "required": true
    }
  ]
}
```

## Implementation Contract Content

`implementation-contract.md` should include:

```txt
1. Product summary
2. User roles
3. Route map summary
4. Required screens
5. Required states
6. Design-system rules
7. Component contract summary
8. Data/action/form contracts
9. Acceptance criteria
10. Verification checklist
```

## Verification Plan Content

`verification-plan.md` should include:

```txt
1. Required commands
2. Expected route coverage
3. Expected screen coverage
4. Expected state coverage
5. Component/token checks
6. Accessibility expectations
7. Manual review checklist
8. Pass/fail criteria
```

## Readiness Report Content

`readiness-report.md` should include:

```txt
- readiness score
- blockers
- warnings
- inferred assumptions
- missing evidence
- implementation risks
- recommended next action
```

## Acceptance Criteria

```txt
[ ] Generated output has top-level README.md.
[ ] Generated output has top-level AGENTS.md.
[ ] Generated output has top-level CLAUDE.md.
[ ] Generated output has manifest.json.
[ ] Generated output has implementation-contract.md.
[ ] Generated output has verification-plan.md.
[ ] Output can be summarized by CLI.
[ ] Output can be validated by CLI.
[ ] Output can guide Codex/Claude without plugin installation.
```

## Codex Instruction

When implementing this scope, optimize for agent readability. The output package should have a small number of obvious entry points, not only deeply nested artifacts.
