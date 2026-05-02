# Archetype Implementation Status

This file records phase gates completed during implementation.

## Completed Phase: DSAG Graph Engine

Status: complete

Implemented:

- DSAG node and edge types.
- DSAG graph builder.
- Evidence source and decision nodes.
- Product goal, business goal, user, job, entity, workflow, route, screen, pattern, component, token, data contract, accessibility, and quality gate nodes.
- Graph edges for supports, requires, implemented_by, composed_of, styled_by, constrained_by, derived_from, appears_on, and validated_by.
- DSAG integrity checks.
- DSAG readiness integration.
- DSAG export at `03-experience-architecture/dsag.json`.
- DSAG report at `08-quality/dsag-integrity-report.md`.

Verification:

- `npm run smoke` passes.
- DSAG status: pass.
- DSAG blockers: 0.
- DSAG warnings: 0.
- Generated package file count: 76.

Next phase:

- Explicit schema contracts and schema validation artifacts.

## Completed Phase: Explicit Schema Contracts

Status: complete

Implemented:

- Schema artifact model.
- JSON Schema definitions for intake, manifest, evidence ledger, product model, route map, screen inventory, screen specs, component registry, pattern registry, data contracts, frontend build manifest, DSAG, and readiness report.
- Schema index export at `00-manifest/schema-index.json`.
- Schema files exported under `09-schemas/`.
- Required-field schema checks wired into `schema-validation-report.json`.

Verification:

- `npm run smoke` passes.
- Schema files exported: 13.
- Schema checks: 182.
- Schema failures: 0.
- Validation blockers: 0.
- Generated package file count: 90.

Next phase:

- Source normalization and safety scanning.

## Completed Phase: Source Normalization and Safety Scanning

Status: complete

Implemented:

- Normalized source model.
- Material intake support for documents, code, design files, screenshots, brand material, and other sources.
- Source analysis report at `01-evidence/source-analysis-report.json`.
- Safety scanner for likely secrets, credentials, PII, regulated data, and prompt-injection instructions.
- Safety report at `08-quality/safety-report.md`.
- Safety findings are converted into Evidence Ledger risks.
- Blocker-severity safety findings block frontend-agent readiness.

Verification:

- Clean `npm run smoke` passes.
- Clean safety findings: 0.
- Hostile fixture blocks readiness.
- Hostile fixture detects 1 secret blocker and 2 prompt-injection findings.

Next phase:

- LLM decision-layer contract and provider abstraction.

## Completed Phase: LLM Decision-Layer Contract

Status: complete

Implemented:

- LLM provider interface.
- Deterministic local provider for offline compiler runs.
- Structured JSON parsing and repair helpers.
- Prompt pack index for all core architecture modules.
- Provider policy.
- Structured output policy.
- Repair policy.
- Prompt-injection policy.
- Module contracts exported under `07-agent-runtime/`.

Verification:

- `npm run smoke` passes.
- LLM artifacts exported: 6.
- LLM validation checks: 4.
- LLM validation failures: 0.
- Generated package file count: 98.

Next phase:

- Reference surfaces.

## Completed Phase: Reference Surfaces

Status: complete

Implemented:

- Reference dashboard surface.
- Reference table surface.
- Reference form surface.
- Reference mobile surface.
- Reference chart surface.
- Reference surface validation checks.
- Exports under `07-reference-surfaces/`.

Verification:

- `npm run smoke` passes.
- Reference artifacts exported: 5.
- Reference validation checks: 5.
- Reference validation failures: 0.
- Generated package file count: 103.

Next phase:

- Revision protocol and artifact invalidation.

## Completed Phase: Revision Protocol and Artifact Invalidation

Status: complete

Implemented:

- Revision protocol.
- Artifact dependency graph.
- Invalidation rules.
- Initial change set.
- Approval gates.
- Decision diff policy.
- Artifact invalidation report.
- Revision validation checks.
- Exports under `10-revision/`.

Verification:

- `npm run smoke` passes.
- Revision artifacts exported: 7.
- Revision validation checks: 5.
- Revision validation failures: 0.
- Generated package file count: 110.

Next phase:

- Golden example coverage across product domains.

## Completed Phase: Golden Example Coverage

Status: complete

Implemented:

- Logistics golden intake.
- Web3 golden intake.
- Healthcare golden intake.
- Golden suite runner.
- Golden summary JSON and Markdown output.
- `npm run golden` command.

Verification:

- `npm run golden` passes.
- Golden examples: fintech, healthcare, logistics, Web3.
- All golden readiness scores: 89.
- All golden packages ready for frontend agent: true.
- All golden DSAG reports: pass.
- All golden blockers: 0.

Next phase:

- CI-friendly package validation command.

## Completed Phase: CI-Friendly Package Validation Command

Status: complete

Implemented:

- Exported package validator.
- CLI command: `node dist/cli.js validate --out <output-dir>`.
- NPM script: `npm run validate`.
- Manifest artifact presence checks.
- Manifest/readiness agreement check.
- Schema validation blocker check.
- DSAG integrity blocker check.
- Readiness threshold check.

Verification:

- `npm run build && npm run validate` passes.
- Checked manifest-listed files: 110.
- Validation blockers: 0.

Next phase:

- Frontend build simulation.
