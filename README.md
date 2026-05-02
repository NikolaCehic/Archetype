# Archetype

Archetype is a Design Architecture Compiler. It turns product context, goals, visual evidence, brand material, and optional implementation evidence into a Product Experience Blueprint, Design System Package, Frontend Agent Contract, and quality/readiness reports.

## Current Implementation

The first implementation is a local TypeScript compiler package. It generates a structured `archetype-output` folder from a structured intake JSON file.

Implemented:

- Domain inference.
- Evidence Ledger.
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

Run golden examples:

```bash
npm run golden
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
- `src/output/exportPackage.ts`: Package writer.
- `examples/fintech-intake.json`: Smoke-test intake.

## Next Implementation Target

The next pass should add the DSAG graph engine and schema files, then wire graph validation into readiness scoring.
