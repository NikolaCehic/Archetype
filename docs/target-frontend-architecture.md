# Target Frontend Architecture

Archetype's implementation contract now emits a real feature/shared/design-system frontend shape instead of an `archetype/` scaffold namespace.

The source of truth is:

- `12-target-frontend/source-file-manifest.json`
- `12-target-frontend/route-component-map.json`
- `12-target-frontend/codegen-tasks.json`
- `12-target-frontend/adapter-interfaces.ts`
- `12-target-frontend/source-generation-runbook.md`

## Layer Contract

Generated target applications use this shared feature structure, with the route layer selected from the approved stack:

```txt
target-app/
  # Next.js App Router targets only
  src/
    app/
      layout.tsx
      globals.css
      <route>/page.tsx

  # Vite + React Router targets only
  index.html
  vite.config.ts
  src/
    main.tsx
    App.tsx
    index.css
    routes/
      <screen-id>.tsx

  # Shared across supported React targets
  src/
    features/
      <screen-id>/
        screens/
          <ScreenName>Screen.tsx
      <workflow>/
        patterns/
          <PatternName>.tsx

    shared/
      ui/
        <contract-bound primitive>.tsx
      layout/
        <shell or navigation primitive>.tsx
      api/
        adapter-interfaces.ts
        data-adapter.ts
      auth/
        auth-adapter.ts
      content/
        copy-contract.ts

    design-system/
      tokens.css

  tests/
    e2e/
    ui/
    archetype/
```

## Rules

- The approved stack decides the route layer: Next.js App Router uses `src/app`; Vite + React Router uses `src/routes` plus `src/App.tsx`.
- Route files normalize route/search params, bind declared state, and delegate to the declared feature screen.
- Product-specific composition belongs in `src/features/<screen-id>/screens`.
- Workflow-specific patterns belong in `src/features/<workflow>/patterns`.
- Contract-bound shadcn-compatible primitive wrappers belong in `src/shared/ui`.
- Shell and navigation primitives belong in `src/shared/layout`.
- Data, auth, and copy boundaries belong in `src/shared/api`, `src/shared/auth`, and `src/shared/content`.
- Generated tokens and typography belong in `src/design-system`.
- Product UI composition inside route files is contract drift.
- Emitting Next-only files for a Vite target, or Vite-only files for a Next target, is contract drift.
- `src/components/archetype`, `src/patterns/archetype`, and `src/lib/archetype` are not valid target architecture outputs.

## Why This Matters

The target project must look like an application that a production frontend team can maintain, not a harness marker surface. The contract separates routes, screens, shared UI, workflow patterns, external adapters, and design-system tokens so Codex or Claude Code can implement real product screens without inventing ownership boundaries.
