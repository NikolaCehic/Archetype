---
tags:
  - archetype
  - hardened-lifecycle
  - implementation-loop
  - lessons
status: active
---

# Scope Implementation Lessons

This file is the memory layer for the hardened lifecycle implementation loop.

Read this file at the start of every scope. Update it at the end of every scope before moving to the next one.

## Loop Rule

1. Open the relevant Obsidian scope before touching code.
2. Extract exact requirements and acceptance criteria from that scope.
3. Implement only that scope.
4. Write or update tests for that scope.
5. Verify against the source node, not memory.
6. Log mismatches, assumptions, and corrections here.
7. Refactor until the implementation matches the scope.
8. Only then move to the next scope.

## Standing Rules

- Do not implement from memory when a scope note exists.
- Do not widen a scope just because adjacent scopes are visible.
- If the implementation depends on a later scope, add the smallest bridge needed and log the dependency.
- If a generated artifact can imply readiness, it must also expose the gate that made that readiness valid.
- If context is weak, Archetype must stop before canonical spec, test contracts, or implementation contracts are generated.
- Clarification output must be actionable to a human user and machine-readable to an agent.
- Recursive writes and deletes must be marker-protected; `--force` means overwrite Archetype-owned generated output, not arbitrary user folders.
- Human approval must be proof-bound to a draft package and source hash. A hand-edited intake boolean is not implementation authorization.

## Six-Agent Audit Phase 01 - Safety And Approval Integrity

Source:

- [[13 Quality Reviews/Archetype Six-Agent Scope Audit Convergence - 2026-05-07]]

Extracted requirements:

- No CLI or MCP command may recursively delete arbitrary directories.
- Output directories and generated target directories need explicit generated-output markers.
- Draft approval must be a lifecycle primitive, not a hand-edited intake field.
- Approval must bind to draft/source/artifact hashes so implementation authorization cannot be structurally spoofed.

Mismatches found before implementation:

- Package exporters and target generation could remove output directories directly when `--force` was present.
- Several contract fixtures authorized implementation by injecting `contractApproval` into intake JSON.
- Approval validation recognized human approval shape but did not require a proof sidecar tied to draft package identity and source content.
- Docs described “human approval” without showing the concrete proof-bound command path.

Corrections applied:

- Added marker-based path safety for generated package output and generated target frontend output.
- Added `archetype approve-draft`, which writes an approved intake plus a sidecar proof bound to the draft package id, intake source hash, package checksum, and required draft artifact hashes.
- Updated approval validation so raw hand-edited approval is blocked as `invalid_unbound_approval`.
- Updated evidence generation so only the validated approval state can canonicalize inference-backed evidence as user-confirmed assumptions.
- Updated CLI, MCP, package exporters, and target writing to use the safety layer.
- Updated contract fixtures to generate a draft first, run `approve-draft`, and only then generate canonical packages.
- Added a dedicated safety and approval contract test.
- Updated quickstart/install/lifecycle/docs for the new approval command and output marker behavior.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run safety-approval:contract`: pass.
- `npm run mcp:contract`: pass after repairing an overly narrow error-message assertion.
- `npm run check`: pass.

Mismatches found during verification:

- The MCP safety contract expected old wording even though the new safety layer was rejecting the repo root correctly.
- Older contract fixtures still depended on raw `contractApproval` injection and had to be moved to the bound approval helper.
- Raw hand-edited approval was blocked for implementation, but evidence generation still treated the raw approval flag as human-approved.

Self-healing rules added:

- Tests that require canonical artifacts must exercise the same approval path a real user would use.
- Safety tests should assert the invariant and preserved sentinel files, not brittle exact wording.
- Approval artifacts must be verified relative to the source intake path and must match the current intake without its approval field.
- Evidence canonicalization must consume the validated approval state, not raw input shape.

Current answer for Six-Agent Audit Phase 01:

```txt
I do not know how to implement this phase better within the current scope.
I cannot identify a technical or architectural mismatch against the Phase 01 safety and approval requirements in the current implementation.
```

## Scope 00 - Core Problem And Purpose

Source:

- [[11 Hardened Lifecycle Scopes/Scope 00 - Core Problem And Purpose]]

Extracted requirements:

- Archetype exists to prevent weak context from becoming fake certainty.
- The known weak prompt is: `I want to build a admin dashboard for a marketing team`.
- Correct behavior: stop, ask one clarification question, and build a context matrix.
- Incorrect behavior: generate a full app, invent product details, generate shallow tests, and produce false confidence.
- Exit condition: the lifecycle must make fake certainty impossible.

Implementation target:

- Add a hard pre-compiler context gate for weak input.
- Produce a clarification package instead of a full contract package when required context is missing.
- Include a context matrix artifact.
- Ask only the highest-impact clarification question in the user-facing package.
- Ensure package readiness is false when context requires clarification.

Mismatches found before implementation:

- Existing lifecycle artifacts could report `needs_clarification`, but the CLI still generated a full contract package.
- Existing clarification questions were bulk questions, not one focused next question.
- Existing full generation could infer routes, screens, data, and tests from a weak one-line prompt.

Correction rule:

- A `needs_clarification` gate must stop full package generation, not merely annotate it.

Implementation result:

- Added a reusable context gate that creates a context matrix before full package generation.
- Added a clarification-only package export for weak context.
- Added `lifecycle/context-matrix.json` to full contract packages and clarification packages.
- Updated the CLI `generate` command so weak input returns a warning clarification package instead of a full contract package.
- Updated validation so lifecycle packages must expose a context matrix and needs-clarification output must ask exactly one question.
- Updated lifecycle contract tests with the exact observed weak prompt.
- Updated golden tests so weak examples are allowed to produce clarification packages, while asserting that clarification packages do not contain canonical specs, test-first contracts, or implementation contracts.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run lifecycle:contract`: pass.
- `npm run smoke && npm run validate`: pass.
- `npm test`: pass after final implementation.
- `npm run golden`: pass after the golden contract update.

Mismatches found during verification:

- `scripts/run-golden.mjs` assumed every example must produce a full DSAG contract package. That was incompatible with Scope 00 because weak examples must stop before DSAG generation.
- The first context-flow detector was too literal and missed natural workflow verbs such as review, manage, track, inspect, compare, and update.

Corrections applied:

- Golden examples now record `package_type` as either `contract` or `clarification`.
- Golden examples assert clarification packages contain no `spec/archetype-spec.json`, no `test-first/test-first-contract.json`, and no `implementation-contract.md`.
- Context-flow detection now recognizes natural workflow language, not only words like route, screen, and dashboard.

Scope 00 convergence review:

- The exact weak prompt now stops before full generation.
- The user-facing output asks one question: `Who is the primary user of this marketing admin dashboard?`
- The machine-readable output includes `lifecycle/context-matrix.json`.
- Readiness is false for the weak prompt.
- No spec, test-first contract, Playwright contract, or implementation contract is generated for the weak prompt.

Current answer for Scope 00:

```txt
I do not know how to implement this scope better within Scope 00 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 00 in the current implementation.
```

## Scope 01 - Non-Negotiable Principles

Source:

- [[11 Hardened Lifecycle Scopes/Scope 01 - Non-Negotiable Principles]]

Extracted requirements:

- Define ten lifecycle laws as non-negotiable principles.
- Every principle must become a hard gate, validator, or artifact requirement.
- No canonical contract may be produced from unapproved invention.
- No spec may be produced before context is sufficient for a draft.
- No implementation may begin before the canonical contract is approved.
- No product UI may be produced before tests are authored from the canonical contract.
- No completion may be claimed before QA evidence and Playwright verification pass.
- Inference may propose candidates but cannot accept decisions.
- Clarification must happen one question at a time.
- No agent may approve its own output.
- Readiness claims must point to artifacts.
- Generated routes, screens, components, tokens, actions, data operations, and tests must trace to approved evidence.

Implementation target:

- Add a machine-readable and human-readable governance artifact for the ten principles.
- Add manifest-level implementation authorization and contract approval state.
- Force rich draft packages to remain structurally valid but not implementation-ready until human approval exists.
- Block write-target and target verification when implementation is not authorized.
- Preserve the Scope 00 weak-context stop in CLI and MCP generation paths.
- Prevent inference-backed decisions from being accepted automatically.
- Validate principle artifacts during package validation.
- Add a contract test that proves draft, human-approved, agent-approved, and weak-context behavior.

Mismatches found before implementation:

- Rich generated packages could claim `readyForFrontendAgent: true` without human approval.
- `write-target` could materialize product UI from an unapproved draft package.
- `verify-target` could verify a target frontend from an unapproved draft package.
- MCP generation still had a path that could bypass the Scope 00 context gate.
- Some inference-backed decisions were marked `accepted`, which violated the rule that inference can only propose.
- Data operation contracts did not carry per-operation evidence refs, which weakened traceability.
- Readiness claims existed in multiple surfaces, but there was no single governance artifact tying those claims to principle gates.

Corrections applied:

- Added `governance/non-negotiable-principles.json` and `governance/non-negotiable-principles.md`.
- Added ten explicit gates with `pass`, `blocked`, and `fail` statuses.
- Added `contract_approval`, `implementation_authorized`, and `readiness_evidence` to package manifests.
- Made human contract approval the only path to `implementationAuthorized: true`.
- Kept draft packages exportable and structurally valid while blocking implementation.
- Made agent approval invalid and surfaced that as a principle failure.
- Changed inference-backed decision status to `proposed` until it is grounded in approved evidence.
- Added evidence refs to data operation queries and mutations.
- Updated validation to require the governance artifact, exactly ten gates, artifact-backed readiness claims, and no implementation readiness without authorization.
- Added hard gates in write-target and verify-target so unapproved contracts cannot produce or validate product UI.
- Updated CLI, MCP, install, Playwright, repair, golden, and demo contract tests around the new approval gate.

Verification evidence:

- `npm run non-negotiable:contract`: pass.
- `npm test`: pass after the full Scope 01 implementation.

Mismatches found during verification:

- Several existing contract tests assumed rich example packages were immediately frontend-agent-ready. They needed to distinguish a complete draft from an approved implementation contract.
- The spec coverage report could retain a stale ready claim after the approval gate forced readiness false.
- Demo and repair flows needed explicit human approval fixtures before invoking write-target or verify-target.

Corrections applied during verification:

- Updated tests to expect rich draft packages to be complete but implementation-blocked.
- Added human-approved fixtures for flows that intentionally exercise write-target, verify-target, and repair.
- Patched readiness reporting so approval-gated packages do not leak stale ready claims.

Self-healing rules added:

- A package can be valid without being authorized for implementation.
- Structural validation must not be treated as implementation permission.
- Any command that creates or verifies product UI must read implementation authorization from the package, not infer permission from package shape.
- Agent approval is not a weaker approval path; it is invalid.
- Inference-backed evidence can help ask better questions or propose draft candidates, but it cannot silently become accepted contract truth.

Scope 01 convergence review:

- All ten principles are represented as gates, validators, or artifact requirements.
- Draft packages are blocked before implementation until human approval exists.
- Human-approved packages can proceed to implementation.
- Agent-approved packages fail the self-approval gate.
- Weak context still stops before canonical spec generation.
- Readiness claims point to artifact refs.
- Routes, screens, components, tokens, actions, data operations, and tests expose traceability refs.
- Full repository test coverage for the current contract suite passes.

Current answer for Scope 01:

```txt
I do not know how to implement this scope better within Scope 01 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 01 in the current implementation.
```

## Agent Hardening - Pixel Perfect Developer

Source:

- `agents/pixel-perfect-developer.md`
- `plugins/claude-code/agents/pixel-perfect-developer.md`
- [[11 Hardened Lifecycle Scopes/Scope 09 - Agent Role Files]]
- [[03 Agents/Frontend Best Practice Skills]]

Browser research anchors:

- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- WCAG Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WCAG Text Spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- Tailwind responsive design: https://tailwindcss.com/docs/responsive-design

Weaknesses found before hardening:

- The role said it owned visual polish, but did not define how to judge polish without subjective taste.
- The role mentioned screenshot evidence, but did not require route, screen, state, viewport, screenshot, and artifact traceability for each visual claim.
- The role did not enforce mobile, tablet, and desktop visual-smoke coverage.
- The role did not connect visual polish to `specialist-gate/frontend-practices/visual-polish-practices.json`, responsive practices, design-system practices, QA reports, or target execution artifacts.
- The role could miss text-spacing, reflow, typography fit, layout stability, content-fit, and state-specific polish failures.
- The role did not provide a deterministic repair handoff schema.

Corrections applied:

- Expanded the role into a visual precision implementation specialist and screenshot-evidence gatekeeper.
- Added explicit mission, production standard, operating procedure, visual sufficiency gate, one-question clarification priority, output schema, decision rules, required visual evidence contract, viewport matrix, repair handoff format, good/bad output signals, and self-review checklist.
- Required visual evidence from `verification/playwright-evidence.json`, `qa/visual-regression-report.md`, `qa/scenario-catalog.json`, `qa/playwright-results.json`, `target:test-results/archetype-visual-smoke/`, and `target:playwright-report/`.
- Required mobile, tablet, and desktop coverage for visual-smoke scenarios.
- Added blockers for overlap, clipped controls, horizontal overflow, hidden critical actions, raw styling, token drift, typography shrinkage, viewport-width font scaling, negative letter spacing, and generic visual output.
- Added output statuses: `ready_for_visual_verification`, `needs_visual_repair`, and `blocked_missing_visual_evidence`.
- Added deterministic repair tasks with route, screen, state, viewport, component/selector, screenshot, contract refs, implementation constraint, and verification command.
- Mirrored the role into the Claude Code plugin and added contract checks so future edits cannot regress the hardened guarantees.

Self-healing rule:

- A visual readiness claim is invalid unless it points to browser screenshot evidence for the affected route, screen, state, and viewport.
- Selector-only or marker-only evidence cannot prove visual quality.
- Pixel-perfect repair must use approved design-system and screen contracts. If the contract is weak, the correct repair is a handoff or one clarification question, not visual invention.

## Scope 02 - Evidence And Decision Model

Source:

- [[11 Hardened Lifecycle Scopes/Scope 02 - Evidence And Decision Model]]

Extracted requirements:

- Define which claims may become canonical.
- Evidence levels must be exactly:
  `unknown`, `archetype_inference`, `weak_user_hint`, `explicit_user_answer`, `imported_material_fact`, `repo_fact`, `user_confirmed_assumption`.
- Only these evidence levels may enter canonical implementation artifacts:
  `explicit_user_answer`, `imported_material_fact`, `repo_fact`, `user_confirmed_assumption`.
- Decision statuses must be exactly:
  `confirmed`, `candidate`, `missing`, `conflicted`, `blocked`.
- Inference must be treated as candidate evidence only.

Implementation target:

- Add a reusable HL-02 evidence decision model module.
- Annotate evidence sources and evidence items with evidence level and canonical eligibility.
- Replace evidence-ledger decision statuses from `accepted` / `proposed` style language to HL-02 statuses.
- Add machine-readable and human-readable governance artifacts for the evidence decision model.
- Validate that the evidence model exists, exposes the exact levels and statuses, and has no failures.
- Ensure draft packages may contain candidate refs but cannot be implementation-authorized by those refs.
- Ensure human-approved packages convert approved candidate assumptions into canonical `user_confirmed_assumption` evidence.
- Ensure weak-context clarification packages expose the model without generating canonical implementation artifacts.

Mismatches found before implementation:

- Evidence items did not declare their evidence level.
- Evidence sources did not declare whether they could become canonical.
- Evidence-ledger decisions still used older statuses such as `accepted` and `proposed`.
- Inference-backed route and entity decisions were present in downstream artifacts without a dedicated audit showing they were candidate-only in draft packages.
- Context matrix decisions had HL-02 status names but no evidence level or canonical eligibility field.
- Validation required traceability refs, but did not distinguish canonical refs from candidate refs.
- Summaries and package handoff docs did not expose a dedicated evidence/decision model entrypoint.

Corrections applied:

- Added `src/modules/evidenceDecisionModel.ts`.
- Added HL-02 evidence level constants, canonical evidence levels, and decision status constants.
- Added evidence-level classification for sources, evidence items, evidence refs, and decisions.
- Updated the evidence ledger so decisions use `confirmed`, `candidate`, `missing`, `conflicted`, or `blocked`.
- Added `canonical_evidence_refs` and `candidate_evidence_refs` to decision records.
- Added `evidence_level` and `can_become_canonical` to context matrix decisions.
- Added `governance/evidence-decision-model.json` and `governance/evidence-decision-model.md` to full contract packages and clarification packages.
- Updated package manifests, CLI summarize, and MCP summarize to expose the evidence model entrypoint.
- Updated validation to require the evidence model, exact levels, exact statuses, zero model failures, and zero non-canonical refs in implementation-authorized canonical surfaces.
- Updated revision and LLM policy language to use `confirmed`, `candidate`, `missing`, `conflicted`, and `blocked`.
- Added `scripts/run-evidence-decision-model-contract.mjs` and wired it into `npm test` and `npm run check`.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run evidence-decision:contract`: pass.
- `npm run cli:contract && npm run mcp:contract && npm run lifecycle:contract && npm run non-negotiable:contract && npm run spec:contract && npm run test-first:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- Draft packages correctly contained many inference-backed refs in route, component, token, and frontend contract surfaces. This was not a failure as long as the package remained unauthorized; it needed to be represented as a draft candidate audit instead of a blocker.
- Human-approved packages needed a deterministic way to treat approved candidate assumptions as `user_confirmed_assumption`.
- The CLI and MCP summarize paths initially exposed the non-negotiable principles but not the evidence decision model.

Corrections applied during verification:

- The evidence model now reports `canonical_surface_audit.candidate_refs` for draft packages.
- The evidence model reports `canonical_surface_audit.noncanonical_refs_in_authorized_package` and validation fails if that list is non-empty for implementation-authorized packages.
- Human-approved packages convert inference-backed and assumption-backed refs to `user_confirmed_assumption` for canonicality checks.
- CLI and MCP summaries now include `governance/evidence-decision-model.json`.

Self-healing rules added:

- Traceability is not enough; every traceability ref must be classified by evidence level.
- A draft package may contain candidate refs, but an implementation-authorized package may not contain non-canonical refs in canonical surfaces.
- Human approval is the only bridge from Archetype-proposed inference to `user_confirmed_assumption`.
- Evidence-ledger decisions must never use statuses outside `confirmed`, `candidate`, `missing`, `conflicted`, and `blocked`.
- Context matrix decisions must expose both decision status and evidence level.

Scope 02 convergence review:

- The seven evidence levels are encoded and exported.
- The four canonical evidence levels are encoded and validated.
- Decision statuses are encoded and validated.
- Inference-backed draft decisions remain `candidate`.
- Human-approved candidate assumptions become canonical as `user_confirmed_assumption`.
- Weak-context packages still stop at clarification and include the evidence model.
- Full repository test coverage for the current contract suite passes.

Current answer for Scope 02:

```txt
I do not know how to implement this scope better within Scope 02 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 02 in the current implementation.
```

## Scope 03 - Context Sufficiency And Readiness

Source:

- [[11 Hardened Lifecycle Scopes/Scope 03 - Context Sufficiency And Readiness]]

Extracted requirements:

- Define how Archetype knows whether it may proceed.
- Weak context means exactly: `The next artifact would depend on unapproved invention.`
- Required dimensions are product outcome, primary users and roles, must-have workflows or screens, target repo or frontend stack, mock/API/data/auth/permission boundary, design direction or permission to create one, test and Playwright execution permission, assumption approval, and safety/regulatory/sensitive-data constraints when detected.
- Readiness tiers must be exactly:
  `ready_for_clarification`, `ready_for_contract_draft`, `ready_for_contract_approval`, `ready_for_test_authoring`, `ready_for_implementation`, `ready_for_qa`, `ready_for_completion`.
- Exit condition: readiness is tiered and artifact-backed, not a single permissive boolean.

Implementation target:

- Make the context gate evaluate all Scope 03 required dimensions before a contract draft can be produced.
- Keep safety constraints conditional: required only when regulated, compliance, safety, or sensitive-data context is detected.
- Add a dedicated readiness tiers artifact to full contract packages and clarification packages.
- Expose readiness tier in package manifests, CLI output, MCP output, lifecycle reports, and validation summaries.
- Treat legacy booleans such as `readyForFrontendAgent` and `implementationAuthorized` as compatibility claims backed by readiness tier artifacts.
- Validate exact weak-context definition, required dimensions, tier names, tier gates, and artifact refs.
- Add a Scope 03 contract test covering rich draft, human-approved, missing-boundary, and weak-prompt flows.

Mismatches found before implementation:

- The context gate could pass with only product/users/stack/flows while data/auth boundaries, design permission, test execution permission, and assumption approval were absent.
- Readiness was represented mainly as scores and booleans, which could hide where the lifecycle actually was.
- There was no dedicated artifact proving the seven readiness tiers or the current tier.
- CLI and MCP summaries did not expose readiness tier as a first-class result.
- Validation checked package shape but did not prove that readiness was tiered and artifact-backed.
- Example intakes relied on implication for required dimensions instead of explicit evidence.

Corrections applied:

- Added Scope 03 inputs for data boundary, test execution permission, assumption approval, and safety constraints.
- Updated source normalization and evidence classification so those fields become explicit user-answer evidence.
- Expanded the context matrix to include the exact weak-context definition, exact required dimensions, exact readiness tiers, and the current readiness tier.
- Added `lifecycle/readiness-tiers.json` and `lifecycle/readiness-tiers.md`.
- Added package-level tier transitions: weak context is `ready_for_clarification`, rich drafts are `ready_for_contract_approval`, and human-approved packages are `ready_for_implementation`.
- Updated manifests, lifecycle reports, package summaries, CLI output, MCP tools, README handoff text, and agent handoff instructions to point at the readiness tiers artifact.
- Updated validation to require exact Scope 03 names and to fail if manifest, context completion, context matrix, quality readiness, or readiness tiers disagree.
- Updated examples so rich fixtures declare boundaries, permissions, assumptions, and safety constraints explicitly.
- Added `scripts/run-context-readiness-contract.mjs` and wired it into `npm test` and `npm run check`.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run context-readiness:contract`: pass.
- `npm run cli:contract && npm run mcp:contract && npm run lifecycle:contract && npm run non-negotiable:contract && npm run evidence-decision:contract && npm run context-readiness:contract && npm run spec:contract && npm run test-first:contract`: pass.
- `npm run cli:contract`: pass after verifier hardening.
- `npm test`: pass.

Mismatches found during verification:

- MCP `create_intake` initially did not collect the new Scope 03 fields, so MCP-created rich context could still become incomplete.
- Full-suite verification revealed that generated target Playwright execution used a fixed default port, allowing a stale target server to make readiness proof nondeterministic.

Corrections applied during verification:

- Updated MCP `create_intake` to accept and persist data boundary, test execution permission, assumption approval, and safety constraints.
- Updated MCP contract fixtures to provide those Scope 03 fields explicitly.
- Hardened `verify-target` so Archetype passes an available `ARCHETYPE_PLAYWRIGHT_PORT` when running generated Playwright verification, while preserving the stable target command `npm run archetype:playwright`.

Self-healing rules added:

- A rich-looking brief is still weak if any required Scope 03 dimension is missing.
- Readiness tier is the source of truth; boolean readiness fields are compatibility surfaces only.
- Every readiness claim must point to `lifecycle/readiness-tiers.json` and related lifecycle or manifest artifacts.
- Examples and MCP intake paths must not rely on implication for required context dimensions.
- Target execution proof must not depend on a fixed local port; deterministic verification requires an isolated available port.

Scope 03 convergence review:

- The exact weak-context definition is encoded in context matrix and readiness tier artifacts.
- All nine required dimensions are represented in rich context, with safety conditional on detection.
- The seven readiness tiers are encoded, exported, and validated.
- Weak packages stop at `ready_for_clarification`.
- Rich draft packages reach `ready_for_contract_approval` but remain blocked before implementation.
- Human-approved packages reach `ready_for_implementation`.
- Readiness claims are artifact-backed across manifest, lifecycle, governance, CLI, MCP, and validation surfaces.
- Full repository test coverage for the current contract suite passes.

Current answer for Scope 03:

```txt
I do not know how to implement this scope better within Scope 03 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 03 in the current implementation.
```

## Scope 04 - One-Question Clarification UX

Source:

- [[11 Hardened Lifecycle Scopes/Scope 04 - One-Question Clarification UX]]

Extracted requirements:

- Define how Archetype asks for missing context.
- Clarification is not a bulk form.
- Archetype asks exactly one question at a time, chosen by highest implementation impact.
- The algorithm is: read idea/materials/repo context, build context matrix, mark required decisions, select the highest-impact missing or conflicted blocker, ask one question, update context matrix from the answer, repeat until the next gate is safe, present assumptions and candidate decisions for approval, and only then generate the canonical contract.
- Default first question for the vague marketing dashboard prompt is exactly: `Who is the primary user of this marketing admin dashboard?`
- Exit condition: the user-facing flow asks one question and updates context after each answer.

Implementation target:

- Add an HL-04 artifact that makes one-question clarification machine-readable and user-facing.
- Make every clarification question carry source scope, selection rule, impact, selected decision id, answer target, and after-answer behavior.
- Add a deterministic answer application bridge so a user answer updates the intake and rebuilt context matrix before the next question.
- Align Codex, Claude Code, and root Archetype skills so they do not ask grouped/bulk questions.
- Validate full packages against the HL-04 artifact and add a Scope 04 contract test.

Mismatches found before implementation:

- Generated clarification packages already exposed a single question, but there was no first-class artifact explaining the one-question turn, selection rule, answer protocol, or update-after-answer behavior.
- Front-door skills still instructed agents to ask up to six grouped questions, directly violating Scope 04.
- There was no CLI or MCP bridge for applying one clarification answer back into the intake/context matrix.
- Obsidian current-repo snapshots still contained stale grouped-question instructions.

Corrections applied:

- Added `lifecycle/clarification-turn.json` and `lifecycle/clarification-turn.md` to full packages and clarification packages.
- Added HL-04 metadata to clarification question objects: `source_scope`, `selection_rule`, `impact`, `selected_decision_id`, `answer_target`, and `after_answer`.
- Added `applyClarificationAnswer` in `src/modules/clarificationUx.ts`.
- Added CLI command `archetype answer-clarification`.
- Added MCP tool `archetype_answer_clarification`.
- Updated package manifests, lifecycle reports, readiness tiers, validation, CLI/MCP summaries, release doctor, README, MCP docs, and agent lifecycle docs to expose the clarification turn.
- Updated root/Codex/Claude front-door skills to require one question at a time and use `archetype_answer_clarification` after each answer.
- Updated plugin contract tests to fail if grouped-question wording returns.
- Updated Obsidian current-repo snapshots for the front-door skill text.
- Added `scripts/run-clarification-ux-contract.mjs` and wired `clarification-ux:contract` into `npm test` and `npm run check`.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run clarification-ux:contract`: pass.
- `npm run lifecycle:contract`: pass.
- `npm run context-readiness:contract`: pass.
- `npm run plugin:codex:contract`: pass.
- `npm run plugin:claude:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run release:contract`: pass.
- `npm run plugin-install:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- Type validation initially treated `contextMatrix.next_question` as unknown, so the HL-04 validator could not compare it to the clarification turn current question.
- Distribution contract output omitted the new `clarification-ux:contract` script from its reported script list.

Corrections applied during verification:

- Typed `contextMatrix.next_question` in validation as an object with an optional `id`.
- Added `clarification-ux:contract` to the distribution contract script report.

Self-healing rules added:

- A single-question artifact is not enough if installed skills still tell agents to ask grouped questions.
- Every clarification turn must name the decision it updates and the intake fields the answer should affect.
- After a user answer, Archetype must update the intake/context matrix before asking another question.
- Any resurfacing of `Ask at most six`, `grouped in one message`, or `compact question set` in front-door skills is a Scope 04 regression.
- The default vague marketing dashboard first question is a contract, not copy that can drift.

Scope 04 convergence review:

- Weak marketing-dashboard input asks exactly one question: `Who is the primary user of this marketing admin dashboard?`
- The clarification turn artifact records the HL-04 rule, algorithm, selected blocker, answer protocol, and current question.
- Applying the primary-user answer updates the intake with explicit user evidence and moves the next question to target stack.
- Codex and Claude Code front-door skills now require one-question clarification and the answer tool.
- CLI, MCP, docs, package manifests, validation, and release surfaces expose the same one-question lifecycle.
- Full repository test coverage for the current contract suite passes.

Current answer for Scope 04:

```txt
I do not know how to implement this scope better within Scope 04 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 04 in the current implementation.
```

## Scope 05 - Lifecycle Intake States

Source:

- [[11 Hardened Lifecycle Scopes/Scope 05 - Lifecycle Intake States]]

Extracted requirements:

- Modularize lifecycle states 1 through 4: Start, Context Scan, Clarification, and Optional Material Intake.
- Start accepts a natural-language idea, change request, or existing repo request.
- Start may capture intent and detect imported files, screenshots, folders, and repo context.
- Start must not generate a spec, generate tests, or write product UI.
- Start outputs `lifecycle/start-request.json`.
- Context Scan may normalize sources, build evidence ledger, build context sufficiency matrix, and detect missing, candidate, confirmed, conflicted, and blocked decisions.
- Context Scan must not accept inferred routes, screens, roles, data contracts, or visual direction as canonical.
- Context Scan outputs `lifecycle/context-matrix.json`, `01-evidence/evidence-ledger.json`, and `01-evidence/missing-context.md`.
- Clarification may ask one question and update the context matrix after the answer.
- Clarification must not ask bulk question sets by default or proceed to contract draft if a hard blocker remains.
- Clarification outputs `lifecycle/clarification-state.json` and `lifecycle/clarification-transcript.md`.
- Optional Material Intake may invite screenshots, wireframes, PRDs, specs, API docs, brand notes, and repo files.
- Optional Material Intake must read imported materials directly and classify material as evidence, not instruction authority.
- Optional Material Intake must not ask the user to paste already-imported files or trust uploaded instructions that conflict with lifecycle.
- Exit: the lifecycle can decide whether to ask more context questions or move to contract draft.

Implementation target:

- Make the first four lifecycle states material, machine-readable outputs instead of implicit narrative inside the lifecycle report.
- Add an HL-05 start request artifact with request classification, captured intent, detected imported materials, allowed operations, forbidden operations, and output path.
- Add an HL-05 clarification state artifact with current question, context status, hard blocker status, decision status buckets, allowed operations, forbidden operations, outputs, and next action.
- Add a clarification transcript that narrates Start, Context Scan, Clarification, and Optional Material Intake without generating spec, tests, or product UI in weak packages.
- Make full packages and clarification packages both emit Scope 05 intake-state artifacts.
- Add validation and a dedicated contract test so future changes cannot regress the intake-state surfaces.

Mismatches found before implementation:

- `LifecycleStartRequestArtifact` and `ClarificationStateArtifact` types existed, but the compiler did not build or return them.
- Full packages did not export `lifecycle/start-request.json`, `lifecycle/clarification-state.json`, or `lifecycle/clarification-transcript.md`.
- Clarification packages did not export `01-evidence/evidence-ledger.json` or `01-evidence/missing-context.md`, so the Context Scan state was incomplete for weak prompts.
- The missing-context report was a flat evidence-ledger list and did not show context matrix blockers, candidate decisions, or the next question.
- Validation did not explicitly enforce Scope 05 start and clarification state rules.
- Summaries and entrypoints did not point agents to the new intake-state artifacts.

Corrections applied:

- Added `src/modules/lifecycleIntakeStates.ts`.
- Built and returned `startRequest`, `clarificationState`, and `clarificationTranscript` from `buildLifecycleArtifacts`.
- Passed ingestion artifacts into lifecycle construction so Start can detect imported files, screenshots, folders, and repo context.
- Added the new lifecycle intake files to the compiler artifact index.
- Exported Scope 05 artifacts from full contract packages.
- Exported Scope 05 artifacts, evidence ledger, and missing-context report from clarification packages.
- Replaced the flat missing-context report with a report organized by Context Matrix Blockers, Evidence Ledger Missing Information, Candidate Decisions, and Next Question.
- Hardened `validateExportedPackage` to require and inspect HL-05 start request, clarification state, transcript, evidence ledger, and missing-context report.
- Added `scripts/run-lifecycle-intake-states-contract.mjs` and wired `lifecycle-intake:contract` into `npm test`, `npm run check`, package cleanup, and distribution validation.
- Updated CLI and MCP package summaries to list the new intake-state entrypoints.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run lifecycle-intake:contract`: pass.
- `npm run lifecycle:contract`: pass.
- `npm run clarification-ux:contract`: pass.
- `npm run context-readiness:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- The first implementation only wired the new artifacts into full packages; Scope 05 also required the Context Scan outputs in clarification packages.
- Summary entrypoints initially still focused on the older lifecycle files, which would make agents less likely to read the Start and Clarification State artifacts.
- The distribution contract did not know about the new Scope 05 contract script.

Corrections applied during verification:

- Added evidence ledger and missing-context outputs to clarification package export.
- Added `lifecycle/start-request.json`, `lifecycle/context-matrix.json`, `lifecycle/clarification-state.json`, `lifecycle/clarification-transcript.md`, `01-evidence/evidence-ledger.json`, and `01-evidence/missing-context.md` to CLI and MCP summaries.
- Updated distribution checks to require `scripts/run-lifecycle-intake-states-contract.mjs` and `lifecycle-intake:contract`.

Self-healing rules added:

- A type definition is not an implementation; every scope artifact must be built, exported, indexed, validated, and tested.
- Clarification packages are lifecycle packages too; weak context must still receive Start, Context Scan, Clarification, and Optional Material Intake artifacts.
- Missing context must be reported from both the evidence ledger and context matrix, because evidence gaps and lifecycle blockers are different failure modes.
- Summary entrypoints must follow newly required lifecycle artifacts, or installed agents will keep reading stale surfaces.
- A Scope 05 pass requires both contract packages and clarification packages to prove no spec, tests, or implementation contract are generated while hard blockers remain.

Scope 05 convergence review:

- Start is represented by `lifecycle/start-request.json`.
- Context Scan is represented by `lifecycle/context-matrix.json`, `01-evidence/evidence-ledger.json`, and `01-evidence/missing-context.md`.
- Clarification is represented by `lifecycle/clarification-state.json` and `lifecycle/clarification-transcript.md`.
- Optional Material Intake is represented in the transcript and lifecycle report as evidence-only intake with lifecycle-authority protections.
- Weak packages stop before spec, tests, Playwright contracts, and implementation contracts while still exporting all intake-state artifacts.
- Rich packages export the same intake-state artifacts and pass validation.
- CLI, MCP, distribution, lifecycle, clarification UX, readiness, and full repository tests pass.

Current answer for Scope 05:

```txt
I do not know how to implement this scope better within Scope 05 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 05 in the current implementation.
```

## Scope 06 - Lifecycle Contract States

Source:

- [[11 Hardened Lifecycle Scopes/Scope 06 - Lifecycle Contract States]]

Extracted requirements:

- Modularize lifecycle states 5 through 8: Contract Draft, Specialist Review, Contract Approval, and Canonical Spec Generation.
- Contract Draft may propose product model, IA, routes, screens, flows, tokens, components, data contracts, action contracts, form contracts, and verification strategy.
- Contract Draft must mark every unconfirmed item as candidate.
- Contract Draft must not mark inferred items as accepted, produce implementation-ready instructions, or tell the agent to write code.
- Contract Draft outputs `draft/product-model.draft.json`, `draft/experience-architecture.draft.json`, `draft/design-system.draft.json`, `draft/frontend-contract.draft.json`, and `draft/assumption-ledger.md`.
- Specialist Review may use specialist agents and frontend best-practice skills to produce blockers, warnings, and recommendations.
- Specialist Review must not let the same role approve the draft it created.
- Specialist Review must not convert warnings into acceptance without evidence.
- Contract Approval may present confirmed facts, candidate assumptions, unresolved unknowns, and risks, then ask for approval or edits.
- Contract Approval must not generate a canonical spec without approval or hide assumptions in generated artifacts.
- Canonical Spec Generation may generate the canonical spec and agent contract only after approval.
- Canonical Spec Generation freezes route, screen, state, token, component, data, action, form, and verification contracts.
- Canonical Spec Generation must not add product scope absent from the approved contract.
- Canonical outputs are `spec/archetype-spec.json`, `spec/archetype-spec.md`, `frontend-agent-contract/implementation-rules.json`, `frontend-agent-contract/frontend-agent-instructions.md`, and `frontend-agent-contract/acceptance-criteria.json`.
- Exit: the canonical spec is valid, approved, and traceable.

Implementation target:

- Split complete-but-unapproved intake from approved canonical generation.
- Emit a review-only `draft_contract` package when context is sufficient but implementation is not human-authorized.
- Add machine-readable draft artifacts, assumption ledger, specialist review, contract approval request, and contract-state artifact.
- Forbid canonical spec, test-first, Playwright, implementation contract, and agent instruction surfaces from draft packages.
- Export Scope 06 draft artifacts inside approved canonical packages for traceability.
- Teach CLI, MCP, summaries, validation, distribution, docs, skills, and tests to branch by package type.

Mismatches found before implementation:

- Complete context previously generated canonical specs, tests, implementation contracts, and agent instructions before explicit approval.
- The package validator only understood full canonical packages, so it could not enforce draft-only forbidden surfaces.
- CLI and MCP summaries pointed agents directly to canonical spec and test-first entrypoints even when approval had not happened.
- Front-door skills and docs implied that sufficient context moved straight into implementation.
- `write-target` could report missing generated source artifacts before rejecting an unauthorized draft package.
- Older contract tests assumed unapproved rich inputs should contain canonical files.

Corrections applied:

- Added `src/modules/lifecycleContractStates.ts` to build Contract Draft, Specialist Review, Contract Approval, and Canonical Spec Generation state artifacts.
- Added `src/output/exportDraftPackage.ts` for review-only draft packages.
- Updated CLI package generation so complete but unapproved context exports `draft_contract`, and approved intake exports the full canonical package.
- Updated MCP package generation with the same approval gate.
- Updated CLI and MCP package summaries to expose draft entrypoints for `draft_contract` packages.
- Updated package validation with draft-package required files and forbidden canonical files.
- Exported the draft artifacts and `lifecycle/contract-state.json` inside approved canonical packages for traceability.
- Moved write-target authorization checks before source artifact checks.
- Updated docs and root/Codex/Claude front-door skills to require draft review and human approval before canonical generation and implementation.
- Updated old CLI, MCP, lifecycle, spec, test-first, golden, plugin, and distribution contract tests to respect the new draft/canonical split.
- Added `scripts/run-lifecycle-contract-states-contract.mjs` and wired `lifecycle-contract:contract` into test, check, cleanup, and distribution coverage.

Verification evidence:

- `npm run lifecycle-contract:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run spec:contract`: pass.
- `npm run test-first:contract`: pass.
- `npm run lifecycle:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run install:contract`: pass.
- `npm run golden`: pass.
- `npm test`: pass.

Mismatches found during verification:

- Draft package validation initially needed separate required and forbidden surfaces from canonical package validation.
- Summary generation needed to read draft artifacts instead of canonical spec files for `draft_contract`.
- Older scenario tests needed explicit human approval in intake before expecting canonical spec and test-first artifacts.
- Unauthorized write-target needed to fail because implementation is not authorized, not because target source files do not exist in draft packages.

Corrections applied during verification:

- Added package-type-specific validation to `validateExportedPackage`.
- Added draft-aware CLI and MCP summary paths.
- Updated canonical-only tests to create approved intake before asserting canonical artifacts.
- Reordered write-target checks so authorization is evaluated first.

Self-healing rules added:

- `ready_for_contract_approval` is not approval and must never generate canonical spec, tests, or implementation surfaces by itself.
- A draft package must not contain canonical spec, test-first, Playwright, implementation-contract, or frontend-agent-contract implementation files.
- Agent-facing skills must branch on `packageType` before reading `spec/` or `test-first/` files.
- Human approval must be recorded in intake before canonical package export.
- Validators must enforce package-type-specific required and forbidden surfaces.
- Specialist review can block, warn, and recommend, but it cannot approve its own draft or launder warnings into accepted facts.

Scope 06 convergence review:

- Complete unapproved context now stops at `draft_contract`.
- Draft packages contain draft product, experience, design-system, frontend-contract, assumption-ledger, specialist-review, approval-request, and contract-state artifacts.
- Draft packages do not contain canonical spec, test-first, Playwright verification, implementation contract, or implementation agent instructions.
- Approved canonical packages still include canonical spec and agent contract outputs, and also include draft artifacts for traceability.
- CLI, MCP, docs, skills, validation, distribution, golden, lifecycle, spec, test-first, install, and full repository tests pass.

Current answer for Scope 06:

```txt
I do not know how to implement this scope better within Scope 06 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 06 in the current implementation.
```

## Scope 07 - Lifecycle Execution States

Source:

- [[11 Hardened Lifecycle Scopes/Scope 07 - Lifecycle Execution States]]

Extracted requirements:

- Modularize lifecycle states 9 through 13: Test-First Authoring, Implementation, QA Verification, Repair or Revision, and Completion.
- Test-First Authoring may generate smoke, E2E, UI, accessibility, integration, and unit test obligations.
- Test-First Authoring may materialize tests before product UI and must preserve initial red tests.
- Test-First Authoring must not write product UI before tests, generate tests that only prove generated markers exist, or weaken tests to make implementation pass.
- Implementation may build from the canonical contract, use approved specialist guidance, and stay inside the target architecture and file manifest.
- Implementation must not invent routes, screens, actions, entities, visual systems, or data behavior outside spec.
- Implementation must not replace real behavior with generic success panels or use untyped escape hatches.
- QA Verification may run Playwright, generate scenario catalog, test malformed data, edge states, accessibility, responsiveness, visual evidence, and detect contract drift.
- QA Verification must not treat passing smoke tests as sufficient QA or ignore visual or behavioral drift because selectors exist.
- Repair or Revision may patch implementation drift first and revise the contract only with approved new evidence.
- Repair or Revision must not revise the contract to excuse bad implementation or close with an unresolved repair queue.
- Completion may produce a final report.
- Completion must not claim production readiness without evidence or accessibility compliance without review.
- Exit condition: `ready_for_completion` is true.

Implementation target:

- Add a canonical-package execution-state artifact for HL-07.
- Make the artifact expose states 9 through 13 with allowed operations, forbidden operations, outputs, gates, proof artifacts, current state, and `ready_for_completion`.
- Add a markdown execution-state report for human review.
- Keep fresh approved packages in `test_first_authoring` with `ready_for_completion: false`.
- Update the execution-state artifact after target verification and repair planning so passing Playwright evidence plus an empty repair queue moves to `completion`.
- Make package validation fail when the execution-state artifact is missing, malformed, or inconsistent with target execution, Playwright evidence, and repair queue status.
- Expose `lifecycle/execution-state.json` through CLI, MCP, generated AGENTS/CLAUDE instructions, docs, top-level manifest, and internal artifact index.

Mismatches found before implementation:

- Test-first, implementation, QA, repair, and completion rules existed as scattered contracts, but there was no single lifecycle artifact representing Scope 07 states.
- Validation could require test-first, Playwright, and repair artifacts but could not compute whether completion was actually allowed.
- Summaries and front-door skills did not point agents to an execution-state gate before completion claims.
- `verify-target` wrote Playwright evidence and repair artifacts but did not update a lifecycle execution state.
- `repair` could update the repair queue without updating any lifecycle completion or repair state.

Corrections applied:

- Added `src/modules/lifecycleExecutionStates.ts`.
- Exported `lifecycle/execution-state.json` and `lifecycle/execution-state.md` from approved canonical packages.
- Added Scope 07 artifacts to the top-level manifest and internal artifact index.
- Updated `verify-target` to refresh execution state after target execution, Playwright evidence, and repair artifacts are written.
- Updated repair artifact planning to refresh execution state when the lifecycle folder exists.
- Updated CLI and MCP summaries to expose `lifecycle/execution-state.json` for canonical packages.
- Updated generated `AGENTS.md` and `CLAUDE.md` to require reading `lifecycle/execution-state.json` and to block completion until `ready_for_completion` is true.
- Updated root, Codex, and Claude front-door skills and docs to read the execution-state artifact.
- Hardened `validateExportedPackage` to require Scope 07 files and to verify `ready_for_completion` against target execution, Playwright evidence, and repair queue status.
- Added `scripts/run-lifecycle-execution-states-contract.mjs` and wired `lifecycle-execution:contract` into `npm test`, `npm run check`, cleanup, and distribution coverage.
- Updated Playwright and repair contract tests to assert execution-state transitions to `completion` on pass and `repair_or_revision` on verification failure.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run lifecycle-execution:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run lifecycle:contract`: pass.
- `npm run spec:contract`: pass.
- `npm run test-first:contract`: pass.
- `npm run playwright:contract`: pass.
- `npm run repair:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- Fresh approved packages needed to start in `test_first_authoring`, not `implementation`, because target tests and initial red evidence are still downstream agent obligations.
- Validation needed to read `14-target-execution/target-execution-report.json` so `ready_for_completion` could be computed from actual execution evidence, not only pending package metadata.
- Full repair and Playwright tests needed explicit assertions that execution-state moved with the evidence, otherwise the new artifact could remain stale while old contracts still passed.

Corrections applied during verification:

- Adjusted execution-state derivation so pending target execution and pending Playwright evidence keep the current state at `test_first_authoring`.
- Added target execution report parsing to package validation.
- Added execution-state transition checks to Playwright and repair contract tests.

Self-healing rules added:

- Completion is not a narrative claim; it is the computed conjunction of implementation authorization, passing target execution, passing Playwright evidence, repair queue pass, and zero repair tasks.
- A fresh canonical package is not complete and should start at `test_first_authoring`.
- Test-first obligations must explicitly forbid marker-only tests, or generated selectors can masquerade as QA.
- `verify-target` and `repair` must keep lifecycle state synchronized with Playwright evidence and repair queue artifacts.
- Any new completion surface must read `lifecycle/execution-state.json` before claiming done.
- Validation must compare lifecycle state against proof artifacts, not just check that files exist.

Scope 07 convergence review:

- Scope 07 states 9 through 13 are represented in `lifecycle/execution-state.json`.
- Fresh approved packages begin at `test_first_authoring` and do not claim completion.
- Passing Playwright verification with an empty repair queue updates execution state to `completion` and sets `ready_for_completion: true`.
- Failed Playwright verification updates execution state to `repair_or_revision` and keeps `ready_for_completion: false`.
- CLI, MCP, docs, installed skills, manifests, validation, Playwright, repair, distribution, and full repository tests pass.

Current answer for Scope 07:

```txt
I do not know how to implement this scope better within Scope 07 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 07 in the current implementation.
```

## Scope 08 - Frontend Best-Practice Skills

Source:

- [[11 Hardened Lifecycle Scopes/Scope 08 - Frontend Best-Practice Skills]]

Extracted requirements:

- Define lifecycle-gated frontend skills.
- Required skills: `frontend-architecture`, `react-practices`, `typescript-strictness`, `design-system-practices`, `accessibility-practices`, `forms-and-validation`, `data-contract-practices`, `responsive-practices`, `performance-practices`, `visual-polish-practices`, and `testing-practices`.
- These are not optional recommendations.
- The frontend practices become pass/fail checks in the specialist gate.
- Exit condition: every frontend practice has an owner, blocker list, and output artifact.

Implementation target:

- Add an HL-08 frontend practice skills artifact.
- Export the master practice artifact and a human-readable report in draft and approved canonical packages.
- Export one output artifact per required frontend practice.
- Attach the practice checks to `draft/specialist-review.json` as a pass/fail specialist gate.
- Validate every required skill, owner, blocker list, output artifact, and specialist review check.
- Expose the master artifact through package summaries, docs, root skills, and installed front-door skills.
- Add a dedicated contract test and wire it into full repository verification.

Mismatches found before implementation:

- Specialist review mentioned frontend best-practice skills, but the skills were not enumerated as required pass/fail checks.
- There was no package artifact proving every required frontend practice had an owner, blocker list, and output artifact.
- Draft packages could be approved without a machine-readable frontend practice gate.
- Validation could not fail when frontend practice checks were missing.
- CLI, MCP, docs, and skills did not point agents to a frontend-practice gate before implementation.

Corrections applied:

- Added `src/modules/frontendPracticeSkills.ts`.
- Added `governance/frontend-practice-skills.json` and `governance/frontend-practice-skills.md`.
- Added individual practice output artifacts under `specialist-gate/frontend-practices/*.json`.
- Updated draft and canonical package exports to include the master artifact, report, and every individual practice output.
- Updated specialist review generation with `frontend_practice_gate` containing every required practice as a pass/fail check.
- Added frontend practice artifacts to the top-level manifest and internal artifact index.
- Updated package validation for draft and canonical packages to require every practice, owner, blocker list, output artifact, and specialist-gate check.
- Updated CLI and MCP summaries to include `governance/frontend-practice-skills.json`.
- Updated README, Codex docs, Claude Code docs, agent lifecycle docs, and root/Codex/Claude front-door skills to read the practice gate.
- Added `scripts/run-frontend-practice-skills-contract.mjs` and wired `frontend-practices:contract` into `npm test`, `npm run check`, cleanup, and distribution coverage.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run frontend-practices:contract`: pass.
- `npm run lifecycle-contract:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- The practice gate needed to exist in draft packages as well as canonical packages because the specialist review happens before contract approval.
- The summary entrypoint needed to expose the practice gate or agents could continue directly from draft/spec artifacts and skip the pass/fail checks.
- Validation needed to fail not only when the master artifact is missing, but also when an individual practice output artifact is missing.

Corrections applied during verification:

- Exported frontend practice artifacts from both `exportDraftPackage` and `exportPackage`.
- Added `governance/frontend-practice-skills.json` to CLI and MCP entrypoints.
- Added contract-test deletion of `specialist-gate/frontend-practices/testing-practices.json` to prove validation fails on missing individual output.

Self-healing rules added:

- A frontend practice named in Scope 08 is not real until it has an owner, blocker list, and output artifact.
- Specialist review must contain a frontend practice gate; plain prose recommendations are a regression.
- Frontend practice gates belong to draft packages too, because approval must see them before canonical generation.
- Summaries and front-door skills must mention the practice gate before implementation starts.
- Validation must check each individual practice artifact, not only the master index.

Scope 08 convergence review:

- All 11 required frontend practices are represented in `governance/frontend-practice-skills.json`.
- Every required practice has an owner, blocker list, and output artifact under `specialist-gate/frontend-practices/`.
- `draft/specialist-review.json` includes an HL-08 pass/fail frontend practice gate.
- Draft and canonical packages validate against the practice gate.
- CLI, MCP, docs, skills, manifests, distribution, and full repository tests pass.

Current answer for Scope 08:

```txt
I do not know how to implement this scope better within Scope 08 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 08 in the current implementation.
```

## Scope 09 - Agent Role Files

Source:

- [[11 Hardened Lifecycle Scopes/Scope 09 - Agent Role Files]]

Extracted requirements:

- Define specialist agent markdown files.
- Required role files: `product-architect.md`, `experience-architect.md`, `frontend-architect.md`, `design-system-architect.md`, `frontend-practice-enforcer.md`, `strict-typescript-developer.md`, `pixel-perfect-developer.md`, `accessibility-specialist.md`, `test-first-developer.md`, `contract-verifier.md`, and `repair-planner.md`.
- No agent can approve its own work.
- Exit condition: each role defines authority, inputs, outputs, blockers, and handoff rules.

Implementation target:

- Create the required role markdown files under the root `agents/` surface.
- Mirror the required role markdown files into the Claude Code plugin `plugins/claude-code/agents/` surface.
- Preserve `frontend-contract-reviewer.md` as a compatibility role while moving final approval authority to `contract-verifier.md`.
- Add a contract test that mechanically validates every required role file, required section, mirror consistency, and the self-approval ban.
- Wire the new contract into `npm test`, `npm run check`, cleanup, distribution checks, Claude plugin checks, and plugin install checks.
- Update docs and front-door skills so installed users and agents can discover the specialist roles.

Mismatches found before implementation:

- Only `product-architect.md` and `frontend-contract-reviewer.md` existed.
- The required HL-09 roles for experience, frontend architecture, design-system architecture, practice enforcement, strict typing, pixel-perfect work, accessibility, test-first work, independent verification, and repair planning were missing.
- Existing role files did not have the required authority, inputs, outputs, blockers, and handoff sections.
- The self-approval ban was not present in every role file.
- Install and distribution tests only checked for the older two-role surface.

Corrections applied:

- Updated `agents/product-architect.md` and `agents/frontend-contract-reviewer.md` with the required Scope 09 sections.
- Added all missing required role files under `agents/`.
- Mirrored the full role set into `plugins/claude-code/agents/`.
- Added `scripts/run-agent-role-files-contract.mjs`.
- Added `agent-roles:contract` to `package.json` and wired it into full test, check, clean, and distribution coverage.
- Updated Claude plugin and plugin-install contracts to require the full specialist role set.
- Updated README, quickstart, install docs, agent lifecycle docs, Codex/Claude usage docs, and root/Codex/Claude front-door skills to expose the role files and the self-approval rule.

Verification evidence:

- `npm run agent-roles:contract`: pass.
- `npm run typecheck`: pass.
- `npm run plugin:claude:contract`: pass.
- `npm run plugin:codex:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run plugin-install:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- The first Scope 09 contract test expected literal `agents/<role>.md` strings in the Claude plugin contract, but that contract correctly builds paths from a role array.

Corrections applied during verification:

- Adjusted `scripts/run-agent-role-files-contract.mjs` to validate the role names in the Claude plugin contract rather than requiring expanded literal paths.

Self-healing rules added:

- A specialist role is not implemented until it exists in both root `agents/` and the Claude Code plugin `agents/` surface.
- Every role file must have `## Authority`, `## Inputs`, `## Outputs`, `## Blockers`, and `## Handoff Rules`.
- The exact sentence `No agent can approve its own work.` must appear in every role file.
- Compatibility roles may remain only when they route approval to an independent required role.
- Install and distribution tests must verify the full role set, not only legacy role files.

Scope 09 convergence review:

- All 11 required HL-09 agent roles exist as markdown files.
- Every required role defines authority, inputs, outputs, blockers, and handoff rules.
- Root and Claude plugin agent role files are mirrored.
- The no-self-approval rule is present in every required role.
- The compatibility frontend contract reviewer cannot approve work and hands final approval to `contract-verifier.md`.
- Agent roles are covered by contract tests, distribution tests, plugin tests, install tests, and full repository tests.

Current answer for Scope 09:

```txt
I do not know how to implement this scope better within Scope 09 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 09 in the current implementation.
```

## Scope 10 - QA Team

Source:

- [[11 Hardened Lifecycle Scopes/Scope 10 - QA Team]]

Extracted requirements:

- Define QA as a lifecycle phase.
- Required QA agent files: `qa-lead.md`, `playwright-e2e-engineer.md`, `ui-state-qa.md`, `malformed-data-qa.md`, `accessibility-qa.md`, `visual-regression-qa.md`, and `contract-drift-qa.md`.
- Required QA artifacts: `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, and `10-revision/repair-task-queue.json`.
- Exit condition: QA produces evidence, not vibes.

Implementation target:

- Add the seven required QA agent files under root `agents/` and mirror them into `plugins/claude-code/agents/`.
- Add generated QA artifacts to canonical packages.
- Start QA artifacts as pending evidence obligations in fresh approved packages.
- Rewrite QA artifacts from actual `verify-target` evidence after Playwright and repair planning run.
- Validate the required QA files, agent list, required artifacts, scenario coverage, evidence sections, and traceability.
- Expose QA artifacts through package manifests, artifact index, generated AGENTS/CLAUDE instructions, CLI/MCP summaries, docs, skills, distribution, install, and tests.

Mismatches found before implementation:

- QA existed only indirectly through Playwright and repair artifacts.
- There were no QA agent files for QA lead, Playwright E2E, UI state, malformed data, accessibility, visual regression, or contract drift.
- There was no `qa/` artifact surface.
- Playwright evidence did not produce a QA scenario catalog or QA result reports.
- Validation could pass a canonical package without any QA phase artifacts.

Corrections applied:

- Added seven QA agent markdown files and mirrored them into the Claude Code plugin agent surface.
- Added `src/modules/qaTeam.ts` with QA agents, required artifacts, scenario catalog generation, Playwright results, malformed-data results, accessibility report, visual-regression report, and contract-drift report.
- Exported `qa/*` artifacts from canonical packages.
- Updated `verify-target` to refresh QA artifacts from Playwright evidence, target execution, repair queue, and drift report.
- Added QA artifacts to top-level manifest, internal artifact index, implementation rules, generated AGENTS/CLAUDE files, CLI/MCP summarize entrypoints, lifecycle execution QA outputs, docs, and skills.
- Updated package validation to require and inspect QA evidence.
- Added `scripts/run-qa-team-contract.mjs`.
- Wired `qa-team:contract` into `npm test`, `npm run check`, cleanup, and distribution coverage.
- Updated Claude plugin and install contracts to include QA agents.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run qa-team:contract`: pass.
- `npm run agent-roles:contract`: pass.
- `npm run plugin:claude:contract`: pass.
- `npm run plugin:codex:contract`: pass.
- `npm run distribution:contract`: pass.
- `npm run plugin-install:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run lifecycle-execution:contract`: pass.
- `npm test`: pass.

Mismatches found during verification:

- The first TypeScript pass failed because malformed-data test extraction had a union type that did not guarantee record properties.
- Validation failed because malformed-data QA scenarios used `evidence_artifact` instead of the shared `evidence_artifacts` array shape.
- Post-verify validation failed because a passing repair queue completion gate no longer mentioned `verify-target`, weakening evidence traceability.

Corrections applied during verification:

- Made malformed-data source tests explicitly `JsonRecord[]`.
- Added `evidence_artifacts` arrays to malformed-data QA scenarios.
- Updated the passing repair queue completion gate to say it is closed only after `verify-target` wrote passing evidence.

Self-healing rules added:

- QA is not real until it has both agent roles and `qa/*` evidence artifacts.
- Every QA scenario must include an owner agent, evidence artifacts, and valid status.
- Malformed-data QA may remain warning or pending only when the artifact explicitly records missing runtime evidence and owner.
- Passing repair queues must still trace to `verify-target` evidence.
- Validation must fail if any required QA artifact is missing.

Scope 10 convergence review:

- All seven required QA agents exist and are installed through plugin surfaces.
- All required QA artifacts are generated in canonical packages.
- QA artifacts start pending, then update from `verify-target` evidence.
- `qa-team:contract` proves pending package validation, post-verify pass state, summarize exposure, and validation failure when a required QA artifact is removed.
- Full repository verification passes.

Current answer for Scope 10:

```txt
I do not know how to implement this scope better within Scope 10 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 10 in the current implementation.
```

## Scope 11 - Test Quality Standard

Source:

- [[11 Hardened Lifecycle Scopes/Scope 11 - Test Quality Standard]]

Extracted requirements:

- Define what valid tests must prove.
- Forbidden patterns: marker-only `[data-archetype-screen]` checks, generic primary-button success checks, contract-array-only tests, screenshot byte-size quality claims, and mirrored implementation constants as expectations.
- Required behaviors: real search/filter outcomes, create workflows, export artifacts/adapters, deterministic fixtures, browser-observable routes and deep links, keyboard/focus/accessible names/landmarks/live regions, long labels/malformed data/permission mismatches, and desktop/tablet/mobile visual evidence.
- Exit condition: marker-only tests fail the verifier.

Implementation target:

- Add a generated `test-first/test-quality-standard.json` and markdown report.
- Make Playwright verification contracts reference the standard and expose the forbidden patterns and required behaviors.
- Strengthen generated Playwright tests with non-marker behavioral assertions.
- Make visual-smoke evidence cover mobile, tablet, and desktop per route.
- Make `verify-target` audit target test files and block marker-only tests before Playwright runs.
- Make package validation require the test-quality standard and fail if generated Playwright evidence is marker-only.
- Expose the standard through CLI/MCP summaries, docs, skills, manifests, target traceability, distribution checks, and install checks.

Mismatches found before implementation:

- Existing generated tests could still be interpreted as selector/marker tests because route and state assertions leaned heavily on `data-archetype-*` markers.
- Visual-smoke scenarios captured one screenshot per route, not desktop/tablet/mobile evidence.
- Package validation did not require a test-quality standard artifact.
- `verify-target` could run a target suite even if the suite was replaced by a marker-only test.
- CLI/MCP summaries and agent skills did not tell implementers to read a test-quality standard.

Corrections applied:

- Added `src/modules/testQualityStandard.ts`.
- Added `test-first/test-quality-standard.json` and `test-first/test-quality-standard.md` to canonical exports, manifests, artifact index, lifecycle execution outputs, and package validation.
- Updated `src/modules/playwrightVerification.ts` so contracts include `test_quality_standard_path`, `marker_only_tests_fail_verifier`, forbidden patterns, required behaviors, and viewport-specific visual-smoke scenarios.
- Strengthened generated Playwright specs with headings, visible text, status regions, route path checks, landmarks, keyboard focus, bounding boxes, and viewport-specific screenshots.
- Updated generated target route state panels with `role="status"` and `aria-live="polite"`.
- Added `auditTargetTestQuality` to `verify-target`; marker-only target tests now block verification before Playwright runs.
- Updated target source manifests so test files read `test-first/test-quality-standard.json`.
- Added `scripts/run-test-quality-standard-contract.mjs` and wired `test-quality:contract` into test, check, clean, distribution, plugin, install, and package surfaces.
- Updated README, lifecycle docs, Codex/Claude usage docs, MCP docs, and root/plugin skills.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run test-quality:contract`: pass.
- `npm run playwright:contract`: pass.
- `npm run qa-team:contract`: pass.
- `npm run repair:contract`: pass.
- `npm run plugin:codex:contract`: pass.
- `npm run plugin:claude:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run distribution:contract`: pass.
- `node scripts/run-test-first-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-execution-states-contract.mjs`: pass after shared build.
- `node scripts/run-plugin-install-contract.mjs`: pass after shared build.
- `node scripts/run-install-contract.mjs`: pass after shared build.

Mismatches found during verification:

- The first validation draft required a `keyboard` signal in the generated Playwright spec before the spec actually pressed a key.
- The initial Scope 11 path exposed the standard in generated packages but did not yet require it in target test traceability.
- Install-facing scripts did not yet assert that the new Scope 11 contract script ships in packed packages.

Corrections applied during verification:

- Added a keyboard/focus assertion to the accessibility Playwright suite.
- Added the test-quality standard to target test-file `reads` traceability.
- Updated install and plugin-install contract scripts to require `scripts/run-test-quality-standard-contract.mjs`.

Self-healing rules added:

- A test-quality standard is not real unless package validation requires it and Playwright contracts reference it.
- Browser tests may use Archetype markers only as anchors; they must also prove user-visible behavior.
- Visual evidence must be viewport-specific across mobile, tablet, and desktop.
- `verify-target` must fail before Playwright if target tests are marker-only.
- Install and distribution tests must include every new contract script that enforces a lifecycle scope.

Scope 11 convergence review:

- The standard artifact exists and is required.
- Generated Playwright contracts and specs encode the standard.
- `verify-target` blocks marker-only tests with an HL-11-specific blocker.
- The Scope 11 contract proves marker-only sabotage fails and restored behavior-rich tests pass.
- Downstream Playwright, QA, repair, CLI, MCP, plugin, distribution, and install surfaces pass focused verification.

Current answer for Scope 11:

```txt
I do not know how to implement this scope better within Scope 11 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 11 in the current implementation.
```

## Scope 12 - Required Package Artifacts

Source:

- [[11 Hardened Lifecycle Scopes/Scope 12 - Required Package Artifacts]]

Extracted requirements:

- Define the artifact shape of a complete package.
- Required complete-package artifacts are the exact HL-12 list: context matrix, clarification state/transcript, approval request/decision, evidence ledger, missing context, assumption ledger, specialist review summary, canonical spec JSON/markdown, frontend agent contract files, test-first contract/plan, initial red test run evidence, QA evidence artifacts, Playwright evidence, repair task queue, and final readiness report.
- Exit condition: every complete package preserves traceable contract evidence.

Implementation target:

- Add a single source list for required complete-package artifacts.
- Generate the missing HL-12 artifacts in canonical packages.
- Add the missing artifacts to top-level manifest artifacts and internal manifest artifact index.
- Validate every required artifact exists and is indexed by both manifests.
- Validate approval decision traceability, approval request markdown, specialist review summary, initial red test run evidence, and final readiness report content.
- Update `verify-target` so the final readiness report reflects actual target execution and Playwright evidence after verification.
- Expose the artifacts through CLI/MCP summaries, docs, skills, package/distribution checks, install checks, and a dedicated contract test.

Mismatches found before implementation:

- Complete packages did not have `lifecycle/approval-request.md`.
- Complete packages did not have `lifecycle/approval-decision.json`.
- Complete packages did not have `reviews/specialist-review-summary.md`.
- Complete packages did not have `test-results/initial-red-test-run.md`.
- Complete packages did not have `lifecycle/final-readiness-report.md`.
- The top-level manifest did not explicitly list `01-evidence/evidence-ledger.json` or `01-evidence/missing-context.md`, even though those files existed.
- Summaries and skills did not expose the new complete-package proof artifacts.

Corrections applied:

- Added `src/modules/requiredPackageArtifacts.ts` with `REQUIRED_COMPLETE_PACKAGE_ARTIFACTS` and builders for approval request, approval decision, specialist review summary, initial red test run, and final readiness report.
- Updated canonical export to write all missing HL-12 artifacts.
- Added required artifacts to top-level manifest and internal artifact index.
- Updated package validation to require the exact HL-12 artifact list and inspect traceability/content.
- Updated `verify-target` to rewrite `lifecycle/final-readiness-report.md` after target verification.
- Updated CLI and MCP summarize entrypoints.
- Updated README, agent lifecycle docs, Codex/Claude usage docs, root skills, and plugin skills.
- Added `scripts/run-required-package-artifacts-contract.mjs`.
- Wired `required-artifacts:contract` into `npm test`, `npm run check`, cleanup, distribution, install, and plugin-install surfaces.

Verification evidence:

- `npm run typecheck`: pass after cast correction.
- `npm run required-artifacts:contract`: pass.
- `node scripts/run-cli-contract.mjs`: pass after shared build.
- `node scripts/run-mcp-contract.mjs`: pass after shared build.
- `node scripts/run-codex-plugin-contract.mjs`: pass after shared build.
- `node scripts/run-claude-plugin-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass after shared build.
- `node scripts/run-plugin-install-contract.mjs`: pass after shared build.
- `node scripts/run-install-contract.mjs`: pass after shared build.
- `node scripts/run-test-first-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-execution-states-contract.mjs`: pass after shared build.

Mismatches found during verification:

- TypeScript rejected direct `Manifest as Record<string, unknown>` casts.
- The top-level manifest was missing `01-evidence/evidence-ledger.json` and `01-evidence/missing-context.md`, which Scope 12 requires to be manifest-traceable.

Corrections applied during verification:

- Cast manifest through `unknown` where a generic record builder is intentionally used.
- Added evidence ledger and missing context to the top-level manifest artifact list.

Self-healing rules added:

- A complete package artifact is not complete unless it exists on disk, appears in `manifest.json`, and appears in `00-manifest/manifest.json` artifact index.
- Approval must be represented both as a human-readable request and a machine-readable decision.
- Specialist review must have a human-readable summary separate from raw JSON.
- Initial red test evidence must exist before implementation as a pending obligation and trace back to the test-first contract.
- Final readiness must be a dedicated lifecycle artifact that updates after verification evidence changes.

Scope 12 convergence review:

- All 27 required HL-12 artifacts are generated in complete canonical packages.
- Every required artifact is manifest-indexed twice.
- Package validation fails when a required complete-package artifact is removed.
- `verify-target` updates final readiness with passing target and Playwright status.
- CLI, MCP, plugin, distribution, install, test-first, and lifecycle execution checks all pass after the change.

Current answer for Scope 12:

```txt
I do not know how to implement this scope better within Scope 12 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 12 in the current implementation.
```

## Scope 13 - Forbidden Behaviors And Acceptance

Source:

- [[11 Hardened Lifecycle Scopes/Scope 13 - Forbidden Behaviors And Acceptance]]

Extracted requirements:

- Define what the lifecycle must reject and how success is judged.
- Encode all 11 forbidden behaviors:
  - weak-context code generation,
  - inferred routes treated as accepted routes,
  - warnings treated as readiness,
  - bulk clarification when one-question clarification is possible,
  - hidden assumptions in product copy or route names,
  - default Vite README as final README,
  - production-grade claims from mock-only interactions,
  - generic success states instead of real workflows,
  - marker-only tests,
  - implementation mutating contract without approved evidence,
  - QA passing without Playwright evidence.
- Encode the six acceptance criteria: vague prompts stop at clarification, inferred routes remain candidates, approved assumptions are recorded, shallow tests fail, implementation drift creates repair tasks, and completion requires a clean repair queue.
- Exit condition: forbidden behaviors are encoded as tests or validators.

Implementation target:

- Add a dedicated HL-13 governance artifact at `governance/forbidden-behaviors.json` plus a markdown report.
- Generate the artifact for clarification, draft, and canonical packages.
- Make canonical package validation require and inspect the artifact.
- Make draft package validation require and inspect the artifact.
- Expose the artifact in CLI and MCP summaries.
- Add implementation rules, generated AGENTS/CLAUDE instructions, docs, skills, and contract-verifier role inputs so implementation agents read it before coding or completion claims.
- Add a dedicated contract test proving weak prompts stop, one-question clarification holds, the artifact is generated, mappings point to concrete validators/tests, validation fails if the artifact is missing, QA traces Playwright evidence, and repair gates block unresolved drift.

Mismatches found before implementation:

- Forbidden behaviors existed only as scattered policy in lifecycle/test/repair modules.
- There was no single validator-readable Scope 13 acceptance contract.
- Clarification and draft packages had non-negotiable/evidence governance, but no explicit forbidden-behavior contract.
- Summaries and implementation skills did not expose the forbidden behavior contract as a first-class entrypoint.

Corrections applied:

- Added `src/modules/forbiddenBehaviorAcceptance.ts` with exact HL-13 forbidden behavior and acceptance criteria lists.
- Added `governance/forbidden-behaviors.json` and `governance/forbidden-behaviors.md` to clarification, draft, and complete package exports.
- Added the forbidden behavior artifacts to top-level manifests and internal artifact indexes.
- Updated `src/quality/validatePackage.ts` to validate exact HL-13 behavior lists, enforcement kind, validator/test path, evidence artifacts, markdown sections, QA Playwright evidence traceability, lifecycle execution forbidden behavior coverage, and repair completion gate coverage.
- Updated generated README/AGENTS/CLAUDE, implementation rules, CLI/MCP summaries, docs, root skills, plugin skills, and verifier role files.
- Added `scripts/run-forbidden-behaviors-contract.mjs`.
- Wired `forbidden-behaviors:contract` into `npm test`, `npm run check`, cleanup, distribution, install, and plugin-install surfaces.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run forbidden-behaviors:contract`: pass.
- `node scripts/run-cli-contract.mjs`: pass after shared build.
- `node scripts/run-mcp-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass after shared build.
- `node scripts/run-codex-plugin-contract.mjs`: pass after shared build.
- `node scripts/run-claude-plugin-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-contract-states-contract.mjs`: pass after shared build.
- `node scripts/run-required-package-artifacts-contract.mjs`: pass after shared build.
- `node scripts/run-test-first-contract.mjs`: pass after shared build.
- `node scripts/run-test-quality-standard-contract.mjs`: pass after shared build.
- `npm test`: pass end to end.

Mismatches found during verification:

- Initial implementation only covered the canonical export; clarification and draft package exports needed the same governance artifact.
- Install/distribution/plugin contract scripts needed the new enforcement script and skill references so packaged installs cannot drift from source behavior.

Corrections applied during verification:

- Added forbidden behavior artifacts to clarification and draft exports.
- Updated install, plugin-install, distribution, CLI, MCP, and plugin contract assertions.
- Updated docs and skills to require reading `governance/forbidden-behaviors.json`.

Self-healing rules added:

- A forbidden behavior is not encoded unless it names a concrete validator, contract test, or lifecycle gate and evidence artifacts.
- Governance contracts must be present in clarification, draft, and canonical package surfaces when they constrain all lifecycle phases.
- New governance artifacts must be exposed in CLI/MCP summaries and installable skills, not only generated on disk.
- Validation must fail when a required governance artifact is removed.
- Scope-level tests must prove at least one negative path, not just happy-path artifact presence.

Scope 13 convergence review:

- All 11 forbidden behaviors are represented exactly.
- All six acceptance criteria are represented exactly.
- Weak prompts stop at clarification and do not emit canonical implementation artifacts.
- One-question clarification remains enforced.
- Marker-only tests are blocked by the test-quality contract.
- Implementation drift creates repair tasks and blocks completion until the repair queue is clean.
- QA cannot pass without tracing Playwright evidence.
- Full repository test suite passes with Scope 13 wired into package generation, validation, docs, plugins, install, and summaries.

Current answer for Scope 13:

```txt
I do not know how to implement this scope better within Scope 13 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 13 in the current implementation.
```

## Scope 14 - Marketing Dashboard Replay

Source node:

- `obsidian-vault/11 Hardened Lifecycle Scopes/Scope 14 - Marketing Dashboard Replay.md`

Exact requirement extracted:

- The prompt `/archetype "I want to build an admin dashboard for a marketing team"` must produce `ready_for_clarification`.
- Confirmed facts are only product surface `admin dashboard` and domain hint `marketing`.
- Primary user, must-have workflows, target repo/stack, mock/API/backend boundary, design direction or permission, Playwright/test permission, and assumption approval remain blockers.
- The correct next question is exactly `Who is the primary user of this marketing admin dashboard?`
- The regression cannot emit a canonical spec, tests, or implementation instructions.

Mismatches found before implementation:

- The context gate treated generic dashboard/build/campaign language as enough to confirm `must_have_flows`.
- The lifecycle already stopped weak prompts, but the marketing dashboard regression was not encoded as a named contract case.
- Golden examples did not include the exact user-reported prompt, so future drift could reintroduce the failure.

Corrections applied:

- Tightened `src/modules/contextGate.ts` so generic product-surface words do not confirm workflows.
- Added `src/modules/marketingDashboardReplay.ts` as the exact HL-14 regression source of truth.
- Added `examples/vague-marketing-dashboard-intake.json`.
- Added `scripts/run-marketing-dashboard-replay-contract.mjs`.
- Wired `marketing-replay:contract` into `npm test`, `npm run check`, cleanup, distribution, install, plugin-install, and README development commands.
- Updated distribution/install/plugin-install contract assertions so the replay contract ships with the package.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run marketing-replay:contract`: pass.
- `node scripts/run-lifecycle-contract.mjs`: pass after shared build.
- `node scripts/run-clarification-ux-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-intake-states-contract.mjs`: pass after shared build.
- `node scripts/run-context-readiness-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass after shared build.
- `node scripts/run-plugin-install-contract.mjs`: pass after shared build.
- `node scripts/run-install-contract.mjs`: pass after shared build.
- `node scripts/run-golden.mjs`: pass after shared build.
- `npm test`: pass end to end.

Mismatches found during verification:

- Running install/plugin packaging contracts in parallel with golden examples can create a false failure because those contracts rebuild and clean `dist` while golden reads it.
- The marketing replay summary has seven named HL-14 missing blockers while the generated package can report an additional derived blocker; the contract should assert the exact HL-14 blockers individually instead of depending on a fragile total count.

Corrections applied during verification:

- Re-ran packaging and golden verification serially.
- Kept the replay contract focused on exact blocker presence, exact next question, forbidden output absence, and readiness tier rather than a brittle package-wide blocker count.

Self-healing rules added:

- User-reported lifecycle failures become named regression contracts, not just generalized examples.
- Product-surface nouns like `dashboard` are not workflow evidence by themselves.
- Generated-golden checks must not run concurrently with contracts that clean or rebuild `dist`.
- Scope replay contracts should forbid the dangerous downstream artifacts explicitly when the expected state is clarification.

Scope 14 convergence review:

- The weak marketing dashboard prompt now produces `ready_for_clarification`.
- The next question is exactly `Who is the primary user of this marketing admin dashboard?`
- Primary users, workflows, stack, boundary, design direction, test permission, and assumption approval remain missing.
- Canonical spec, tests, implementation rules, AGENTS/CLAUDE instructions, and implementation contracts are absent for the replay.
- Full repository test suite passes with the replay wired into package generation, distribution, install, plugins, and golden examples.

Current answer for Scope 14:

```txt
I do not know how to implement this scope better within Scope 14 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 14 in the current implementation.
```

## Scope 15 - Implementation Phases

Source node:

- `obsidian-vault/11 Hardened Lifecycle Scopes/Scope 15 - Implementation Phases.md`

Exact requirement extracted:

- Define phase sequencing after the plan is approved.
- The seven phases are Gate Model, One-Question Clarification UX, Candidate vs Canonical Contracts, Specialist Skills And Agent Roles, Test And QA Hardening, Verification And Drift Enforcement, and Regression Fixtures.
- Phase 1 priority is that `needs_clarification` blocks implementation readiness.
- Exit condition: each phase has tests and a lifecycle acceptance gate.

Mismatches found before implementation:

- The repo had readiness tiers and execution states, but no single HL-15 artifact naming the seven phases as a sequence.
- Tests and lifecycle gates existed in separate contracts, but they were not mapped phase-by-phase.
- Generated packages did not expose an implementation-phase entrypoint for agents.
- Validators could not fail a package that omitted phase sequencing.

Corrections applied:

- Added `src/modules/implementationPhases.ts` with exact HL-15 phase names, contract tests, required artifacts, lifecycle acceptance gates, and the phase 1 implementation-readiness gate.
- Exported `lifecycle/implementation-phases.json` and `lifecycle/implementation-phases.md` from clarification, draft, and canonical packages.
- Added the implementation phases artifact to top-level manifests, draft internal manifests, canonical artifact index, CLI/MCP summaries, README, lifecycle docs, Codex/Claude usage docs, front-door skills, implementation skills, and contract-verifier role inputs.
- Added `scripts/run-implementation-phases-contract.mjs`.
- Wired `implementation-phases:contract` into `npm test`, `npm run check`, cleanup, distribution, install, and plugin-install package checks.
- Added `lifecycle/implementation-phases.json` and `lifecycle/implementation-phases.md` to the required complete package artifact set.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run implementation-phases:contract`: pass.
- `node scripts/run-cli-contract.mjs`: pass after shared build.
- `node scripts/run-mcp-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-contract.mjs`: pass after shared build.
- `node scripts/run-context-readiness-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-execution-states-contract.mjs`: pass after shared build.
- `node scripts/run-marketing-dashboard-replay-contract.mjs`: pass after shared build.
- `node scripts/run-required-package-artifacts-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass after README correction.
- `node scripts/run-plugin-install-contract.mjs`: pass after shared build.
- `node scripts/run-install-contract.mjs`: pass after shared build.
- `node scripts/run-golden.mjs`: pass after shared build.
- `npm test`: pass end to end.

Mismatches found during verification:

- The first implementation-phases contract assumed the CLI response would label an approved package as `canonical`; the real invariant is `ready_for_implementation`, `readyForFrontendAgent: true`, and canonical spec artifacts present.
- The canonical internal manifest artifact index did not include the new lifecycle phase files until `ARTIFACT_INDEX` was updated.
- The README did not initially mention `lifecycle/implementation-phases.json`, and the distribution contract correctly rejected that omission.
- The required package artifacts contract had a local static list that needed the new HL-15 artifacts in addition to the source constant.

Corrections applied during verification:

- Updated the Scope 15 contract to assert real canonical surface and readiness invariants instead of a brittle package label.
- Added `lifecycle/implementation-phases.json` and `lifecycle/implementation-phases.md` to the canonical artifact index.
- Updated README package-surface documentation.
- Updated `scripts/run-required-package-artifacts-contract.mjs` to require and summarize the new artifacts.

Self-healing rules added:

- A lifecycle phase is not encoded unless it names both contract tests and a lifecycle acceptance gate.
- New lifecycle artifacts must appear in clarification, draft, and canonical packages when they govern all package states.
- New required canonical artifacts must be in source constants, validation logic, the top-level manifest, the internal manifest artifact index, summarize entrypoints, docs, and package/install contracts.
- Contract tests should assert durable lifecycle invariants, not incidental CLI labels.
- Distribution docs must mention every new first-class agent entrypoint.

Scope 15 convergence review:

- The exact seven HL-15 phases are encoded in order.
- Each phase has at least one contract test and a lifecycle acceptance gate with required artifacts.
- Weak marketing dashboard replay has implementation readiness blocked by `context_status is needs_clarification`.
- Draft packages block implementation readiness until human approval and implementation authorization.
- Approved canonical packages satisfy the implementation readiness gate.
- Validation fails if `lifecycle/implementation-phases.json` is removed from a complete package.
- Full repository test suite passes with Scope 15 wired into package generation, validation, docs, summaries, distribution, install, plugins, and golden examples.

Current answer for Scope 15:

```txt
I do not know how to implement this scope better within Scope 15 without importing later-scope requirements.
I cannot identify a technical or architectural mismatch against Scope 15 in the current implementation.
```

## Scope 16 - Convergence Standard

Source node:

- `obsidian-vault/11 Hardened Lifecycle Scopes/Scope 16 - Convergence Standard.md`

Exact requirement extracted:

- Define when the lifecycle is hardened enough.
- The lifecycle is acceptable only when Archetype cannot answer yes to these five questions:
  - `Can weak context still produce code?`
  - `Can inferred scope become canonical without approval?`
  - `Can tests pass while proving only generated markers?`
  - `Can QA pass without Playwright evidence?`
  - `Can completion happen with unresolved repair tasks?`
- The required answer is exactly `No.`
- Exit condition: all convergence questions answer no through automated and documented evidence.

Mismatches found before implementation:

- The repo had separate contracts for context gating, approval, test quality, QA, and repair, but no single HL-16 convergence artifact tying the final five questions together.
- Generated packages did not expose a first-class `governance/convergence-standard.json` or markdown companion for agents to read before implementation and verification.
- Validators could not fail a package where a convergence question drifted to `Yes`.
- Docs, skills, package manifests, install checks, and summarize entrypoints did not make the convergence standard visible as a launch/readiness gate.

Corrections applied:

- Added `src/modules/convergenceStandard.ts` with the exact five HL-16 questions, required answer `No.`, evidence-backed status, automated evidence, documented evidence, lifecycle artifact links, and markdown rendering.
- Exported `governance/convergence-standard.json` and `governance/convergence-standard.md` from clarification, draft, and canonical packages.
- Added the convergence artifacts to package manifests, canonical internal artifact index, required artifact constants, CLI summaries, MCP summaries, README package surfaces, lifecycle docs, Codex/Claude usage docs, front-door skills, implement/verify skills, and contract-verifier role inputs.
- Extended package validation so convergence artifacts must exist, must keep the exact questions in order, must answer `No.`, must contain automated/documented/lifecycle evidence, and must fail if any answer becomes `Yes`.
- Added `scripts/run-convergence-standard-contract.mjs` and wired `convergence:contract` into `npm test`, `npm run check`, cleanup, distribution, install, plugin-install, and required-artifact checks.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run convergence:contract`: pass.
- `node scripts/run-cli-contract.mjs`: pass after shared build.
- `node scripts/run-mcp-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass after shared build.
- `node scripts/run-required-package-artifacts-contract.mjs`: pass after shared build.
- `node scripts/run-lifecycle-contract.mjs`: pass after shared build.
- `node scripts/run-plugin-install-contract.mjs`: pass after shared build.
- `node scripts/run-install-contract.mjs`: pass after shared build.
- `node scripts/run-golden.mjs`: pass after shared build.
- `node scripts/run-lifecycle-contract-states-contract.mjs`: pass when isolated after the first full-suite failure.
- `npm test`: pass end to end on the clean rerun.

Mismatches found during verification:

- The first full `npm test` run failed once during `lifecycle-contract:contract` with `Cannot find module '../llm/promptPacks'` from `dist/modules/llmDecisionLayer.js`.
- Focused reproduction passed, `src/llm/promptPacks.ts` was confirmed tracked and included by `tsconfig.json`, `dist/llm/promptPacks.js` was present in the current build, and the clean full rerun passed end to end.
- No Scope 16 code correction was needed for that transient build-output failure, but future repeats should be treated as a build artifact integrity issue and patched at the build/package boundary.

Corrections applied during verification:

- Re-ran the failing lifecycle contract in isolation to check whether the module failure was persistent.
- Re-ran the full suite serially and allowed the slower repair contract to complete its Playwright-backed verification path.
- Recorded the transient failure as an operational lesson rather than silently ignoring it.

Self-healing rules added:

- Convergence is not a narrative claim; it must be a generated, validated governance artifact.
- Every convergence `No` must include automated evidence, documented evidence, and lifecycle artifact references.
- Validation must fail if any HL-16 question is removed, reordered, answered `Yes`, or left without evidence.
- Weak-context, approval, marker-only-test, Playwright-QA, and unresolved-repair guarantees must remain independently tested and summarized by the convergence artifact.
- If full-suite build output loses a compiled dependency once, rerun the focused contract and full suite; if it repeats, fix the build/package boundary before claiming convergence.

Scope 16 convergence review:

- Weak context cannot produce implementation code; the weak marketing dashboard replay stays in clarification and emits no canonical spec, tests, or frontend-agent instructions.
- Inferred scope cannot become canonical without human approval; draft packages remain `ready_for_contract_approval` and block implementation.
- Marker-only tests cannot pass as sufficient evidence; the test-quality contract rejects generated-marker-only behavior.
- QA cannot pass without Playwright evidence; Playwright verification and QA-team contracts require browser evidence and screenshot-backed scenarios.
- Completion cannot happen with unresolved repair tasks; repair verification moves the lifecycle to `repair_or_revision` on drift and only returns to completion after the queue is clean.
- Full repository test suite passes with Scope 16 wired into package generation, validation, docs, summaries, distribution, install, plugins, golden examples, QA evidence, repair evidence, and convergence validation.

Current answer for Scope 16:

```txt
I do not know how to implement this scope better within Scope 16 without importing requirements outside the hardened lifecycle scope set.
I cannot identify a technical or architectural mismatch against Scope 16 in the current implementation.
```

## Scope 17 - Draft Design System Preview

Source node:

- `obsidian-vault/11 Hardened Lifecycle Scopes/Scope 17 - Draft Design System Preview.md`

Exact requirement extracted:

- Draft design systems must be reviewable in a browser before they can become canonical.
- Required artifacts are `draft/design-system.draft.json`, `draft/design-system-preview.html`, and `draft/design-system-review.md`.
- The preview HTML is a static human review projection of the draft JSON.
- The preview HTML is not app implementation and not the source of truth.
- Every visible preview section traces back to `draft/design-system.draft.json`.
- The preview includes colors, typography, component examples, component states, token tables, patterns, and accessibility review data.
- Users can ask questions or request changes before approval.
- Ambiguous design feedback returns to one clarification question.
- Archetype revises the draft JSON first, then regenerates the preview.
- Canonical design-system generation remains blocked until human approval.

Mismatches found before implementation:

- Draft packages exposed `draft/design-system.draft.json`, but users had no browser-viewable design-system review artifact.
- Draft review instructions asked users to read structured JSON rather than inspect colors, typography, states, and components visually.
- Validation could not fail a draft package that lacked a human-readable design preview.
- Agent skills and docs did not tell Codex or Claude Code to surface a design-system preview before asking for approval.

Corrections applied:

- Added `src/modules/designSystemPreview.ts` to render `draft/design-system-preview.html` and `draft/design-system-review.md` from the draft design-system JSON.
- Exported the preview and review artifacts from draft packages and approved complete packages.
- Added both artifacts to manifests, canonical artifact index, CLI/MCP summarize entrypoints, required complete package artifacts, docs, quickstart, MCP usage docs, Codex/Claude usage docs, front-door skills, and Claude slash-command behavior.
- Extended validation so missing preview/review artifacts fail, preview traceability to `draft/design-system.draft.json` is required, and script-bearing preview HTML is rejected.
- Added `scripts/run-design-system-preview-contract.mjs` and wired `design-preview:contract` into `npm test`, `npm run check`, cleanup, distribution, install, plugin-install, CLI, MCP, required-artifact, and lifecycle contract checks.
- Added the new Obsidian scope node and linked it from lifecycle maps.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run design-preview:contract`: pass.
- `node scripts/run-lifecycle-contract-states-contract.mjs`: pass after shared build.
- `node scripts/run-cli-contract.mjs`: pass after shared build.
- `node scripts/run-mcp-contract.mjs`: pass after shared build.
- `node scripts/run-required-package-artifacts-contract.mjs`: pass after shared build.
- `node scripts/run-distribution-contract.mjs`: pass.
- `node scripts/run-codex-plugin-contract.mjs`: pass.
- `node scripts/run-claude-plugin-contract.mjs`: pass.
- `npm run plugin-install:contract`: pass.
- `npm run install:contract`: pass.
- `npm run golden`: pass.
- `npm test`: pass end to end.

Mismatches found during verification:

- Complete-package summarize entrypoints originally exposed the preview only for draft packages. The required-artifacts contract needed complete packages to expose the retained draft preview too.
- The install and plugin-install contracts needed the new design preview contract script in their packed package assertions.

Corrections applied during verification:

- Added `draft/design-system-preview.html` and `draft/design-system-review.md` to complete-package summarize entrypoints.
- Added `scripts/run-design-system-preview-contract.mjs` to install and plugin-install packed package assertions.
- Added the preview and review artifacts to the complete package required artifact set.

Self-healing rules added:

- Browser-viewable draft previews must be generated from structured draft artifacts, not hand-authored as parallel truth.
- Preview HTML must be static, script-free, and traceable to the source draft JSON.
- A design preview can support human approval, but it can never authorize implementation by itself.
- Any requested design change revises `draft/design-system.draft.json` first, then regenerates the preview.
- If a user request about the preview is ambiguous, return to one clarification question before revising.

Scope 17 convergence review:

- Draft packages now include `draft/design-system-preview.html` and `draft/design-system-review.md`.
- Complete packages retain those artifacts for approval traceability.
- The preview exposes colors, typography, components, states, tokens, patterns, accessibility data, and full draft JSON details.
- Validation fails when preview traceability is broken or the preview is missing.
- Docs and skills tell agents to surface the preview for browser review before approval.
- Full repository test suite passes with Scope 17 wired into generation, validation, summaries, distribution, install, plugins, required artifacts, and golden examples.

Current answer for Scope 17:

```txt
I do not know how to implement this scope better within Scope 17 without turning the review artifact into product implementation, which would violate the harness boundary.
I cannot identify a technical or architectural mismatch against Scope 17 in the current implementation.
```

## Agent Hardening - Frontend Architect

Source files:

- `agents/frontend-architect.md`
- `plugins/claude-code/agents/frontend-architect.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Mismatches found before hardening:

- The frontend architect role named routing, components, state, and manifests, but did not define a full production role, mission, operating procedure, sufficiency gate, output schema, or self-review checklist.
- The role referenced stale `12-target-frontend/file-manifest.json` instead of the actual generated `12-target-frontend/source-file-manifest.json`.
- The role did not force architecture to be based on a human-approved canonical contract before implementation.
- The role did not treat `12-target-frontend/source-file-manifest.json`, `12-target-frontend/route-component-map.json`, `12-target-frontend/codegen-tasks.json`, and `12-target-frontend/adapter-interfaces.ts` as mandatory source architecture.
- The role did not explicitly enforce test-first ordering before product UI.
- The role did not distinguish fixture adapters from production backend, auth, and copy integration.
- The role was not mechanically contract-tested beyond generic section presence.

Corrections applied:

- Rewrote the frontend architect as a target frontend architecture specialist and source-manifest gatekeeper.
- Added role boundaries, mission, production standard, operating procedure, frontend architecture sufficiency gate, one-question clarification order, output schema, target source contract, test-first integration, production integration boundary, good/bad output signals, blockers, handoff rules, and self-review checklist.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added root and Claude plugin contract assertions for the hardened frontend architect requirements.

Self-healing rules added:

- Frontend architecture is not production-grade unless it reads the generated `12-target-frontend` source artifacts, not memory or stale names.
- `source-file-manifest.json`, `route-component-map.json`, `codegen-tasks.json`, and `adapter-interfaces.ts` are the minimum target source architecture set.
- The frontend architect must block implementation when human approval is missing, when source file ownership is ambiguous, or when adapter boundaries require invented backend/auth behavior.
- Test creation must precede product UI in the architecture handoff; a role file that omits this is not hardened.
- Fixture adapters are local proof scaffolding only and cannot be described as production integration.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The frontend architect now has enough role detail to produce deterministic architecture handoffs from approved Archetype artifacts.
- The role blocks weak approval, stale manifests, missing route-component maps, missing codegen ordering, missing adapters, missing state mappings, and test-first bypasses.
- The role explicitly hands off TypeScript, design-system, accessibility, QA, verification, and repair risks instead of self-approving.
- Contract tests now fail if the hardened frontend architect responsibilities are removed from root or Claude plugin agent files.

Current answer for frontend architect hardening:

```txt
I do not know how to make the frontend architect role more deterministic without importing requirements outside the approved Archetype package and current hardened lifecycle.
I cannot identify a technical or architectural mismatch against the frontend architect hardening goal in the current role file.
```

## Agent Hardening - Design System Architect

Source files:

- `agents/design-system-architect.md`
- `plugins/claude-code/agents/design-system-architect.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Mismatches found before hardening:

- The design-system architect role listed tokens, typography, components, states, and polish blockers, but did not define a production-grade role, mission, operating procedure, sufficiency gate, output schema, or self-review checklist.
- The role referenced legacy `design-system/*` paths but did not require the canonical `04-design-system/*` artifact set.
- The role did not distinguish `draft/design-system-preview.html` as a human review projection from canonical implementation authority.
- The role did not require token layers, CSS variables, Tailwind token mapping, shadcn/Radix constraints, or WCAG AA accessibility rules.
- The role did not mechanically enforce that component contracts include props, slots, variants, states, events, tokens, accessibility, data behavior, and tests.
- The role was not contract-tested beyond generic role sections.

Corrections applied:

- Rewrote the role as a design-system contract specialist and token/component gatekeeper.
- Added draft preview review rules, canonical artifact requirements, token-layer validation, typography validation, component contract validation, pattern contract validation, shadcn/Radix/Tailwind rules, accessibility gates, responsive density checks, and handoff requirements.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened design-system architect requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- A design-system role is not hardened unless it separates draft preview review from canonical implementation authority.
- `draft/design-system-preview.html` can support human review but cannot authorize product UI implementation.
- Canonical design-system review must use the `04-design-system/*` artifacts, especially token contracts, typography system, component contracts, pattern contracts, accessibility rules, CSS variables, and Tailwind token mapping.
- shadcn, Radix, and Tailwind are implementation tools, not design authority.
- Component contracts must include props, slots, variants, states, events, tokens, accessibility, data, tests, and forbidden usage.
- WCAG AA, visible focus, keyboard behavior, labels, status text, reduced motion, and chart fallback are design-system blockers when missing.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The design-system architect now has enough role detail to produce deterministic design-system handoffs from approved Archetype artifacts.
- The role blocks weak visual direction, missing draft preview traceability, missing token layers, tokenless styling, missing component states, shadcn default drift, raw Tailwind drift, and accessibility gaps.
- The role explicitly hands off frontend architecture, pixel-perfect, accessibility, strict typing, QA, and contract verification risks instead of self-approving.
- Contract tests now fail if the hardened design-system architect responsibilities are removed from root or Claude plugin agent files.

Current answer for design-system architect hardening:

```txt
I do not know how to make the design-system architect role more deterministic without importing requirements outside the approved Archetype package and current hardened lifecycle.
I cannot identify a technical or architectural mismatch against the design-system architect hardening goal in the current role file.
```

## Agent Hardening - Frontend Practice Enforcer

Source files:

- `agents/frontend-practice-enforcer.md`
- `plugins/claude-code/agents/frontend-practice-enforcer.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Mismatches found before hardening:

- The frontend practice enforcer listed the 11 HL-08 practices but did not define a full role, mission, operating procedure, enforcement gate, output schema, evidence rules, or self-review checklist.
- The role did not require every individual `specialist-gate/frontend-practices/*.json` artifact.
- The role did not explain how to block implementation when practice checks are missing, prose-only, failed, or self-approved.
- The role did not distinguish artifact-backed pass/fail evidence from generic best-practice recommendations.
- The role did not explicitly reject marker-only tests, missing browser evidence, or tests that fail to assert user-visible behavior.
- The role was not contract-tested beyond generic required sections.

Corrections applied:

- Rewrote the role as a frontend quality gate specialist and pass/fail practice enforcer.
- Added required artifact lists, required fields per practice, practice-specific enforcement matrix, evidence rules, one-question clarification priority, output schema, decision rules, handoff rules, and self-review checklist.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened frontend practice enforcer requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- Frontend practices are not optional recommendations; they are pass/fail checks in the specialist gate.
- A practice is not real unless it has an owner, lifecycle gates, input artifacts, blocker list, output artifact, status, and enforcement rule.
- `draft/specialist-review.json` must include `frontend_practice_gate` with every required practice.
- Missing individual practice artifacts must block validation even when the master artifact exists.
- Marker-only tests are traceability aids, not evidence of user-visible correctness.
- Practice failures must route to owners and remain blockers until repaired or explicitly revised in the contract.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The frontend practice enforcer now has enough role detail to enforce HL-08 deterministically.
- The role blocks missing practices, prose-only findings, missing output artifacts, weak evidence, marker-only tests, self-approval, and implementation before gate completion.
- The role maps each practice to its specialist ownership and repair path.
- Contract tests now fail if the hardened frontend practice enforcer responsibilities are removed from root or Claude plugin agent files.

Current answer for frontend practice enforcer hardening:

```txt
I do not know how to make the frontend practice enforcer role more deterministic without importing requirements outside HL-08 and the approved Archetype package.
I cannot identify a technical or architectural mismatch against the frontend practice enforcer hardening goal in the current role file.
```

## Agent Hardening - Strict TypeScript Developer

Source files:

- `agents/strict-typescript-developer.md`
- `plugins/claude-code/agents/strict-typescript-developer.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Mismatches found before hardening:

- The strict TypeScript role mentioned `any`, typecheck, and props, but did not define a full role, production standard, operating procedure, type-safety gate, output schema, required type contract, adapter/state union rules, or self-review checklist.
- The role used legacy paths such as `frontend-agent-contract/implementation-rules.json`, `data-contracts/*.json`, and `forms/*.json` instead of the canonical `06-frontend-agent-contract/*` and `12-target-frontend/*` artifacts.
- The role did not require `12-target-frontend/adapter-interfaces.ts`, finite state unions, adapter return types, target `tsconfig.json`, or `14-target-execution/target-execution-report.json`.
- The role did not distinguish safe boundary `unknown` from unsafe un-narrowed values.
- The role did not turn strictness failures into repair tasks with rerun commands.
- The role was not contract-tested beyond generic required sections.

Corrections applied:

- Rewrote the role as a strict TypeScript implementation specialist and contract-typing gatekeeper.
- Added strict compiler policy, canonical inputs, state union requirements, adapter typing rules, data/action/form/component/pattern typing rules, external value narrowing, typecheck evidence, repair rules, output schema, handoff rules, and self-review checklist.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened strict TypeScript requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- `strict: true` and target typecheck evidence are required before completion can be claimed.
- `12-target-frontend/adapter-interfaces.ts` is the type authority for generated data and auth adapters.
- Query and mutation states must remain finite unions, not arbitrary strings.
- `unknown` is allowed only at external boundaries and must be narrowed before use.
- Broad `any`, unsafe casts, unchecked JSON, broad index signatures, disabled strictness, and failed typecheck are blockers.
- Type failures must become repair tasks with file, contract, unsafe pattern, and rerun command.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The strict TypeScript developer now has enough role detail to enforce contract-derived typing deterministically.
- The role blocks disabled strictness, missing adapter interfaces, invalid state unions, untyped contract surfaces, unsafe external values, broad `any`, unsafe casts, missing validation, and failed typecheck evidence.
- The role explicitly hands off data model, component API, validation, accessibility typing, and repair sequencing risks instead of self-approving.
- Contract tests now fail if the hardened strict TypeScript responsibilities are removed from root or Claude plugin agent files.

Current answer for strict TypeScript developer hardening:

```txt
I do not know how to make the strict TypeScript developer role more deterministic without importing requirements outside the approved Archetype package and target repository type evidence.
I cannot identify a technical or architectural mismatch against the strict TypeScript developer hardening goal in the current role file.
```

## Agent Hardening - Accessibility Specialist

Source files:

- `agents/accessibility-specialist.md`
- `plugins/claude-code/agents/accessibility-specialist.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Browser research anchors:

- W3C WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices Guide patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- MDN ARIA reference: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA

Mismatches found before hardening:

- The accessibility role mentioned keyboard, focus, labels, contrast, and evidence, but did not define a full role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, repair format, or self-review checklist.
- The role used legacy artifact paths such as `screens/screen-inventory.json` and `design-system/component-contracts.json` instead of canonical `03-experience-architecture/*`, `04-design-system/*`, `05-screen-specs/*`, and `06-frontend-agent-contract/*` artifacts.
- The role did not require test-first accessibility obligations, Playwright accessibility scenario coverage, QA accessibility reports, or human review boundaries.
- The role did not explicitly enforce native semantics before ARIA, ARIA pattern correctness, landmarks, heading order, focus restoration, status announcements, reduced motion, chart fallback, or color-not-sole-indicator rules.
- The role did not turn accessibility failures into deterministic repair tasks.
- The role was not contract-tested beyond generic required sections.

Corrections applied:

- Rewrote the role as an accessibility contract specialist and WCAG AA evidence gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, accessibility sufficiency gate, one-question clarification priority, output schema, decision rules, evidence contract, accessibility matrix, repair handoff format, external practice anchors, good/bad output signals, and self-review checklist.
- Required evidence from `04-design-system/accessibility/accessibility-rules.json`, `test-first/test-first-contract.json`, `verification/playwright-verification-contract.json`, `verification/playwright-evidence.json`, `specialist-gate/frontend-practices/accessibility-practices.json`, `qa/accessibility-results.md`, `qa/scenario-catalog.json`, and `08-quality/accessibility-report.md`.
- Added statuses: `ready_for_accessibility_verification`, `needs_accessibility_repair`, and `blocked_missing_accessibility_evidence`.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened accessibility specialist requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- Accessibility claims are invalid without route, screen, state, component, test, and evidence references.
- Prefer native semantics before ARIA; ARIA without matching keyboard and focus behavior is a blocker.
- Automated checks are evidence, not compliance certification. Qualified human review remains required before legal or compliance claims.
- Accessibility must be present in design-system contracts, screen specs, test-first suites, Playwright verification, QA reports, and repair queues.
- Marker-only accessibility tests do not prove accessible user-visible behavior.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The accessibility specialist now has enough role detail to enforce accessibility deterministically across contracts, tests, QA evidence, and repair planning.
- The role blocks missing names, missing labels, invalid semantics, broken keyboard paths, missing focus, inaccessible forms, color-only status, missing chart fallback, reduced-motion gaps, ARIA misuse, and unsupported compliance claims.
- The role explicitly hands off design-system, visual, test-first, QA, repair, and verification concerns instead of self-approving.
- Contract tests now fail if the hardened accessibility responsibilities are removed from root or Claude plugin agent files.

Current answer for accessibility specialist hardening:

```txt
I do not know how to make the accessibility specialist role more deterministic without importing requirements outside WCAG AA, WAI-ARIA pattern guidance, the approved Archetype package, and target accessibility evidence.
I cannot identify a technical or architectural mismatch against the accessibility specialist hardening goal in the current role file.
```

## Agent Hardening - Test First Developer

Source files:

- `agents/test-first-developer.md`
- `plugins/claude-code/agents/test-first-developer.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Browser research anchors:

- Playwright best practices: https://playwright.dev/docs/best-practices
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- Vitest guide: https://vitest.dev/guide/

Mismatches found before hardening:

- The role mentioned smoke, E2E, UI, accessibility, integration, and unit tests, but did not define a full role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, suite matrix, forbidden patterns, required behavior checklist, or self-review checklist.
- The role used legacy paths such as `experience/route-map.json`, `screens/screen-inventory.json`, and `frontend-agent-contract/verification-contracts.json` instead of canonical `03-experience-architecture/*`, `05-screen-specs/*`, `06-frontend-agent-contract/*`, and `12-target-frontend/*` artifacts.
- The role did not require `test-first/test-quality-standard.json`, generated Playwright and Vitest templates, target test files, `test-results/initial-red-test-run.md`, or red-to-green evidence integrity.
- The role did not explicitly block marker-only tests, static contract-array tests, generic success-panel tests, screenshot-byte-size tests, skipped tests, or weakened tests.
- The role did not define how to distinguish meaningful red failures from broken test setup.
- The role was not contract-tested beyond generic required sections.

Corrections applied:

- Rewrote the role as a test-first implementation specialist and red-green evidence gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, sufficiency gate, one-question clarification priority, output schema, decision rules, evidence contract, suite matrix, forbidden test patterns, required behavior checklist, external practice anchors, good/bad output signals, and self-review checklist.
- Required six suites: `smoke`, `e2e`, `ui`, `accessibility`, `integration`, and `unit`.
- Required target files for route smoke, user flows, screen states, accessibility, integration contracts, and component/unit contracts.
- Required evidence from `test-first/test-first-contract.json`, `test-first/test-quality-standard.json`, `test-first/playwright-contract.spec.ts`, `test-first/vitest-contract.spec.ts`, `test-results/initial-red-test-run.md`, `verification/playwright-verification-contract.json`, `verification/playwright-evidence.json`, `12-target-frontend/source-file-manifest.json`, `12-target-frontend/codegen-tasks.json`, `14-target-execution/target-execution-report.json`, `qa/scenario-catalog.json`, and `10-revision/repair-task-queue.json`.
- Added statuses: `ready_for_implementation_after_red`, `needs_test_repair`, and `blocked_untestable_contract`.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened test-first developer requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- Implementation cannot start until target tests exist and initial red evidence is captured.
- A red phase is valid only when failures prove missing or incomplete implementation, not broken setup or disconnected tests.
- Marker-only tests, generic success-panel tests, static contract-array tests, screenshot-byte-size tests, skipped tests, and weakened tests are blockers.
- Playwright tests should prefer user-visible behavior, roles, names, state fixtures, keyboard, status, viewport, screenshot, and route/deep-link evidence.
- Vitest tests should exercise target behavior or fail meaningfully until target behavior exists.
- Every hardened role upgrade must be mirrored into plugin surfaces and pinned by contract tests.

Agent hardening convergence review:

- The test-first developer now has enough role detail to enforce TDD deterministically before implementation.
- The role blocks missing tests, missing initial red evidence, missing suite coverage, marker-only tests, behaviorless unit/integration tests, untestable contract gaps, skipped tests, and test weakening.
- The role explicitly hands off contract gaps, accessibility test gaps, visual evidence gaps, implementation failures, QA failures, repair planning, and final verification instead of self-approving.
- Contract tests now fail if the hardened test-first responsibilities are removed from root or Claude plugin agent files.

Current answer for test-first developer hardening:

```txt
I do not know how to make the test-first developer role more deterministic without importing requirements outside the approved Archetype package, target repository test evidence, and browser/user-facing testing best practices.
I cannot identify a technical or architectural mismatch against the test-first developer hardening goal in the current role file.
```

## Agent Hardening - Contract Verifier

Source files:

- `agents/contract-verifier.md`
- `plugins/claude-code/agents/contract-verifier.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Browser research anchors:

- Playwright reporters: https://playwright.dev/docs/test-reporters
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer-intro
- Specification by Example: https://martinfowler.com/bliki/SpecificationByExample.html

Mismatches found before hardening:

- The verifier role was a thin checklist and did not define a full role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, reconciliation matrix, or self-review loop.
- The Claude Code plugin copy remained a weaker stub, so the installable plugin could ship a lower-grade verifier than the root repository.
- The role did not explicitly compute `ready_for_completion` from approval, target execution, Playwright evidence, repair status, and lifecycle state.
- The role did not expose deterministic blocked statuses for missing evidence, inconsistent evidence, unresolved repair, unapproved implementation, or repair/revision needs.
- The role did not pin target execution, QA reports, final readiness, marker-only test failures, or self-approval checks strongly enough.
- Contract tests only enforced generic agent sections, so verifier-specific regressions would not fail CI.

Corrections applied:

- Rewrote the role as an independent lifecycle verifier and completion-readiness gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, verification sufficiency gate, one-question clarification priority, output schema, decision rules, required verification evidence contract, reconciliation matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Required the verifier to compute completion independently from `lifecycle/approval-decision.json`, `14-target-execution/target-execution-report.json`, `verification/playwright-evidence.json`, `qa/*`, `10-revision/repair-task-queue.json`, and `lifecycle/execution-state.json`.
- Added deterministic statuses: `ready_for_completion`, `blocked_missing_evidence`, `blocked_inconsistent_evidence`, `blocked_unresolved_repair`, `blocked_unapproved_implementation`, and `needs_repair_or_revision`.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened verifier requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- Completion is not a narrative claim; it must be recomputed from lifecycle state, human approval, target execution, Playwright evidence, QA reports, and an empty repair queue.
- Warnings are not readiness and missing evidence is not a soft pass.
- A passing smoke test is not completion.
- A non-empty repair queue blocks completion even when other checks pass.
- Contract revision cannot be used to hide implementation drift; repair comes first unless user-approved source evidence proves the contract changed.
- The installable plugin mirror must be verified against the same hardened requirements as the root agent file.

Agent hardening convergence review:

- The contract verifier now has enough role detail to act as an independent final gate for package readiness.
- The role blocks missing validation, missing human approval, agent self-approval, target execution failure, Playwright failure, QA contradictions, marker-only tests, unresolved repair tasks, and lifecycle state drift.
- The role explicitly hands off test gaps, accessibility gaps, visual gaps, implementation failures, repair work, and unapproved contract changes to the right owners.
- Contract tests now fail if the hardened verifier responsibilities are removed from root or Claude plugin agent files.

Current answer for contract verifier hardening:

```txt
I do not know how to make the contract verifier role more deterministic without importing requirements outside the approved Archetype lifecycle artifacts, target execution evidence, Playwright/QA reports, and human approval evidence.
I cannot identify a technical or architectural mismatch against the contract verifier hardening goal in the current role file.
```

## Agent Hardening - Repair Planner

Source files:

- `agents/repair-planner.md`
- `plugins/claude-code/agents/repair-planner.md`
- `scripts/run-agent-role-files-contract.mjs`
- `scripts/run-claude-plugin-contract.mjs`

Browser research anchors:

- Playwright debugging: https://playwright.dev/docs/debug
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer-intro
- Playwright reporters: https://playwright.dev/docs/test-reporters
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- Specification by Example: https://martinfowler.com/bliki/SpecificationByExample.html

Mismatches found before hardening:

- The repair planner role was a thin task-list stub and did not define a role, mission, production standard, operating procedure, repair sufficiency gate, output schema, task contract, priority matrix, owner matrix, or self-review loop.
- The role did not require preservation of failing Playwright results, traces, screenshots, reports, command logs, or QA evidence.
- The role did not distinguish `implementation_patch`, `test_repair`, `qa_repair`, `contract_revision_review`, and `blocked_missing_evidence`.
- The role did not require closure evidence, forbidden fixes, stable owners, target files, rerun commands, or patch-first ordering for each task.
- The role did not define when contract revision is allowed, so a repair loop could still rewrite the contract to hide implementation drift.
- Contract tests only enforced generic role sections, so repair-planner-specific regressions could ship in the plugin.

Corrections applied:

- Rewrote the role as an implementation repair coordinator and drift-to-task gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, repair sufficiency gate, one-question clarification priority, output schema, decision rules, required task contract, priority matrix, owner matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Required tasks to include `task_id`, `priority`, `severity`, `owner`, `source`, `classification`, `action_type`, `summary`, `evidence`, `source_artifacts`, `target_files`, `expected_fix`, `forbidden_fixes`, `rerun_commands`, and `closure_evidence`.
- Added deterministic statuses: `ready_for_repair_execution`, `needs_repair_execution`, `ready_for_reverification`, `blocked_missing_repair_evidence`, and `blocked_contract_revision_without_approval`.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened repair planner requirements in both root agent and Claude plugin checks.

Self-healing rules added:

- Repair planning must preserve failing evidence until the same check passes.
- Failed implementation defaults to `implementation_patch`; `contract_revision_review` requires user-approved source evidence.
- A repair task without source artifacts, target files, expected fix, rerun commands, and closure evidence is not actionable.
- Install, typecheck, and build failures must be fixed before relying on browser scenario evidence.
- A non-empty repair queue blocks completion even when tasks have been assigned.
- Plugin mirrors must carry the same hardened repair role as the root repository.

Agent hardening convergence review:

- The repair planner now has enough role detail to convert verification failure into deterministic patch work.
- The role blocks missing evidence, stale lifecycle state, unowned tasks, unlocalized tasks, missing closure criteria, test weakening, contract revision without approval, and completion with unresolved work.
- The role explicitly hands off type, architecture, visual, accessibility, test, QA, revision, and verification concerns to the correct owners instead of self-approving.
- Contract tests now fail if the hardened repair planning responsibilities are removed from root or Claude plugin agent files.

Current answer for repair planner hardening:

```txt
I do not know how to make the repair planner role more deterministic without importing requirements outside the approved Archetype lifecycle artifacts, target execution evidence, Playwright/QA reports, repair artifacts, and human-approved contract revision evidence.
I cannot identify a technical or architectural mismatch against the repair planner hardening goal in the current role file.
```

## Agent Hardening - QA Lead

Source files:

- `agents/qa-lead.md`
- `plugins/claude-code/agents/qa-lead.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- Playwright best practices: https://playwright.dev/docs/best-practices
- Playwright reporters: https://playwright.dev/docs/test-reporters
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer-intro
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- W3C accessibility evaluation overview: https://www.w3.org/WAI/test-evaluate/

Mismatches found before hardening:

- The QA lead role coordinated QA specialists, but did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, artifact contract, specialist assignment matrix, or self-review loop.
- The role did not require scenario family coverage for route, screen state, flow, responsive, accessibility, visual-smoke, and malformed-data obligations.
- The role did not reconcile Playwright results, Playwright evidence, target execution, specialist reports, contract drift, and repair queue status as one evidence system.
- The role did not define stale or contradictory QA evidence as a blocker.
- The role did not preserve the accessibility boundary that automated evidence is not qualified human compliance review.
- Contract tests only checked generic QA role sections and mirroring, so QA-lead-specific responsibilities could regress.

Corrections applied:

- Rewrote the role as a QA orchestration specialist and evidence-coverage gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, QA sufficiency gate, one-question clarification priority, output schema, decision rules, required QA artifact contract, specialist assignment matrix, external practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `qa_ready_for_verifier`, `qa_needs_repair`, `qa_blocked_missing_evidence`, `qa_blocked_stale_evidence`, and `qa_warning_named_external_confirmation`.
- Required reconciliation of `qa/scenario-catalog.json`, `qa/playwright-results.json`, `qa/malformed-data-results.json`, `qa/accessibility-results.md`, `qa/visual-regression-report.md`, `qa/contract-drift-report.md`, `10-revision/repair-task-queue.json`, Playwright evidence, and target execution.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened QA lead requirements in the QA team contract.

Self-healing rules added:

- QA status must be computed from artifacts, not narrative summary.
- Missing QA artifacts are blockers.
- Stale or contradictory QA artifacts are blockers.
- Scenario coverage must name owner, source contract, evidence artifact, and status.
- Accessibility automation cannot become a compliance claim without qualified human review.
- Visual QA requires screenshot/browser evidence.
- A non-empty repair queue blocks QA handoff to completion verification.

Agent hardening convergence review:

- The QA lead now has enough role detail to coordinate specialist QA evidence deterministically.
- The role blocks missing reports, stale Playwright/QA contradictions, missing scenario ownership, unresolved repair tasks, marker-only behavior proof, accessibility overclaims, visual proof gaps, and narrative QA confidence.
- The role explicitly hands off Playwright, UI state, malformed data, accessibility, visual, contract drift, repair, and verification concerns to the correct owners.
- QA team contract tests now fail if the hardened QA lead responsibilities are removed from root or Claude plugin agent files.

Current answer for QA lead hardening:

```txt
I do not know how to make the QA lead role more deterministic without importing requirements outside the approved Archetype QA artifacts, target execution evidence, Playwright evidence, repair artifacts, and bounded human-review evidence.
I cannot identify a technical or architectural mismatch against the QA lead hardening goal in the current role file.
```

## Agent Hardening - Playwright E2E Engineer

Source files:

- `agents/playwright-e2e-engineer.md`
- `plugins/claude-code/agents/playwright-e2e-engineer.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- Playwright best practices: https://playwright.dev/docs/best-practices
- Playwright locators: https://playwright.dev/docs/locators
- Playwright reporters: https://playwright.dev/docs/test-reporters
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer-intro
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing

Mismatches found before hardening:

- The Playwright E2E role owned browser evidence but did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, scenario matrix, failure routing matrix, or self-review loop.
- The role did not require reconciliation across contract scenarios, QA catalog, target execution, Playwright evidence, raw JSON results, HTML report, traces, screenshots, and repair queue.
- The role did not explicitly reject marker-only Playwright evidence or screenshot byte-size-only visual proof.
- The role did not define scenario family coverage for route, screen state, flow, responsive, accessibility, and visual-smoke obligations.
- The role did not bound accessibility-smoke as smoke evidence rather than compliance proof.
- Contract tests only checked generic QA role sections and mirroring.

Corrections applied:

- Rewrote the role as a browser verification specialist and Playwright evidence gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, Playwright sufficiency gate, one-question clarification priority, output schema, decision rules, required Playwright evidence contract, scenario family matrix, failure routing matrix, external practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `playwright_ready_for_qa_lead`, `playwright_needs_repair`, `playwright_blocked_missing_evidence`, `playwright_blocked_contract_mismatch`, and `playwright_blocked_marker_only_evidence`.
- Required user-visible behavior evidence, JSON results, HTML reports, traces/failure details, visual-smoke screenshots, and coverage reconciliation.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened Playwright E2E requirements in the QA team contract.

Self-healing rules added:

- A passing Playwright command is not enough without raw JSON, QA status, target execution, and scenario coverage agreement.
- Browser evidence must prove user-visible behavior, not only generated selectors.
- Visual-smoke cannot pass from screenshot byte size alone.
- Accessibility-smoke evidence cannot become a compliance claim.
- Failure triage must preserve raw JSON, report, trace, screenshot, scenario id, route/screen/viewport, owner, and rerun command.

Agent hardening convergence review:

- The Playwright E2E engineer now has enough role detail to verify browser evidence deterministically.
- The role blocks missing raw results, missing reports/traces for failures, scenario count mismatches, missing scenario families, marker-only checks, screenshot-byte-only visual proof, status contradictions, and unresolved Playwright drift.
- The role explicitly hands off state, visual, accessibility, marker-only, status contradiction, and implementation drift to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened Playwright responsibilities are removed from root or Claude plugin agent files.

Current answer for Playwright E2E engineer hardening:

```txt
I do not know how to make the Playwright E2E engineer role more deterministic without importing requirements outside the approved Archetype Playwright contract, target execution evidence, raw browser results, QA artifacts, and repair evidence.
I cannot identify a technical or architectural mismatch against the Playwright E2E engineer hardening goal in the current role file.
```

## Agent Hardening - UI State QA

Source files:

- `agents/ui-state-qa.md`
- `plugins/claude-code/agents/ui-state-qa.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- Playwright best practices: https://playwright.dev/docs/best-practices
- Playwright locators: https://playwright.dev/docs/locators
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- Testing Library query priority: https://testing-library.com/docs/queries/about/#priority
- MDN ARIA status role: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/status_role
- WCAG 2.2 status messages: https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html

Mismatches found before hardening:

- The UI State QA role was a short checklist and did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, state taxonomy, failure routing matrix, or self-review loop.
- The role named loading, empty, error, success, permission, offline, stale, and forced states, but did not cover the canonical Archetype state set: `default`, `loading`, `empty`, `filtered_empty`, `error`, `permission_denied`, `offline`, `partial_data`, `stale_data`, `validation_error`, and `success_confirmation`.
- The role did not require deterministic reachability through `?archetype_state=...`, fixture routes, or documented user triggers.
- The role did not distinguish visible user-facing state content from marker-only proof.
- The role did not require semantic status, alert, error, progress, form association, focus behavior, accessible recovery, or status-message boundaries.
- The role did not reconcile screen specs, UX flow state completeness, test-first UI tests, Playwright screen-state scenarios, QA catalog, accessibility report, visual report, target execution, and repair queue as one evidence system.
- Contract tests only checked generic QA role sections and plugin mirroring.

Corrections applied:

- Rewrote the role as a UI state coverage specialist and forced-state evidence gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, UI state sufficiency gate, one-question clarification priority, output schema, decision rules, required evidence contract, state family matrix, failure routing matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `ui_state_ready_for_qa_lead`, `ui_state_needs_repair`, `ui_state_blocked_missing_evidence`, `ui_state_blocked_unreachable_state`, `ui_state_blocked_marker_only_evidence`, and `ui_state_blocked_accessibility_gap`.
- Required every state finding to include screen, route, state, required source, trigger, visible feedback, status semantics, recovery action, scenario ids, target test file, raw result artifact, screenshot/trace artifact, status, and owner.
- Required UI state evidence to prove visible copy, route orientation, recovery, semantic feedback, state-specific meaning, and target evidence instead of selector-only presence.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened UI State QA requirements in the QA team contract.

Self-healing rules added:

- UI state QA must build its state matrix from artifacts, not memory.
- A state is not verified unless it is both contract-declared and deterministic to reach.
- Selector-only proof is a blocker, not a weak pass.
- Status-like state changes need semantic feedback that assistive technology can announce without an unnecessary focus change.
- Recovery states without visible next steps remain repair tasks.
- Empty, filtered-empty, error, permission, offline, partial, stale, validation, and success states must not collapse into one generic panel.
- Plugin mirrors must carry the same hardened UI-state role as the root repository.

Agent hardening convergence review:

- The UI State QA role now has enough role detail to verify non-happy-path screen states deterministically.
- The role blocks missing state contracts, unreachable forced states, marker-only proof, inaccessible status/recovery, generic state copy, visual collapse, stale evidence, contradictory QA/target status, and unresolved UI-state repair work.
- The role explicitly hands off implementation, ambiguous contract, accessibility, visual, marker-only, drift, and QA reconciliation findings to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened UI State QA responsibilities are removed from root or Claude plugin agent files.

Current answer for UI State QA hardening:

```txt
I do not know how to make the UI State QA role more deterministic without importing requirements outside the approved Archetype screen-state contracts, UX flow state completeness, test-first UI tests, Playwright evidence, QA artifacts, target execution evidence, and accessibility/visual reports.
I cannot identify a technical or architectural mismatch against the UI State QA hardening goal in the current role file.
```

## Agent Hardening - Malformed Data QA

Source files:

- `agents/malformed-data-qa.md`
- `plugins/claude-code/agents/malformed-data-qa.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- OWASP input validation cheat sheet: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html
- MDN client-side form validation: https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
- W3C WAI form notifications: https://www.w3.org/WAI/tutorials/forms/notifications/
- Playwright best practices: https://playwright.dev/docs/best-practices
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/

Mismatches found before hardening:

- The Malformed Data QA role was a short checklist and did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, malformed case taxonomy, failure routing matrix, or self-review loop.
- The role did not require every malformed case to name exact malformed input, contract source, expected user-facing result, runtime command, raw artifact, and owner.
- The role did not distinguish narrative-only malformed-data summaries from runtime evidence.
- The role did not define deterministic statuses for missing evidence, unexecuted runtime, untraceable cases, narrative-only results, repair-needed failures, or QA-lead readiness.
- The role did not cover high-risk malformed cases beyond the currently generated set, such as null non-nullable values, wrong types, invalid enum values, invalid dates/currencies, unexpected extra fields, and oversized labels.
- The role did not preserve the boundary that frontend malformed-data QA cannot claim backend/security validation completion.
- Contract tests only checked generic QA role sections and plugin mirroring.

Corrections applied:

- Rewrote the role as a data-boundary QA specialist and invalid-input evidence gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, malformed-data sufficiency gate, one-question clarification priority, output schema, decision rules, required evidence contract, malformed case matrix, failure routing matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `malformed_data_ready_for_qa_lead`, `malformed_data_needs_repair`, `malformed_data_blocked_missing_evidence`, `malformed_data_blocked_unexecuted_runtime`, `malformed_data_blocked_untraceable_case`, and `malformed_data_blocked_narrative_only`.
- Required canonical malformed coverage for `missing_required_value`, `null_non_nullable`, `wrong_type`, `invalid_identifier`, `invalid_enum_value`, `invalid_date_or_currency`, `empty_payload`, `unexpected_extra_field`, `oversized_or_long_label`, `permission_denied_fixture`, and `stale_or_conflicting_payload`.
- Required every malformed-data finding to include scenario id, case id, malformed case, source test, contract kind, source contract/path, target file, malformed input, expected state, expected user result, runtime command, runtime artifact, actual result, status, owner, and repair handoff.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened Malformed Data QA requirements in the QA team contract.

Self-healing rules added:

- Malformed-data QA must prove exact invalid input and expected visible recovery, not just scenario existence.
- Runtime evidence is mandatory before completion; pending or narrative-only evidence blocks completion claims.
- Invalid data accepted as success is implementation drift.
- Client-side validation improves UX, but backend/security validation remains externally unconfirmed unless separately evidenced.
- Type/schema gaps go to `strict-typescript-developer.md`; missing form/action/data contract semantics go to `frontend-architect.md`; runtime implementation failures go to `repair-planner.md`.
- Plugin mirrors must carry the same hardened malformed-data role as the root repository.

Agent hardening convergence review:

- The Malformed Data QA role now has enough detail to verify invalid-input evidence deterministically.
- The role blocks missing malformed scenarios, unexecuted runtime proof, untraceable cases, narrative-only summaries, silent invalid acceptance, generic success after bad input, inaccessible errors, permission bypasses, stale/conflict blind spots, and backend/security overclaims.
- The role explicitly hands off test, type, contract, implementation, accessibility, visual, QA contradiction, and contract-drift findings to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened malformed-data responsibilities are removed from root or Claude plugin agent files.

Current answer for Malformed Data QA hardening:

```txt
I do not know how to make the Malformed Data QA role more deterministic without importing requirements outside the approved Archetype QA scenario catalog, malformed-data results, test-first contract, frontend data/form/action contracts, target execution evidence, raw runtime artifacts, and bounded backend/security confirmation.
I cannot identify a technical or architectural mismatch against the Malformed Data QA hardening goal in the current role file.
```

## Agent Hardening - Accessibility QA

Source files:

- `agents/accessibility-qa.md`
- `plugins/claude-code/agents/accessibility-qa.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- W3C WAI accessibility evaluation overview: https://www.w3.org/WAI/test-evaluate/
- WCAG 2.2 Quick Reference: https://www.w3.org/WAI/WCAG22/quickref/
- WAI-ARIA Authoring Practices read-me-first: https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/
- MDN ARIA overview: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- Playwright best practices: https://playwright.dev/docs/best-practices

Mismatches found before hardening:

- The Accessibility QA role was a short checklist and did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, QA matrix, failure routing matrix, or self-review loop.
- The role did not clearly distinguish QA evidence verification from accessibility requirement authoring or WCAG/legal compliance certification.
- The role did not define deterministic blocked statuses for missing evidence, marker-only evidence, compliance overclaim, untraceable findings, repair-needed failures, or QA-lead readiness.
- The role did not require reconciliation across `qa/accessibility-results.md`, QA scenario catalog, Playwright evidence, raw target results, design-system accessibility rules, screen/form/action contracts, quality accessibility report, target execution, and repair queue.
- The role did not explicitly reject accessibility evidence based only on route rendering, generated markers, or screenshot byte size.
- The role did not enforce the boundary that automated checks can support smoke/accessibility evidence but cannot certify compliance without qualified human evaluation.
- Contract tests only checked generic QA role sections and plugin mirroring.

Corrections applied:

- Rewrote the role as an accessibility evidence verifier and compliance-claim boundary gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, accessibility QA sufficiency gate, one-question clarification priority, output schema, decision rules, required evidence contract, accessibility QA matrix, failure routing matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `accessibility_qa_ready_for_qa_lead`, `accessibility_qa_needs_repair`, `accessibility_qa_blocked_missing_evidence`, `accessibility_qa_blocked_marker_only_evidence`, `accessibility_qa_blocked_compliance_overclaim`, and `accessibility_qa_blocked_untraceable_finding`.
- Required evidence for headings/landmarks, names/labels, roles/semantics, keyboard path, focus visibility, form errors, status feedback, color/contrast meaning, reduced motion, chart/table fallback, and compliance boundary.
- Required every accessibility QA finding to include finding id, severity, route, screen, state, component/selector, check type, source contract, observed failure, expected behavior, evidence artifacts, manual review status, status, owner, and repair handoff.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened Accessibility QA requirements in the QA team contract.

Self-healing rules added:

- Accessibility QA verifies evidence and blocks overclaims; it does not author requirements or certify compliance.
- Automated checks can support smoke/accessibility evidence but cannot prove WCAG/legal compliance without qualified human review.
- Marker-only accessibility proof is a blocker.
- Every accessibility finding must be traceable to route, screen, component/state/form/interactions, expected behavior, raw evidence, and owner.
- Compliance claims must be downgraded to the evidence actually present.
- Plugin mirrors must carry the same hardened accessibility QA role as the root repository.

Agent hardening convergence review:

- The Accessibility QA role now has enough detail to verify accessibility evidence deterministically.
- The role blocks missing reports/scenarios/raw results, marker-only evidence, missing keyboard/focus/name/form/status/color/fallback proof, inaccessible recovery, compliance overclaims, untraceable findings, and unresolved accessibility repair tasks.
- The role explicitly hands off requirement, test, Playwright, design-system, implementation, visual, contract-drift, QA-lead, and verifier concerns to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened accessibility QA responsibilities are removed from root or Claude plugin agent files.

Current answer for Accessibility QA hardening:

```txt
I do not know how to make the Accessibility QA role more deterministic without importing requirements outside the approved Archetype accessibility rules, QA accessibility report, scenario catalog, Playwright evidence, raw target results, screen/form/action contracts, quality accessibility report, repair queue, and bounded human-review evidence.
I cannot identify a technical or architectural mismatch against the Accessibility QA hardening goal in the current role file.
```

## Agent Hardening - Visual Regression QA

Source files:

- `agents/visual-regression-qa.md`
- `plugins/claude-code/agents/visual-regression-qa.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- Playwright screenshots: https://playwright.dev/docs/screenshots
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Playwright best practices: https://playwright.dev/docs/best-practices
- WCAG reflow understanding: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- WCAG text spacing understanding: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
- Tailwind responsive design: https://tailwindcss.com/docs/responsive-design

Mismatches found before hardening:

- The Visual Regression QA role was a short checklist and did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, viewport matrix, failure routing matrix, or self-review loop.
- The role did not distinguish screenshot existence from visual correctness.
- The role did not reject selector-only, marker-only, static-inspection-only, or screenshot byte size-only proof.
- The role did not require screenshot provenance tied to scenario id, route, screen, state, viewport, dimensions, source contract, raw result/report, status, and owner.
- The role named viewport coverage but did not make mobile, tablet, and desktop coverage a deterministic gate.
- The role did not reconcile visual evidence with Playwright results, target execution, visual direction, token contracts, responsive rules, accessibility adjacency, repair queue, and contract drift.
- Contract tests only checked generic QA role sections and plugin mirroring.

Corrections applied:

- Rewrote the role as a visual evidence verifier and screenshot-backed regression gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, visual regression QA sufficiency gate, one-question clarification priority, output schema, decision rules, required visual regression evidence contract, viewport screenshot matrix, failure routing matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `visual_regression_ready_for_qa_lead`, `visual_regression_needs_repair`, `visual_regression_blocked_missing_evidence`, `visual_regression_blocked_incomplete_viewport_coverage`, `visual_regression_blocked_marker_only_evidence`, and `visual_regression_blocked_screenshot_only_byte_size`.
- Required visual-smoke evidence to include scenario id, route, screen, state, viewport, dimensions, source contract, screenshot path, supporting raw result/report path, expected visual contract, observed result, status, and owner.
- Required QA to block overlap, clipping, hidden critical actions, horizontal overflow, unstable dimensions, token drift, typography drift, component-state drift, responsive drift, missing screenshots, incomplete viewport coverage, and accessibility conflicts caused by visual repairs.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened Visual Regression QA requirements in the QA team contract.

Self-healing rules added:

- Visual QA must build the expected screenshot matrix from contracts, not memory.
- Screenshot byte size proves file existence only; it cannot prove visual correctness.
- Selector-only and marker-only visual proof is a blocker.
- Mobile, tablet, and desktop coverage is required unless explicitly excluded by source contract.
- Visual QA verifies evidence and routes defects; it does not implement visual fixes or approve its own generated evidence.
- Reflow, text-spacing resilience, horizontal overflow, content fit, and layout stability are visual QA constraints.
- Plugin mirrors must carry the same hardened visual regression QA role as the root repository.

Agent hardening convergence review:

- The Visual Regression QA role now has enough detail to verify visual evidence deterministically.
- The role blocks missing reports/screenshots/raw evidence, incomplete viewport matrices, marker-only proof, screenshot byte-size-only proof, untraceable screenshot paths, layout failures, token drift, typography drift, component-state drift, responsive drift, accessibility conflicts, and unresolved visual repair tasks.
- The role explicitly hands off Playwright evidence gaps, visual implementation defects, token/design-system drift, responsive architecture gaps, accessibility conflicts, QA contradictions, and contract drift to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened visual regression responsibilities are removed from root or Claude plugin agent files.

Current answer for Visual Regression QA hardening:

```txt
I do not know how to make the Visual Regression QA role more deterministic without importing requirements outside the approved Archetype visual direction, token contracts, responsive rules, QA scenario catalog, Playwright evidence, target visual-smoke screenshots, target execution evidence, accessibility adjacency, repair queue, and contract-drift evidence.
I cannot identify a technical or architectural mismatch against the Visual Regression QA hardening goal in the current role file.
```

## Agent Hardening - Contract Drift QA

Source files:

- `agents/contract-drift-qa.md`
- `plugins/claude-code/agents/contract-drift-qa.md`
- `scripts/run-qa-team-contract.mjs`

Browser research anchors:

- Martin Fowler consumer-driven contracts: https://martinfowler.com/articles/consumerDrivenContracts.html
- Pact "when to use Pact": https://docs.pact.io/getting_started/what_is_pact_good_for
- Semantic Versioning: https://semver.org/
- Playwright best practices: https://playwright.dev/docs/best-practices

Mismatches found before hardening:

- The Contract Drift QA role was a short checklist and did not define a role, mission, production standard, operating procedure, sufficiency gate, output schema, evidence contract, drift classification matrix, failure routing matrix, or self-review loop.
- The role did not reconcile the canonical spec, implementation contract, test-first contract, Playwright contract, target execution, QA reports, repair queue, drift report, lifecycle state, and approval decision as one evidence system.
- The role did not define deterministic statuses for missing evidence, repair queue mismatch, stale/inconsistent evidence, unapproved contract revision, repair-needed drift, or QA-lead readiness.
- The role did not require repair task count, drift count, tasks length, task ids, status, classifications, source artifacts, target files, rerun commands, and closure evidence to reconcile.
- The role did not preserve the patch-first boundary strongly enough: implementation drift must be patched first; contract revision needs new user-approved evidence.
- The role did not classify drift across dependency, type, build, route, state, flow, responsive, accessibility, visual, Playwright, marker-only, malformed-data, QA, and contract revision categories.
- Contract tests only checked generic QA role sections and plugin mirroring.

Corrections applied:

- Rewrote the role as a contract drift evidence reconciler and patch-first revision boundary gatekeeper.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, contract drift QA sufficiency gate, one-question clarification priority, output schema, decision rules, required contract drift evidence contract, drift classification matrix, failure routing matrix, practice anchors, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `contract_drift_ready_for_qa_lead`, `contract_drift_needs_repair`, `contract_drift_blocked_missing_evidence`, `contract_drift_blocked_stale_or_inconsistent_evidence`, `contract_drift_blocked_unapproved_contract_revision`, and `contract_drift_blocked_repair_queue_mismatch`.
- Required queue math reconciliation across `10-revision/repair-task-queue.json.status`, `10-revision/repair-task-queue.json.task_count`, `tasks.length`, `10-revision/drift-report.json.status`, `10-revision/drift-report.json.drift_count`, and task ids.
- Required every drift finding to include drift id, queue task id, classification, action type, source contract, source evidence, target file or artifact, expected behavior, observed behavior, severity, status, owner, rerun command, closure evidence, and contract revision evidence when revision is proposed.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened Contract Drift QA requirements in the QA team contract.

Self-healing rules added:

- Contract drift QA must reconcile canonical contracts, runtime evidence, QA reports, repair queue, drift report, lifecycle state, and approval decision before claiming readiness.
- Repair task count, drift count, task ids, and statuses must match exactly.
- Failed Playwright, target execution, or specialist QA evidence must become repair work unless approved revision evidence proves the contract is wrong.
- Contract revision cannot be used to excuse implementation drift.
- Tests weakened, skipped, deleted, or made marker-only to hide failures are drift blockers.
- Plugin mirrors must carry the same hardened contract drift QA role as the root repository.

Agent hardening convergence review:

- The Contract Drift QA role now has enough detail to verify drift evidence deterministically.
- The role blocks missing artifacts, stale evidence, contradictory statuses, repair queue math mismatches, unowned drift, failed evidence without repair tasks, unapproved contract revision, marker-only test drift, and completion claims with unresolved repair tasks.
- The role explicitly hands off implementation, approval-sensitive contract changes, Playwright evidence, weak tests, type drift, architecture drift, flow/state drift, visual drift, accessibility drift, malformed-data drift, source ambiguity, and QA reconciliation to the correct owners instead of self-approving.
- QA team contract tests now fail if the hardened contract drift responsibilities are removed from root or Claude plugin agent files.

Current answer for Contract Drift QA hardening:

```txt
I do not know how to make the Contract Drift QA role more deterministic without importing requirements outside the approved Archetype canonical contracts, test-first and Playwright contracts, target execution evidence, QA reports, repair queue, drift report, lifecycle approval state, and user-approved revision evidence.
I cannot identify a technical or architectural mismatch against the Contract Drift QA hardening goal in the current role file.
```

## Agent Hardening - Frontend Contract Reviewer Compatibility Role

Source files:

- `agents/frontend-contract-reviewer.md`
- `plugins/claude-code/agents/frontend-contract-reviewer.md`
- `scripts/run-agent-role-files-contract.mjs`

Browser research anchors:

- Playwright best practices: https://playwright.dev/docs/best-practices
- Testing Library guiding principles: https://testing-library.com/docs/guiding-principles/
- W3C WAI accessibility evaluation overview: https://www.w3.org/WAI/test-evaluate/
- Pact "when to use Pact": https://docs.pact.io/getting_started/what_is_pact_good_for
- Semantic Versioning: https://semver.org/

Mismatches found before hardening:

- The compatibility reviewer was a short checklist and did not define a role, mission, production standard, operating procedure, preflight gate, output schema, evidence contract, review matrix, failure routing matrix, or self-review loop.
- The role said it was compatible and non-approving, but did not make the approval boundary enforceable enough.
- The role did not define deterministic statuses for verifier-ready, revision-needed, missing evidence, draft-used-as-canonical, unverifiable criteria, or specialist-gate blockers.
- The role did not reconcile draft/canonical artifacts, approval decision, readiness tiers, context, experience architecture, design system, frontend contracts, test-first contract, Playwright contract, QA catalog, repair queue, and MCP tools as one compatibility preflight.
- The role did not require findings to explain what implementation guessing a missing artifact would force.
- Contract tests only checked the compatibility label and plugin mirroring.

Corrections applied:

- Rewrote the role as a compatibility frontend contract preflight reviewer and implementation-guesswork blocker.
- Added explicit authority, mission, production standard, canonical inputs, outputs, blockers, operating procedure, compatibility contract review gate, one-question clarification priority, output schema, decision rules, required frontend contract evidence contract, review matrix, failure routing matrix, good/bad output signals, self-review checklist, and handoff rules.
- Added deterministic statuses: `frontend_contract_review_ready_for_contract_verifier`, `frontend_contract_review_needs_revision`, `frontend_contract_review_blocked_missing_evidence`, `frontend_contract_review_blocked_draft_used_as_canonical`, `frontend_contract_review_blocked_unverifiable_criteria`, and `frontend_contract_review_blocked_specialist_gate`.
- Required every finding to include severity, artifact path, missing or weak evidence, why it would force implementation guessing or verifier risk, owner role, recommended correction, and handoff target.
- Mirrored the hardened role into the Claude Code plugin agent surface.
- Added contract assertions for the hardened compatibility reviewer requirements in the agent-role contract.

Self-healing rules added:

- Compatibility does not mean weaker governance.
- The compatibility reviewer can review and route, but final approval always belongs to `contract-verifier.md`.
- Draft artifacts remain drafts until approval state and readiness tiers authorize implementation.
- Missing evidence must be described in terms of the implementation guessing it would force.
- Acceptance criteria must have test or Playwright verification paths.
- Plugin mirrors must carry the same hardened compatibility role as the root repository.

Agent hardening convergence review:

- The Frontend Contract Reviewer role now has enough detail to preserve old-install compatibility without reopening weak approval behavior.
- The role blocks missing evidence, draft/canonical confusion, stale or inconsistent approval state, candidate assumptions used as facts, unverifiable criteria, marker-only tests, unresolved specialist gates, design-preview-only implementation authority, accessibility/visual evidence gaps, unresolved repair drift, and self-approval attempts.
- The role explicitly hands off product, UX, architecture, design-system, practice, type, visual, accessibility, test, QA, drift, repair, and final approval gaps to the correct owners instead of self-approving.
- Agent-role contract tests now fail if the hardened compatibility responsibilities are removed from root or Claude plugin agent files.

Current answer for Frontend Contract Reviewer hardening:

```txt
I do not know how to make the Frontend Contract Reviewer compatibility role more deterministic without importing requirements outside the approved Archetype draft/canonical package artifacts, approval decision, readiness tiers, frontend contracts, test-first and Playwright contracts, QA catalog, repair queue, MCP tool surfaces, and final verifier boundary.
I cannot identify a technical or architectural mismatch against the Frontend Contract Reviewer compatibility hardening goal in the current role file.
```

## Multiagent Product Quality Review - 2026-05-07

Source report:

- `obsidian-vault/13 Quality Reviews/Archetype Multiagent Quality Review - 2026-05-07.md`

Reviews gathered:

- Scope A: lifecycle, gates, approval, repair, convergence.
- Scope B: CLI, MCP, plugin install, distribution, release readiness.
- Scope C: code architecture, modules, typing, artifact readers/writers.
- Scope D: test system, QA, Playwright, repair, golden/replay.
- Scope E: agents, skills, docs, onboarding, natural-language UX.
- Scope F: performance, token budget, artifact size, read/write speed.

Reinforced product lessons:

- Governance prose is not enough; lifecycle boundaries must be enforced before artifacts are constructed.
- First-run trust is product quality; unsafe CLI output deletion is a release blocker.
- A central artifact registry is the keystone for future hardening.
- Scaffold verification and independent product behavior verification must be separate evidence grades.
- Agent instructions should not carry workflow state; tools and artifacts should carry workflow state.
- Optimize the default read path, not only total artifact size.
- Approval must be a bound product artifact, not a boolean field in intake JSON.
- Schema validation must be real nested validation, not top-level presence checks.
- Full release checks can stay rigorous, but daily checks need a build-once runner and cached target installs.
- The next work should harden safety, artifact architecture, runtime proof, bounded context, and executable lifecycle primitives instead of adding more role prose.

Perfected investment priorities:

1. P0: Add CLI output safety guard before recursive exporter deletion.
2. P0: Split scaffold verification from independent implementation verification.
3. P0: Stop draft generation before canonical/test/Playwright artifact construction.
4. P0: Add explicit approval artifact/command bound to draft id, source hash, reviewed refs, and assumptions.
5. P0: Create a single artifact registry for manifests, exports, validators, docs, and read plans.
6. P0: Bound MCP artifact reads and add compact phase context bundles.
7. P0: Replace repeated build/install/test loops with build-once runner and target dependency caching.
8. P1: Add Ajv-backed schema validation and split `validatePackage.ts`.
9. P1: Require real red-run, malformed-data, per-scenario Playwright, visual, and accessibility evidence.
10. P1: Add a first-class natural-language lifecycle primitive behind `/archetype` and `$archetype`.

## Agent Data Plane Phase 01 - Plan And Documentation

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`
- `obsidian-vault/13 Quality Reviews/Archetype Multiagent Quality Review - 2026-05-07.md`

Extracted requirements:

- Rename the concept correctly as Agent Data Plane.
- Keep the first implementation local, deterministic, file-backed, replayable, and queryable.
- Do not replace generated artifacts.
- Preserve current lifecycle gates and existing CLI/MCP behavior.
- Provide an agent-friendly query substrate for run state, events, artifact lineage, projections, verification status, and repair provenance.

Plan critique:

- The original prompt was strong but mixed compiler and exporter responsibilities.
- The original projection layout omitted readiness even though readiness is required.
- Broad "read entire repository" language needed to become phase-specific critical-file reads.
- Agent UX requires compact run queries first, not full artifact dumping.

Corrections applied:

- Created `docs/AGENT_DATA_PLANE_PLAN.md` with phased implementation, critique, non-goals, risks, and hard-loop rules.
- Created `docs/agent-data-plane.md` defining control plane, runtime, data plane, lifecycle mapping, events, artifacts, projections, adapters, and non-goals.
- Updated README, lifecycle docs, MCP docs, and Codex docs to introduce the data plane as deterministic and non-autonomous.

Self-healing rules:

- Say "Agent Data Plane", not "data layer".
- Compiler integration records lifecycle facts; exporter integration records written artifacts.
- CLI/MCP should query projections and artifact records before asking agents to read large generated files.
- Direct compiler API behavior must remain unchanged unless a data plane is explicitly supplied.

Phase 01 convergence review:

```txt
I do not know how to make the Agent Data Plane plan more faithful to the current Archetype repo without starting implementation details from later phases.
I cannot identify a phase-plan mismatch against the hardened lifecycle docs after adding the readiness projection and compiler/exporter boundary.
```

## Agent Data Plane Phase 02 - Typed Core And Adapters

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`

Extracted requirements:

- Add `src/data-plane/`.
- Define strict entity and port types.
- Implement file and memory adapters.
- Implement deterministic JSON/JSONL helpers.
- Implement typed errors.
- Avoid `any` in new files.

Phase critique:

- Projection writing can easily become non-replayable if projection files are treated as the source of truth. The source of truth must remain `events.jsonl`; projection files are materialized read models.
- Event ordering must be owned by the adapter, not by caller-supplied sequence values.
- Artifact records should store metadata and lineage, not duplicate full generated artifact contents.
- File adapter artifact IDs must be path-safe even if future callers pass custom IDs.

Corrections applied:

- Added strict data-plane entities in `src/data-plane/types.ts`.
- Added ports in `src/data-plane/ports.ts`.
- Added typed `DataPlaneError` codes in `src/data-plane/errors.ts`.
- Added deterministic JSON, JSONL, checksums, validation guards, and timeline helpers in `src/data-plane/state.ts`.
- Added replay/timeline projection logic in `src/data-plane/events.ts`.
- Added artifact helpers in `src/data-plane/artifacts.ts`.
- Added `MemoryDataPlane` and `FileDataPlane` adapters.
- Exported the public data-plane API from `src/data-plane/index.ts` and root `src/index.ts`.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run build`: pass.
- Manual Node smoke against `dist` exercised memory and file adapters: create run, append ordered events, write/read artifact, write/read projection, replay, and typed missing-artifact failure.
- `rg -n "\\bany\\b|as any" src/data-plane`: no matches.

Self-healing rules:

- Treat `events.jsonl` as append-only authority.
- Treat projection JSON as query acceleration, not source of truth.
- Do not copy generated artifacts into the data plane; record refs, hashes, size, phase, producer, and lineage.
- Missing data-plane states must throw `DataPlaneError` with stable codes.

Phase 02 convergence review:

```txt
I do not know how to make the typed core and local adapters more complete within Phase 02 without pulling in compiler/exporter/CLI/MCP integration that belongs to later phases.
I cannot identify a Phase 02 mismatch after verifying strict types, adapter behavior, replay, typed errors, and no new `any` usage.
```

## Agent Data Plane Phase 03 - Compiler And Exporter Integration

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`

Extracted requirements:

- Add an optional `dataPlane` compiler option.
- Keep direct compiler behavior unchanged when no data plane is passed.
- Make CLI and MCP generation create file-backed runs by default.
- Record intake, evidence, lifecycle, approval/decision, contract, readiness, and verification events.
- Record generated artifact records only after export files exist.
- Preserve all existing generated package paths and return values.

Phase critique:

- The exporter deletes the output directory before writing. Creating `archetype-output/data-plane` before export would silently delete the run.
- Recording only the top-level manifest artifacts would miss many canonical package files from the internal artifact index.
- Absolute filesystem paths inside artifact metadata would make local run records noisy and less portable.
- Running two contract commands that both rebuild `dist` in parallel is an avoidable verification drift even though this run passed.

Corrections applied:

- Added `dataPlane?: DataPlane` to compiler options.
- Added `recordCompiledPackage`, `recordClarificationPackage`, `recordExportedArtifacts`, and `mergeManifestArtifacts`.
- CLI and MCP `generate` now create `data-plane/runs/<run-id>/` after package export and return `dataPlaneRunId`.
- Clarification, draft, and canonical generation paths all record run events, projections, and artifact lineage.
- Canonical artifact recording merges the top-level manifest with the internal `artifact_index` and records every existing exported file.
- Artifact metadata stores package-relative paths, byte size, SHA-256, producer, phase, and lineage without redundant absolute paths.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run build`: pass.
- CLI smoke generated clarification, draft, and canonical packages with `dataPlaneRunId`.
- Data-plane smoke verified one run per package, ordered events, five projections, replay parity, and artifact records.
- Compiler memory smoke verified optional `dataPlane` creates events/projections while preserving the returned package.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `rg -n "absolute_path|as any|\\bany\\b" src/data-plane src/cli.ts src/mcp/tools/generatePackage.ts src/core/pipeline.ts src/core/types.ts`: no matches.

Self-healing rules:

- Never create the file-backed data plane inside an output directory before an exporter runs.
- For canonical packages, record artifact lineage from the merged manifest plus internal artifact index.
- Keep `ArtifactRecord.ref.path` package-relative; resolve absolute paths from `AgentRun.output_dir` only when needed by a reader.
- Avoid parallel contract commands when both invoke `npm run build`; builds mutate the same `dist` directory.

Phase 03 convergence review:

```txt
I do not know how to make compiler/exporter integration more faithful to Phase 03 without adding CLI/MCP query commands that belong to later phases.
I cannot identify a Phase 03 mismatch after verifying no default compiler behavior change, default CLI/MCP run creation, artifact lineage after export, replay, and existing contract compatibility.
```

## Agent Data Plane Phase 04 - CLI Query Surface

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`

Extracted requirements:

- Add `archetype data-plane status --out archetype-output --json`.
- Add `archetype data-plane timeline --out archetype-output --run <run-id> --json`.
- Add `archetype data-plane artifacts --out archetype-output --run <run-id> --json`.
- Add `archetype data-plane read-artifact --out archetype-output --artifact <artifact-id> --json`.
- Add `archetype data-plane replay --out archetype-output --run <run-id> --json`.
- Keep all commands deterministic, read-only, and LLM-free.
- Return typed JSON failures for malformed reads.

Phase critique:

- Query behavior should not live only inside CLI because MCP needs the same semantics in Phase 05.
- `status` must be safe on an empty data-plane directory and should not create files.
- `timeline`, `artifacts`, and `replay` require explicit run IDs; otherwise agents can accidentally inspect the wrong run.
- `read-artifact` can safely search all runs when no run ID is supplied because artifact records carry their source `run_id`.

Corrections applied:

- Added `src/data-plane/queries.ts` as the shared read-only query layer.
- Added `data-plane` CLI subcommands for status, timeline, artifacts, read-artifact, and replay.
- Added typed JSON error handling for data-plane commands using `DataPlaneError` codes.
- Updated README and data-plane docs with CLI query commands.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run build`: pass.
- CLI query smoke verified `status`, `timeline`, `artifacts`, `read-artifact`, and `replay` against a canonical generated run.
- Malformed CLI smoke verified typed `RUN_NOT_FOUND`, `ARTIFACT_NOT_FOUND`, and `INVALID_DATA_PLANE_ARGUMENT` failures.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.

Self-healing rules:

- Keep query operations read-only and shared through `src/data-plane/queries.ts`.
- CLI/MCP query surfaces should return data-plane records, not generated artifact file contents.
- Require `--run` for run-scoped reads unless the operation can unambiguously locate by artifact ID.
- Typed data-plane failures must expose `{ status: "error", error: { code, message, details } }` in JSON mode.

Phase 04 convergence review:

```txt
I do not know how to make the CLI query surface more complete within Phase 04 without implementing MCP tools that belong to Phase 05.
I cannot identify a Phase 04 mismatch after verifying read-only query commands, typed malformed failures, shared query logic, and existing CLI/MCP contract compatibility.
```

## Agent Data Plane Phase 05 - MCP Query Surface

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`

Extracted requirements:

- Add `archetype_data_plane_status`.
- Add `archetype_data_plane_timeline`.
- Add `archetype_data_plane_read_artifact`.
- Add `archetype_data_plane_replay_run`.
- Match CLI read/query semantics.
- Include tools in MCP tool list.
- Keep existing MCP tools working.

Phase critique:

- MCP tools must reuse `src/data-plane/queries.ts`; duplicating logic would drift from the CLI surface.
- MCP tool errors previously returned only `{ status, message }`, which would hide `DataPlaneError.code` and fail the typed-error requirement.
- `read_artifact` must return `ArtifactRecord` metadata, not generated artifact contents, otherwise agents lose the token-safety benefit of the data plane.

Corrections applied:

- Added `src/mcp/tools/dataPlane.ts` with four read-only data-plane tools.
- Registered the tools in `src/mcp/tools/index.ts`.
- Updated MCP server instructions to name Agent Data Plane querying.
- Updated MCP error serialization to preserve `DataPlaneError` code, message, and details.
- Extended `scripts/run-mcp-contract.mjs` to require the tools, query a generated draft run, read an artifact record, replay the run, and verify typed missing-run errors.
- Updated README, MCP docs, Codex docs, and data-plane docs with the new tool names.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run mcp:contract`: pass.
- `npm run cli:contract`: pass.
- `rg -n "as any|\\bany\\b" src/data-plane src/mcp src/cli.ts scripts/run-mcp-contract.mjs`: no matches.

Self-healing rules:

- MCP data-plane tools must stay as thin wrappers over shared query functions.
- Data-plane MCP failures must preserve `DataPlaneError` details in `structuredContent`.
- Use `archetype_data_plane_read_artifact` for artifact records and `archetype_read_artifact` only when full file content is explicitly needed.

Phase 05 convergence review:

```txt
I do not know how to make the MCP query surface more complete within Phase 05 without adding the dedicated data-plane contract script that belongs to Phase 06.
I cannot identify a Phase 05 mismatch after verifying tool registration, shared CLI/MCP semantics, typed MCP data-plane errors, and existing CLI/MCP contract compatibility.
```

## Agent Data Plane Phase 06 - Contract Tests And Hardening

Source:

- `docs/AGENT_DATA_PLANE_PLAN.md`
- `docs/agent-data-plane.md`

Extracted requirements:

- Add `scripts/run-data-plane-contract.mjs`.
- Add `npm run data-plane:contract`.
- Cover run creation, ordered events, artifact write/read, replay, CLI, MCP, generation integration, and malformed reads.
- Verify targeted existing CLI/MCP contracts.
- Run full `npm run check` if time and disk allow.

Phase critique:

- Manual smoke tests from Phases 03-05 were useful but not durable. The repository needs a repeatable contract script.
- A data-plane contract that only tests adapters would miss the actual product path: `archetype generate` writing `archetype-output/data-plane`.
- A data-plane contract that only tests CLI would not protect MCP agents from semantic drift.
- Full `npm run check` is expensive but appropriate after touching package scripts and MCP/CLI surfaces.

Corrections applied:

- Added `scripts/run-data-plane-contract.mjs`.
- Added `data-plane:contract` to package scripts and inserted it into `test` and `check`.
- Added `tmp/data-plane-contract` to `npm run clean`.
- Data-plane contract now verifies memory and file adapters, event ordering, artifact records, projection reads, replay, generation integration, CLI queries, MCP query tools, typed CLI malformed failures, and typed MCP malformed failures.
- Added the contract command to data-plane docs.

Verification evidence:

- `npm run data-plane:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run mcp:contract`: pass.
- `npm run check`: pass.

Self-healing rules:

- Any future data-plane behavior change must update `scripts/run-data-plane-contract.mjs`.
- Keep `data-plane:contract` near the front of `test` and `check` because it validates shared CLI/MCP query semantics.
- Prefer durable contract tests over one-off smoke scripts once a phase stabilizes.

Phase 06 convergence review:

```txt
I do not know how to make the data-plane hardening phase more complete within the current Agent Data Plane plan.
I cannot identify a Phase 06 mismatch after adding the dedicated contract, proving adapters, CLI, MCP, generation integration, malformed failures, and passing the full repository check.
```

## Six-Agent Audit Phase 02 - Phase-Safe Compiler

Source:

- `obsidian-vault/13 Quality Reviews/Archetype Six-Agent Scope Audit Convergence - 2026-05-07.md`

Extracted requirements:

- Split compiler execution into context, draft, approval, canonical, test-first, verification, target, QA, and repair phases.
- Draft generation must stop before canonical spec, test-first, Playwright verification, target, QA, and repair construction.
- Clarification, draft, and canonical package types must remain compatible with validation, summary, simulation, data-plane recording, and contracts.
- Pre-approval execution must not write canonical/test/Playwright/target artifacts to disk.

Phase critique:

- The previous compiler shape built most canonical and verification artifacts before it knew whether implementation was approved. That made draft output look blocked while still spending tokens and CPU on unauthorized downstream surfaces.
- A shallow file-export fix would not be enough; data-plane recording, readiness, evidence decisions, and non-negotiable principles also needed to understand skipped phases.
- The package type still requires full package fields, so the safest incremental architecture is phase records plus blocked sentinel objects for fields that legacy readers expect, while ensuring downstream builders are not called before approval.

Corrections applied:

- Added `manifest.compiler_phases` to expose constructed versus skipped compiler phases.
- Reworked `runArchetypeCompiler` so draft packages construct context, evidence, draft contracts, draft design-system preview, governance, approval request, and lightweight draft quality only.
- Moved canonical spec, test-first, Playwright, target, QA, build simulation, and repair builders behind the bound approval gate.
- Updated data-plane recording so draft runs do not emit verification records.
- Updated non-negotiable principles, evidence-decision audits, and readiness tiers so skipped pre-approval phases are blocked/skipped instead of false failures.
- Updated package export manifests and docs so agents can inspect the phase trace.
- Added `scripts/run-phase-safe-compiler-contract.mjs` and `npm run phase-safe:contract`.

Verification evidence:

- `npm run typecheck`: pass.
- `npm run phase-safe:contract`: pass.
- `npm run non-negotiable:contract`: pass.
- `npm run evidence-decision:contract`: pass.
- `npm run context-readiness:contract`: pass.
- `npm run design-preview:contract`: pass.
- `npm run required-artifacts:contract`: pass.
- `npm run check`: pass.

Self-healing rules:

- Draft packages may expose blocked compatibility placeholders, but draft execution must not call canonical/test/verification/target/QA/repair builders.
- Any new lifecycle artifact must declare whether it belongs to draft or post-approval construction.
- Data-plane verification events belong only to approved implementation-capable runs.
- Agent-facing docs must name skipped compiler phases so agents do not treat absent canonical artifacts as missing files.

Phase 02 convergence review:

```txt
I do not know how to make the phase-safe compiler implementation more complete within the current package architecture without first changing the package type to a discriminated union in a later phase.
I cannot identify a Phase 02 mismatch after proving pre-approval output skips canonical/test/Playwright/target/QA/repair artifacts, approved output constructs all phases, data-plane verification is approval-gated, and the full repository check passes.
```

## Six-Agent Audit Phase 03 - Central Artifact Registry

Source:

- `obsidian-vault/13 Quality Reviews/Archetype Six-Agent Scope Audit Convergence - 2026-05-07.md`

Extracted requirements:

- Create `src/artifacts/registry.ts`.
- Generate manifest entries, required lists, docs read order, validator expectations, data-plane metadata, and read priorities from one artifact authority.
- Begin splitting artifact-path validation out of `validatePackage.ts`.
- Preserve all generated artifact paths.

Phase critique:

- Artifact path knowledge was duplicated in the compiler, canonical exporter, draft exporter, complete-package validator, draft validator, required-artifacts contract, and data-plane recording.
- Centralizing only the compiler index would leave validators and manifests drifting.
- Centralizing only validators would not help agents choose bounded reads.
- The registry must not write files itself; exporters remain responsible for values while the registry owns paths and metadata.

Corrections applied:

- Added `src/artifacts/registry.ts` with package membership, manifest ids, artifact type, lifecycle phase, read priority, required/forbidden validator flags, read order, and data-plane metadata.
- Replaced compiler `artifact_index` hardcoding with `artifactIndexForPackage`.
- Replaced draft and canonical top-level manifest artifact arrays with `manifestArtifactsForPackage`.
- Replaced complete required artifact constants and required-artifacts contract duplication with `requiredCompletePackageArtifactPaths`.
- Replaced draft validator required/forbidden path lists and draft manifest-id checks with registry helpers.
- Added `src/quality/artifactRegistryValidation.ts` as the first validation split from `validatePackage.ts`.
- Added data-plane artifact metadata for `registry_id` and `read_priority`.
- Added `docs/artifact-registry.md` and README architecture references.
- Added `scripts/run-artifact-registry-contract.mjs` and `npm run artifact-registry:contract`.

Verification evidence:

- `npm run artifact-registry:contract`: pass.
- `npm run typecheck`: pass.
- `npm run phase-safe:contract`: pass.
- `npm run required-artifacts:contract`: pass.
- `npm run cli:contract`: pass.
- `npm run data-plane:contract`: pass.
- `npm run check`: pass.

Self-healing rules:

- New generated artifacts must be added to `src/artifacts/registry.ts` before exporter, validator, or data-plane changes.
- Exporters may write artifact contents, but they must not own independent manifest path lists.
- Validators must consume registry required/forbidden/read-order helpers instead of local path arrays.
- Data-plane artifact records should carry registry id and read priority when the path is registered.

Phase 03 convergence review:

```txt
I do not know how to make the artifact registry phase more complete without moving into Phase 04 data-plane authority hardening or Phase 05 token-bounded context.
I cannot identify a Phase 03 mismatch after proving registry-backed draft/canonical manifests, registry-backed internal indexes, registry-backed required artifacts, registry-backed validator checks, registry-backed data-plane metadata, and a full repository check.
```
