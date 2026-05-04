# Lifecycle Loop Log

## Scope Map

Scope 1: Lifecycle and context-completion spine.

- Add a deterministic lifecycle state machine.
- Define clarify as context completion.
- Ask for optional materials as a default lifecycle step.
- Generate lifecycle artifacts in every `archetype-output` package.
- Update generated agent instructions to read lifecycle context first.
- Prove rich context proceeds and sparse context asks questions.

Scope 2: Canonical spec artifacts.

- Generate `spec/archetype-spec.md` and `spec/archetype-spec.json`.
- Make the canonical spec the source of truth for design system, screens, routes, flows, data, states, and acceptance criteria.

Scope 3: Test-first contracts.

- Generate E2E, UI, smoke, integration, and unit test contracts before implementation.
- Update agent instructions so tests are written before product UI code.

Scope 4: Playwright-backed verification.

- Generate Playwright scenario obligations and expected evidence.
- Verify route, screen, flow, responsive, accessibility, and visual-smoke adherence against the spec.

Scope 5: Revision and drift repair loop.

- Make verification failures produce concrete fix/revise tasks.
- Keep implementation changes and spec revisions traceable.

## Scope 1 Review

Context:

- The user corrected the product shape: `/archetype "project idea"` should be sufficient.
- The user should not need to ask Archetype to clarify, request materials, implement, or verify.
- Clarify is context completion: known facts, missing decisions, assumptions, optional material prompt, and focused questions.

Implementation:

- Added lifecycle artifacts to generated packages.
- Added a state machine with `start`, `clarifying`, `waiting_for_optional_materials`, `intaking`, `spec_generating`, `test_generating`, `implementing_tests_first`, `verifying_with_playwright`, `revising`, and `done`.
- Added deterministic context-completion output.
- Updated generated `AGENTS.md` and `CLAUDE.md` to read lifecycle context and enforce spec-driven plus test-driven discipline.
- Added `scripts/run-lifecycle-contract.mjs` and wired it into `npm run check`.
- Added package validation for lifecycle files and lifecycle state-machine semantics.
- Added distribution, CLI, MCP, plugin, install, and pivot-audit coverage for the lifecycle entrypoints.

Validation:

- `npm run lifecycle:contract` passed.
- `npm run cli:contract` passed.
- `npm run mcp:contract` passed.
- `npm run plugin:claude:contract` passed.
- `npm run plugin:codex:contract` passed.
- `npm run distribution:contract` passed.
- `npm run check` passed.
- `npm pack --dry-run --json` included the lifecycle module, scope doc, and lifecycle contract script.
- `npm audit --json` reported 0 vulnerabilities.
- `git diff --check` passed.

Self-review:

- The implementation adheres to Scope 1 because lifecycle behavior is generated as machine-readable and human-readable artifacts, validated by package validation, and covered by a dedicated contract test.
- It does not yet implement canonical spec files, executable test-contract generation, or Playwright result verification. Those are intentionally the next scopes.
- Review answer: YES for Scope 1. The scope is fully implemented according to the current context.

Rule:

- Do not describe `/archetype` as a command the user must decorate with "ask me questions", "build", or "verify". `/archetype "project idea"` implies the lifecycle.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Scope 2 Review

Context:

- The product claim is spec-driven development.
- Scope 1 created the lifecycle spine, but the generated package still needed an explicit canonical source-of-truth spec.
- The spec must be produced before test-first contracts because tests should derive from the spec.

Implementation:

- Added `spec/archetype-spec.md`.
- Added `spec/archetype-spec.json`.
- Added source-of-truth, lifecycle, product, experience, design-system, frontend contract, verification, and traceability sections.
- Updated generated `AGENTS.md` and `CLAUDE.md` to read the canonical spec before implementation.
- Added package validation for canonical spec presence, source-of-truth flag, lifecycle entrypoint, core sections, route count, screen count, and verification evidence.
- Added `scripts/run-spec-contract.mjs` and wired it into `npm run check`.

Self-review:

- The implementation adheres to Scope 2 because the canonical spec is generated, listed in manifests, surfaced through summarize entrypoints, validated for coherence, and covered by a dedicated contract test.
- It does not yet create executable E2E/UI/smoke/integration/unit test contracts. That is intentionally Scope 3.
- Review answer: YES for Scope 2. The scope is fully implemented according to the current context.

Rule:

- Do not claim test-driven implementation until test contracts are generated. The correct claim after Scope 2 is: Archetype is spec-driven; test-driven agent implementation is the next scope.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Scope 3 Review

Context:

- The product claim now needs both spec-driven development and test-driven agent implementation.
- Scope 2 made the canonical spec the source of truth, but agents still needed deterministic test obligations before writing UI code.
- The generated tests must cover smoke, E2E, UI, integration, and unit evidence, with Playwright-backed browser-observable proof.

Implementation:

- Added `test-first/test-first-contract.json`.
- Added `test-first/test-first-plan.md`.
- Added `test-first/playwright-contract.spec.ts`.
- Added `test-first/vitest-contract.spec.ts`.
- Derived route smoke tests, flow E2E tests, required screen-state UI tests, data/action/form integration tests, component/pattern/token unit tests, and accessibility tests from `spec/archetype-spec.json`.
- Updated generated `AGENTS.md`, `CLAUDE.md`, README, implementation rules, CLI summarize, MCP summarize, plugin skills, docs, schema index, top-level manifest, and validation.
- Updated target source-generation guidance so verification tests are created before components, patterns, routes, and screens.
- Added `scripts/run-test-first-contract.mjs` and wired it into `npm run check`.

Self-review:

- The implementation adheres to Scope 3 because every generated package now contains a machine-readable test-first contract, a human-readable plan, target test templates, validation gates, summary entrypoints, and plugin instructions that require tests before product UI implementation.
- Self-review caught one contradiction: target codegen still listed verification tests after route/component creation. That was wrong for TDD, so it was corrected and locked with a contract assertion.
- The compiler still does not execute the user's target Playwright suite in this scope. That is intentional: Scope 3 generates deterministic test obligations; Scope 4 is Playwright-backed verification evidence against an implemented target.
- Review answer: YES for Scope 3. The scope is fully implemented according to the current context.

Rule:

- Do not claim implementation is test-driven unless `test-first/test-first-contract.json` exists, validation enforces it, and agent instructions require red-first test creation before product UI code.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Scope 4 Review

Context:

- Scope 3 generated deterministic tests, but Archetype still needed browser-backed proof after an agent implements the target.
- The verification step must not depend on user prompt choreography. `verify-target` should run the materialized target checks and write evidence into `archetype-output`.
- Playwright proof must stay inside the local harness pivot, not become a hosted QA dashboard or cloud testing product.

Implementation:

- Added `verification/playwright-verification-contract.json`.
- Added `verification/playwright-verification-plan.md`.
- Added `verification/playwright.config.ts`.
- Added `verification/playwright-verification.spec.ts`.
- Added pending and completed `verification/playwright-evidence.json`.
- Added pending and completed `verification/playwright-evidence.md`.
- Derived route, required screen-state, user-flow, responsive, accessibility, and visual-smoke scenarios from the canonical spec and test-first contract.
- Updated generated target source so `write-target` materializes Playwright config, browser verification specs, and `npm run archetype:playwright`.
- Updated `verify-target` to run install, typecheck, production build, Playwright verification, target dependency audit, target execution proof, and Playwright evidence writing.
- Added `scripts/run-playwright-verification-contract.mjs` and wired it into `npm run check`.
- Updated validation, schema index, CLI summarize, MCP summarize, plugin skills, docs, pivot roadmap, distribution checks, and install checks.

Self-review:

- The implementation adheres to Scope 4 because every generated package now contains browser verification obligations, target Playwright config, executable browser checks, pending evidence, completed evidence after `verify-target`, and validation gates that fail when the proof layer is missing or incoherent.
- Self-review caught two technical issues during smoke testing: the generated Playwright `webServer` originally waited on `/` even when the first generated route was not `/`, and flow scenarios were not being collected from the canonical `flows` wrapper. Both were fixed and locked into the Playwright contract test.
- Remaining production confirmations are deliberately external: backend, auth, compliance, and final copy review. Those do not weaken Scope 4 because this scope proves browser-observable frontend contract adherence.
- Review answer: YES for Scope 4. The scope is fully implemented according to the current context.

Rule:

- Do not claim browser verification is complete unless `verify-target` has written `verification/playwright-evidence.json` and Playwright route, state, flow, responsive, accessibility, and visual-smoke scenarios passed or every remaining warning is named.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation

## Scope 5 Review

Context:

- Scope 4 proved target implementations with Playwright, but failed evidence still required an agent to manually infer what to fix from logs.
- The pivot requires a self-contained harness loop: failed verification should become implementation patch tasks or explicit contract revision review tasks.
- The repair loop must stay local and deterministic. It must not become a hosted repair service or an auto-rewriter hidden inside the compiler.

Implementation:

- Added `10-revision/verification-repair-contract.json`.
- Added `10-revision/repair-task-queue.json`.
- Added `10-revision/repair-plan.md`.
- Added `10-revision/drift-report.json`.
- Added `10-revision/drift-report.md`.
- Added `archetype repair --out <output-dir> [--target <target-dir>]`.
- Added MCP tool `archetype_plan_repair`.
- Updated `verify-target` so target execution and Playwright evidence refresh repair artifacts.
- Classified install, typecheck, build, Playwright, route, state, flow, responsive, accessibility, visual-smoke, and target blockers into repair tasks.
- Updated generated `AGENTS.md`, `CLAUDE.md`, implementation rules, README, CLI/MCP summaries, plugin skills, docs, schema index, validation gates, distribution checks, install checks, and pivot docs.
- Added `scripts/run-repair-contract.mjs` and wired it into the check suite.

Self-review:

- The implementation adheres to Scope 5 because every generated package now contains repair policy, task queue, repair plan, and drift report artifacts; `verify-target` updates them from real evidence; CLI and MCP expose repair planning; validation accepts failed verification only when concrete repair tasks exist; and plugin skills tell Claude Code and Codex to patch implementation drift before revising contracts.
- Self-review caught one technical issue during the contract test: the Playwright result walker recursed forever on missing nested keys, causing repair planning to return an error after evidence was written. The walker now exits on non-object values, and the repair contract proves failed evidence generates tasks and clean regeneration clears them.
- Remaining behavior is intentionally advisory: Archetype plans repairs and gates completion, while Claude Code or Codex patches the target implementation. This preserves the pivot boundary.
- Review answer: YES for Scope 5. The scope is fully implemented according to the current context.

Rule:

- Do not claim verification failure handling is complete unless `10-revision/repair-task-queue.json` names concrete blocker tasks or `verify-target` has written a passing empty repair queue.

Convergence statement:

- I dont know how to implement this better as I cannot answer what is techically or architecturally wrong with the current implentation
