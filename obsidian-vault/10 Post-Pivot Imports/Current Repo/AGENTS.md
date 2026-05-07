# Archetype Repository Instructions

This repository contains the Archetype agent harness for frontend implementation contracts.

## Product Category

Frontend implementation contracts for AI coding agents.

## Product Scope

Archetype provides:

- deterministic core compiler behavior
- public CLI commands
- generated `archetype-output` packages
- agent-readable `AGENTS.md` and `CLAUDE.md`
- generated test-first contracts for smoke, E2E, UI, integration, and unit tests
- MCP tools for generate, validate, read, summarize, and verify
- Claude Code and Codex plugin wrappers

## Product Boundaries

Do not rebuild Archetype as a hosted web app, SaaS dashboard, account system, billing surface, generic autonomous agent, or no-code builder.

Keep the compiler framework-agnostic. Keep Claude-specific and Codex-specific behavior out of core.

## Completion Standard

Every product change should preserve or improve the CLI path:

```bash
npm run build
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output
npx . validate --out archetype-output
```

Before publishing-facing changes are complete, run:

```bash
npm run repo:audit
npm run check
```
