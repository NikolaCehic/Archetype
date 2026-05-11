# Design Quality Gate

Archetype must not hand a coding agent a generic frontend direction. The design phase is a blocking lifecycle gate, not decoration.

## Goal

Before canonical spec generation, Archetype creates a human-reviewable design draft with:

- at least three differentiated design directions
- source signatures, source strength, source-material alignment, and route/screen alignment for every direction
- a selected draft direction
- a browser-viewable `draft/design-system-preview.html`
- a machine-readable `draft/design-quality-gate.json`
- a human-readable `draft/design-craft-rubric.md`
- shadcn and Tailwind integration rules
- component state requirements
- anti-generic UI rejection rules

The user may approve the direction, request changes, or reject the draft. Implementation remains blocked until proof-bound human approval binds the draft.

## Generated Draft Artifacts

```txt
draft/design-system.draft.json
draft/design-directions.json
draft/design-quality-gate.json
draft/design-craft-rubric.md
draft/design-system-preview.html
draft/design-system-review.md
review-console/index.html
review-console/session.json
```

## Canonical Artifacts

After approval, the selected direction and quality gate are preserved in:

```txt
04-design-system/design-directions.json
04-design-system/design-quality-gate.json
04-design-system/design-craft-rubric.md
04-design-system/visual-reference-contract.json
04-design-system/shadcn-integration.json
design-system/tokens.json
frontend-agent-contract/implementation-rules.json
```

## Non-Negotiable Rejections

Archetype rejects:

- reusable preset design directions that are not derived from the user's idea, SPEC, PRD, screenshots, brand notes, design files, or generated route/screen contracts
- default blue-gray SaaS UI unless explicit brand evidence requires it
- untouched shadcn examples used as product UI
- generic card-grid dashboards as the dominant layout
- raw Tailwind color and spacing literals in product implementation
- missing hover, focus-visible, active, disabled, loading, empty, error, and success behavior where applicable
- route or screen proposals that contradict the brief, imported source material, or human review feedback
- visual completion claims without Playwright, screenshot evidence, and source-bound visual-reference assertions
- screenshot or design-file ingestion that records only paths, hashes, byte size, or broad inspiration instead of density, navigation, layout, component, state, and assertion-id obligations

## Agent Rule

Agents must read the current phase bundle first. During implementation, the bundle must include `04-design-system/design-quality-gate.json` before product UI styling starts.

## Source-Derived Direction Rule

The directions are not Archetype demo themes. Each generated direction must cite:

- `source_user_context`
- supplied `SPEC.md`, `PRD.md`, design docs, brand notes, screenshots, or design files when present
- extracted visual evidence signals when screenshots or design files exist
- generated route and screen contracts
- material alignment explaining how uploaded evidence influences layout, components, states, and density

When screenshots, wireframes, or design files exist, `01-evidence/visual-evidence-extraction.json` and `04-design-system/visual-reference-contract.json` must carry source-bound assertions. `DQ-11` fails unless those materials become browser-verifiable density, navigation, layout, component, state, typography, or data-display obligations. `verification/playwright-verification-contract.json` must then include `visual_reference` scenarios that check each assertion id in the target DOM and capture screenshot proof. Screenshot byte size is evidence that a screenshot exists; it is not visual fidelity.

If no visual or design material is supplied, the direction is explicitly candidate context-derived work. Archetype should invite the user to add screenshots, brand files, design docs, or product documentation before approval when visual fidelity matters.

## Route/Source Alignment

`draft/design-quality-gate.json` includes `DQ-10` for route/source alignment. If review feedback says a draft is the wrong product, or if the generated route map keeps rejected generic SaaS routes, the gate fails. The correct recovery is `request_changes` plus draft regeneration; a host agent must not build a direct fallback frontend from the prompt while the package remains unapproved.
