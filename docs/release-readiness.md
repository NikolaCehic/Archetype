# Release Readiness

Release readiness means a user or AI agent can install Archetype into Codex and Claude Code, verify setup, start the MCP server, and understand the lifecycle without reverse-engineering the repository.

## One-Command Install

```bash
npx -y -p @nikolacehic/archetype archetype install --target all --json
```

This is the primary 60-second setup path. It writes the Codex home-local marketplace, the Claude Code local marketplace, the root plugin manifests, skills, agents, and MCP config.

## Doctor

Run the package doctor before claiming a release is ready:

```bash
npm run build
npx . doctor --json
```

For a published package:

```bash
npx -y -p @nikolacehic/archetype archetype install --target all --json
npx -y -p @nikolacehic/archetype archetype doctor --json
```

The doctor checks package metadata, CLI and MCP bins, published file allowlist, root plugin surfaces, docs, plugin wrappers, MCP configs, examples, and release contract files.

## Contracts

```bash
npm run release:contract
npm run plugin-install:contract
npm run install:contract
npm pack --dry-run --json
npm run check
```

`release:contract` validates the source and packed package readiness surface. `plugin-install:contract` proves the host installer writes Codex and Claude Code plugin surfaces from source and packed `npx`. `install:contract` proves a clean consumer install, `npx` setup, MCP startup, plugin files, and the 60-second setup contract.

## Completion Gate

Do not claim release readiness unless all of these pass:

```txt
archetype doctor --json
npm run release:contract
npm run plugin-install:contract
npm run install:contract
npm pack --dry-run --json
npm run check
```
