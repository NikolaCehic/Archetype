# Release Readiness

Release readiness means a user or AI agent can install Archetype into Codex and Claude Code, verify setup, start the MCP server, review the current lifecycle state, and continue through the harness without reverse-engineering the repository.

## One-Command Install

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

This is the primary 60-second setup path. It writes the Codex home-local marketplace, the Claude Code local marketplace, direct Codex and Claude Code skills, slash command files, agents, and MCP config. When the `claude` CLI is available, it also installs/enables `archetype@archetype-local`.

## Doctor

Run the package doctor before claiming a release is ready:

```bash
npm run build
npx . doctor --json
```

For the current GitHub package:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
```

The doctor checks package metadata, CLI and MCP bins, packaged file allowlist, root plugin surfaces, docs, plugin wrappers, MCP configs, examples, and release contract files.

## Contracts

```bash
npm run check:fast
npm run check:contracts
npm run check:release
npm run release:contract
npm run plugin-install:contract
npm run repo:audit
npm run install:contract
npm pack --dry-run --json
npm run check
npm run clean:tmp-heavy
```

`release:contract` validates the source and packed package readiness surface. `plugin-install:contract` proves the host installer writes Codex and Claude Code plugin surfaces from source and packed `npx`. `repo:audit` blocks internal logs, generated outputs, private env files, and package tarballs from the tracked repository. `install:contract` proves a clean consumer install, `npx` setup, MCP startup, plugin files, and the 60-second setup contract.

`npm run check` and `npm run test` use the build-once `scripts/run-contract-suite.mjs` runner. The split suites are:

- `check:fast`: cheap lifecycle, natural-language run primitive, registry, context, consumer plane, review console, progressive handoff, role, and governance contracts.
- `check:contracts`: runtime contracts including real verification, CLI, MCP, QA, Playwright, and repair.
- `check:release`: package, plugin, install, distribution, and golden release checks.

Each suite writes `tmp/contract-suite/<suite>-timings.json` and `.md` with per-contract timing, workspace disk usage, token-budget estimates, and the target dependency cache path. Target frontend installs share the `ARCHETYPE_TARGET_NPM_CACHE_DIR` target dependency cache when set. Use `npm run clean:tmp-heavy` to remove heavy temporary `node_modules`, `.next`, Playwright report, and test-result folders without deleting every diagnostic artifact.

`npm run session-console:contract` proves the Review Console, progressive/lazy contract index, phase token budget, MCP resource/prompt descriptors, orchestration contracts, attachment UX, blocker explanations, and phase-package handoff are present. It also proves phase-package output is smaller than the full output and refuses unsafe overlapping source/target paths.

Release artifacts must expose the same current-phase surfaces through CLI, MCP tools, MCP resources, MCP prompts, skills, docs, and plugin command wrappers.

## Completion Gate

Do not claim release readiness unless all of these pass:

```txt
archetype doctor --json
npm run check:fast
npm run check:contracts
npm run check:release
npm run release:contract
npm run plugin-install:contract
npm run repo:audit
npm run install:contract
npm pack --dry-run --json
npm run check
```
