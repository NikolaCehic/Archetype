# Scope 04 — Public CLI Contract

## Purpose

Create a stable command surface that humans, Codex, Claude Code, MCP tools, and CI can call.

The CLI is the lowest-friction product surface. It must work before plugins become valuable.

## Command Surface

Minimum commands:

```bash
archetype init
archetype generate --input archetype.intake.json --out archetype-output
archetype validate --out archetype-output
archetype summarize --out archetype-output
archetype simulate --out archetype-output
archetype write-target --out archetype-output --target ./app
archetype verify-target --out archetype-output --target ./app
```

## JSON Mode

Every command that returns meaningful status should support:

```bash
--json
```

Example:

```bash
archetype generate --input archetype.intake.json --out archetype-output --json
```

Expected output:

```json
{
  "status": "success",
  "outputDir": "archetype-output",
  "readinessScore": 84,
  "blockers": [],
  "warnings": [],
  "artifacts": [
    {
      "id": "implementation-contract",
      "path": "archetype-output/implementation-contract.md",
      "type": "markdown"
    }
  ]
}
```

## Command Details

### `archetype init`

Creates a starter intake file.

```bash
archetype init --out archetype.intake.json
```

Optional flags:

```bash
--template saas-dashboard
--template fintech
--template marketplace-admin
```

### `archetype generate`

Generates the contract package.

```bash
archetype generate --input archetype.intake.json --out archetype-output
```

Required behavior:

- write output folder
- emit manifest
- emit readiness report
- emit implementation contract
- emit generated `AGENTS.md`
- emit generated `CLAUDE.md`
- return blockers/warnings

### `archetype validate`

Validates output package integrity.

Checks:

- required files exist
- manifest references valid paths
- route map is parseable
- screen inventory is parseable
- frontend contract exists
- verification plan exists

### `archetype summarize`

Returns a compact summary for agent context.

This is important because Codex/Claude should not have to read the entire output folder immediately.

Expected output:

```json
{
  "product": "B2B SaaS analytics dashboard",
  "routes": 8,
  "screens": 14,
  "requiredStates": ["loading", "empty", "error", "success", "permission-denied"],
  "readinessScore": 84,
  "blockers": [],
  "warnings": ["API endpoints inferred"]
}
```

### `archetype verify-target`

Checks whether a target frontend matches the contract.

```bash
archetype verify-target --out archetype-output --target ./app --json
```

Expected output:

```json
{
  "status": "warning",
  "checks": [
    {
      "name": "routes",
      "status": "pass"
    },
    {
      "name": "empty-states",
      "status": "warning",
      "message": "Billing history empty state not implemented"
    }
  ]
}
```

## CLI Help Text

The CLI help should say:

```txt
Archetype generates frontend implementation contracts for AI coding agents.
```

Do not say:

```txt
Archetype is an autonomous AI agent.
```

## Acceptance Criteria

```txt
[ ] CLI binary works after install/build.
[ ] `generate` creates usable output.
[ ] `validate` catches missing required artifacts.
[ ] `summarize --json` returns compact agent context.
[ ] `verify-target --json` returns parseable check results.
[ ] Commands have stable names and flags.
[ ] CLI can be called by MCP server.
```

## Codex Instruction

When implementing this scope, prioritize stable command behavior and parseable output. Avoid clever interactive flows. Coding agents need predictable commands.
