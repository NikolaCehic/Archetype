# Archetype

Frontend implementation contracts for AI coding agents.

Archetype turns product briefs, screenshots, brand notes, and existing frontend context into structured contracts that Claude Code, Codex, and other coding agents can follow.

Instead of asking an agent to guess routes, screens, states, design tokens, data contracts, and acceptance criteria, generate an Archetype contract first.

## Quickstart

Install Archetype into Codex and Claude Code:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

Then start a fresh agent session and use Archetype as one natural-language workflow:

```txt
Codex: $archetype "I want to build a premium B2B analytics app for marketing teams."
Claude Code: /archetype "I want to build a premium B2B analytics app for marketing teams."
```

Archetype should then ask any needed clarification questions, invite optional materials such as designs, screenshots, wireframes, `SPEC.md`, or `PRD.md`, generate the spec and agent contract, drive tests-first implementation, verify the target, and patch or revise without making you learn internal commands.

CLI fallback and diagnostics:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
npx --yes --package github:NikolaCehic/Archetype archetype approve-draft --draft archetype-output --input archetype.intake.json --out archetype.approved.intake.json --approved-by "Your name" --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.approved.intake.json --out archetype-output --force --json
```

See `docs/quickstart.md`, `docs/agent-lifecycle.md`, and `docs/release-readiness.md`.

Archetype includes a deterministic local Agent Data Plane. It records run state, lifecycle gates, evidence, generated artifact lineage, verification status, and repair provenance under `archetype-output/data-plane/` so humans and agents can inspect and replay what happened without relying on hidden memory. See `docs/agent-data-plane.md` and `docs/AGENT_DATA_PLANE_PLAN.md`.

Archetype also includes a central artifact registry in `src/artifacts/registry.ts`. It is the source of truth for generated manifest entries, internal artifact indexes, validator required paths, data-plane artifact metadata, and agent read order. See `docs/artifact-registry.md`.

## What It Does

Archetype compiles product intent into a frontend implementation package:

- product model
- route map
- screen inventory
- screen states
- design-system tokens
- component contracts
- data, action, and form contracts
- acceptance criteria
- test-first contracts
- Playwright-backed verification contract and evidence
- QA scenario catalog and evidence reports
- revision and repair task queue
- verification plan
- readiness report
- specialist agent role files under `agents/`

## Core Flow

```txt
Product brief / screenshots / brand notes / repo context
        ↓
Archetype clarifies context and optionally ingests files
        ↓
draft archetype-output contract package with a browser-viewable design-system preview
        ↓
bound human approval proof via `archetype approve-draft`
        ↓
canonical archetype-output contract package
        ↓
Agent Data Plane records run events, artifact lineage, and projections
        ↓
Claude Code / Codex writes tests first and implements from the contract
        ↓
Archetype verifies the implementation against the contract
```

## CLI

Install paths are in `docs/install.md`.

Install the agent-host plugin surfaces:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

Check package, plugin, MCP, and lifecycle readiness:

```bash
npx . doctor --json
```

Create a starter intake:

```bash
npx . init --template saas-dashboard --out archetype.intake.json --json
```

Generate a contract package:

```bash
npx . generate --input examples/saas-dashboard-intake.json --out archetype-output --json
```

Approve a draft contract after human review:

```bash
npx . approve-draft --draft archetype-output --input examples/saas-dashboard-intake.json --out archetype.approved.intake.json --approved-by "Your name" --json
npx . generate --input archetype.approved.intake.json --out archetype-output --force --json
```

`approve-draft` writes a sidecar approval proof and binds the approved intake to the draft package id, source hash, package checksum, and required draft artifact hashes. Editing `contractApproval` into intake JSON by hand is not an implementation authorization path.

Draft generation is phase-safe: before bound approval, Archetype writes only clarification, evidence, governance, review, and draft artifacts. Canonical spec, test-first, Playwright verification, target, QA, and repair artifacts are constructed only after the approved intake is regenerated.

Validate the package:

```bash
npx . validate --out archetype-output --json
```

Summarize compact agent context:

```bash
npx . summarize --out archetype-output --json
npx . summarize --out archetype-output --compact --json
```

Every generated package now includes a token-bounded agent context surface. Start with `agent-context/context-summary.json`, then open one current file from `agent-context/phase-bundles/` such as `draft-review.json`, `test-first.json`, `implementation.json`, `verification.json`, `qa.json`, or `repair.json`. Agents should only request full artifacts when the active phase bundle names them.

Simulate implementation readiness:

```bash
npx . simulate --out archetype-output --json
```

Write a deterministic target frontend scaffold:

```bash
npx . write-target --out archetype-output --target tmp/generated-frontend --force --json
```

Verify a target frontend:

```bash
npx . verify-target --out archetype-output --target tmp/generated-frontend --json
```

Plan repair tasks from the latest verification evidence:

```bash
npx . repair --out archetype-output --target tmp/generated-frontend --json
```

Inspect the Agent Data Plane without rereading large artifacts:

```bash
npx . data-plane status --out archetype-output --json
npx . data-plane timeline --out archetype-output --run <run-id> --json
npx . data-plane artifacts --out archetype-output --run <run-id> --priority hot --limit 10 --json
npx . data-plane read-artifact --out archetype-output --artifact <artifact-id> --json
npx . data-plane lifecycle --out archetype-output --run <run-id> --json
npx . data-plane replay --out archetype-output --run <run-id> --json
```

## MCP

Start the local MCP server:

```bash
npm run build
npm run mcp
```

The server exposes deterministic tools for agent hosts:

- `archetype_release_doctor`
- `archetype_create_intake`
- `archetype_answer_clarification`
- `archetype_generate_package`
- `archetype_data_plane_status`
- `archetype_data_plane_timeline`
- `archetype_data_plane_artifacts`
- `archetype_data_plane_read_artifact`
- `archetype_data_plane_lifecycle`
- `archetype_data_plane_replay_run`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`
- `archetype_plan_repair`

See `docs/use-with-mcp.md` and `mcp.example.json`.

Installation details are in `docs/install.md`.

## What Archetype Generates

`archetype-output/` is a generated directory and is protected by a `.archetype-output-marker`. Archetype refuses to recursively overwrite arbitrary non-empty folders or project roots. Target frontend scaffolds use `.archetype-target-marker` with the same safety rule.

`archetype-output/` is gated by lifecycle readiness:

- Clarification packages include `lifecycle/start-request.json`, `lifecycle/context-matrix.json`, `lifecycle/implementation-phases.json`, `lifecycle/clarification-turn.json`, `lifecycle/clarification-state.json`, `01-evidence/evidence-ledger.json`, `01-evidence/missing-context.md`, `governance/forbidden-behaviors.json`, and `governance/convergence-standard.json`.
- Draft contract packages include `lifecycle/implementation-phases.json`, `draft/product-model.draft.json`, `draft/experience-architecture.draft.json`, `draft/design-system.draft.json`, `draft/design-system-preview.html`, `draft/design-system-review.md`, `draft/frontend-contract.draft.json`, `draft/assumption-ledger.md`, `draft/specialist-review.json`, `governance/frontend-practice-skills.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, and `draft/contract-approval-request.json`.
- Canonical packages are generated only after human approval and include `spec/archetype-spec.md`, `spec/archetype-spec.json`, `governance/forbidden-behaviors.json`, `governance/convergence-standard.json`, `test-first/test-first-contract.json`, `test-first/test-quality-standard.json`, `test-results/initial-red-test-run.md`, `lifecycle/approval-request.md`, `lifecycle/approval-decision.json`, `lifecycle/execution-state.json`, `lifecycle/implementation-phases.json`, `lifecycle/final-readiness-report.md`, `draft/design-system-preview.html`, `reviews/specialist-review-summary.md`, `verification/playwright-verification-contract.json`, `verification/playwright-evidence.json`, `implementation-contract.md`, `AGENTS.md`, `CLAUDE.md`, `frontend-agent-contract/`, `10-revision/repair-task-queue.json`, and target generation artifacts.
- Every package includes `manifest.json`, `agent-context/context-summary.json`, `agent-context/phase-bundles/index.json`, readiness artifacts, evidence artifacts, and lifecycle state artifacts.

## Use With Claude Code

Install:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target claude --json
```

Then use:

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Installed Claude Code plugin surface:

- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.claude-plugin/plugin.json`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/commands/archetype.md`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/skills/`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/agents/`
- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype/.mcp.json`
- `~/.claude/skills/archetype/SKILL.md`

Install notes: `docs/install-claude-code-plugin.md`.

The Claude Code installer writes both the plugin surface and `~/.claude/skills/archetype/`, then installs/enables `archetype@archetype-local` when the `claude` CLI is available.

## Use With Codex

Install:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target codex --json
```

Then use:

```txt
$archetype "I want to build a premium B2B analytics app for marketing teams."
```

Installed Codex plugin surface:

- `~/.codex/skills/archetype/SKILL.md`
- `~/.codex/skills/archetype-blueprint/SKILL.md`
- `~/.codex/skills/archetype-implement/SKILL.md`
- `~/.codex/skills/archetype-verify/SKILL.md`
- `~/.codex/skills/archetype-revise/SKILL.md`
- `~/.codex/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/.codex-plugin/plugin.json`
- `~/plugins/archetype/skills/`
- `~/plugins/archetype/agents/`
- `~/plugins/archetype/.mcp.json`
- `~/.agents/plugins/marketplace.json`

Install notes: `docs/install-codex-plugin.md`.

## Demo

Run the reproducible demo:

```bash
npm run demo:run
```

Narration and expected artifacts are in `docs/demo-script.md`.

## Examples

- `examples/saas-dashboard-intake.json`
- `examples/fintech-intake.json`
- `examples/marketplace-admin-intake.json`
- `examples/vague-marketing-dashboard-intake.json`

## Development

```bash
npm run build
npm run doctor
npm run smoke
npm run cli:contract
npm run mcp:contract
npm run plugin:claude:contract
npm run plugin:codex:contract
npm run distribution:contract
npm run release:contract
npm run plugin-install:contract
npm run repo:audit
npm run lifecycle:contract
npm run design-preview:contract
npm run lifecycle-execution:contract
npm run frontend-practices:contract
npm run agent-roles:contract
npm run qa-team:contract
npm run forbidden-behaviors:contract
npm run marketing-replay:contract
npm run implementation-phases:contract
npm run convergence:contract
npm run spec:contract
npm run test-first:contract
npm run playwright:contract
npm run install:contract
npm run check
```

Release notes live in `RELEASE_NOTES.md`.
