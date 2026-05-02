# Archetype

Archetype is a Design Architecture Compiler. It turns product context, goals, visual evidence, brand material, and optional implementation evidence into a Product Experience Blueprint, Design System Package, Frontend Agent Contract, and quality/readiness reports.

## Current Implementation

The first implementation is a local TypeScript compiler package. It generates a structured `archetype-output` folder from a structured intake JSON file.

Implemented:

- Domain inference.
- Evidence Ledger.
- Visual evidence extraction.
- UX flow and state matrix completeness.
- Deterministic component contracts.
- Deterministic pattern contracts.
- Deterministic data, action, and form contracts.
- Product Model.
- User, role, permission, entity, and lifecycle artifacts.
- Experience architecture.
- Route map.
- Screen inventory.
- YAML screen specs.
- Design-system artifacts.
- Frontend Agent Contract.
- Data contracts and fixture data.
- Validation report.
- Readiness score.
- Package exporter.
- CLI runner.
- CI validation and frontend build simulation.
- Browser workbench for package review.
- Workbench generation draft controls.
- Workbench approval gate controls.
- Workbench artifact diff and revision impact review.
- Workbench export center and handoff artifacts.
- Workbench local workspace persistence.
- Workbench structured intake form builder.
- Workbench source-material intake and safety preview.
- Workbench route and screen coverage review controls.
- Workbench design-system review controls.
- Workbench frontend contract gap reporting.
- Workbench build simulation triage controls.
- Workbench revision change-request composer.
- Workbench governance summary dashboard.
- Workbench accessibility hardening.
- Workbench state export and restore.
- Workbench multi-package workspace import/export.
- Workbench saved package comparison.
- Workbench package archive and cleanup controls.
- Workbench package search and filtering.
- Workbench package sorting and saved package views.
- Workbench saved package detail inspection.
- Workbench workspace package tagging and notes.
- Workbench package collection exports.
- Workbench package collection import review.
- Workbench package duplication controls.
- Workbench package rename controls.
- Workbench package pinning and priority controls.
- Workbench bulk package actions.
- Workbench workspace activity log.
- Workbench workspace health summary.
- Workbench workspace health export.
- Workbench workspace health filtering.
- Workbench workspace health actions.

## Run

Install dependencies:

```bash
npm install
```

Build:

```bash
npm run build
```

Generate the sample package:

```bash
npm run smoke
```

Validate the generated package:

```bash
npm run validate
```

Simulate whether the exported frontend contract is buildable:

```bash
npm run simulate
```

Run golden examples:

```bash
npm run golden
```

Build the browser workbench:

```bash
npm run workbench:build
```

Run the browser workbench:

```bash
npm run workbench:dev
```

The compiler extracts visual evidence from screenshots, reference images, and design materials into density, navigation, layout, component, state, typography, data-display, and safety signals. It also exports UX flow/state completeness, deterministic component contracts, pattern contracts, data operation contracts, action contracts, and form contracts with required states, contextual states, recovery actions, transition contracts, props, slots, variants, events, token bindings, accessibility rules, test selectors, pattern composition, workflow refs, data refs, query/mutation behavior, action preconditions, validation rules, and acceptance rules for deterministic frontend generation. The workbench can review generated packages, import an exported package folder, save packages into a local browser workspace, duplicate, rename, prioritize, pin, tag, annotate, search, filter, sort, browse, inspect, bulk-update visible package sets, export saved package collections, review collection imports before writing them, track workspace activity, summarize, filter, act on, and export workspace health, archive and clean up packages, export and restore an active workbench session, import and export multi-package workspaces, compare saved packages, prepare an intake JSON draft from structured form controls, collect source materials with a safety preview, copy a matching CLI command, track route and screen coverage, review design-system components and tokens, report frontend contract gaps, triage build simulation and acceptance coverage, compose revision change requests, track local approval gate decisions, compare package baselines for revision impact, summarize governance actions, and generate handoff artifacts for downstream frontend work.

Run all checks:

```bash
npm run check
```

Output:

```txt
tmp/archetype-output/
```

Run with a custom intake file:

```bash
node dist/cli.js generate --input examples/fintech-intake.json --out tmp/archetype-output
```

## Important Files

- `PRODUCT_DEVELOPMENT_PLAN.md`: Full phased product plan.
- `SPEC_CONVERGED.md`: Converged product specification.
- `src/core/pipeline.ts`: Compiler pipeline.
- `src/modules/`: Generation modules.
- `src/quality/quality.ts`: Validation and readiness scoring.
- `src/quality/validatePackage.ts`: CI-friendly exported package validator.
- `src/quality/simulatePackage.ts`: CI-friendly frontend build simulation validator.
- `src/output/exportPackage.ts`: Package writer.
- `examples/fintech-intake.json`: Smoke-test intake.
- `workbench/`: Browser workbench for reviewing generated packages.
- `scripts/create-workbench-sample.mjs`: Creates the sample workbench package bundle.

## Next Implementation Target

The next pass should harden token and typography contracts.
