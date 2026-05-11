import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { buildTargetFrontendArtifacts } = require("../dist/modules/targetFrontend.js");
const { writeTargetFrontendSource } = require("../dist/output/writeTargetFrontend.js");

const root = process.cwd();
const workspace = path.join(root, "tmp", "target-stack-manifest-contract");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function buildArtifacts(stack) {
  return buildTargetFrontendArtifacts({
    experience: {
      screenSpecs: [
        {
          screen_id: "board.overview",
          route: "/",
          states: { default: {}, loading: {}, empty: {}, error: {} },
          required_components: ["Task Card", "Agent Lane"],
          required_patterns: ["Agent Swimlane"],
          data_needs: ["Task"],
          actions: [],
          evidence_refs: ["test_stack_contract"]
        },
        {
          screen_id: "task.detail",
          route: "/tasks/:taskId",
          states: { default: {}, loading: {}, permission_denied: {} },
          required_components: ["Task Detail Drawer"],
          required_patterns: ["Task Review"],
          data_needs: ["Task"],
          actions: [],
          evidence_refs: ["test_stack_contract"]
        }
      ]
    },
    designSystem: {
      componentContracts: {
        contracts: [
          { name: "Task Card" },
          { name: "Agent Lane" },
          { name: "Task Detail Drawer" }
        ]
      },
      patternContracts: {
        contracts: [
          { name: "Agent Swimlane" },
          { name: "Task Review" }
        ]
      }
    },
    frontendContract: {
      buildManifest: {
        frontend_stack: stack,
        build_order: ["install_target_stack", "create_verification_tests", "install_design_system_tokens"],
        entry_routes: ["/", "/tasks/:taskId"],
        forbidden_behavior: ["Do not drift from the selected target stack."]
      },
      dataOperationContracts: { queries: [], mutations: [] },
      actionContracts: { actions: [] },
      formContracts: { forms: [] },
      verificationContracts: { test_suites: [{ suite_id: "route_smoke", tests: [{ id: "loads" }] }] },
      productionIntegrationContracts: {}
    }
  });
}

function pathsFor(artifacts) {
  return new Set((artifacts.sourceFileManifest.files ?? []).map((file) => String(file.path)));
}

function assertViteManifest(artifacts, label) {
  const paths = pathsFor(artifacts);
  assert(artifacts.sourceFileManifest.target_stack.resolved_source_target === "vite_react_router", `${label}: resolved target should be Vite/React Router.`);
  assert(artifacts.sourceFileManifest.architecture.layers.routing === "src/routes + src/App.tsx", `${label}: routing layer should be Vite/React Router.`);
  for (const required of ["vite.config.ts", "index.html", "src/main.tsx", "src/App.tsx", "src/index.css", "src/routes/board-overview.tsx", "src/routes/task-detail.tsx"]) {
    assert(paths.has(required), `${label}: missing ${required}.`);
  }
  for (const forbidden of ["next.config.mjs", "next-env.d.ts", "src/app/page.tsx", "src/app/tasks/[taskId]/page.tsx", "src/app/layout.tsx", "src/app/globals.css"]) {
    assert(!paths.has(forbidden), `${label}: must not emit Next-only file ${forbidden}.`);
  }
  assert((artifacts.routeComponentMap.routes ?? []).every((route) => String(route.route_file).startsWith("src/routes/")), `${label}: route map must point to src/routes.`);
  const installTask = (artifacts.codegenTasks.tasks ?? []).find((task) => task.task_id === "install_target_stack");
  assert(installTask?.writes.includes("vite.config.ts"), `${label}: install task must write vite.config.ts.`);
  assert(installTask?.writes.includes("src/main.tsx"), `${label}: install task must write src/main.tsx.`);
}

function assertNextManifest(artifacts) {
  const paths = pathsFor(artifacts);
  assert(artifacts.sourceFileManifest.target_stack.resolved_source_target === "next_app_router", "Next: resolved target should be Next App Router.");
  assert(artifacts.sourceFileManifest.architecture.layers.routing === "src/app", "Next: routing layer should be src/app.");
  for (const required of ["next.config.mjs", "next-env.d.ts", "src/app/page.tsx", "src/app/tasks/[taskId]/page.tsx", "src/app/layout.tsx", "src/app/globals.css"]) {
    assert(paths.has(required), `Next: missing ${required}.`);
  }
  for (const forbidden of ["vite.config.ts", "index.html", "src/main.tsx", "src/App.tsx", "src/index.css", "src/routes/board-overview.tsx"]) {
    assert(!paths.has(forbidden), `Next: must not emit Vite-only file ${forbidden}.`);
  }
  assert((artifacts.routeComponentMap.routes ?? []).every((route) => String(route.route_file).startsWith("src/app/")), "Next: route map must point to src/app.");
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function writeFixtureOutput(outputDir, artifacts) {
  writeJson(path.join(outputDir, "manifest.json"), {
    implementationAuthorized: true,
    contractApproval: { status: "approved" }
  });
  writeJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"), artifacts.sourceFileManifest);
  writeJson(path.join(outputDir, "12-target-frontend", "route-component-map.json"), artifacts.routeComponentMap);
  writeText(path.join(outputDir, "12-target-frontend", "adapter-interfaces.ts"), artifacts.adapterInterfaceSource);
  writeText(path.join(outputDir, "04-design-system", "tokens", "css-variables.css"), ":root { --color-text-primary: #111827; --color-text-muted: #4b5563; --color-border-subtle: #d1d5db; --color-surface: #f9fafb; --space-3: 12px; --space-4: 16px; --space-5: 20px; --space-6: 24px; --radius-md: 8px; }");
  writeText(path.join(outputDir, "04-design-system", "tokens", "typography.css"), ":root { --font-sans: Inter, system-ui, sans-serif; } body { font-family: var(--font-sans); }");
  writeText(path.join(outputDir, "04-design-system", "tokens", "tailwind.config.ts"), "export default {};");
  writeJson(path.join(outputDir, "06-frontend-agent-contract", "data-operation-contracts.json"), { queries: [], mutations: [] });
  writeJson(path.join(outputDir, "06-frontend-agent-contract", "production-integration-contracts.json"), { content_brand: { copy_surfaces: [] } });
  writeJson(path.join(outputDir, "02-product-model", "permission-matrix.json"), { permissions: [] });
  writeText(path.join(outputDir, "verification", "playwright.config.ts"), "export default {};");
  writeText(path.join(outputDir, "verification", "playwright-verification.spec.ts"), "export {};");
  writeJson(path.join(outputDir, "test-first", "test-first-contract.json"), {
    required_target_test_files: [],
    suites: []
  });
  writeText(path.join(outputDir, "test-first", "playwright-contract.spec.ts"), "import { test } from \"@playwright/test\";\ntest.describe(\"target-stack fixture\", () => {});");
  writeText(path.join(outputDir, "test-first", "vitest-contract.spec.ts"), "import { describe } from \"vitest\";\ndescribe(\"target-stack fixture\", () => {});");
  writeJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"), { actions: [] });
}

const explicitVite = buildArtifacts({
  framework: "Vite + React",
  language: "TypeScript",
  styling: "Tailwind CSS + shadcn/ui",
  routing: "React Router"
});
const defaultStack = buildArtifacts({});
const partialVite = buildArtifacts({
  framework: "Vite + React",
  language: "TypeScript",
  styling: "Tailwind CSS + shadcn/ui"
});
const inferredReactRouter = buildArtifacts({
  framework: "React",
  language: "TypeScript",
  styling: "Tailwind CSS",
  routing: "React Router or target app router"
});
const next = buildArtifacts({
  framework: "React",
  language: "TypeScript",
  styling: "Tailwind CSS",
  routing: "Next.js App Router"
});

assertViteManifest(explicitVite, "explicit Vite");
assertViteManifest(defaultStack, "default stack");
assertViteManifest(partialVite, "partial Vite stack");
assertViteManifest(inferredReactRouter, "React Router inference");
assertNextManifest(next);

const writerOutputDir = path.join(workspace, "vite-output");
const writerTargetDir = path.join(workspace, "vite-target");
writeFixtureOutput(writerOutputDir, explicitVite);
const writerResult = writeTargetFrontendSource(writerOutputDir, writerTargetDir, { force: true });
assert(writerResult.status === "pass", "Vite write-target should pass.");
assert(writerResult.files.includes("vite.config.ts"), "Vite write-target should write vite.config.ts.");
assert(writerResult.files.includes("src/App.tsx"), "Vite write-target should write src/App.tsx.");
assert(!writerResult.files.includes("next.config.mjs"), "Vite write-target must not write next.config.mjs.");

const summary = {
  status: "pass",
  explicitViteFiles: explicitVite.sourceFileManifest.file_count,
  defaultStackFiles: defaultStack.sourceFileManifest.file_count,
  partialViteFiles: partialVite.sourceFileManifest.file_count,
  inferredReactRouterFiles: inferredReactRouter.sourceFileManifest.file_count,
  nextFiles: next.sourceFileManifest.file_count,
  viteWriterFiles: writerResult.filesWritten
};
writeFileSync(path.join(workspace, "target-stack-manifest-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
