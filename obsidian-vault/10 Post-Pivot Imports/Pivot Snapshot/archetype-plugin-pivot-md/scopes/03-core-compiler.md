# Scope 03 — Core Compiler

## Purpose

Keep the Archetype compiler deterministic, framework-agnostic, and reusable across CLI, MCP, Claude plugin, and Codex plugin.

The compiler is the engine. Plugins are wrappers around the engine.

## Core Responsibility

The core package should take structured input and produce structured output.

```txt
intake JSON → Archetype contract package
```

## Core Should Generate

- manifest
- evidence ledger
- product model
- experience architecture
- route map
- screen inventory
- screen specs
- screen states
- design-system tokens
- component contracts
- data contracts
- action contracts
- form contracts
- frontend-agent contract
- readiness report
- verification plan

## Core Should Not Contain

- Claude-specific prompts
- Codex-specific prompts
- MCP server startup code
- plugin manifests
- marketplace metadata
- UI workbench-only assumptions
- network-dependent behavior unless explicitly configured

## Suggested API

```ts
export interface GenerateArchetypePackageInput {
  inputPath: string;
  outputDir: string;
  options?: {
    overwrite?: boolean;
    json?: boolean;
  };
}

export interface GenerateArchetypePackageResult {
  status: 'success' | 'warning' | 'error';
  outputDir: string;
  readinessScore: number;
  blockers: string[];
  warnings: string[];
  artifacts: Array<{
    id: string;
    path: string;
    type: 'markdown' | 'json' | 'text' | 'asset';
  }>;
}

export async function generateArchetypePackage(
  input: GenerateArchetypePackageInput
): Promise<GenerateArchetypePackageResult>;
```

## Compiler Design Rules

- Prefer deterministic transformations.
- Prefer explicit missing-input warnings over hallucinated completeness.
- Emit stable artifact IDs.
- Emit stable file paths.
- Emit JSON summaries for machine consumption.
- Make Markdown useful for humans but do not make it the only source of truth.

## Artifact ID Convention

```txt
manifest
readiness-report
implementation-contract
verification-plan
product-model
route-map
screen-inventory
screen-specs
component-contracts
design-tokens
frontend-agent-instructions
```

## Error Model

The compiler should distinguish:

```txt
error   → cannot generate valid output
warning → output generated but has risks/missing evidence
success → output generated and ready enough for implementation
```

## Acceptance Criteria

```txt
[ ] Core can run without Claude/Codex/plugin code.
[ ] Core emits stable artifact paths.
[ ] Core returns machine-readable result objects.
[ ] Core emits readiness score, blockers, and warnings.
[ ] Core does not require workbench.
[ ] Core can be called by CLI and MCP.
```

## Codex Instruction

When working on the core compiler, do not add agent-host logic. The correct dependency direction is CLI/MCP/plugins depend on core, not the other way around.
