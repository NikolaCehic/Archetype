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
