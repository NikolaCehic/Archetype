# Archetype

Archetype is a local agent harness for Codex and Claude Code.

It turns a natural-language product idea, plus optional screenshots, specs, brand notes, wireframes, or repo context, into a deterministic frontend contract package that an AI coding agent can implement tests-first and verify with evidence.

Archetype is not a hosted web app, a backend platform, or a general-purpose autonomous agent. It is the missing harness around coding agents: clarify the product, freeze the contract, generate implementation instructions, require tests first, verify the result, and plan repair when the implementation drifts.

## Why It Exists

AI coding agents can build quickly, but they often invent missing product details, skip edge states, produce shallow tests, or claim success from a pretty screenshot. Archetype makes the work explicit before code is written.

Archetype gives the agent:

- a product model
- user flows and route architecture
- screen inventory and screen states
- design-system tokens and component contracts
- data, action, and form contracts
- acceptance criteria
- test-first contracts
- Playwright verification requirements
- QA scenarios and malformed-data coverage
- repair tasks when contract drift is found
- an Agent Data Plane for replayable run history

## 60-Second Install

Install Archetype into both Codex and Claude Code:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype install --target all --json
```

Then start a fresh Codex or Claude Code session.

Use Archetype in Codex:

```txt
$archetype "I want to build a premium B2B analytics app for marketing teams."
```

Use Archetype in Claude Code:

```txt
/archetype "I want to build a premium B2B analytics app for marketing teams."
```

Archetype should ask one clarification question at a time when context is weak, invite optional materials, generate the contract, require human review before canonical approval, drive tests-first implementation, verify with Playwright evidence, and repair drift.

Useful docs:

- `docs/quickstart.md`
- `docs/install.md`
- `docs/agent-lifecycle.md`
- `docs/release-readiness.md`
- `docs/demo-script.md`

## CLI Fallback

You can also run Archetype directly from a terminal.

Check install and release readiness:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype doctor --json
```

Run the natural-language lifecycle primitive:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype run "I want to build a premium B2B analytics app for marketing teams." --out archetype-output --force --json
```

Create a starter intake:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype init --template saas-dashboard --out archetype.intake.json --force --json
```

Generate a contract package from an intake:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.intake.json --out archetype-output --json
```

Approve a reviewed draft, then generate the canonical package:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype approve-draft --draft archetype-output --input archetype.intake.json --out archetype.approved.intake.json --approved-by "Your name" --json
npx --yes --package github:NikolaCehic/Archetype archetype generate --input archetype.approved.intake.json --out archetype-output --force --json
```

## Lifecycle

Archetype follows a gated lifecycle:

```txt
idea or brief
  -> clarify missing context
  -> optional materials and source evidence
  -> draft contract and design-system preview
  -> human review and approval
  -> canonical spec
  -> test-first contracts
  -> coding agent implementation
  -> Playwright verification
  -> QA evidence
  -> repair or revision
```

The generated package keeps these gates visible under `lifecycle/`, including `lifecycle/implementation-phases.json`.

Important governance files include:

- `governance/forbidden-behaviors.json`
- `governance/convergence-standard.json`

The design-system draft includes a browser-viewable preview:

- `draft/design-system-preview.html`

Canonical implementation files include:

- `spec/archetype-spec.json`
- `test-first/`
- `verification/playwright-verification-contract.json`
- `verification/playwright-evidence.json`
- `10-revision/repair-task-queue.json`

Try a weak-context example to see the clarification gate:

- `examples/vague-marketing-dashboard-intake.json`

## What Gets Installed

Codex install writes the local skill and plugin surfaces used by fresh Codex sessions:

- `~/.codex/skills/archetype`
- `~/.codex/skills/archetype-blueprint`
- `~/.codex/skills/archetype-implement`
- `~/.codex/skills/archetype-verify`
- `~/.codex/skills/archetype-revise`
- `~/plugins/archetype`
- `~/.agents/plugins/marketplace.json`

Claude Code install writes a local marketplace plugin and skill surface:

- `~/.claude/plugins/marketplaces/archetype-local/plugins/archetype`
- `~/.claude/skills/archetype`
- `archetype@archetype-local`

The installer also writes MCP configuration so hosts can call deterministic Archetype tools.

## Agent Data Plane

Archetype includes a deterministic local Agent Data Plane under `archetype-output/data-plane/`.

It records:

- run and session state
- lifecycle gate events
- source evidence
- generated artifact lineage
- contract versions
- verification state
- repair provenance

Inspect it without rereading large artifacts:

```bash
npx . data-plane status --out archetype-output --json
npx . data-plane timeline --out archetype-output --run <run-id> --json
npx . data-plane artifacts --out archetype-output --run <run-id> --priority hot --limit 10 --json
npx . data-plane read-artifact --out archetype-output --artifact <artifact-id> --json
npx . data-plane replay --out archetype-output --run <run-id> --json
```

See `docs/agent-data-plane.md`.

## MCP Tools

Start the MCP server:

```bash
npm run build
npm run mcp
```

The server exposes deterministic tools such as:

- `archetype_release_doctor`
- `archetype_run_lifecycle`
- `archetype_create_intake`
- `archetype_answer_clarification`
- `archetype_generate_package`
- `archetype_validate_package`
- `archetype_summarize_package`
- `archetype_read_artifact`
- `archetype_verify_target`
- `archetype_plan_repair`
- `archetype_data_plane_status`
- `archetype_data_plane_timeline`
- `archetype_data_plane_artifacts`
- `archetype_data_plane_read_artifact`
- `archetype_data_plane_replay_run`

See `docs/use-with-mcp.md` and `mcp.example.json`.

## Development

Install dependencies and build:

```bash
npm install
npm run build
```

Run the core checks:

```bash
npm run check:fast
npm run check:contracts
npm run check:release
npm run check
```

Run focused release and plugin checks:

```bash
npm run doctor
npm run plugin:claude:contract
npm run plugin:codex:contract
npm run distribution:contract
npm run release:contract
npm run plugin-install:contract
npm run install:contract
npm run repo:audit
```

Run lifecycle and frontend-contract checks:

```bash
npm run lifecycle:contract
npm run design-preview:contract
npm run frontend-practices:contract
npm run agent-roles:contract
npm run qa-team:contract
npm run spec:contract
npm run test-first:contract
npm run playwright:contract
npm run repair:contract
```

Run the reproducible demo:

```bash
npm run demo:run
```

## License

Archetype is dual-licensed under either:

- MIT License, in `LICENSE-MIT`
- Apache License, Version 2.0, in `LICENSE-APACHE`

You may use Archetype under either license, at your option. The root `LICENSE` file contains the short dual-license notice.
