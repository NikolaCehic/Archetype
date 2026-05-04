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
      "args": ["-y", "@nikolacehic/archetype-mcp"]
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
      "args": ["./packages/mcp/dist/server.js"]
    }
  }
}
```
