# Scope 06 — MCP Server

## Purpose

Expose Archetype as deterministic tools callable by AI agent hosts.

Without MCP, Archetype is mostly a CLI and generated instructions. With MCP, Claude Code and Codex can call Archetype actions inside the agent loop.

## Product Rule

MCP tools should execute deterministic actions. They should not pretend to be the reasoning agent.

The model reasons. Archetype tools generate, validate, read, and verify.

## Package Shape

```txt
packages/mcp/
  src/
    server.ts
    tools/
      createIntake.ts
      generatePackage.ts
      validatePackage.ts
      summarizePackage.ts
      readArtifact.ts
      verifyTarget.ts
  package.json
```

## Tool List

### `archetype_create_intake`

Creates or updates an intake file from structured user/product inputs.

Input:

```json
{
  "brief": "string",
  "targetStack": "string",
  "brandNotes": "string",
  "existingRepoContext": "string",
  "outputPath": "archetype.intake.json"
}
```

Output:

```json
{
  "status": "success",
  "intakePath": "archetype.intake.json",
  "missingInputs": [],
  "riskFlags": []
}
```

### `archetype_generate_package`

Runs the compiler.

Input:

```json
{
  "inputPath": "archetype.intake.json",
  "outputDir": "archetype-output",
  "overwrite": true
}
```

Output:

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
      "path": "archetype-output/implementation-contract.md"
    }
  ]
}
```

### `archetype_validate_package`

Validates an output folder.

Input:

```json
{
  "outputDir": "archetype-output"
}
```

Output:

```json
{
  "status": "pass",
  "errors": [],
  "warnings": []
}
```

### `archetype_summarize_package`

Returns compact context for an agent.

Input:

```json
{
  "outputDir": "archetype-output"
}
```

Output:

```json
{
  "product": "B2B SaaS analytics dashboard",
  "routes": 8,
  "screens": 14,
  "readinessScore": 84,
  "blockers": [],
  "warnings": []
}
```

### `archetype_read_artifact`

Reads one known artifact by ID.

Input:

```json
{
  "outputDir": "archetype-output",
  "artifactId": "implementation-contract"
}
```

Output:

```json
{
  "status": "success",
  "artifactId": "implementation-contract",
  "path": "archetype-output/implementation-contract.md",
  "content": "..."
}
```

### `archetype_verify_target`

Checks target implementation against contract.

Input:

```json
{
  "outputDir": "archetype-output",
  "targetDir": ".",
  "skipInstall": false
}
```

Output:

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

## Bad Tool Names

Do not use names like:

```txt
do_magic
build_app
agentify
make_frontend
```

## Good Tool Names

Use names like:

```txt
archetype_generate_package
archetype_validate_package
archetype_read_artifact
archetype_verify_target
```

## Security And Safety

- Do not write outside declared output directories.
- Do not modify target repos unless tool is explicitly named to do so.
- Validate paths.
- Return structured errors.
- Avoid hidden shell execution.
- Do not install dependencies unless the user or host explicitly allows it.

## Acceptance Criteria

```txt
[ ] MCP server starts locally.
[ ] MCP tools call core/CLI behavior successfully.
[ ] Tools return structured JSON-like results.
[ ] Generate/validate/summarize/read/verify tools exist.
[ ] Claude plugin can reference the MCP server.
[ ] Codex plugin can reference the MCP server.
```

## Codex Instruction

When implementing this scope, keep tools small and deterministic. Do not implement a general-purpose agent inside the MCP server.
