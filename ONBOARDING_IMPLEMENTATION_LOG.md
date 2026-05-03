# Onboarding Implementation Log

## Phase 1: Fresh State and Start Hub

Status: complete

Date: 2026-05-03

Source plan: `ONBOARDING_PLAN.md`

## Phase Goal

Implement the first onboarding phase fully:

- Stop auto-loading the sample as the only first-run path.
- Add an explicit empty app state.
- Add Start Hub.
- Add `Create package`, `Explore sample`, and `Import existing package`.
- Add `Reset to fresh state`.
- Add recent package recovery.

## Changes Made

### Workbench Startup

- Replaced automatic `loadSample()` boot with `refreshWorkspaceEntries()` plus fresh Start Hub render.
- Made `bundle === null` a deliberate onboarding state instead of rendering `Package unavailable`.
- Preserved saved workspace records while clearing only the active package context.

### Start Hub

- Added a fresh Start Hub with the required primary actions:
  - `Create a package`
  - `Explore sample package`
  - `Import existing package`
- Added secondary actions:
  - `Restore workspace state`
  - `Reset to fresh state`
  - Recent package recovery
- Added a compact product map:
  - Input
  - Compiler
  - Proof
  - Handoff
- Added output preview for the artifacts Archetype produces.
- Added `data-agent-onboarding-state` and `data-agent-action` hooks for human and AI-agent accessibility.

### Create Package Path

- Added a local project draft state that opens from `Create a package`.
- Added local draft fields for project name, operating mode, color, brand attributes, context, goals, business goals, users, and tone.
- Added local draft creation and intake JSON download.
- Explicitly states that local draft creation does not require an LLM API key.
- Does not ask for provider setup in Phase 1.

### Existing Package Paths

- `Explore sample package` loads the sample package into the existing Launch Review Workbench.
- `Import existing package` opens exported package folders from the Start Hub.
- `Restore workspace state` works from the Start Hub.
- `New Project` in the loaded Workbench returns to the fresh Start Hub.
- Recent saved packages can be reopened from the Start Hub.

### Styling

- Added responsive Start Hub layout.
- Added Start Hub action cards, product map rows, output list, and status surfaces.
- Removed the default fresh-state notice after visual review because the status badges already communicate the state.
- Verified desktop and mobile Start Hub render without horizontal overflow.

### Tests

- Updated the Playwright suite to begin from fresh state.
- Added Start Hub E2E coverage:
  - Fresh Start Hub renders before a package is loaded.
  - Create package opens local draft without asking for an LLM key.
  - Sample exploration and reset return to fresh Start Hub.
  - Recent package recovery opens a saved package.
- Preserved the existing full Workbench navigation, happy path, and 20 malformed-data edge-case tests.

## Validation Against ONBOARDING_PLAN.md

### Phase 1 Requirement: Stop Auto-Loading Sample

Result: pass

The app now starts in a true fresh state. Sample package loading is explicit through `Explore sample package`.

### Phase 1 Requirement: Explicit Empty App State

Result: pass

`bundle === null` now renders a purposeful Start Hub with `data-agent-onboarding-state="fresh-start"`.

### Phase 1 Requirement: Start Hub

Result: pass

The Start Hub explains Archetype in one sentence, provides primary actions, shows recent packages, exposes an output preview, and includes AI-readable landmarks.

### Phase 1 Requirement: Create, Sample, Import

Result: pass

All three paths are implemented as first-class actions. `Create package` starts a local intake draft, `Explore sample package` opens the sample Workbench, and `Import existing package` opens a package folder input.

### Phase 1 Requirement: Reset to Fresh State

Result: pass

The loaded Workbench now includes `New Project`, which returns to the Start Hub without deleting saved packages. The Start Hub also includes `Reset to fresh state` for draft reset.

### Phase 1 Requirement: Recent Package Recovery

Result: pass

Saved packages render on the Start Hub and can be reopened from fresh state.

### LLM API Key Boundary

Result: pass

No Phase 1 path asks for an API key. This matches the converged onboarding decision: provider setup happens only later, after local preflight and immediately before provider-backed generation.

## Test Evidence

- Unit/type test: `npm run build` passed.
- Smoke test: `npm run smoke` passed.
- E2E/UI test: `npm run workbench:e2e` passed with 26 passed, 0 failed.
- Malformed-data E2E regression: 20 passed, 0 failed.
- E2E report generation: `npm run workbench:e2e:report` passed.
- Integration test: `npm run check` passed.
- Root dependency audit: `npm audit --json` reports 0 vulnerabilities.
- Generated target dependency audit: `npm audit --json` in `tmp/generated-frontend` reports 0 vulnerabilities.
- Diff hygiene: `git diff --check` passed.
- Desktop browser visual check: `tmp/onboarding-phase1-desktop.png`.
- Mobile browser visual check: `tmp/onboarding-phase1-mobile.png`.
- Browser diagnostics: `tmp/onboarding-phase1-browser-check.json`, no desktop or mobile horizontal overflow.

## Self-Critique and Iteration Decision

Question: Is this implementation the most optimal and correct Phase 1 solution?

Answer: Yes, for Phase 1.

Reasoning:

- It fixes the real defect: the app no longer pretends a sample package is a fresh user state.
- It does not prematurely implement provider setup, local preflight, or full guided intake, because those are later phases in the plan.
- It still makes `Create package` real enough for Phase 1 by opening a local draft and producing intake JSON without requiring an LLM key.
- It preserves every existing review, proof, malformed-data, sample, import, workspace, and handoff flow.
- It gives both humans and AI agents deterministic landmarks for the onboarding state and available actions.
- It removes non-actionable startup feedback so the first screen is calmer and more intentional.

Known next work is intentionally Phase 2, not a Phase 1 defect:

- Turn the local draft path into the full guided intake flow.
- Add input quality preflight.
- Persist drafts locally.
- Expand source-material onboarding and evidence upload guidance.

## Exit Condition

I dont know any better solution for this nor do I see anything worng with the current one.

## Next Phase

Phase 2: Guided Intake.

Why this is next:

The Start Hub now gives users a true fresh state and a clean decision point. The next problem is that `Create package` should become a complete guided intake experience with input quality checks, local draft persistence, clearer evidence collection, and operating-mode guidance before provider setup is introduced in Phase 3.

## Phase 2: Guided Intake

Status: complete

Date: 2026-05-03

Source plan: `ONBOARDING_PLAN.md`

## Phase Goal

Implement the second onboarding phase fully:

- Convert Intake Builder into a guided creation flow.
- Add input quality preflight.
- Add local draft persistence.
- Add operating mode explanation.
- Add clear source-material empty states.

## Changes Made

### Guided Creation Flow

- Replaced the single Start Hub draft screen with a three-step guided intake:
  - `Project Intent`
  - `Evidence Upload`
  - `Local Preflight`
- Added `data-agent-onboarding-state` values:
  - `guided-intent`
  - `guided-evidence`
  - `guided-preflight`
- Added step navigation with AI-readable `data-agent-action` hooks.
- Preserved the Start Hub as the first screen and kept sample/import paths separate from user draft creation.

### Project Intent

- Added required Phase 2 intent fields:
  - Project name.
  - Product context.
  - Primary users.
  - User goals.
  - Business goals.
  - Constraints.
  - Preferred stack.
  - Operating mode.
- Added a live local input-quality meter with required gaps, warnings, and a deterministic score.
- Added an example toggle so examples are available without filling fields with placeholder paragraphs.
- Extended the active Workbench Intake Builder with constraints and preferred stack so the generated intake shape stays consistent.

### Evidence Upload

- Added local evidence intake for:
  - Screenshots and product references.
  - Brand notes.
  - Existing docs.
  - Existing code snippets.
  - Backend/API notes.
  - Auth/permission notes.
- Every added or imported source becomes an evidence record.
- Added a clear empty state explaining what to add and that no LLM key is required.
- Added immediate local safety findings for secrets, prompt injection, PII, and regulated data.
- Unsupported file types are recorded with clear metadata limitations.

### Local Preflight

- Added deterministic local checks for:
  - Product context.
  - Users or user goals.
  - Operating mode.
  - Evidence readability.
  - Evidence safety blockers.
  - Missing high-impact constraints.
- Added exact preflight outputs from the plan:
  - `Ready to generate`
  - `Generate with warnings`
  - `Needs required context`
- Kept `Generate architecture` disabled for Phase 2 and explicitly deferred provider selection/API key entry to Phase 3.

### Local Draft Persistence

- Added browser-local draft persistence under `archetype:start-draft:v1`.
- Persisted project intent, evidence records, and saved timestamp.
- Added reset behavior that clears the onboarding draft while preserving saved packages.
- Ensured sample exploration does not erase a user's local draft.

### Visual and Accessibility Iteration

- Added responsive guided-intake layout for desktop and mobile.
- Added accessible names/focus behavior for step cards and mode cards.
- Fixed a visual QA issue where the quality meter and draft preview lagged behind edited fields.
- Fixed skip-link visibility so it is hidden unless keyboard-focused.
- Verified no horizontal overflow and no unnamed focusable controls in desktop or mobile browser diagnostics.

### Tests

- Added Playwright coverage for:
  - Guided intent capture without API key prompts.
  - Evidence empty state, safety findings, and blocker preflight behavior.
  - Ready local preflight path.
  - Local draft persistence across reloads.
  - Malformed local draft storage normalization.
- Preserved Start Hub, sample, import, recent package, full Workbench navigation, primary workflow, and 20 malformed-data edge-case tests.

## Validation Against ONBOARDING_PLAN.md

### Phase 2 Requirement: Convert Intake Builder Into Guided Creation Flow

Result: pass

`Create package` now enters a structured guided intake with Project Intent, Evidence Upload, and Local Preflight steps. The existing Workbench Intake Builder also understands the expanded intake shape.

### Phase 2 Requirement: Add Input Quality Preflight

Result: pass

The app now calculates local deterministic readiness from context, users/goals, mode, evidence readability, evidence safety, and high-impact constraints. The UI shows score, blockers, warnings, and the exact preflight status.

### Phase 2 Requirement: Add Local Draft Persistence

Result: pass

Drafts persist across reloads without asking for an LLM key. Reset clears only the local onboarding draft and active package context, not saved workspace packages.

### Phase 2 Requirement: Add Operating Mode Explanation

Result: pass

Each operating mode now has human-readable guidance explaining what it is best for and what it produces. Mode cards remain synchronized with the select control.

### Phase 2 Requirement: Add Clear Source-Material Empty States

Result: pass

The Evidence step now explains exactly which evidence types are useful and makes clear that local checking can happen before provider setup.

### LLM API Key Boundary

Result: pass

No Phase 2 path asks for a provider key. Provider setup is visible only as the next disabled generation boundary, matching the plan that API key entry happens in Phase 3.

## Test Evidence

- Unit/type test: `npm run build` passed.
- Smoke test: `npm run smoke` passed.
- Focused guided-intake E2E/UI regression: `npm run workbench:e2e -- --grep "guided intake captures|guided evidence|local preflight"` passed with 3 passed, 0 failed.
- Full E2E/UI test: `npm run workbench:e2e` passed with 30 passed, 0 failed.
- Malformed-data E2E regression: 20 passed, 0 failed.
- E2E report generation: `npm run workbench:e2e:report` passed and wrote `tmp/workbench-ui-e2e`.
- Integration test: `npm run check` passed.
- Root dependency audit: `npm audit --json` reports 0 vulnerabilities.
- Generated target dependency audit: `npm audit --json` in `tmp/generated-frontend` reports 0 vulnerabilities.
- Diff hygiene: `git diff --check` passed.
- Desktop browser visual checks:
  - `tmp/onboarding-phase2-desktop-intent.png`
  - `tmp/onboarding-phase2-desktop-evidence.png`
  - `tmp/onboarding-phase2-desktop-preflight.png`
- Mobile browser visual checks:
  - `tmp/onboarding-phase2-mobile-intent.png`
  - `tmp/onboarding-phase2-mobile-evidence.png`
  - `tmp/onboarding-phase2-mobile-preflight.png`
- Browser diagnostics: `tmp/onboarding-phase2-browser-check.json`, no desktop or mobile horizontal overflow, no unnamed focusable controls, and skip link hidden unless focused.

## Self-Critique and Iteration Decision

Question: Is this implementation the most optimal and correct Phase 2 solution?

Answer: Yes, for Phase 2.

Reasoning:

- It implements the full guided local intake without prematurely building provider setup.
- It preserves the user's trust boundary: no key is requested until generation needs one.
- It gives humans a clearer path and gives AI agents deterministic state/action hooks.
- It makes evidence collection real, including source safety, empty states, unsupported-file limitations, and local persistence.
- It makes preflight deterministic and inspectable instead of a vague "continue" button.
- The initial visual iteration revealed and fixed the stale quality-meter issue before completion.
- The remaining disabled generation boundary is intentional Phase 3 scope, not a Phase 2 defect.

Known next work is intentionally Phase 3, not a Phase 2 defect:

- Add provider selection.
- Add session-only API key entry.
- Add evidence summary before provider call.
- Add include/exclude and redaction controls.
- Add provider connection diagnostics.

## Exit Condition

I dont know any better solution for this nor do I see anything worng with the current one.

## Next Phase

Phase 3: Provider Setup.

Why this is next:

The user can now reach a trusted local preflight state with real context and evidence. The next product risk is the provider handoff: users need to see exactly what will be sent, redact or exclude risky material, select a provider, enter a session-only API key, and diagnose connection failures before generation starts.
