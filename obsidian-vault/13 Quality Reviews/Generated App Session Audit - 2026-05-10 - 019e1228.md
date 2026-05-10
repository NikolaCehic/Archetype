# Generated App Session Audit - 2026-05-10 - 019e1228

Session: `019e1228-9ccb-7403-85b3-da3804a5cafa`
Generated project: `/Users/nikolacehic/Documents/Codex/2026-05-10/archetype-users-nikolacehic-codex-skills-archetype`

## What Passed

- The generated app builds successfully with Vite.
- Vitest passed: 11 tests.
- Playwright passed: 33 tests, 1 mobile drag/drop test skipped.
- The app roughly follows the supplied visual references for the Agent Task Board: dark control-room board, swimlanes, task drawer, agent detail, and mobile lane route.
- The app uses domain concepts from the supplied SPEC: agents, tasks, statuses, dependencies, handoffs, logs, artifacts, blocked reasons, and local mock state.

## Critical Findings

1. Target stack drift.
   - User explicitly selected Vite + React + TypeScript + Tailwind + shadcn/ui + Zustand + dnd-kit.
   - The approved `12-target-frontend/source-file-manifest.json` still emitted a Next.js `src/app` architecture with `next.config.mjs`, `next-env.d.ts`, and Next App Router route files.
   - The generated implementation used Vite/React Router, so the implementation and approved source contract disagree.

2. Contract architecture was not enforced against the generated source tree.
   - Contract expected `src/app`, `src/features`, `src/shared`, and `src/design-system`.
   - Actual source tree contains `src/App.tsx`, `src/components`, `src/state`, `src/utils`.
   - Tests passed because they checked rendered routes and some interactions, not source-manifest conformance.

3. Action contracts are generic and misaligned with the product.
   - Contract still generated generic actions like `Create agent`, `Filter`, and `Export`.
   - The actual app exposed `New task`, `P0/P1`, `Artifacts`, `Export JSON`, `Run`, `Fail run`, and drawer task actions.
   - `P0/P1`, `Artifacts`, `Export JSON`, and `Run` were visible controls with no meaningful implemented behavior.

4. Verification proved smoke behavior, not contract fidelity.
   - Playwright tests verified routes, headings, a few interactions, and shallow states.
   - Tests did not fail on inert controls, source-manifest drift, missing design-system wrappers, missing data adapters, or incomplete action semantics.

5. State/action rules were incomplete at runtime.
   - After resolving, handing off, and cancelling a task, the drawer still exposed actions like `Resolve block`, `Handoff`, `Rerun`, and `Cancel`.
   - Terminal/destructive states need action availability contracts and recovery or confirmation behavior.

6. Evidence existed but visual extraction stayed shallow.
   - The package recorded one SPEC and three screenshots.
   - Screenshot records mostly stored hashes and paths; they did not become strict visual layout assertions or screenshot-to-implementation comparison checks.

7. E2E scenario semantics are confusing.
   - Canonical `13-e2e/e2e-results.json` intentionally included diagnostic failures for missing backend/auth context.
   - Readiness then surfaced `e2e.results.no_failures` as a blocker, while the host still proceeded to implementation.
   - Diagnostic scenario failures and implementation-blocking failures need separate severities.

## Required Hardening

1. Make target frontend manifest stack-aware.
   - Vite + React Router should emit `src/main.tsx`, `src/App.tsx` or route modules, `vite.config.ts`, and no Next-only files.
   - Next App Router should continue emitting `src/app`.

2. Add source-manifest conformance tests.
   - Verify generated app contains required files/directories for the declared stack.
   - Verify forbidden files are absent.
   - Verify route files delegate to feature screens when the architecture contract says so.

3. Generate product-specific action contracts.
   - Agent Task Board needs actions for search, status filter, priority filter, artifact filter, create task, open task drawer, drag status, drag handoff, resolve block, handoff, rerun, cancel, pause/resume run, fail run, and export JSON.
   - Every visible control must either perform the declared action or be omitted.

4. Add runtime UI contract tests for every visible control.
   - Click each button and assert state change, route change, download, disabled reason, toast, or explicit `not implemented` blocker.
   - Inert controls are blockers.

5. Add terminal-state action policy.
   - Cancelled/done tasks must not expose invalid actions unless explicitly recoverable.
   - Destructive actions need confirmation or undo/recovery behavior.

6. Convert visual references into measurable checks.
   - At minimum: layout regions, palette tokens, component inventory, density, drawer placement, and viewport screenshots.
   - Later: pixel/region comparison against reference screenshots where applicable.

7. Split diagnostic warnings from implementation blockers.
   - Missing production backend/auth can be warning for mock-only test apps.
   - Real blocker should be mismatch between chosen data boundary and generated contracts.

## Lesson

Passing tests is not sufficient when the tests are not contract-complete. Archetype must verify the generated project against the approved source manifest, action contracts, state contracts, and supplied visual evidence, not only route smoke and a few happy-path flows.
