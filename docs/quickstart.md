# Archetype Quickstart

Goal: install Archetype into agent hosts and prove the fallback CLI path in about 60 seconds.

## GitHub Package Install

Install the Codex and Claude Code plugin surfaces:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

This writes:

- `~/.codex/skills/archetype/` for the Codex front-door skill
- `~/.codex/skills/archetype-blueprint/`, `~/.codex/skills/archetype-implement/`, `~/.codex/skills/archetype-verify/`, and `~/.codex/skills/archetype-revise/`
- `~/.codex/plugins/archetype/` and `~/plugins/archetype/` for the Codex plugin surface
- `~/plugins/archetype/agents/` for specialist role files
- `~/.agents/plugins/marketplace.json` for Codex plugin discovery
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/` for Claude Code
- `~/.claude/plugins/marketplaces/archetype-local/.claude-plugin/marketplace.json` for Claude Code marketplace discovery
- `~/.claude/skills/archetype/` for the Claude Code `/archetype` front door

When the `claude` CLI is available, the installer also registers `archetype-local` and installs/enables `archetype@archetype-local`.

Then start a fresh Codex or Claude Code session.

## Natural Front Doors

```txt
Codex: $archetype "I want to build a premium B2B analytics app for marketing teams."
Claude Code: /archetype "I want to build a premium B2B analytics app for marketing teams."
```

In Codex, use `@` only to attach project files and folders, for example `@SPEC.md` or `@screenshots/login.png`.

The plugin flow should clarify missing context, ask for optional materials, generate `archetype-output`, stop for draft approval when needed, drive tests first after canonical spec approval, verify with Playwright, and plan repair tasks without making the user learn internal commands.

## Diagnostics And CLI Fallback

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

Read first:

```txt
archetype-output/lifecycle/contract-state.json
archetype-output/lifecycle/execution-state.json
archetype-output/draft/frontend-contract.draft.json
archetype-output/draft/assumption-ledger.md
archetype-output/draft/contract-approval-request.json
```

After human approval, regenerate and read `archetype-output/spec/archetype-spec.md`, `archetype-output/test-first/test-first-plan.md`, `archetype-output/AGENTS.md`, or `archetype-output/CLAUDE.md`.

## Local Source

```bash
npm install
npm run build
npx . install --target all --json
npx . doctor --json
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
```
