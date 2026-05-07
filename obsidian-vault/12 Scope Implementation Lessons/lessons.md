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
