# Scope 02 — Repo And Package Cleanup

## Purpose

Make Archetype installable, inspectable, and usable by strangers.

Current weakness: the repo may work locally, but a new user should not need to understand the source tree to get value.

## Target Repo Shape

```txt
archetype/
  packages/
    core/
    cli/
    mcp/
  plugins/
    claude-code/
    codex/
  examples/
  docs/
  workbench/
  package.json
  README.md
  AGENTS.md
```

## Cleanup Goals

- Add a real open-source license.
- Remove `private: true` if the package is intended for npm distribution.
- Add a CLI `bin` entry.
- Define package exports.
- Separate core/compiler logic from plugin-specific wrappers.
- Make examples easy to run.
- Keep the workbench optional.

## Root Package Direction

If keeping a single package at first:

```json
{
  "name": "@nikolacehic/archetype",
  "version": "0.1.0",
  "license": "MIT",
  "type": "module",
  "bin": {
    "archetype": "./dist/cli.js"
  },
  "files": [
    "dist",
    "examples",
    "README.md",
    "LICENSE"
  ]
}
```

If splitting into packages later:

```txt
@nikolacehic/archetype-core
@nikolacehic/archetype-cli
@nikolacehic/archetype-mcp
```

Do not split prematurely if it slows MVP. A clean single package is acceptable for the first release.

## Required Scripts

Root scripts should support:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run smoke
npm run demo:generate
npm run demo:verify
```

## Required Example Files

```txt
examples/saas-dashboard-intake.json
examples/fintech-intake.json
examples/marketplace-admin-intake.json
```

Each example should include enough information to generate:

- route map
- screen inventory
- design system
- frontend agent contract
- readiness report

## Quickstart Requirement

A new user should be able to run:

```bash
npx --yes --package github:NikolaCehic/Archetype archetype generate --input examples/saas-dashboard-intake.json --out archetype-output
```

And receive a usable `archetype-output` folder.

## Out Of Scope

Do not add:

- cloud auth
- hosted storage
- billing
- account system
- plugin marketplace automation
- workbench-first onboarding

## Acceptance Criteria

```txt
[ ] Repo has an open-source license.
[ ] Package is installable or clearly documented as local-only.
[ ] CLI binary works after build.
[ ] Example intake generates output.
[ ] README quickstart works without hidden steps.
[ ] Workbench is not required for first value.
```

## Codex Instruction

When implementing this scope, prioritize installability and command reliability over architectural perfection. Do not create a complex monorepo unless the current structure blocks package use.
