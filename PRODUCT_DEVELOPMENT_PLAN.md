# Archetype Complete Product Development Plan

This plan treats Archetype as a complete product: a Design Architecture Compiler that converts product intent and evidence into UX architecture, a product-specific design system, and a frontend-agent build contract.

The product should be built as a deterministic compiler with LLM-assisted decision modules, not as a chat-only design assistant. The durable product value is in the artifacts, schemas, validation gates, evidence traceability, and downstream build contracts.

## Product North Star

Archetype succeeds when a user can provide product context, goals, visual references, brand material, and optional code/design evidence, then receive a validated architecture package that a frontend agent can build from without inventing major UX, design-system, routing, state, accessibility, or data decisions.

## Product Architecture

Core runtime:

1. Intake and source normalization.
2. Evidence Ledger.
3. Product Model.
4. User, role, permission, entity, and workflow models.
5. Product Experience Blueprint.
6. Design System Architecture Graph.
7. Design System Package.
8. Screen Specs.
9. Frontend Agent Contract.
10. Artifact Validation Engine.
11. Readiness and quality reports.
12. Export package.

Core product surfaces:

- Project intake workspace.
- Evidence review.
- Architecture review.
- Screen spec review.
- Design-system review.
- Frontend contract review.
- Validation/readiness dashboard.
- Export and integration center.
- Revision history and decision records.

## Phase 1 - Compiler Foundation

Goal: Make Archetype artifact-first and deterministic.

Build:

- TypeScript compiler package.
- Stable project IDs and artifact IDs.
- Manifest generation.
- Output package writer.
- JSON/YAML artifact generation.
- Validation engine.
- Readiness score engine.
- Command-line runner for local generation.

Exit criteria:

- A structured intake file generates a complete `archetype-output` folder.
- Required artifacts are written to the correct package paths.
- Missing required artifacts create blockers.
- Readiness report is generated.

## Phase 2 - Evidence and Decision System

Goal: Make evidence binding.

Build:

- Evidence Ledger schema.
- Source normalization for text, goals, images, brand files, docs, code, and design artifacts.
- Fact, observation, inference, assumption, risk, conflict, missing-context, and decision records.
- Decision lifecycle: proposed, accepted, rejected, superseded, blocked.
- Conflict resolution protocol.
- Evidence refs on every major output.

Exit criteria:

- Every major decision can be traced back to source evidence or assumption.
- Conflicting inputs are surfaced instead of silently resolved.
- Low-confidence decisions are visible.

## Phase 3 - Product Understanding Engine

Goal: Convert messy context into structured product architecture.

Build:

- Product Model generator.
- User and Jobs-to-be-Done generator.
- Role and permission modeling.
- Entity modeling.
- Entity lifecycle modeling.
- Workflow extraction.
- Risk-domain classification.

Exit criteria:

- Archetype can identify product type, users, jobs, entities, workflows, roles, and risk flags.
- Missing business or user constraints are documented.

## Phase 4 - UX Architecture Engine

Goal: Generate the Product Experience Blueprint.

Build:

- Information architecture generator.
- Navigation model generator.
- Route map generator.
- User journey generator.
- Flow spec generator.
- Screen inventory generator.
- Screen state matrix generator.
- Action taxonomy generator.

Exit criteria:

- Every route maps to a screen.
- Every screen maps to a user job and workflow.
- Every P0 screen has default, loading, empty, error, and permission states.

## Phase 5 - Screen Specification Engine

Goal: Make every screen buildable.

Build:

- YAML screen spec generator.
- Layout section hierarchy.
- Required components and patterns.
- Data needs.
- Actions and interactions.
- Form behavior.
- Responsive behavior.
- Accessibility rules.
- Content rules.
- Testable acceptance criteria.

Exit criteria:

- A frontend agent can build P0 screens from specs without broad guessing.
- Missing data or design decisions are reported as gaps.

## Phase 6 - Design System Engine

Goal: Derive the system from product workflows.

Build:

- Foundations generator.
- Visual direction generator.
- Token architecture generator.
- Primitive, semantic, component, and pattern tokens.
- Component registry.
- Component API contract.
- Product-specific pattern registry.
- Pattern lifecycle rules.
- Usage guidelines and anti-patterns.

Exit criteria:

- Every generated component or pattern exists because a workflow or screen requires it.
- Tokens map to components, patterns, and screen rules.

## Phase 7 - DSAG Graph Engine

Goal: Make coherence inspectable.

Build:

- DSAG node and edge schema.
- Graph builder from artifacts.
- Reachability checks.
- Evidence-to-decision graph links.
- Token-to-component-to-pattern-to-screen trace.
- Workflow-to-screen-to-contract trace.

Exit criteria:

- Orphan screens, components, patterns, and tokens are detected.
- Product goals can be traced down to implementation artifacts.

## Phase 8 - Frontend Agent Contract Engine

Goal: Prevent downstream UI drift.

Build:

- Build manifest.
- Routing contract.
- Component usage map.
- Layout rules.
- Responsive rules.
- Interaction rules.
- Form rules.
- Data contracts.
- Fixture data.
- Acceptance criteria package.
- Frontend-agent instructions.
- Gap-reporting protocol.

Exit criteria:

- Frontend agents know exactly what to build, what to reuse, and what not to invent.
- Contract validation fails when required screen, data, state, or component decisions are missing.

## Phase 9 - Quality, Accessibility, and Readiness

Goal: Make export gated by quality.

Build:

- Schema validation.
- Artifact presence validation.
- Evidence reference validation.
- Accessibility severity classification.
- Readiness score with hard blockers.
- Export-readiness checklist.
- Consistency report.
- Screen coverage report.
- Component coverage report.
- Unresolved-decision report.

Exit criteria:

- Export readiness cannot be true when blockers exist.
- Accessibility blockers prevent ready status.

## Phase 10 - LLM Decision Layer

Goal: Add high-quality design reasoning while preserving compiler constraints.

Build:

- Provider abstraction.
- Prompt packs per module.
- Structured-output contracts.
- Retry and repair loops.
- Evidence-aware prompts.
- Low-confidence escalation.
- Deterministic post-processing.
- Prompt-injection defenses for untrusted inputs.

Exit criteria:

- LLM output must satisfy schemas before entering the package.
- Invalid or unsupported claims are rejected or downgraded to assumptions.

## Phase 11 - Image, Document, Code, and Design Ingestion

Goal: Support rich source material.

Build:

- Image analysis pipeline.
- Brand material parser.
- Document parser.
- Codebase audit.
- Token extraction.
- Component inventory extraction.
- Screenshot audit.
- Figma-compatible token/design file import.
- Secret and sensitive-data warnings.

Exit criteria:

- Each source produces evidence records.
- References inform architecture without copying protected expression.

## Phase 12 - Product Workbench UI

Goal: Make the compiler usable by real product teams.

Build:

- Project creation.
- Intake form and upload surface.
- Evidence Ledger viewer.
- Architecture map viewer.
- Screen spec viewer/editor.
- Design system viewer.
- Contract viewer.
- Readiness dashboard.
- Approval gates.
- Export center.

Exit criteria:

- Users can review, approve, revise, and export packages from the browser.
- The UI shows what Archetype knows, assumes, and still needs.

## Phase 13 - Revision, Collaboration, and Governance

Goal: Support real product iteration.

Build:

- Revision protocol.
- Decision diffing.
- Artifact invalidation.
- Approval records.
- Comments.
- Change log.
- Deprecation policy.
- Migration notes.
- Version history.

Exit criteria:

- Feedback updates decisions and regenerates affected artifacts only.
- Teams can see why outputs changed.

## Phase 14 - Integrations

Goal: Put Archetype into design and engineering workflows.

Build:

- GitHub export.
- Pull request generation.
- Storybook generation.
- Figma token export/import.
- Frontend build simulation.
- Issue tracker export.
- CI validation command.

Exit criteria:

- Generated contracts can move directly into engineering workflow.
- CI can detect contract drift and design-system violations.

## Phase 15 - Continuous Maintenance System

Goal: Turn Archetype into a living design architecture system.

Build:

- Design-system drift detection.
- Duplicate component detection.
- Token misuse detection.
- Accessibility regression detection.
- Design/code mismatch detection.
- Multi-product support.
- Multi-brand support.
- Governance analytics.

Exit criteria:

- Archetype can maintain a product design system after initial generation.
- Teams can detect and repair drift continuously.

## Phase 16 - Enterprise Hardening

Goal: Make the product robust for serious teams.

Build:

- Workspace management.
- Auth and permissions.
- Data retention settings.
- Sensitive-data handling.
- Audit logs.
- Compliance notes.
- Rate limits and job queues.
- Observability.
- Cost controls.

Exit criteria:

- Product can support teams, private projects, and regulated-domain reviews.

## Implementation Order

The first implementation should start with Phases 1, 2, 3, 4, 5, 6, 8, and 9 as a local compiler package. Phases 7 and 10 deepen intelligence and coherence after the first package generator works. The workbench UI begins after the compiler can produce useful artifacts reliably.

## First Code Milestone

The first code milestone is complete when this command works:

```txt
npm run smoke
```

Expected result:

- A sample project intake generates `tmp/archetype-output`.
- The package includes manifest, evidence, product model, experience architecture, design system, screen specs, frontend contract, and quality reports.
- The readiness report clearly lists score, blockers, warnings, and validation checks.
