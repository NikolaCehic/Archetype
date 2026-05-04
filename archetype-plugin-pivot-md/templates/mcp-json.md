# Template — MCP Config

File path for plugins:

```txt
plugins/claude-code/.mcp.json
plugins/codex/.mcp.json
```

Template:

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

Local development variant:

```json
{
  "mcpServers": {
    "archetype": {
      "command": "node",
      "args": ["./dist/mcp/server.js"]
    }
  }
}
```
