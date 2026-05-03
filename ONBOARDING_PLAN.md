# Archetype Onboarding Plan

## Purpose

Archetype onboarding must teach the user what the product does by helping them create or inspect a real architecture package. It should not be a passive tour, a marketing welcome screen, or a wall of artifact names.

The core onboarding promise:

> Give Archetype product context and evidence. Archetype compiles that evidence into a traceable UX architecture, design system, frontend-agent contract, validation report, and handoff package.

## How Archetype Works

Archetype is a Design Architecture Compiler.

It does not begin by choosing colors, typography, or generic components. It begins with product evidence:

- Product context and goals.
- Users, jobs, permissions, workflows, and constraints.
- Screenshots, reference images, brand material, docs, or code.
- Known backend, auth, data, copy, accessibility, and production constraints.

Archetype then runs the evidence through a structured architecture pipeline:

1. Intake is normalized into evidence sources.
2. Source material is scanned for secrets, PII, regulated data, and prompt-injection attempts.
3. The Evidence Ledger separates facts, observations, assumptions, missing context, risks, and decisions.
4. The Product Model defines users, jobs, roles, permissions, entities, and lifecycle states.
5. The Experience Architecture defines information architecture, routes, screens, workflows, and state models.
6. The Design System Architecture Graph connects evidence to workflows, patterns, components, tokens, accessibility rules, and quality gates.
7. Screen specs define what each screen must contain, which states it supports, and what interactions are allowed.
8. The Design System exports semantic tokens, component contracts, pattern contracts, content rules, and accessibility requirements.
9. The Frontend Agent Contract tells a human or AI frontend builder exactly what to build and what not to invent.
10. Validation, E2E coverage, target execution proof, and readiness scoring reveal what is ready and what still needs human review.

The Workbench is the review and handoff environment. It lets a user inspect the generated package, understand readiness, repair missing contract details, save packages, compare package versions, and export a deterministic handoff for a frontend-building agent.

## Current Onboarding Problem

The current app does not create a clean first-run mental model.

- It loads into an existing package experience instead of a fresh start.
- Sample data is useful, but it is not framed as a learning path.
- The user is not told what Archetype needs, what it will produce, or why the output matters.
- The app exposes powerful review surfaces before the user understands the compiler pipeline.
- There is no obvious `New project`, `Load sample`, `Import package`, or `Reset workspace` decision.
- The LLM provider/key moment is not productized, so users may assume the app is either fully local or blocked by hidden configuration.

## Iteration Log

### Iteration 1: Documentation-First Onboarding

Concept: Start with an explanation of Archetype, its pipeline, and its artifacts.

Why it fails:

- It teaches too much before the user does anything.
- It makes Archetype feel like documentation, not a working compiler.
- It does not solve the fresh-state problem.

### Iteration 2: Sample-First Onboarding

Concept: Always load the sample package and guide the user through the Launch Review.

Why it fails:

- It explains the review surface, but not project creation.
- The sample becomes confused with the user's workspace.
- Returning users still lack a clean way to start over.

### Iteration 3: API-Key-First Onboarding

Concept: Ask for an LLM API key at the start.

Why it fails:

- It creates friction before trust.
- It blocks users who only want to inspect a sample or imported package.
- It asks for a secret before explaining why the secret is needed.
- It makes the product feel like an API wrapper instead of an architecture compiler.

### Iteration 4: Wizard-First Onboarding

Concept: Use a linear wizard: context, screenshots, brand, stack, API key, generate.

Why it partially works:

- It gives a clear path from nothing to first package.
- It fits first-time users.

Why it is not enough:

- Power users need import, sample, and skip paths.
- A strict wizard can hide the Workbench's real surfaces.
- The LLM key still needs to appear only when the user crosses from local draft/preflight into live generation.

### Iteration 5: Empty-State-First Onboarding

Concept: Treat the fresh Workbench state as the onboarding surface.

Why it works:

- It fixes the actual product defect: no fresh state.
- It gives users three clear jobs: create, inspect sample, or import.
- It teaches through real product UI instead of a separate tutorial.

Remaining issue:

- It still needs a clear activation point and API-key boundary.

### Iteration 6: Activation-First Onboarding

Concept: Define onboarding success as reaching the first reviewed package, not merely completing the form.

Why it works:

- It aligns with Archetype's actual value: a validated, reviewable package.
- It teaches the compiler pipeline as visible progress.
- It makes readiness and handoff the natural destination.

Remaining issue:

- Users need to know what can happen locally and what requires an LLM provider.

### Iteration 7: Converged Model

Concept: Fresh Start Hub + Guided Package Creation + Just-in-Time LLM Setup + Launch Review Graduation.

Why this converges:

- It gives true fresh state.
- It supports beginners, power users, returning users, and AI agents.
- It does not ask for an API key before the user understands the product.
- It makes sample mode and import mode first-class paths.
- It teaches the product through the same surfaces users will keep using.
- It defines completion as a real output: a validated package ready for review or handoff.

## Converged Onboarding Solution

The first-run experience should be a `Start Hub`, not the loaded sample package.

The Start Hub has three primary actions:

1. `Create a package`
2. `Explore sample package`
3. `Import existing package`

Secondary actions:

- `Restore workspace state`
- `Open recent package`
- `Reset local workspace`
- `Read quick product map`

The product map is short and concrete:

- `Input`: context, goals, users, screenshots, brand, docs, code.
- `Compiler`: evidence ledger, product model, workflows, DSAG, design system, contracts.
- `Proof`: validation, readiness, E2E scenarios, target execution.
- `Handoff`: frontend-agent instructions, build manifest, routes, screens, components, tokens, data contracts.

## Onboarding Flow

### Step 0: Fresh Start Hub

Shown when:

- No active package is loaded.
- The user selects `New project`.
- The user selects `Reset to fresh state`.
- Local state exists but no package is selected.

Required UI:

- Clear one-sentence product definition.
- Three primary actions: create, sample, import.
- Recent packages if available.
- A compact output preview showing what Archetype produces.
- AI-readable `data-agent-*` landmarks for each action.

Do not:

- Auto-load the sample as the first screen.
- Ask for an LLM key here.
- Show all Workbench navigation before a package exists.

### Step 1: Project Intent

Goal: collect enough context to make a meaningful architecture draft.

Fields:

- Project name.
- Product context.
- Primary users.
- User goals.
- Business goals.
- Constraints.
- Preferred stack.
- Operating mode: Fast Architecture, Full Architecture, Existing Product Audit, Contract Repair.

UI behavior:

- Show a readiness meter for input quality.
- Keep fields editable after generation.
- Let users save a draft locally without an LLM key.
- Provide an example toggle, not placeholder paragraphs inside every field.

### Step 2: Evidence Upload

Goal: gather source material that constrains the architecture.

Supported evidence:

- Screenshots and product references.
- Brand notes, colors, logos, tone guidance.
- Existing docs.
- Existing code snippets or file manifests.
- Backend/API notes.
- Auth/permission notes.

UI behavior:

- Every uploaded item becomes an evidence record.
- Safety findings are visible immediately.
- Prompt-injection attempts are explained as source risks, not followed as instructions.
- Sensitive data warnings recommend redaction.
- Unsupported files are recorded with a clear limitation.

Still no LLM key is required at this point.

### Step 3: Local Preflight

Goal: show the user whether the intake is sufficient before asking for a provider key.

Local checks:

- Is product context present?
- Are users or user goals present?
- Is operating mode selected?
- Are evidence files readable?
- Are there obvious safety blockers?
- Are there missing high-impact constraints, such as backend, auth, production copy, or compliance context?

Output:

- `Ready to generate`
- `Generate with warnings`
- `Needs required context`

This preflight should be deterministic and local.

### Step 4: LLM Provider Setup

Ask for an LLM API key only when the user clicks `Generate architecture` and the selected generation mode requires non-local model reasoning.

The key should not be requested:

- On the Start Hub.
- While exploring the sample.
- While importing an existing package.
- While editing a draft.
- While running local validation.
- While reviewing an already generated package.

The key should be requested:

- After the user has entered enough project context to generate.
- After local preflight explains what will be sent.
- Before the first provider-backed architecture run.
- Again only if the previous key is missing, invalid, expired, or the user changes provider.

Provider setup should explain:

- Why a provider is needed: to reason over product context and evidence for architecture generation.
- What will be sent: normalized context and evidence summaries, not hidden app state.
- What should not be included: secrets, credentials, raw regulated data, or private files that have not been approved.
- How the key is handled.

Default key handling:

- Session-only by default.
- Never store in localStorage as plain text.
- Offer `Remember for this browser` only if the implementation has an encrypted or server-side secret mechanism.
- Provide `Use local deterministic mode` for demos, validation, sample review, and offline compiler runs.

Recommended provider step copy:

> Archetype can run local checks without an LLM key. To generate a full architecture package from your context and evidence, connect a model provider. Review the evidence summary before sending it.

### Step 5: Evidence Review Before Generation

Goal: prevent accidental sharing and make trust explicit.

UI:

- Evidence summary table.
- Safety findings.
- Redaction suggestions.
- Included/excluded toggle per evidence item.
- `Send summaries only` default when possible.
- Final `Generate architecture` action.

This is the final gate before provider-backed generation.

### Step 6: Generation Progress

Show generation as compiler phases, not as vague AI thinking.

Phases:

1. Normalize evidence.
2. Build Evidence Ledger.
3. Model users, roles, permissions, and entities.
4. Create routes, workflows, and screen inventory.
5. Build DSAG.
6. Generate screen specs.
7. Generate design-system contracts.
8. Generate frontend-agent contract.
9. Validate package.
10. Prepare Launch Review.

Each phase should show:

- Status.
- Artifact created.
- Warnings or blockers.
- Retry or repair action when relevant.

### Step 7: Launch Review Graduation

Onboarding completes when the user reaches the first Launch Review with a generated or imported package.

The Launch Review should answer:

- Is this package ready for a frontend agent?
- What is trusted?
- What is missing?
- What needs human review?
- What can be exported?

Completion actions:

- Save package to workspace.
- Review frontend contract.
- Review E2E proof.
- Export handoff.
- Create revision request.

This is the correct aha moment:

> The user sees that Archetype did not just make screens. It produced a traceable architecture package and a deterministic build contract.

## Returning User Flow

Returning users should not see onboarding again by default.

Instead they see:

- Recent packages.
- Active workspace health.
- Drafts waiting for generation.
- Packages with unresolved review gates.
- `Create new package`.
- `Import package`.
- `Replay onboarding`.

Onboarding state should be tracked locally:

- `start_hub_seen`
- `first_package_created`
- `sample_explored`
- `provider_connected`
- `launch_review_completed`
- `handoff_exported`
- Dismissed contextual hints by feature ID.

## Empty States

Every empty state should teach the next action.

Required empty states:

- No active package.
- No saved packages.
- No source materials.
- No uploaded evidence.
- No generation draft.
- No contract gaps.
- No revision requests.
- No E2E run artifacts.
- No search results.
- No provider connected.

Each empty state needs:

- What appears here.
- Why it matters.
- One primary action.
- One secondary action when useful.

Example:

> No source materials yet. Add screenshots, docs, brand notes, or code evidence so Archetype can make architectural decisions from evidence instead of assumptions.

Actions:

- `Add source material`
- `Continue without sources`

## Contextual Guidance

Use small inline guidance instead of long tours.

Good guidance moments:

- First time in Intake Builder: explain that context becomes the seed for Product Model and screen specs.
- First uploaded source: explain evidence safety and source confidence.
- First readiness warning: explain warning versus blocker.
- First Launch Review: explain the ready/hold decision.
- First Handoff export: explain what a frontend agent consumes.

Do not explain standard controls like buttons, dropdowns, or search.

## AI-Agent Accessibility

Onboarding must be usable by human users and AI agents.

Required machine-readable hooks:

- `data-agent-onboarding-state`
- `data-agent-action="create-package"`
- `data-agent-action="explore-sample"`
- `data-agent-action="import-package"`
- `data-agent-action="reset-workspace"`
- `data-agent-action="connect-provider"`
- `data-agent-action="run-local-preflight"`
- `data-agent-action="generate-architecture"`
- `data-agent-action="review-evidence"`
- `data-agent-action="export-handoff"`

Required landmarks:

- Start Hub.
- Intake.
- Evidence.
- Preflight.
- Provider Setup.
- Generation Progress.
- Launch Review.
- Handoff.

AI agents should be able to determine:

- Whether a package exists.
- Whether provider setup is required.
- Whether generation is blocked.
- Which evidence is included.
- Which readiness warnings remain.
- Which artifact should be handed to a frontend-building agent.

## Implementation Phases

### Phase 1: Fresh State and Start Hub

- Stop auto-loading the sample as the only first-run path.
- Add explicit empty app state.
- Add Start Hub.
- Add `Create package`, `Explore sample`, and `Import existing package`.
- Add `Reset to fresh state`.
- Add recent package recovery.

### Phase 2: Guided Intake

- Convert Intake Builder into a guided creation flow.
- Add input quality preflight.
- Add local draft persistence.
- Add operating mode explanation.
- Add clear source-material empty states.

### Phase 3: Provider Setup

- Add provider selection and session-only API key entry.
- Ask for the key only at generation time.
- Add evidence summary before provider call.
- Add redaction and include/exclude controls.
- Add provider connection diagnostics.

### Phase 4: Generation Progress

- Add compiler-phase progress view.
- Show artifacts as they are created.
- Surface warnings and blockers per phase.
- Add retry, repair, and save-draft actions.

### Phase 5: Launch Review Graduation

- Mark onboarding complete when the user reaches Launch Review with a package.
- Add first-run callouts only to readiness, warnings, proof, and handoff.
- Add replay onboarding from help or settings.

### Phase 6: Measurement and Hardening

- Track onboarding completion, skip, provider setup success, generation success, first save, first handoff export, and reset usage.
- Add Playwright E2E scenarios for fresh state, sample path, import path, provider-required path, skipped provider path, failed key path, redaction path, and reset path.
- Add accessibility checks for keyboard navigation, focus order, status announcements, and screen-reader names.

## Success Metrics

Onboarding is working when:

- A new user can explain what Archetype produces after two minutes.
- A new user can create or inspect a package without reading external docs.
- A user is not asked for an LLM key until they understand why it is needed.
- Sample exploration does not pollute the user's own workspace.
- Importing an existing package does not trigger unnecessary onboarding.
- A user can reset to a fresh state at any time.
- A frontend-building AI agent can deterministically find the handoff contract.

## Final Decision

The best onboarding model is:

> Fresh Start Hub, guided package creation, local preflight, just-in-time LLM provider setup, evidence review before sending, compiler-phase progress, and Launch Review graduation.

This is better than a generic tour because it teaches Archetype through its real workflow. It is better than API-key-first onboarding because it delays sensitive configuration until the user has enough trust and a concrete reason. It is better than sample-first onboarding because it gives users a true fresh state while preserving the sample as a fast learning path.
