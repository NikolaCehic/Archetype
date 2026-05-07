# Codex Prompt — Phase 05 Plugins

Use this prompt inside the Archetype repo.

```txt
Read AGENTS.md, scopes/07-claude-code-plugin.md, and scopes/08-codex-plugin.md.

Create plugin wrapper files only:

Claude Code:
- plugins/claude-code/.claude-plugin/plugin.json
- skills/blueprint/SKILL.md
- skills/implement/SKILL.md
- skills/verify/SKILL.md
- skills/revise/SKILL.md
- agents/product-architect.md
- agents/frontend-contract-reviewer.md
- .mcp.json

Codex:
- plugins/codex/.codex-plugin/plugin.json
- skills/archetype-blueprint/SKILL.md
- skills/archetype-implement/SKILL.md
- skills/archetype-verify/SKILL.md
- skills/archetype-revise/SKILL.md
- .mcp.json

Each skill should call MCP tools when available and CLI fallback when MCP is unavailable.

Do not change core compiler behavior unless a missing CLI/MCP command blocks plugin usage.

After changes, summarize plugin file structure and how to test locally.
```
