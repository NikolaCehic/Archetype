# Codex Prompt — Phase 04 MCP Server

Use this prompt inside the Archetype repo.

```txt
Read AGENTS.md and scopes/06-mcp-server.md.

Create the Archetype MCP server package or module.

Expose these deterministic tools:

- archetype_create_intake
- archetype_generate_package
- archetype_validate_package
- archetype_summarize_package
- archetype_read_artifact
- archetype_verify_target

Tools should call existing core/CLI behavior and return structured results.

Do not implement a general-purpose autonomous agent inside the MCP server. The server executes deterministic actions only.

Add local startup instructions and a sample .mcp.json.

After changes, run whatever local validation is possible and summarize tool names, inputs, outputs, and limitations.
```
