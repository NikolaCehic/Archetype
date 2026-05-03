# Workbench UI Audit

## What Was Wrong

The Workbench looked more polished than before, but the product model was still wrong.

- The default screen was artifact-first. It exposed counts, raw warnings, JSON, and validation output before explaining the review workflow.
- The navigation was flat. Fifteen destinations had equal weight, so a user had to infer the order: intake, evidence, architecture, design, contract, proof, governance, handoff.
- The overview did not answer the launch question. It showed readiness score and warnings, but not what to trust, what to review, what to fix, and where to hand off.
- Warnings were ungrouped. Backend, auth, proof, review, design, and content issues appeared as one long list.
- Human review and AI-agent handoff were mixed into artifact inventory instead of being first-class flows.
- Buttons and dropdowns looked more consistent after the previous polish pass, but the product still lacked workflow primitives: launch decision, guided step, issue row, status summary, and handoff target.
- AI agents could inspect text, but the UI lacked explicit machine-readable landmarks and action attributes for deterministic navigation.
- Mobile was technically responsive, but it carried the desktop IA too literally and did not prioritize the active workflow.

## Why It Was Not Intuitive

The Workbench is for a product lead, frontend architect, or coding agent deciding whether a generated package is ready to produce frontend code. That user does not begin by asking how many artifacts exist. They ask:

- Is this package ready?
- What is still unconfirmed?
- What should I review first?
- Which contract should my frontend agent consume?
- What proof exists?
- What do I export?

The old UI made those answers available, but not obvious. A launchable product has to make the correct path the default path.

## Implemented Fixes

- Renamed the default view from `Overview` to `Launch Review`.
- Grouped navigation into `Launch`, `Input`, `Architecture`, `Build Contract`, and `Governance`.
- Added a launch decision panel with primary actions for contract review, E2E proof, and handoff.
- Added a guided review path from intake to export.
- Grouped warnings into actionable categories: backend, auth, proof, review, design, content, and architecture.
- Added a human review queue with direct next-step actions.
- Added an AI Agent Handoff Map that points to deterministic artifacts and the correct Workbench views.
- Added machine-readable `data-agent-*` attributes for views, actions, sections, statuses, and issues.
- Added workflow, issue, status, and launch primitives to the Tailwind/shadcn-style component system.
- Improved responsive behavior so the active workflow is prioritized on mobile.

## Production-Grade Polish Plan

1. Make `Launch Review` the default cockpit for readiness, risks, proof, and handoff.
2. Keep artifact-heavy views available, but make them secondary to guided review.
3. Treat shadcn primitives as the Workbench vocabulary: button, badge, card/panel, input, select, textarea, table, alert/notice, workflow step, status card, and review row.
4. Preserve accessibility through landmarks, focus states, status regions, labels, keyboard navigation, and readable mobile targets.
5. Preserve AI-agent accessibility through stable `data-agent-*` attributes and deterministic artifact labels.
6. Verify every major view on desktop and mobile before calling the UI launchable.
