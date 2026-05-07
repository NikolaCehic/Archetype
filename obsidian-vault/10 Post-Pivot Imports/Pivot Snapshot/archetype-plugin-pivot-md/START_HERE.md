# Archetype Plugin Pivot — Start Here

## Objective

Pivot Archetype from a local compiler/workbench into a plugin-first product for AI coding agents.

The product should be positioned as:

> Archetype turns product intent into frontend implementation contracts that Claude Code, Codex, and other coding agents can actually follow.

The compiler remains the engine. The plugin layer becomes the product surface.

## Core Thesis

Coding agents can write code, but they often guess product architecture. Archetype should reduce guessing by generating a deterministic contract that contains:

- product model
- route map
- screen inventory
- screen states
- design-system tokens
- component contracts
- data/action/form contracts
- acceptance criteria
- verification plan
- readiness report

## Target User Journey

```txt
Product brief / screenshots / brand notes / existing repo context
        ↓
Archetype plugin or CLI
        ↓
archetype-output contract package
        ↓
Claude Code / Codex implements from the contract
        ↓
Archetype verification checks implementation against contract
```

## Non-Negotiable Product Rule

Do not position Archetype as a generic autonomous AI agent.

Position it as:

```txt
Frontend implementation contracts for AI coding agents.
```

## How To Use This Doc Pack

This folder is split by scope so Codex does not have to ingest one giant context blob.

Recommended sequence:

1. Read `AGENTS.md` for global implementation rules.
2. Read the specific file in `scopes/` for the current task.
3. Use the matching file in `prompts/` when asking Codex to execute that phase.
4. Use files in `templates/` as copy/paste starting points.

## Scope Files

```txt
scopes/01-product-positioning.md
scopes/02-repo-package-cleanup.md
scopes/03-core-compiler.md
scopes/04-cli-contract.md
scopes/05-output-contract.md
scopes/06-mcp-server.md
scopes/07-claude-code-plugin.md
scopes/08-codex-plugin.md
scopes/09-demo-and-examples.md
scopes/10-roadmap-and-acceptance.md
scopes/11-readme-rewrite.md
```

## Build Order

```txt
1. Product positioning
2. Repo/package cleanup
3. Core compiler isolation
4. Public CLI contract
5. Generated agent-readable output
6. MCP server
7. Claude Code plugin
8. Codex plugin
9. Demo project
10. Distribution docs
```

## MVP Definition

The MVP is successful when:

```txt
A stranger can install/use Archetype, generate a frontend contract, hand it to Claude Code or Codex, implement the frontend, and verify the implementation without reading Archetype source code.
```
