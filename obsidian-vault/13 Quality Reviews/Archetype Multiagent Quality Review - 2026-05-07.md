# Archetype Multiagent Quality Review - 2026-05-07

## Purpose

Deep quality review of Archetype as a product after the agent hardening loop.

The review used six parallel read-only scope reviews plus a local consolidation pass. The goal was not to prove the current state is good. The goal was to find where Archetype must invest next to become a production-grade agent harness.

## Local Measurements

- Repository status before report creation: clean and synced with `origin/main`.
- Published package dry run: 185 entries, 388 KB packed, 2.28 MB unpacked.
- Source/package shape:
  - `src`: 1.1 MB.
  - `agents`: 432 KB.
  - `plugins`: 548 KB.
  - `scripts`: 384 KB.
  - `docs`: 52 KB.
- Workspace bloat:
  - repo working tree: 4.0 GB.
  - `tmp`: 3.9 GB.
  - repeated generated target `node_modules` trees dominate the size.
- Largest source files by line count:
  - `src/quality/validatePackage.ts`: 2,127 lines.
  - `src/modules/designSystem.ts`: 1,140 lines.
  - `src/output/exportPackage.ts`: 913 lines.
  - `src/modules/frontendContract.ts`: 902 lines.
  - `src/core/types.ts`: 869 lines.
  - `src/modules/revisionProtocol.ts`: 761 lines.

## Executive Verdict

Archetype is strongest as a deterministic contract-package generator and lifecycle harness. It has unusually strong governance language, install surfaces, role contracts, QA artifacts, repair planning, and release contracts.

The product is not yet production-grade as an autonomous frontend-quality harness because too much of the system still proves the harness and generated scaffold rather than proving an independently implemented product. The next evolution should shift from "we generated all required contracts" to "we can prove a real target implementation satisfies those contracts with bounded tokens, bounded IO, and non-spoofable lifecycle evidence."

## Core Strengths

1. Lifecycle architecture is coherent.
   - Weak context stops at clarification.
   - Draft packages stop before implementation readiness.
   - Approved packages produce implementation, test, QA, verification, and repair artifacts.

2. Install and distribution are viable.
   - CLI and MCP binaries exist.
   - Plugin install contracts cover Codex and Claude Code surfaces.
   - Package dry run is modest: 388 KB packed.

3. Agent roles are now serious.
   - Product, UX, frontend, design system, type, pixel, accessibility, test-first, verification, repair, and QA roles all have explicit authority, blockers, handoffs, and self-review loops.

4. Repair planning is real enough to matter.
   - Failed target checks become classified repair tasks with source artifacts, target files, rerun commands, and drift reports.

5. The product has a strong "evidence, not vibes" culture.
   - Many prior lessons are now encoded in contracts: one-question clarification, no weak-context code generation, no marker-only completion, no self-approval, and patch implementation drift before revising contracts.

## Critical Findings

### P0. CLI Output Deletion Safety

Multiple reviewers independently found the same issue: MCP output paths are guarded, but CLI `generate --out` can pass an arbitrary path into exporters that delete the output directory recursively.

Risk:

- User data loss.
- Production trust failure.
- Release blocker.

Evidence:

- `src/cli.ts` resolves `--out` and calls export paths.
- `src/output/exportPackage.ts`, `src/output/exportDraftPackage.ts`, and `src/output/exportClarificationPackage.ts` delete output directories with recursive force.
- MCP has `assertSafeOutputDirectory`; CLI does not have equivalent parity.

Fix direction:

- Reuse the MCP safety guard in CLI.
- Require `--force` for existing non-empty output directories.
- Refuse home, desktop, repo root, filesystem root, and likely project roots unless explicitly marked as Archetype output directories.
- Add destructive-output contract tests.

### P0. Self-Confirming Verification

Archetype can generate a target scaffold and then verify that scaffold. That proves the harness path works, but it is not equivalent to proving an independent frontend implementation satisfies the generated contracts.

Risk:

- False confidence.
- "Production-grade frontend" claim becomes overclaimed.
- Agents can pass the harness while building shallow UI.

Evidence:

- Generated target contains `data-archetype-*` markers and generic panels.
- Playwright tests still lean on markers, headings, screenshots, route visibility, and broad text checks.
- Marker-only audit can be gamed with shallow browser interactions.
- QA reports often derive scenario status from global Playwright status instead of per-scenario result evidence.

Fix direction:

- Split evidence grade:
  - `scaffold_verified`
  - `browser_smoke_verified`
  - `behavior_verified`
  - `manual_reviewed`
  - `production_integrated`
- Add independent target fixtures with intentional pass/fail apps.
- Ingest Playwright JSON per scenario into QA artifacts.
- Make scaffold proof unable to satisfy final product behavior readiness.

### P0. Draft Generation Builds Canonical Artifacts Too Early

The lifecycle says no canonical spec/test/implementation artifacts before approval, but the compiler still builds many canonical artifacts in memory before CLI decides to export a draft package.

Risk:

- Wasted compute and tokens.
- Lifecycle semantics are operationally weaker than the docs imply.
- Harder to reason about future agent/tool behavior.

Fix direction:

- Split compiler phases:
  - context
  - draft
  - canonical
  - test-first
  - verification
  - target
- Draft mode should stop before canonical spec, test-first, Playwright, target, and QA package construction.

### P0. Approval Can Be Spoofed Structurally

Approval is currently an intake shape, not a durable product object.

Risk:

- Any agent or user can set `contractApproval.approved: true` and `approverType: "human"`.
- No binding to a specific draft, source hash, reviewed artifacts, or approved assumption set.

Fix direction:

- Add `archetype approve-draft`.
- Approval artifact should bind:
  - draft package id.
  - source hash.
  - reviewed artifact refs.
  - approved assumptions.
  - approver identity.
  - timestamp.
  - package checksum.
- Generation should reject approval that does not match the current draft/source.

### P0. Artifact Registry Missing

Artifact paths are duplicated across pipeline, exporters, manifests, validators, docs, generated README/AGENTS, contracts, and tests.

Risk:

- Drift is likely as the product grows.
- Adding one artifact requires edits in too many places.
- Validation can become inconsistent with export.

Fix direction:

- Create `src/artifacts/registry.ts` as the single source of truth:
  - id.
  - path.
  - type.
  - package phase.
  - schema.
  - writer.
  - validator.
  - read priority.
  - artifact group.
  - token budget.
- Generate manifest, required-file lists, package docs, validator expectations, and agent read plans from this registry.

### P0. Token And Artifact Surface Is Too Large

Archetype is safer than it is ergonomic. The generated package asks agents to read too much.

Risk:

- Agents miss critical artifacts.
- Token waste.
- Weak models follow instructions mechanically but do not internalize the lifecycle.

Evidence:

- Generated start-here surfaces list many files.
- `archetype_read_artifact` returns full content.
- `spec/archetype-spec.json` can approach 1 MB in generated packages.
- Agent/skill/plugin surfaces are duplicated across root and plugin directories.

Fix direction:

- Add `agent-context.compact.json` or `agent-brief.md`.
- Add MCP `readArtifact` options:
  - `maxBytes`.
  - `mode: summary | excerpt | full`.
  - `jsonPointer`.
  - `markdownHeading`.
  - `artifactGroup`.
- Add phase bundles:
  - clarification.
  - draft review.
  - implementation.
  - verification.
  - repair.
- Full artifact reads should be opt-in.

### P0. Build/Test/Verification Speed Is Not Productized

Full tests rebuild repeatedly and generated target workspaces install large dependencies repeatedly.

Risk:

- Slow iteration.
- Huge disk usage.
- Harder contributor experience.

Evidence:

- `tmp/` measured 3.9 GB.
- `package.json` chains many scripts, and most contract scripts run `npm run build`.
- Generated target verification installs, typechecks, builds, runs Playwright, and audits without dependency hash caching.

Fix direction:

- Build once per full contract run.
- Add a Node-based contract runner with timing output.
- Add `check:fast`, `check:contracts`, and `check:release`.
- Cache generated target installs by package hash.
- Add `clean:tmp-heavy`.
- Add budgets:
  - max artifact count.
  - max package bytes.
  - max MCP response bytes.
  - max verify wall time.
  - max tmp disk usage.

### P1. Schema Validation Is Too Weak

The repo exports schemas but validation is largely manual and permissive.

Risk:

- Typos and extra fields can pass.
- Structural drift can hide until late.
- "Schema validation" overclaims rigor.

Fix direction:

- Add Ajv or equivalent.
- Make `additionalProperties: false` for stable contracts.
- Generate schemas from TypeScript or TypeScript from schemas.
- Split `validatePackage.ts` into domain validators.

### P1. Natural-Language Front Door Is Still Instructional

`$archetype` and `/archetype` work through host skills/commands, but the package itself does not expose a first-class natural-language lifecycle command that reads materials and runs the clarification loop.

Risk:

- User mental model and implementation model diverge.
- Host agent must behave well and know how to call the right tools.

Fix direction:

- Add `archetype run "<brief>" --material <path>`.
- Add MCP tool `archetype_run_lifecycle`.
- Add material ingestion that can read local files safely and store source chunks.
- The tool should ask/apply one clarification question at a time.

### P1. Test-First Evidence Is More Contractual Than Executed

The test-first story is strong in artifacts, but initial red evidence is not yet always a real failed test run.

Risk:

- TDD claim is partially aspirational.
- Implementation agents can treat test plans as docs, not gates.

Fix direction:

- Require actual red-run evidence before implementation.
- Add Vitest to generated target or stop generating Vitest obligations.
- Store per-suite red/green command outputs.
- Make missing red evidence block implementation authorization.

### P1. Context Readiness Uses Heuristics

The context gate is effective for obvious weak prompts, but much of it is keyword/field based.

Risk:

- Generic phrases can satisfy important fields.
- Conflicts are represented but not deeply extracted.

Fix direction:

- Introduce evidence extraction records:
  - claim.
  - source.
  - confidence.
  - contradiction set.
  - approval state.
- Make context matrix explain exactly why each dimension is confirmed, candidate, or missing.

## Critique Of The Reviews

### Scope A - Lifecycle

Useful:

- Correctly identified that the lifecycle is coherent but operationally leaky because draft generation still builds canonical artifacts in memory.
- Correctly elevated approval spoofing and runtime lifecycle authority.

Critique:

- It underweighted destructive CLI output safety, which is a more immediate release blocker.
- It described test-first evidence weakness but did not fully connect it to the self-confirming scaffold issue.

Reinforced lesson:

- Governance language is not enough. The implementation boundary must enforce the lifecycle before artifacts are even constructed.

### Scope B - CLI, MCP, Install, Release

Useful:

- Strongest review for user-facing 60-second setup and release risk.
- Correctly found CLI/MCP safety parity gap.
- Correctly found install/marketplace drift and `doctor` overclaim risk.

Critique:

- Marketplace drift may be a P1 unless it breaks current install; CLI destructive output remains the real P0.
- It focused on install packaging more than post-install natural language execution quality.

Reinforced lesson:

- First-run trust is product quality. A single unsafe CLI path can invalidate a polished install story.

### Scope C - Code Architecture

Useful:

- Strongest architectural review.
- Correctly named artifact path duplication and `validatePackage.ts` size as the biggest maintainability risks.
- Correctly called out permissive schemas and `Record<string, unknown>` leakage.

Critique:

- It recommended async filesystem writes, but the larger speed win is not async IO; it is fewer generated artifacts, no full tree rewrites, no repeated builds, and cached target installs.

Reinforced lesson:

- Central artifact registry is the keystone. Without it, every future hardening scope gets slower and riskier.

### Scope D - QA And Tests

Useful:

- Most important product-quality review.
- Correctly identified the self-confirming scaffold loop.
- Correctly separated broad scenario generation from true behavioral proof.

Critique:

- It should not imply the current tests are useless. They are excellent harness regression tests. They are just not enough as independent product verification.

Reinforced lesson:

- Rename evidence levels so a scaffold pass can never masquerade as product implementation readiness.

### Scope E - Agents, Skills, UX

Useful:

- Correctly identified that Archetype still relies too much on a careful host agent.
- Correctly found missing scoped artifact reads and a missing first-class natural-language run command.

Critique:

- The review underplayed that host skills are intentionally the front door. The issue is not that skills exist; the issue is that the skill should have a stronger MCP-backed lifecycle primitive.

Reinforced lesson:

- Agent instructions should not carry workflow state. Tools and artifacts should carry workflow state.

### Scope F - Performance, Tokens, IO

Useful:

- Best quantitative review.
- Correctly measured the `tmp/` bloat pattern and repeated build/install cost.
- Correctly identified unbounded MCP artifact reads as token-dangerous.

Critique:

- It treated generated package size as a primary problem. The deeper problem is read strategy: large artifacts can exist if agents receive compact phase bundles by default.

Reinforced lesson:

- Optimize the default path, not just the total artifact tree.

## Final Investment Map

### Phase 1 - Safety And Trust

1. Add CLI output safety guard.
2. Add destructive-output tests.
3. Add explicit approval artifact/command.
4. Validate clarification answer IDs against the current question.
5. Add deterministic repeatability test with frozen volatile fields.

Exit signal:

- No CLI command can delete arbitrary user directories.
- Approval cannot be spoofed by editing intake JSON alone.
- Clarification answers cannot be stale or arbitrary.

### Phase 2 - Artifact Registry And Validation

1. Build `src/artifacts/registry.ts`.
2. Generate artifact index, required file lists, export manifests, docs read order, and validator expectations from it.
3. Split `validatePackage.ts` into bounded validators.
4. Add Ajv-backed schema validation.
5. Make stable schemas reject unknown fields where appropriate.

Exit signal:

- Adding a new artifact requires one registry entry and optional writer/validator, not scattered manual edits.

### Phase 3 - Token And Agent Context Optimization

1. Add `agent-context.compact.json`.
2. Add MCP bundle reads by phase.
3. Add `maxBytes`, `mode`, `jsonPointer`, `markdownHeading`, and `artifactGroup` to `readArtifact`.
4. Shrink generated start-here instructions to 3-5 required reads per phase.
5. Deduplicate root/plugin agent and skill surfaces or generate plugin mirrors at pack/install time.

Exit signal:

- A downstream agent can start each phase from one compact context and request full artifacts only when needed.

### Phase 4 - Real Verification

1. Split scaffold verification from independent implementation verification.
2. Add independent target fixtures with intentional failures.
3. Add per-scenario Playwright result ingestion.
4. Add real malformed-data runner.
5. Add axe/accessibility scanner smoke checks.
6. Add visual baselines or explicit human-reviewable visual diff gates.
7. Convert golden summaries into enforced baselines.

Exit signal:

- Archetype can prove it catches real product failures in a target it did not generate itself.

### Phase 5 - Speed And Developer Experience

1. Build-once contract runner.
2. Target dependency hash cache.
3. Incremental artifact writer with content hashes.
4. Atomic output staging.
5. Performance budgets.
6. `clean:tmp-heavy`.

Exit signal:

- Full release checks remain rigorous, but daily checks are fast, bounded, and explain where time/disk went.

### Phase 6 - Natural Language Lifecycle Primitive

1. Add `archetype run "<brief>"`.
2. Add MCP `archetype_run_lifecycle`.
3. Read local material paths safely.
4. Store chunked source graph.
5. Ask/apply one clarification at a time.
6. Produce approval-ready draft and design preview through one loop.

Exit signal:

- `/archetype "idea"` is backed by a real lifecycle primitive, not just host-agent instruction choreography.

## Perfected Top Ten Findings

1. P0: CLI output paths are not safe enough before recursive deletion.
2. P0: Verification currently proves the harness/scaffold better than it proves independent product behavior.
3. P0: Draft generation builds canonical artifacts too early.
4. P0: Approval is structurally spoofable and not bound to a draft/source hash.
5. P0: Artifact paths and requirements need a single registry.
6. P0: Unbounded artifact reads and large default read sets create token risk.
7. P0: Test/build/verify loops are too slow and disk-heavy for productized iteration.
8. P1: Schema validation is too permissive and manual.
9. P1: Test-first red evidence and malformed-data evidence need real execution.
10. P1: Natural-language `/archetype` needs a first-class lifecycle primitive behind the skill.

## Current Convergence Answer

I cannot honestly answer that Archetype is a full production-grade product yet.

I can answer that Archetype has a strong harness foundation and a clear path to production-grade quality. The next work should not add more role prose. It should harden safety, artifact architecture, runtime proof, bounded context, and executable lifecycle primitives.
