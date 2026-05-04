# Use Archetype With Claude Code

Archetype should feel like one Claude Code workflow, not a sequence of user-managed commands.

## Natural Front Door

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Claude Code should:

- treat `/archetype` as the full lifecycle by default
- ask clarification questions when product context is incomplete
- invite optional `@` files, screenshots, wireframes, `SPEC.md`, `PRD.md`, brand notes, or repo context
- read the imported `@` files itself
- create `archetype.intake.json`
- generate `archetype-output`
- create executable tests from the generated contract before implementation
- implement from the generated contract
- verify the target frontend
- patch or revise until verification is acceptable

The user should not need to know `generate`, `validate`, `verify-target`, or which generated file to hand back to Claude Code.

## Internal Contract Files

When implementation starts, Claude Code reads `lifecycle/context-completion.json`, `spec/archetype-spec.md`, `spec/archetype-spec.json`, `test-first/test-first-contract.json`, `test-first/test-first-plan.md`, `CLAUDE.md`, `implementation-contract.md`, `experience/route-map.json`, `screens/screen-inventory.json`, `design-system/tokens.json`, and `frontend-agent-contract/implementation-rules.json`.

Claude Code creates the smoke, E2E, UI, integration, and unit tests declared in `test-first/test-first-contract.json` before product UI implementation, preserves the initial red result, then implements until the same tests pass.

## Use The MCP Server

For MCP-capable Claude Code workflows, use `docs/use-with-mcp.md` and `mcp.example.json`. The server exposes `archetype_generate_package`, `archetype_validate_package`, `archetype_summarize_package`, `archetype_read_artifact`, and `archetype_verify_target`.

## Verify Before Completion

```bash
npx . summarize --out archetype-output --json
npx . validate --out archetype-output --json
npx . verify-target --out archetype-output --target . --json
```

Claude Code plugin work is tracked in `archetype-plugin-pivot-md/scopes/07-claude-code-plugin.md`.
