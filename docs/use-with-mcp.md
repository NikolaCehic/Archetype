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
      "args": ["-y", "-p", "@nikolacehic/archetype", "archetype-mcp"]
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

Published package form:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "npx",
      "args": ["-y", "-p", "@nikolacehic/archetype", "archetype-mcp"]
    }
  }
}
```

## Tools

- `archetype_create_intake`
- `archetype_generate_package`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`

The tools are deterministic wrappers around the compiler, package validation, artifact reading, and target verification. They do not run a general-purpose agent.

`archetype_verify_target` defaults `skipInstall` to `true` for MCP safety. Pass `skipInstall: false` only when the user or host explicitly allows dependency installation in the target frontend.
