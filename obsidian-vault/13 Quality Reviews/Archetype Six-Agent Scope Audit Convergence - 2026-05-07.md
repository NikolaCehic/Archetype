---
tags:
  - archetype
  - multiagent-audit
  - quality-review
  - agent-data-plane
  - hardened-lifecycle
status: active
created: 2026-05-07
---

# Archetype Six-Agent Scope Audit Convergence - 2026-05-07

## Purpose

This review consolidates six read-only subagent audits over Archetype after the Agent Data Plane implementation.

The goal was to test Archetype as a product, not to prove prior work correct.

Each subagent audited a different scope:

1. CLI, installer, plugin setup, docs, Codex and Claude Code front doors.
2. Core lifecycle and compiler pipeline.
3. Agent Data Plane, artifact lineage, replay, query APIs.
4. MCP tools, host-agent interaction, natural-language command behavior.
5. Agents and skills, specialist roles, handoffs, anti-hallucination rules.
6. Quality, tests, verification, security, file safety, release readiness.

The master pass cross-checked the reports against:

- `HARDENED_ARCHETYPE_LIFECYCLE.md`
- `docs/agent-data-plane.md`
- `docs/AGENT_DATA_PLANE_PLAN.md`
- `obsidian-vault/13 Quality Reviews/Archetype Multiagent Quality Review - 2026-05-07.md`
- `obsidian-vault/12 Scope Implementation Lessons/lessons.md`
- `src/core`
- `src/modules`
- `src/output`
- `src/mcp`
- `src/data-plane`
- `src/install`
- `src/quality`
- `src/schemas`
- `agents`
- `skills`
- `plugins`
- `scripts`
- `package.json`

## Executive Verdict

Archetype is now a serious deterministic frontend-agent harness foundation.

It has a coherent lifecycle, installable plugin surfaces, strong role files, an Agent Data Plane, CLI/MCP query surfaces, validation contracts, QA artifacts, and repair planning.

But Archetype is not yet release-grade as a safe, independently verified, token-efficient, production harness.

The converged blockers are:

1. CLI and target output paths are not safe enough before recursive deletion.
2. Approval is structurally spoofable and not bound to draft/source/artifact hashes.
3. Draft mode still constructs canonical/test/verification artifacts in memory.
4. Verification proves generated scaffold behavior more strongly than independent product behavior.
5. Artifact paths need a central registry.
6. Agent reads are too broad and MCP artifact reads are unbounded.
7. The Agent Data Plane is useful but not yet authoritative enough for lifecycle evidence.
8. Test/build/verification loops are too slow and disk-heavy.
9. Schema validation is too permissive.
10. `/archetype` and `$archetype` still rely too much on host-agent choreography instead of a lifecycle primitive.

## Confirmed Strengths

### Lifecycle

- Weak context now stops before full contract generation.
- One-question clarification is implemented as a real gate.
- Sufficient but unapproved context generates a draft contract package.
- Canonical export requires a human approval shape.
- Draft, canonical, test-first, QA, verification, repair, and readiness artifacts are represented.
- Governance rules are repeatedly encoded across docs, generated artifacts, skills, agents, and contracts.

Evidence:

- `src/cli.ts`
- `src/mcp/tools/generatePackage.ts`
- `src/modules/contextGate.ts`
- `src/modules/evidenceDecisionModel.ts`
- `src/modules/nonNegotiablePrinciples.ts`
- `obsidian-vault/01 Lifecycle/*`

### Distribution And Setup

- `archetype` and `archetype-mcp` binaries exist.
- `npm pack --dry-run` is small enough for a source-installable package.
- Codex and Claude Code plugin surfaces exist.
- Quickstart and install docs are present.
- Plugin install contracts exercise Codex and Claude Code paths.
- Doctor and repo audit commands exist.

Evidence:

- `package.json`
- `docs/quickstart.md`
- `docs/install-codex-plugin.md`
- `docs/install-claude-code-plugin.md`
- `src/install/pluginInstaller.ts`
- `scripts/run-plugin-install-contract.mjs`
- `scripts/run-install-contract.mjs`

### Agent Data Plane

- The data plane is local, file-backed, deterministic, and inspectable.
- It records runs, events, artifact records, projections, hashes, and replay data.
- It uses JSON and JSONL instead of a database.
- CLI and MCP query tools expose run status, timeline, artifact records, and replay.
- Artifact records store metadata, not full artifact bodies, which is the right foundation for token control.

Evidence:

- `docs/agent-data-plane.md`
- `src/data-plane/types.ts`
- `src/data-plane/ports.ts`
- `src/data-plane/adapters/fileDataPlane.ts`
- `src/data-plane/adapters/memoryDataPlane.ts`
- `src/data-plane/queries.ts`
- `src/mcp/tools/dataPlane.ts`
- `scripts/run-data-plane-contract.mjs`

### Agents And Skills

- Role files are deep and specific.
- Product, experience, frontend, design-system, practice-enforcer, strict TypeScript, pixel-perfect, accessibility, test-first, verifier, repair, and QA roles exist.
- Roles define authority, inputs, outputs, blockers, handoffs, non-ownership, and self-review.
- QA and pixel roles require browser evidence, viewport coverage, screenshot evidence, and marker-only rejection.
- The anti-hallucination doctrine is explicit.

Evidence:

- `agents/product-architect.md`
- `agents/experience-architect.md`
- `agents/frontend-architect.md`
- `agents/frontend-practice-enforcer.md`
- `agents/pixel-perfect-developer.md`
- `agents/qa-lead.md`
- `agents/test-first-developer.md`
- `skills/archetype/SKILL.md`
- `plugins/codex/skills/archetype/SKILL.md`
- `plugins/claude-code/commands/archetype.md`

### QA, Verification, And Repair Foundation

- Verification and repair are actual code paths, not only prose.
- Generated target verification runs structured checks.
- Repair artifacts classify implementation drift and contract drift.
- Test-first, Playwright, malformed-data, accessibility, visual regression, and contract-drift artifacts exist.
- Golden tests assert clarification/draft packages do not export canonical spec/test artifacts.

Evidence:

- `src/output/verifyTargetFrontend.ts`
- `src/modules/playwrightVerification.ts`
- `src/modules/qaTeam.ts`
- `src/modules/testQualityStandard.ts`
- `src/modules/revisionProtocol.ts`
- `scripts/run-golden.mjs`

## Confirmed Weaknesses

### P0 - CLI Output Deletion Safety

CLI `generate --out` resolves arbitrary output paths and then passes them to exporters that recursively delete output directories.

MCP has `assertSafeOutputDirectory`; CLI does not have equivalent protection.

Affected areas:

- `src/cli.ts`
- `src/mcp/tools/shared.ts`
- `src/output/exportPackage.ts`
- `src/output/exportDraftPackage.ts`
- `src/output/exportClarificationPackage.ts`

Why this matters:

- A user can accidentally point `--out` at a real project directory.
- Exporters can recursively delete user data.
- This is a release trust blocker.

Required fix:

- Share the MCP path guard with CLI.
- Add output markers such as `.archetype-output-marker`.
- Refuse root, home, Desktop, repo root, and project roots.
- Require explicit force for non-empty existing output dirs.
- Add destructive-output contract tests.

### P0 - Target Output Deletion Safety

`write-target --force` can recursively replace the target directory after only existence and force checks.

Affected areas:

- `src/output/writeTargetFrontend.ts`
- `src/cli.ts`

Why this matters:

- A user can accidentally write a generated frontend over an existing app.
- The target writer should be as guarded as the package exporter.

Required fix:

- Add a target safety guard.
- Refuse home, root, repo root, and directories with project markers unless explicitly marked as disposable.
- Use staging and atomic rename.
- Add contract tests for dangerous target paths.

### P0 - Approval Is Structurally Spoofable

Approval is currently represented by intake JSON fields such as:

- `approved: true`
- `approverType: "human"`
- `approvedBy`
- `approvedAt`

This is not bound to a draft package, source hash, artifact hashes, reviewed artifact refs, or approved assumption set.

Affected areas:

- `src/core/types.ts`
- `src/modules/nonNegotiablePrinciples.ts`
- `src/core/pipeline.ts`
- contract fixtures that fabricate approved intake JSON

Why this matters:

- An agent can structurally spoof approval by editing intake JSON.
- Approval cannot prove which draft the human saw.
- Canonical generation can be authorized without durable provenance.

Required fix:

- Add `archetype approve-draft`.
- Create a durable approval artifact.
- Bind approval to:
  - draft package id
  - source hash
  - artifact refs
  - artifact checksums
  - approved assumption ids
  - approver identity
  - timestamp
  - package checksum
- Reject approval that does not match the current source/draft.
- Record approval proof into the Agent Data Plane.

### P0 - Draft Mode Builds Canonical Machinery In Memory

The public export gate prevents canonical files from being written before approval, but the compiler still constructs many canonical/test/verification structures before export decides whether the package is draft or canonical.

Affected areas:

- `src/core/pipeline.ts`

Why this matters:

- It violates the operational meaning of "no canonical contract before approval."
- It wastes compute.
- It makes lifecycle state harder to reason about.
- It weakens the separation between draft candidates and canonical truth.

Required fix:

- Split compiler phases:
  - context
  - draft
  - approval
  - canonical
  - test-first
  - verification
  - target
  - QA
  - repair
- Draft mode must stop before canonical spec, test-first, Playwright, target, and QA package construction.

### P0 - Verification Is Too Self-Confirming

Archetype can generate a target scaffold and then verify that scaffold. This proves the harness path, but it does not prove an independently implemented product satisfies the contract.

Affected areas:

- `src/output/writeTargetFrontend.ts`
- `src/output/verifyTargetFrontend.ts`
- `src/modules/playwrightVerification.ts`
- `src/modules/qaTeam.ts`

Why this matters:

- A generated scaffold can pass checks that an independent production implementation would fail.
- Marker-heavy tests can be gamed.
- QA scenario status is too often derived from global evidence rather than per-scenario execution.

Required fix:

- Add evidence grades:
  - `scaffold_verified`
  - `browser_smoke_verified`
  - `behavior_verified`
  - `accessibility_verified`
  - `visual_verified`
  - `manual_reviewed`
  - `production_integrated`
- Make scaffold verification unable to satisfy production behavior readiness.
- Add independent target fixtures with intentional pass and fail cases.
- Ingest Playwright JSON per scenario.
- Add real malformed-data execution.

### P0 - Artifact Registry Missing

Artifact paths and requirements are duplicated across compiler indexes, exporters, validators, docs, manifests, tests, agent instructions, and data-plane phase mapping.

Affected areas:

- `src/core/pipeline.ts`
- `src/output/exportPackage.ts`
- `src/output/exportDraftPackage.ts`
- `src/output/exportClarificationPackage.ts`
- `src/quality/validatePackage.ts`
- `src/data-plane/artifacts.ts`
- docs and scripts

Why this matters:

- Drift is likely.
- Adding or changing an artifact requires too many edits.
- Validation and export can disagree.
- Token read order cannot be centrally optimized.

Required fix:

- Create `src/artifacts/registry.ts`.
- Registry entries should define:
  - artifact id
  - path
  - type
  - package phase
  - lifecycle gate
  - artifact group
  - required/optional state
  - schema
  - writer
  - validator
  - read priority
  - token budget
  - data-plane phase
- Generate manifest entries, required-path lists, docs read order, validator expectations, data-plane artifact metadata, and compact agent bundles from the registry.

### P1 - Agent Data Plane Is Useful But Not Yet Authoritative

The data plane is a strong substrate, but several details prevent it from being the full lifecycle authority.

Weaknesses:

- Persisted projections can become stale because projections are written before exported artifact events are appended.
- `read-artifact` without `runId` is ambiguous when artifact ids repeat across runs.
- Event replay sorts by sequence but does not fully validate append order, continuity, duplicates, or corrupt JSONL.
- Artifact phase mapping falls to `unknown` too often.
- Run status is not a real state machine yet.
- Verification and repair outputs are not consistently written back into the same data-plane run.
- Event append can become O(n^2)-leaning because each append reparses events to find the next sequence.

Affected areas:

- `src/data-plane/packageRecorder.ts`
- `src/data-plane/adapters/fileDataPlane.ts`
- `src/data-plane/state.ts`
- `src/data-plane/artifacts.ts`
- `src/data-plane/queries.ts`
- `src/output/verifyTargetFrontend.ts`
- `src/mcp/tools/verifyTarget.ts`

Required fix:

- Write projections after artifact events or rebuild persisted projections from the final event stream.
- Add persisted projection equals replayed projection contract tests.
- Default artifact lookup to latest run or require run id when ambiguous.
- Add typed `ARTIFACT_AMBIGUOUS` or equivalent error.
- Validate event sequence continuity and JSONL parse failures with typed errors.
- Add event range and phase filters.
- Add data-plane writers for verification, QA, and repair.
- Maintain run-level counters or an index for event count and last sequence.

### P1 - MCP And Agent Reads Are Too Broad

`archetype_read_artifact` returns full content. Start-here instructions ask agents to read too many artifacts. MCP responses can duplicate payloads as text plus structured content.

Affected areas:

- `src/mcp/tools/readArtifact.ts`
- `src/mcp/server.ts`
- `src/mcp/tools/summarizePackage.ts`
- `skills/archetype/SKILL.md`
- `plugins/codex/skills/archetype/SKILL.md`
- `plugins/claude-code/commands/archetype.md`
- generated package README/AGENTS surfaces

Why this matters:

- Agents burn tokens before understanding the task.
- Important artifacts become lost in the read list.
- Full JSON payloads can exceed context or waste cost.

Required fix:

- Add `agent-context.compact.json` or `agent-brief.md`.
- Add phase bundles:
  - clarification
  - draft review
  - approval
  - implementation
  - verification
  - repair
- Extend `archetype_read_artifact` with:
  - `mode: summary | excerpt | full`
  - `maxBytes`
  - `jsonPointer`
  - `markdownHeading`
  - `artifactGroup`
  - `phase`
- Make full reads opt-in.
- Make MCP text output compact while preserving structured payloads.

### P1 - Schema Validation Is Too Permissive

Generated schema artifacts allow unknown fields, and runtime validation is mostly manual.

Affected areas:

- `src/schemas/coreSchemas.ts`
- `src/quality/validatePackage.ts`
- `src/quality/quality.ts`

Why this matters:

- The system can overclaim "schema validation."
- Extra fields and typos may pass.
- Drift can hide until later.

Required fix:

- Add strict schema validation with Ajv or equivalent.
- Use `additionalProperties: false` for stable public contracts.
- Split validators by domain.
- Generate schemas from TypeScript or TypeScript from schemas.
- Make validation package-type-aware.

### P1 - Test-First Evidence Is Not Yet Strong Enough

The "initial red test run" is often a generated pending evidence document, not a real failed test execution.

Affected areas:

- `src/modules/requiredPackageArtifacts.ts`
- `src/modules/testFirstContracts.ts`
- `src/modules/testQualityStandard.ts`
- `src/output/verifyTargetFrontend.ts`

Why this matters:

- TDD can become contractual prose instead of executed evidence.
- Agents may implement UI before a real red test exists.

Required fix:

- Require real red-run evidence before implementation.
- Store per-suite command output.
- Make missing red evidence block implementation readiness.
- Preserve red test ids through green runs unless a human-approved contract revision changes them.

### P1 - Natural-Language Front Door Needs A Lifecycle Primitive

`$archetype` and `/archetype` work through skills and slash-command instructions, but the underlying product does not yet expose one first-class lifecycle command that owns brief intake, material ingestion, clarification, draft generation, approval, and continuation.

Affected areas:

- `skills/archetype/SKILL.md`
- `plugins/codex/skills/archetype/SKILL.md`
- `plugins/claude-code/commands/archetype.md`
- `src/cli.ts`
- `src/mcp/tools/index.ts`

Why this matters:

- Host agents must behave perfectly.
- Workflow state lives too much in instructions.
- The user experience can drift between Codex and Claude Code.

Required fix:

- Add `archetype run "<brief>"`.
- Add MCP tool `archetype_run_lifecycle`.
- Add safe material ingestion.
- Store source graph and material hashes.
- Ask one clarification question at a time.
- Generate draft, design-system preview, approval request, and next-step instructions from one lifecycle primitive.

## Gaps By Product Area

### Safety And Security

- CLI output path guard missing.
- Target output path guard missing.
- No `.archetype-output-marker`.
- No destructive-output contract tests.
- No CI workflow enforcing release gates.
- Approval is not bound to immutable draft/source proof.

### Lifecycle Correctness

- Draft compiler path overproduces in memory.
- Clarification/draft/canonical handling is not equally supported across summarize, validate, simulate, and MCP.
- Draft readiness tiers reference canonical artifacts.
- Context sufficiency can still be satisfied by generic workflow words.
- Source material path references are not fully content-hashed.

### Data Plane

- Persisted projections can be stale.
- Artifact id collisions across runs are ambiguous.
- Event continuity and corruption checks are weak.
- No projection-by-name query.
- No event range query.
- No artifact phase/group filter.
- No lineage graph query.
- No verification/QA/repair event writers after target verification.

### Verification

- Harness/scaffold proof is stronger than independent product proof.
- Marker-heavy checks remain.
- Per-scenario evidence ingestion is incomplete.
- Malformed-data results are not always executed evidence.
- Accessibility and visual verification need stronger actual browser proof.

### Agent UX

- Role files are strong but large.
- Skills and plugin mirrors can drift.
- Agents read too much by default.
- No compact phase bundle.
- No bounded artifact read by default.
- No lifecycle primitive behind `/archetype` and `$archetype`.

### Maintainability

- `src/quality/validatePackage.ts` is too large.
- `src/modules/designSystem.ts` is too large.
- `src/output/exportPackage.ts` is too large.
- Artifact paths are duplicated.
- Tests/scripts rebuild repeatedly.

## Performance Optimization Proposals

### Build And Test Speed

1. Replace repeated `npm run build && node scripts/...` chains with a build-once contract runner.
2. Add `check:fast`, `check:contracts`, and `check:release`.
3. Add per-contract timing output.
4. Add fail-fast and affected-contract modes.
5. Cache generated target installs by lockfile/package hash.
6. Avoid repeated generated target `node_modules` trees.
7. Add CI matrix only after local runner is stable.

### Compiler Speed

1. Split compiler phases so draft stops early.
2. Avoid building canonical/test/verification artifacts before approval.
3. Lazy-build expensive artifacts by package phase.
4. Make validation/summarization/simulation package-type-aware and short-circuit clarification/draft packages.

### Verification Speed

1. Cache target install/build output by dependency hash.
2. Separate scaffold smoke, independent behavior, accessibility, and visual verification commands.
3. Allow targeted scenario reruns.
4. Store verification evidence in the data plane so agents can query status instead of rereading files.

### Data Plane Speed

1. Maintain run counters for `last_sequence`, `event_count`, and `artifact_count`.
2. Avoid reparsing `events.jsonl` on every append.
3. Add event filters by phase/type/sequence range.
4. Add artifact filters by phase/group/type.
5. Rebuild projections once from final event stream after generation.

## Read And Write Speed Optimization Proposals

### Safer Writes

1. Write to an atomic staging directory.
2. Validate staged output.
3. Rename into place only after success.
4. Require `.archetype-output-marker` before overwriting generated package dirs.
5. Refuse dangerous directories by default.

### Fewer Writes

1. Use content-hash skip writes for unchanged artifacts.
2. Hash during export write instead of rereading files later.
3. Batch data-plane artifact recording.
4. Generate manifests from the artifact registry.
5. Avoid deleting and rewriting whole trees for small changes.

### Faster Reads

1. Add data-plane artifact group filters.
2. Add MCP artifact excerpt modes.
3. Add JSON pointer reads for large JSON artifacts.
4. Add markdown heading reads for long markdown artifacts.
5. Add compact run status and compact replay modes.

## Token Cost Optimization Proposals

### Compact Context

1. Add `agent-context.compact.json`.
2. Add `agent-brief.md`.
3. Add phase bundles:
   - `agent-context/clarification.json`
   - `agent-context/draft-review.json`
   - `agent-context/approval.json`
   - `agent-context/implementation.json`
   - `agent-context/verification.json`
   - `agent-context/repair.json`
4. Make these the first read for agents.

### Bounded MCP Reads

1. Extend `archetype_read_artifact`.
2. Add `maxBytes`.
3. Add summary/excerpt/full modes.
4. Add `jsonPointer`.
5. Add `markdownHeading`.
6. Add `artifactGroup`.
7. Add data-plane artifact listing to MCP.
8. Make full content opt-in.

### Smaller Hot Paths

1. Shrink generated README/AGENTS start-here lists to 3-5 phase-specific reads.
2. Move long role schemas and matrices into appendices.
3. Keep each role hot path to mission, required reads, decision gate, and handoff schema.
4. Generate plugin skill mirrors from one canonical source.
5. Contract-test mirrored skill and agent surfaces to prevent drift.

## Converged Priority Order

### Phase 1 - Safety And Approval Integrity

Implement first.

Scope:

- CLI output safety.
- Target output safety.
- `.archetype-output-marker`.
- Destructive-output tests.
- `archetype approve-draft`.
- Approval artifact bound to draft/source/artifact hashes.

Exit signal:

- No CLI command can recursively delete arbitrary user directories.
- No implementation authorization can be created by editing intake JSON alone.

### Phase 2 - Phase-Safe Compiler

Scope:

- Split compiler into context, draft, canonical, test-first, verification, target, QA, repair phases.
- Draft generation stops before canonical/test/verification construction.
- Clarification/draft/canonical package types are supported consistently by validate/summarize/simulate.

Exit signal:

- Pre-approval execution never constructs canonical/test/Playwright/target artifacts in memory or on disk.

### Phase 3 - Central Artifact Registry

Scope:

- Create `src/artifacts/registry.ts`.
- Generate manifest entries, required lists, docs read order, validator expectations, data-plane metadata, and read priorities.
- Begin splitting `validatePackage.ts`.

Exit signal:

- Adding a new artifact requires one registry entry plus optional writer/validator, not scattered edits.

### Phase 4 - Data Plane Authority Hardening

Scope:

- Projection consistency.
- Artifact lookup ambiguity.
- Event continuity.
- Typed corrupt-record errors.
- Data-plane writers for verification, QA, and repair.
- Filtered queries.

Exit signal:

- Data plane replay and persisted projections agree.
- Agents can query the lifecycle state without reading the whole artifact tree.

### Phase 5 - Token-Bounded Agent Context

Scope:

- Compact context files.
- Phase bundles.
- Bounded MCP artifact reads.
- Compact MCP response text.
- Skill/agent mirror deduplication.

Exit signal:

- A downstream agent can start each phase from one compact artifact and request full artifacts only when needed.

### Phase 6 - Real Verification

Scope:

- Evidence grades.
- Independent target fixtures.
- Per-scenario Playwright result ingestion.
- Real malformed-data execution.
- Strong accessibility and visual proof.

Exit signal:

- Archetype can prove it catches real product failures in a target it did not generate itself.

### Phase 7 - Speed And Release Discipline

Scope:

- Build-once contract runner.
- Target dependency cache.
- Contract timing.
- Disk and token budgets.
- CI workflows.
- `clean:tmp-heavy`.

Exit signal:

- Local and CI checks are rigorous, bounded, and explain their cost.

### Phase 8 - Natural-Language Lifecycle Primitive

Scope:

- `archetype run "<brief>"`.
- `archetype_run_lifecycle`.
- Safe material ingestion.
- One-question clarification.
- Draft, design-system preview, approval, and continuation through one command/tool.

Exit signal:

- `/archetype "idea"` and `$archetype "idea"` are backed by a deterministic lifecycle primitive, not only host-agent instructions.

## Master Critique Of The Six Audits

The six audits strongly converged. The repeated findings are credible because they came from different scopes:

- CLI/install found unsafe output deletion and weak front-door lifecycle primitives.
- Lifecycle/compiler found phase leakage and spoofable approval.
- Data-plane found projection consistency, ambiguity, replay, and performance issues.
- MCP/host found token-heavy responses and missing lifecycle primitive.
- Agents/skills found strong roles but excessive token surface.
- QA/security found deletion safety, self-confirming verification, schema weakness, and missing CI.

The only priority adjustment from the raw reports is this:

- Artifact registry is important, but safety and approval integrity must come first because they protect users and lifecycle trust.
- Data-plane hardening should come before natural-language lifecycle automation because the lifecycle primitive needs a trustworthy substrate.
- Real verification should come before any production-grade claims.

## Final Converged Answer

Archetype has gained a strong harness skeleton.

It is not yet a launchable production-grade agent harness.

The next work should not add more role prose. It should harden:

1. destructive path safety,
2. approval provenance,
3. phase-safe compilation,
4. artifact registry authority,
5. data-plane correctness,
6. bounded agent context,
7. real independent verification,
8. speed and release automation,
9. first-class natural-language lifecycle execution.

This is the shortest path from a strong deterministic contract generator to a production-grade agent harness for Codex and Claude Code.
