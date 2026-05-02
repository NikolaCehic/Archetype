# Archetype Design Context

## Register

Product UI.

## Scene

A product lead or frontend architect reviews generated build contracts on a large desktop monitor during planning, then checks details again on a laptop before handing the package to a coding agent. The interface should optimize for scanning, trust, and traceability.

## Color Strategy

Restrained. Use tinted neutral surfaces with a controlled blue action/selection accent, semantic status colors only where they carry meaning, and low-chroma borders. Avoid decorative gradients and heavy brand color.

## Typography

Use a system sans stack. Keep type compact and legible. Use hierarchy through weight, size, spacing, and section grouping, not oversized display text.

## Layout

Use an app shell with a persistent sidebar, a concise top status region, and dense artifact panels. Avoid nested cards. Use panels only when they frame repeated items or tools.

## Components

Expected components:

- Sidebar navigation.
- Status summary.
- Segmented/tabs style artifact navigation.
- Compact tables.
- Code/preformatted artifact previews.
- Badges for readiness, blockers, warnings, checks, and DSAG status.
- Search/filter input for artifacts and screens.

## Accessibility

- Visible focus states.
- High text contrast.
- Keyboard-accessible navigation and buttons.
- Status must not rely on color alone.
- Preserve readable sizes on mobile.

## Motion

Minimal state motion only. Transitions should be 150-200ms and must not animate layout-heavy properties.
