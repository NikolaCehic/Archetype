# AGENTS.md — Archetype Plugin Pivot Instructions

## Project Goal

Transform Archetype into a plugin-first developer tool for AI coding agents.

Primary product category:

```txt
Frontend implementation contracts for AI coding agents.
```

Do not implement broad autonomous-agent behavior unless it directly supports contract generation, implementation guidance, or verification.

## Global Implementation Rules

- Keep the core compiler framework-agnostic.
- Keep Claude-specific logic out of core.
- Keep Codex-specific logic out of core.
- Keep MCP tools deterministic and explicit.
- Prefer small, parseable CLI outputs over prose-heavy outputs.
- Generate `AGENTS.md` and `CLAUDE.md` into `archetype-output` so agent hosts can consume the package even without plugins.
- Do not make the workbench the primary product surface.
- Do not add cloud features, auth, billing, dashboards, or marketplace polish before CLI + output + MCP + plugin MVP works.

## Preferred Architecture

```txt
packages/core      deterministic compiler
packages/cli       public command surface
packages/mcp       agent tool server
plugins/claude-code Claude Code plugin wrapper
plugins/codex       Codex plugin wrapper
examples/          demo intakes and app targets
docs/              user-facing docs
```

## Product Boundaries

### In Scope

- Product brief to frontend contract
- Existing output contract stabilization
- CLI generation/validation/verification
- MCP tools for generate/validate/read/verify
- Claude Code plugin skills and subagents
- Codex plugin skills
- Generated `AGENTS.md` and `CLAUDE.md`
- Demo implementation flow

### Out of Scope For MVP

- Cloud app
- Team accounts
- Billing
- Figma OAuth
- Slack/Jira integrations
- Large marketplace campaign
- Complex multi-agent orchestration
- Design inspiration gallery
- Full no-code app builder

## Execution Discipline

When changing the repo:

1. Identify which scope file applies.
2. Do only that scope unless a dependency is unavoidable.
3. Keep command names stable.
4. Add or update tests around compiler/CLI behavior.
5. Make outputs machine-readable where possible.
6. Update docs only after behavior is implemented.

## Definition Of Done

The pivot is done when all are true:

```txt
[ ] CLI can generate an Archetype package from an example intake.
[ ] CLI can validate the generated package.
[ ] CLI can summarize the generated package as JSON.
[ ] CLI can verify a target frontend against the package.
[ ] Generated package includes AGENTS.md.
[ ] Generated package includes CLAUDE.md.
[ ] Generated package includes implementation-contract.md.
[ ] Generated package includes verification-plan.md.
[ ] MCP server exposes generate/validate/read/verify tools.
[ ] Claude Code plugin can invoke blueprint/implement/verify workflows.
[ ] Codex plugin can invoke blueprint/implement/verify workflows.
[ ] README has a quickstart that produces value in under 10 lines.
[ ] Demo proves: brief → contract → implementation → verification.
```
