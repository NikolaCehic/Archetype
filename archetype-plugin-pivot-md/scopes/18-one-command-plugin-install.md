# Scope 18 - One-Command Plugin Install

## Purpose

Close the 60-second setup gap. Archetype must not ask users to understand repository plugin folders before they can try the product.

The current product install path uses the GitHub package because the npm package is not published yet:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

After that, the user should start a fresh Codex or Claude Code session and use the natural front door:

```txt
@Archetype "project idea"
/archetype "project idea"
```

## Retained Scope

- Add root-level `.codex-plugin/plugin.json` and `.claude-plugin/plugin.json`.
- Add root-level `.mcp.json`.
- Add root-level `skills/` and `agents/` so the package itself is the plugin surface.
- Add Codex marketplace metadata at `.agents/plugins/marketplace.json`.
- Add `archetype install` with `--target codex|claude|all`, `--home`, `--dry-run`, and `--json`.
- Write Codex plugin files to `~/plugins/archetype/`.
- Write Codex home-local marketplace metadata to `~/.agents/plugins/marketplace.json`.
- Write Claude Code local marketplace metadata to `~/.claude/plugins/marketplaces/archetype-local/.claude-plugin/marketplace.json`.
- Write Claude Code plugin files to `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/`.
- Add a plugin install contract that proves source, dry-run, packed package, and `npx -p <tarball>` install behavior.
- Update README, quickstart, install, plugin, and release readiness docs to make the install command the primary path.

## Removed Scope

- Do not ask users to point an agent host at `plugins/codex/` or `plugins/claude-code/` as the default path.
- Do not make setup depend on users knowing CLI generation commands.
- Do not add a hosted installer, account system, cloud service, telemetry, or web workbench.
- Do not remove the nested plugin wrappers yet; keep them as compatibility fixtures and contract-test references.

## Required Surfaces

```txt
archetype install --target all --json
.codex-plugin/plugin.json
.claude-plugin/plugin.json
.mcp.json
skills/archetype/SKILL.md
agents/product-architect.md
.agents/plugins/marketplace.json
scripts/run-plugin-install-contract.mjs
```

## Pass Condition

```txt
A clean home directory can receive Codex and Claude Code plugin surfaces from source and from the packed package through one command, and the command produces the natural front doors without requiring folder-path instructions.
```

## Codex Instruction

Use the Superpowers-style root plugin layout as the product packaging precedent. Keep Archetype an agent harness: the installer only wires plugin surfaces, skills, agents, and MCP config into agent hosts.
