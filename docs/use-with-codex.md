# Use Archetype With Codex

Archetype should feel like one Codex workflow, not a sequence of user-managed commands.

## Natural Front Door

```txt
@Archetype @docs/product-brief.md @screens/dashboard.png Build this frontend. Ask me what is missing, then implement and verify.
```

Codex should:

- read the imported `@` files itself
- ask one compact set of missing-context questions only when needed
- create `archetype.intake.json`
- generate `archetype-output`
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Codex.

## Internal Contract Files

When implementation starts, Codex reads `AGENTS.md`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json`.

## Use The MCP Server

For MCP-capable Codex workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_generate_package`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, and `archetype_verify_target`.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Codex plugin work is tracked in `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`.
