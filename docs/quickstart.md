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

Open the local review console when a package exists:

```txt
archetype-output/review-console/index.html
```

It shows decisions, not a raw artifact tree: current phase, what Archetype knows, missing inputs, one question, attached materials, route proposals, design preview, approval checklist, blockers, timeline, and next legal action.

## Diagnostics And CLI Fallback

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype run "I want to build a premium B2B analytics app for marketing teams." --out archetype-output --force --json
npx --yes --package github:NikolaCehic/Archetype archetype next-action --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype phase-package --out archetype-output --phase draft_review --target archetype-phase-package --force --json
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

Read first:

```txt
archetype-output/agent-context/consumer-plane.json
archetype-output/agent-context/context-summary.json
archetype-output/agent-context/phase-bundles/index.json
archetype-output/agent-context/phase-bundles/<current-phase>.json
archetype-output/governance/agent-control-plane.json
```

The consumer plane tells the host what to say, which full artifacts are legal now, and which reads to defer. Draft review may point to `archetype-output/review-console/index.html`, `archetype-output/draft/design-system-preview.html`, `archetype-output/draft/design-directions.json`, `archetype-output/draft/design-quality-gate.json`, `archetype-output/draft/design-craft-rubric.md`, and `archetype-output/draft/contract-approval-request.json`. After human approval, Archetype writes the canonical package and the host starts from the test-first phase bundle before reading implementation artifacts.

The design-quality gate blocks default blue-gray SaaS output, untouched shadcn defaults, generic card-grid dashboards, missing component states, and raw Tailwind visual literals before implementation.

After approval, `12-target-frontend/source-file-manifest.json` defines the target app architecture. Archetype now emits a stack-aware feature/shared/design-system structure: Next.js App Router targets use `src/app` for route wiring, Vite + React Router targets use `src/routes` plus `src/App.tsx`, `src/features/<screen-id>/screens` owns product screen composition, `src/features/<workflow>/patterns` owns workflow patterns, `src/shared/ui` and `src/shared/layout` own reusable contract-bound UI, `src/shared/api` and `src/shared/auth` own external boundaries, and `src/design-system` owns generated tokens.

The review decision path is proof-bound:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype review --draft archetype-output --input archetype.intake.json --decision approve --reviewer "Your name" --out archetype-output-approved --force --json
```

Requesting changes is also a first-class decision:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype review --draft archetype-output --input archetype.intake.json --decision request_changes --reviewer "Your name" --feedback "Change the design direction before approval." --out archetype-output-revised --force --json
```

Do not hand-edit `contractApproval` into the intake. Archetype only treats a contract as implementation-authorized when the review primitive writes an approval artifact that matches the draft package id, source hash, package checksum, required draft artifact hashes, and draft contract fingerprint. `archetype-output/governance/agent-control-plane.json` is the machine-readable authority for whether an agent may move to implementation.

Generated output directories include `.archetype-output-marker`. Archetype refuses to overwrite arbitrary non-empty folders or project roots, even with `--force`, unless the marker proves the folder was generated by Archetype.

## Local Source

```bash
npm install
npm run build
npx . install --target all --json
npx . doctor --json
npx . run "I want to build a premium B2B analytics app for marketing teams." --out archetype-output --force --json
npx . next-action --out archetype-output --json
npx . phase-package --out archetype-output --phase draft_review --target archetype-phase-package --force --json
npx . init --template saas-dashboard --out archetype.intake.json --force --json
npx . generate --input archetype.intake.json --out archetype-output --json
npx . review --draft archetype-output --input archetype.intake.json --decision approve --reviewer "Your name" --out archetype-output-approved --force --json
```
