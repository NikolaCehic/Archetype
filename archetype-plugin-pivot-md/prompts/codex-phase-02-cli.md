# Codex Prompt — Phase 02 CLI Contract

Use this prompt inside the Archetype repo.

```txt
Read AGENTS.md and scopes/04-cli-contract.md.

Stabilize the public CLI command surface:

- archetype init
- archetype generate
- archetype validate
- archetype summarize
- archetype simulate
- archetype write-target
- archetype verify-target

Add --json support where commands return status/results.

The CLI must emit parseable, deterministic output suitable for Codex/Claude/MCP calls.

Do not add interactive flows. Do not add plugin code. Do not add cloud/workbench dependencies.

After changes, run a full example command sequence and report exact commands/results.
```
