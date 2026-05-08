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

`draft` artifacts are review-only. They include context, evidence, governance, draft contracts, design-system preview, and approval request surfaces.

`canonical` artifacts are generated only after bound approval. They include the canonical spec, test-first contracts, Playwright verification, target generation contracts, QA evidence, and repair artifacts.

Both draft and canonical packages include `agent-context/` artifacts. These are compact first-read bundles for agents and carry hot read priority:

- `agent-context/context-summary.json`
- `agent-context/phase-bundles/index.json`
- one phase bundle per lifecycle phase

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
