# Release Readiness

Release readiness means a user or AI agent can install Archetype, verify setup, start the MCP server, load the plugin wrapper, and understand the lifecycle without reverse-engineering the repository.

## Doctor

Run the package doctor before claiming a release is ready:

```bash
npm run build
npx . doctor --json
```

For a published package:

```bash
npx -y -p @nikolacehic/archetype archetype doctor --json
```

The doctor checks package metadata, CLI and MCP bins, published file allowlist, docs, plugin wrappers, MCP configs, examples, and release contract files.

## Contracts

```bash
npm run release:contract
npm run install:contract
npm pack --dry-run --json
npm run check
```

`release:contract` validates the source and packed package readiness surface. `install:contract` proves a clean consumer install, `npx` setup, MCP startup, plugin files, and the 60-second setup contract.

## Completion Gate

Do not claim release readiness unless all of these pass:

```txt
archetype doctor --json
npm run release:contract
npm run install:contract
npm pack --dry-run --json
npm run check
```
