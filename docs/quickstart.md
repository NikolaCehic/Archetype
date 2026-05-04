# Archetype Quickstart

Goal: install Archetype into agent hosts and prove the fallback CLI path in about 60 seconds.

## Published Package Install

Install the Codex and Claude Code plugin surfaces:

```bash
npx -y -p @nikolacehic/archetype archetype install --target all --json
```

This writes:

- `~/plugins/archetype/` for Codex
- `~/.agents/plugins/marketplace.json` for Codex plugin discovery
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/` for Claude Code
- `~/.claude/plugins/marketplaces/archetype-local/.claude-plugin/marketplace.json` for Claude Code marketplace discovery

Then start a fresh Codex or Claude Code session.

## Natural Front Doors

```txt
@Archetype "I want to build a premium B2B analytics app for marketing teams."
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

The plugin flow should clarify missing context, ask for optional materials, generate `archetype-output`, drive tests first, verify with Playwright, and plan repair tasks without making the user learn internal commands.

## Diagnostics And CLI Fallback

```bash
npx -y -p @nikolacehic/archetype archetype doctor --json
npx -y -p @nikolacehic/archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx -y -p @nikolacehic/archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

Read first:

```txt
archetype-output/AGENTS.md
archetype-output/CLAUDE.md
archetype-output/spec/archetype-spec.md
archetype-output/test-first/test-first-plan.md
```

## Local Source

```bash
npm install
npm run build
npx . install --target all --json
npx . doctor --json
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
```
