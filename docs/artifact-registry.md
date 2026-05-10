# Artifact Registry

Archetype keeps generated artifact authority in `src/artifacts/registry.ts`.

The registry is the source of truth for:

- manifest artifact entries
- internal artifact indexes
- draft required artifacts
- complete-package required artifacts
- draft-forbidden post-approval artifacts
- agent read order
- data-plane artifact phase and read-priority metadata

## Why It Exists

Before the registry, artifact paths were duplicated across the compiler, exporters, validators, data-plane recording, and contract scripts. That made every new artifact risky because one path could be added to output while another validator or manifest list silently drifted.

The registry makes a new artifact a single-entry change plus an optional writer or validator.

## Package Kinds

`draft` artifacts are review-only. They include context, evidence, governance, draft contracts, design direction options, the design-quality gate, design-system preview, and approval request surfaces.

`canonical` artifacts are generated only after bound approval. They include the canonical spec, test-first contracts, Playwright verification, target generation contracts, QA evidence, and repair artifacts.

Both draft and canonical packages include `agent-context/` artifacts. These are compact first-read bundles for agents and carry hot read priority:

- `agent-context/consumer-plane.json`
- `agent-context/context-summary.json`
- `agent-context/phase-bundles/index.json`
- one phase bundle per lifecycle phase

Both package kinds also include the session and progressive handoff artifacts. These are hot review and token-control surfaces:

- `review-console/session.json`
- `review-console/index.html`
- `review-console/run-timeline.json`
- `progressive/generation-plan.json`
- `progressive/lazy-contract-index.json`
- `progressive/token-budget.json`
- `mcp/current-phase-resources.json`
- `mcp/current-phase-prompts.json`
- `orchestration/host-permissions.json`
- `orchestration/team-handoffs.json`
- `orchestration/subagent-ownership.json`

Phase packages are derived from the registry and lazy contract index. They copy only the consumer plane, review console, current phase bundle, required reads, MCP descriptors, attachment UX, blocker explanations, and orchestration/permission contracts into a small generated handoff directory.

## Public Helpers

- `manifestArtifactsForPackage(packageKind)` generates top-level manifest entries.
- `artifactIndexForPackage(packageKind, dynamicPaths)` generates internal manifest indexes.
- `requiredDraftPackageArtifactPaths()` drives draft validation.
- `requiredCompletePackageArtifactPaths()` drives complete package validation.
- `forbiddenDraftArtifactPaths()` blocks post-approval artifacts from draft output.
- `artifactReadOrderForPackage(packageKind)` drives generated package README read order.
- `artifactRegistryEntryForPath(path)` gives data-plane metadata for artifact recording.

## Data Plane Metadata

Every registry entry includes:

- `phase`
- `readPriority`
- `dataPlane.sourcePhase`
- `dataPlane.readPriority`

Export recording copies the registry id and read priority into artifact records so agents can choose compact, high-value reads before pulling large files.

## Non-Goals

The registry does not write files by itself, validate artifact schemas by itself, or replace package exporters. It defines artifact authority so exporters, validators, docs, and data-plane recording stop inventing separate path lists.
