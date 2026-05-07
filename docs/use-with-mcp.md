# Use With MCP

Archetype includes a local MCP stdio server for agent hosts that can call tools directly.

## Local Development

Build the package:

```bash
npm install
npm run build
```

Run the MCP server:

```bash
npm run mcp
```

## MCP Config

Use `mcp.example.json` as the package config template:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["--yes", "--package", "github:NikolaCehic/Archetype", "archetype-mcp"]
    }
  }
}
```

Local source variant:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "node",
      "args": ["/absolute/path/to/Archetype/dist/mcp/server.js"]
    }
  }
}
```

Current GitHub package form:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["--yes", "--package", "github:NikolaCehic/Archetype", "archetype-mcp"]
    }
  }
}
```

## Tools

- `archetype_create_intake`
- `archetype_release_doctor`
- `archetype_answer_clarification`
- `archetype_generate_package`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`
- `archetype_plan_repair`

The tools are deterministic wrappers around intake creation, one-question clarification updates, compiler output, package validation, artifact reading, target verification, and repair-task planning. They do not run a general-purpose agent.

`archetype_verify_target` defaults `skipInstall` to `true` for MCP safety. Pass `skipInstall: false` only when the user or host explicitly allows dependency installation in the target frontend.

`archetype_verify_target` also enforces `test-first/test-quality-standard.json`; target tests that only check generated markers fail before Playwright runs.

Use `archetype_release_doctor` before setup demos or plugin install support to verify the package, docs, plugin wrappers, MCP configs, and lifecycle readiness surface.

Use `archetype_plan_repair` after target verification to write `10-revision/repair-task-queue.json` and `10-revision/repair-plan.md` from the latest evidence.
