import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { auditTargetContractFidelity } = require("../dist/output/verifyTargetFrontend.js");

const root = process.cwd();
const workspace = path.join(root, "tmp", "contract-fidelity-contract");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "target");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function writeText(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeFixture() {
  writeJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"), {
    manifest_version: "1.0",
    target_stack: {
      framework: "Vite + React",
      routing: "React Router",
      resolved_source_target: "vite_react_router",
      forbidden_stack_files: ["next.config.mjs", "next-env.d.ts", "src/app/**"]
    },
    file_count: 8,
    files: [
      { path: "package.json", kind: "project_config" },
      { path: "vite.config.ts", kind: "project_config" },
      { path: "src/routes/board-overview.tsx", kind: "route", route: "/", screen_id: "board.overview", screen_file: "src/features/board-overview/screens/BoardOverviewScreen.tsx" },
      { path: "src/features/board-overview/screens/BoardOverviewScreen.tsx", kind: "screen", screen_id: "board.overview" },
      { path: "src/shared/ui/task-card.tsx", kind: "component", component: "Task Card" },
      { path: "src/features/workflows/patterns/agent-swimlane.tsx", kind: "pattern", pattern: "Agent Swimlane" },
      { path: "tests/e2e/archetype-route-smoke.spec.ts", kind: "test", suite_id: "route_smoke" },
      { path: "tests/integration/archetype-contracts.spec.ts", kind: "test", suite_id: "contract_integration" }
    ],
    coverage: { routes: 1, screens: 1, components: 1, patterns: 1, tests: 2 },
    blockers: [],
    warnings: []
  });
  writeJson(path.join(outputDir, "12-target-frontend", "route-component-map.json"), {
    contract_version: "1.0",
    routes: [
      {
        route: "/",
        screen_id: "board.overview",
        route_file: "src/routes/board-overview.tsx",
        screen_file: "src/features/board-overview/screens/BoardOverviewScreen.tsx"
      }
    ]
  });
  writeJson(path.join(outputDir, "test-first", "test-first-contract.json"), {
    contract_version: "1.0",
    required_target_test_files: [
      { path: "tests/e2e/archetype-route-smoke.spec.ts" },
      { path: "tests/integration/archetype-contracts.spec.ts" }
    ],
    suites: [
      {
        suite_id: "route_smoke",
        tests: [
          { test_id: "smoke.board-overview" }
        ]
      },
      {
        suite_id: "contract_integration",
        tests: [
          { test_id: "integration.action.board-run", action_id: "board.overview.run" }
        ]
      }
    ]
  });
  writeJson(path.join(outputDir, "verification", "playwright-verification-contract.json"), {
    contract_version: "1.0",
    scenarios: [
      { scenario_id: "PW-ROUTE-001", type: "route" },
      { scenario_id: "PW-STATE-001-01", type: "screen_state" },
      { scenario_id: "PW-FLOW-001", type: "flow" },
      { scenario_id: "PW-RESP-001-desktop", type: "responsive" },
      { scenario_id: "PW-A11Y-001", type: "accessibility" },
      { scenario_id: "PW-INTERACTION-001", type: "interaction_state" },
      { scenario_id: "PW-VISUAL-001-desktop", type: "visual_smoke" },
      { scenario_id: "PW-MALFORMED-001", type: "malformed_data" }
    ]
  });
  writeJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"), {
    contract_version: "1.0",
    actions: [
      { action_id: "board.overview.run", screen_id: "board.overview" }
    ]
  });

  writeText(path.join(targetDir, "package.json"), "{\"private\":true}");
  writeText(path.join(targetDir, "vite.config.ts"), "export default {};");
  writeText(path.join(targetDir, "src/routes/board-overview.tsx"), "import { BoardOverviewScreen } from '../features/board-overview/screens/BoardOverviewScreen'; export default function BoardOverviewRoute(){ return <main data-archetype-screen=\"board.overview\"><BoardOverviewScreen /></main>; }");
  writeText(path.join(targetDir, "src/features/board-overview/screens/BoardOverviewScreen.tsx"), "export function BoardOverviewScreen(){ return <section data-archetype-feature-screen=\"board.overview\">Board overview</section>; }");
  writeText(path.join(targetDir, "src/shared/ui/task-card.tsx"), "export function TaskCard(){ return <article data-archetype-component=\"task-card\">Task</article>; }");
  writeText(path.join(targetDir, "src/features/workflows/patterns/agent-swimlane.tsx"), "export function AgentSwimlane(){ return <section data-archetype-pattern=\"agent-swimlane\">Lane</section>; }");
  writeText(path.join(targetDir, "tests/e2e/archetype-route-smoke.spec.ts"), "test('smoke.board-overview', async () => {});");
  writeText(path.join(targetDir, "tests/integration/archetype-contracts.spec.ts"), "test('integration.action.board-run covers board.overview.run', () => {});");
}

writeFixture();
const passing = auditTargetContractFidelity(outputDir, targetDir);
assert(passing.status === "pass", `Expected passing contract fidelity audit, got ${JSON.stringify(passing.blockers)}`);

writeText(path.join(targetDir, "src/app/page.tsx"), "export default function Drift(){ return null; }");
const forbiddenDrift = auditTargetContractFidelity(outputDir, targetDir);
assert(forbiddenDrift.status === "fail", "Forbidden stack file should fail contract fidelity.");
assert(forbiddenDrift.blockers.some((blocker) => blocker.includes("source_manifest.forbidden_stack_files_absent")), "Forbidden stack blocker should be named.");

rmSync(path.join(targetDir, "src/app"), { recursive: true, force: true });
writeText(path.join(targetDir, "tests/integration/archetype-contracts.spec.ts"), "test('generic integration passes', () => {});");
const missingActionTrace = auditTargetContractFidelity(outputDir, targetDir);
assert(missingActionTrace.status === "fail", "Missing action and test ids should fail contract fidelity.");
assert(missingActionTrace.blockers.some((blocker) => blocker.includes("test_first.required_test_ids_present")), "Missing test id blocker should be named.");
assert(missingActionTrace.blockers.some((blocker) => blocker.includes("action_contracts.test_traceability")), "Missing action trace blocker should be named.");

writeText(path.join(targetDir, "tests/integration/archetype-contracts.spec.ts"), "test('integration.action.board-run covers board.overview.run', () => {});");
writeText(path.join(targetDir, "src/routes/board-overview.tsx"), "export default function BoardOverviewRoute(){ return <main />; }");
const routeDrift = auditTargetContractFidelity(outputDir, targetDir);
assert(routeDrift.status === "fail", "Route without screen trace should fail contract fidelity.");
assert(routeDrift.blockers.some((blocker) => blocker.includes("route_component_map.route_traceability")), "Route trace blocker should be named.");

const summary = {
  status: "pass",
  passingChecks: passing.checks.length,
  forbiddenStackBlockers: forbiddenDrift.blockers.length,
  missingActionBlockers: missingActionTrace.blockers.length,
  routeDriftBlockers: routeDrift.blockers.length
};
writeJson(path.join(workspace, "contract-fidelity-contract-summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
