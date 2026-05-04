# Template — Codex Plugin Manifest

File path:

```txt
plugins/codex/.codex-plugin/plugin.json
```

Template:

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
  "mcpServers": "./.mcp.json",
  "interface": {
    "displayName": "Archetype",
    "shortDescription": "Frontend contracts for coding agents",
    "longDescription": "Turn product briefs, screenshots, and design notes into implementation-ready frontend contracts for Codex.",
    "developerName": "Nikola Cehic",
    "category": "Developer Tools",
    "capabilities": ["Read", "Write"]
  }
}
```
