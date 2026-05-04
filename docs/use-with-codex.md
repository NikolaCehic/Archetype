# Use Archetype With Codex

Archetype should feel like one Codex workflow, not a sequence of user-managed commands.

## Natural Front Door

```txt
@Archetype "I want to build a premium B2B analytics app for marketing teams."
```

Codex should:

- treat `/archetype` or `@Archetype` as the full lifecycle by default
- ask clarification questions when product context is incomplete
- invite optional `@` files, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, or repo context
- read the imported `@` files itself
- create `archetype.intake.json`
- generate `archetype-output`
- create executable tests from the generated contract before implementation
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Codex.

## Internal Contract Files

When implementation starts, Codex reads `lifecycle/context-completion.json`, `AGENTS.md`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json`.

## Use The MCP Server

For MCP-capable Codex workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_generate_package`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, and `archetype_verify_target`.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Codex plugin work is tracked in `archetype-plugin-pivot-md/scopes/08-codex-plugin.md`.
