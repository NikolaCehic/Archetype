# Use Archetype With Claude Code

Archetype should feel like one Claude Code workflow, not a sequence of user-managed commands.

## Natural Front Door

```txt
/archetype @docs/product-brief.md @screens/dashboard.png Build this frontend. Ask me what is missing, then implement and verify.
```

Claude Code should:

- read the imported `@` files itself
- ask one compact set of missing-context questions only when needed
- create `archetype.intake.json`
- generate `archetype-output`
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Claude Code.

## Internal Contract Files

When implementation starts, Claude Code reads `CLAUDE.md`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json`.

## Use The MCP Server

For MCP-capable Claude Code workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_generate_package`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, and `archetype_verify_target`.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Claude Code plugin work is tracked in `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`.
