import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "real-verification-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");
const generatedTargetDir = path.join(workspace, "generated-frontend");
const independentGoodDir = path.join(workspace, "independent-good-target");
const independentBadDir = path.join(workspace, "independent-bad-target");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args) {
  return execFileSync("node", ["dist/cli.js", ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function runJson(args) {
  return JSON.parse(run([...args, "--json"]));
}

function runJsonMaybeFail(args) {
  try {
    return { exitCode: 0, json: runJson(args), stderr: "" };
  } catch (error) {
    const stdout = String(error.stdout ?? "");
    return {
      exitCode: typeof error.status === "number" ? error.status : 1,
      json: stdout.trim().length > 0 ? JSON.parse(stdout) : null,
      stderr: String(error.stderr ?? error.message ?? "")
    };
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeText(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${value.trimEnd()}\n`);
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function normalizeRoute(value) {
  const withoutQuery = String(value || "/").split("?")[0] || "/";
  return withoutQuery.startsWith("/") ? withoutQuery : `/${withoutQuery}`;
}

function packageJson() {
  return {
    private: true,
    scripts: {
      build: "next build",
      start: "next start",
      typecheck: "tsc --noEmit",
      "archetype:playwright": "playwright test --config=playwright.config.ts"
    },
    dependencies: {
      next: "16.2.4",
      react: "19.2.5",
      "react-dom": "19.2.5"
    },
    devDependencies: {
      "@types/node": "25.6.0",
      "@types/react": "19.2.14",
      "@types/react-dom": "19.2.3",
      "@playwright/test": "1.59.1",
      typescript: "5.9.3"
    },
    overrides: {
      postcss: "8.5.10"
    }
  };
}

function tsconfigJson() {
  return {
    compilerOptions: {
      target: "ES2022",
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: false,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: "esnext",
      moduleResolution: "bundler",
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: "react-jsx",
      incremental: true,
      plugins: [{ name: "next" }]
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
    exclude: ["node_modules"]
  };
}

function routeModel(contract) {
  const scenarios = Array.isArray(contract.scenarios) ? contract.scenarios : [];
  const routeScenarios = scenarios.filter((scenario) => scenario.type === "route");
  const stateScenarios = scenarios.filter((scenario) => scenario.type === "screen_state");
  const actionStateScenarios = scenarios.filter((scenario) => scenario.type === "action_state_policy");
  const stateByScreen = new Map();
  for (const state of stateScenarios) {
    const screenId = String(state.screen_id ?? "screen");
    const states = stateByScreen.get(screenId) ?? new Set(["default"]);
    states.add(String(state.state ?? "default"));
    stateByScreen.set(screenId, states);
  }
  for (const state of actionStateScenarios) {
    const screenId = String(state.screen_id ?? "screen");
    const states = stateByScreen.get(screenId) ?? new Set(["default"]);
    states.add(String(state.terminal_state ?? "success_confirmation"));
    stateByScreen.set(screenId, states);
  }
  return routeScenarios.map((scenario, index) => {
    const screenId = String(scenario.screen_id ?? `screen_${index + 1}`);
    return {
      path: normalizeRoute(scenario.resolved_route ?? scenario.route ?? "/"),
      route: String(scenario.route ?? "/"),
      screen_id: screenId,
      states: [...(stateByScreen.get(screenId) ?? new Set(["default"]))]
    };
  });
}

function writeSharedTargetFiles(targetDir) {
  writeJson(path.join(targetDir, "package.json"), packageJson());
  writeJson(path.join(targetDir, "tsconfig.json"), tsconfigJson());
  writeText(path.join(targetDir, "next-env.d.ts"), "/// <reference types=\"next\" />\n/// <reference types=\"next/image-types/global\" />");
  writeText(path.join(targetDir, "next.config.mjs"), [
    "const nextConfig = {",
    "  turbopack: { root: process.cwd() }",
    "};",
    "",
    "export default nextConfig;"
  ].join("\n"));
  writeText(path.join(targetDir, "src", "app", "layout.tsx"), [
    "import type { ReactNode } from \"react\";",
    "import \"./globals.css\";",
    "",
    "export default function RootLayout({ children }: { children: ReactNode }) {",
    "  return (",
    "    <html lang=\"en\">",
    "      <body>{children}</body>",
    "    </html>",
    "  );",
    "}"
  ].join("\n"));
  writeText(path.join(targetDir, "src", "app", "globals.css"), [
    "html, body { margin: 0; min-height: 100%; font-family: Arial, sans-serif; background: #0b0c10; color: #f6f7fb; }",
    "main { min-height: 100vh; box-sizing: border-box; padding: 32px; overflow-x: hidden; }",
    ".panel { border: 1px solid #2a2d37; border-radius: 12px; padding: 20px; margin-top: 16px; background: #141722; }",
    ".action-row { display: flex; flex-wrap: wrap; gap: 10px; }",
    ".action-row a { border: 1px solid #3a4050; border-radius: 999px; color: #f6f7fb; padding: 9px 12px; text-decoration: none; }",
    ".action-row a:focus-visible { outline: 2px solid #9bc4ff; outline-offset: 2px; }",
    ".eyebrow { display: block; color: #a7adbc; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }"
  ].join("\n"));
  writeText(path.join(targetDir, "playwright.config.ts"), readFileSync(path.join(outputDir, "verification", "playwright.config.ts"), "utf8"));
  writeText(
    path.join(targetDir, "tests", "e2e", "archetype-route-smoke.spec.ts"),
    readFileSync(path.join(outputDir, "verification", "playwright-verification.spec.ts"), "utf8")
  );
}

function pascalCase(value) {
  return String(value)
    .split(/[^a-zA-Z0-9]+/g)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join("") || "ArchetypeFixture";
}

function routeStatesForScreen(contract, screenId) {
  const scenarios = Array.isArray(contract.scenarios) ? contract.scenarios : [];
  return [...new Set([
    "default",
    ...scenarios
      .filter((scenario) => scenario.type === "screen_state" && scenario.screen_id === screenId)
      .map((scenario) => String(scenario.state ?? "default")),
    ...scenarios
      .filter((scenario) => scenario.type === "action_state_policy" && scenario.screen_id === screenId)
      .map((scenario) => String(scenario.terminal_state ?? "success_confirmation"))
  ])];
}

function actionContractsForScreen(actionContracts, screenId) {
  return (actionContracts.actions ?? [])
    .filter((action) => String(action.screen_id ?? "") === screenId)
    .map((action) => ({
      action_id: String(action.action_id ?? ""),
      label: String(action.label ?? action.action_id ?? "Action"),
      available_states: Array.isArray(action.availability_policy?.available_states) ? action.availability_policy.available_states.map(String) : ["default"]
    }))
    .filter((action) => action.action_id.length > 0);
}

function routePageSource(route, contract, actionContracts, acceptMalformedState) {
  const screenId = String(route.screen_id ?? "screen");
  const routePath = String(route.route ?? "/");
  const states = routeStatesForScreen(contract, screenId);
  const actions = actionContractsForScreen(actionContracts, screenId);
  return [
    "type RouteProps = {",
    "  searchParams?: Promise<Record<string, string | string[] | undefined>>;",
    "};",
    "",
    `const screenId = ${JSON.stringify(screenId)};`,
    `const routePath = ${JSON.stringify(routePath)};`,
    `const allowedStates = ${JSON.stringify(states)} as const;`,
    "type ActionFixture = { action_id: string; label: string; available_states: readonly string[] };",
    `const actions: readonly ActionFixture[] = ${JSON.stringify(actions, null, 2)};`,
    "",
    "export default async function IndependentArchetypeTarget({ searchParams }: RouteProps) {",
    "  const resolvedSearch = await searchParams;",
    "  const requestedState = typeof resolvedSearch?.archetype_state === \"string\" ? resolvedSearch.archetype_state : \"default\";",
    "  const requestedAction = typeof resolvedSearch?.archetype_action === \"string\" ? resolvedSearch.archetype_action : null;",
    acceptMalformedState
      ? "  const state = requestedState;"
      : "  const state = (allowedStates as readonly string[]).includes(requestedState) ? requestedState : \"default\";",
    "  const visibleActions = actions.filter((action) => action.available_states.includes(state));",
    "  return (",
    "    <main data-archetype-screen={screenId} data-state={state} data-route={routePath}>",
    "      <span className=\"eyebrow\">independent target</span>",
    "      <h1>{screenId.replace(/[._-]/g, \" \")}</h1>",
    "      <section className=\"panel\" role=\"status\" aria-live=\"polite\" data-archetype-state={state}>",
    "        <span className=\"eyebrow\">state</span>",
    "        <strong>{state.replace(/[_-]/g, \" \")}</strong>",
    "      </section>",
    "      <section className=\"panel action-row\" data-archetype-control-contract=\"declared-actions\">",
    "        {visibleActions.map((action) => (",
    "          <a key={action.action_id} href={`?archetype_action=${encodeURIComponent(action.action_id)}`} data-archetype-action={action.action_id}>",
    "            {action.label}",
    "          </a>",
    "        ))}",
    "      </section>",
    "      {requestedAction ? (",
    "        <section className=\"panel\" role=\"status\" aria-live=\"polite\" data-archetype-action-result={requestedAction}>",
    "          <span className=\"eyebrow\">action result</span>",
    "          <strong>{requestedAction.replace(/[._-]/g, \" \")}</strong>",
    "        </section>",
    "      ) : null}",
    "      <section className=\"panel\">",
    "        <p>This hand-written target implements the Archetype browser contract without using write-target source generation.</p>",
    "      </section>",
    "    </main>",
    "  );",
    "}"
  ].join("\n");
}

function screenSource(file) {
  const name = pascalCase(String(file.screen_id ?? "Screen"));
  return [
    `export function ${name}Screen() {`,
    "  return (",
    `    <section data-archetype-feature-screen="${String(file.screen_id ?? "screen")}" data-feature-module="${String(file.feature_module ?? "fixture")}">`,
    `      <h2>${String(file.screen_id ?? "screen").replace(/[._-]/g, " ")}</h2>`,
    "    </section>",
    "  );",
    "}"
  ].join("\n");
}

function componentSource(file) {
  const name = pascalCase(String(file.component ?? path.basename(String(file.path ?? "Component"), ".tsx")));
  return [
    `export function ${name}() {`,
    `  return <section data-archetype-component="${path.basename(String(file.path ?? "component"), ".tsx")}">${name}</section>;`,
    "}"
  ].join("\n");
}

function patternSource(file) {
  const name = pascalCase(String(file.pattern ?? path.basename(String(file.path ?? "Pattern"), ".tsx")));
  return [
    `export function ${name}() {`,
    `  return <section data-archetype-pattern="${path.basename(String(file.path ?? "pattern"), ".tsx")}">${name}</section>;`,
    "}"
  ].join("\n");
}

function testTraceSource() {
  const testFirst = readJson(path.join(outputDir, "test-first", "test-first-contract.json"));
  const actions = readJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"));
  const testIds = (testFirst.suites ?? []).flatMap((suite) => (suite.tests ?? []).map((test) => String(test.test_id ?? ""))).filter(Boolean);
  const actionIds = (actions.actions ?? []).map((action) => String(action.action_id ?? "")).filter(Boolean);
  return [
    "/*",
    "Archetype test-first traceability fixture.",
    "Test IDs:",
    ...testIds.map((testId) => `- ${testId}`),
    "Action IDs:",
    ...actionIds.map((actionId) => `- ${actionId}`),
    "*/",
    "export {};"
  ].join("\n");
}

function writeIndependentTarget(targetDir, contract, acceptMalformedState) {
  rmSync(targetDir, { recursive: true, force: true });
  const routes = routeModel(contract);
  assert(routes.length > 0, "Independent target requires route scenarios.");
  writeSharedTargetFiles(targetDir);
  const manifest = readJson(path.join(outputDir, "12-target-frontend", "source-file-manifest.json"));
  const routeMap = readJson(path.join(outputDir, "12-target-frontend", "route-component-map.json"));
  const actionContracts = readJson(path.join(outputDir, "06-frontend-agent-contract", "action-contracts.json"));
  const routeByFile = new Map((routeMap.routes ?? []).map((route) => [String(route.route_file ?? ""), route]));
  const traceSource = testTraceSource();
  for (const file of manifest.files ?? []) {
    const relativePath = String(file.path ?? "");
    if (relativePath.length === 0) continue;
    const absolutePath = path.join(targetDir, relativePath);
    if (relativePath === "package.json" || relativePath === "tsconfig.json") continue;
    if (relativePath === "next-env.d.ts" || relativePath === "next.config.mjs" || relativePath === "src/app/layout.tsx" || relativePath === "src/app/globals.css" || relativePath === "playwright.config.ts" || relativePath === "tests/e2e/archetype-route-smoke.spec.ts") continue;
    if (file.kind === "route") {
      writeText(absolutePath, routePageSource(routeByFile.get(relativePath) ?? file, contract, actionContracts, acceptMalformedState));
    } else if (file.kind === "screen") {
      writeText(absolutePath, screenSource(file));
    } else if (file.kind === "component") {
      writeText(absolutePath, componentSource(file));
    } else if (file.kind === "pattern") {
      writeText(absolutePath, patternSource(file));
    } else if (String(file.kind).includes("test") || relativePath.endsWith(".spec.ts")) {
      writeText(absolutePath, traceSource);
    } else if (relativePath.endsWith(".css")) {
      writeText(absolutePath, readFileSync(path.join(targetDir, "src", "app", "globals.css"), "utf8"));
    } else {
      writeText(absolutePath, "export {};");
    }
  }
}

function writeIndependentGoodTarget(targetDir, contract) {
  writeIndependentTarget(targetDir, contract, false);
}

function writeIndependentBadTarget(targetDir, contract) {
  writeIndependentTarget(targetDir, contract, true);
}

createApprovedIntakeFixture({ root, workspace, approvedInputPath, approvedBy: "Real verification contract" });

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(["success", "warning"].includes(generate.status), "Real verification fixture generation should succeed or warn.");
assert(generate.readyForFrontendAgent === true, "Real verification fixture should be implementation-authorized.");

const contract = readJson(path.join(outputDir, "verification", "playwright-verification-contract.json"));
assert(contract.coverage?.malformed_data_scenarios > 0, "Playwright contract must contain malformed-data scenarios.");

const writeTarget = runJson(["write-target", "--out", outputDir, "--target", generatedTargetDir, "--force"]);
assert(writeTarget.status === "pass", "Generated target should materialize before verification.");
const generatedVerify = runJson(["verify-target", "--out", outputDir, "--target", generatedTargetDir]);
assert(generatedVerify.status === "pass", "Generated scaffold should pass runtime verification.");

const generatedEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(generatedEvidence.status === "pass", "Generated scaffold should write passing evidence.");
assert(generatedEvidence.evidence_grades?.runtime_overall === "pass", "Runtime evidence grade should pass for generated target.");
assert(generatedEvidence.evidence_grades?.production_integrated === "pending", "Production integration must remain pending after scaffold verification.");
assert(generatedEvidence.scenario_summary?.contract_scenarios === contract.coverage.total_scenarios, "Scenario summary should cover every contract scenario.");
assert(generatedEvidence.scenario_results?.length === contract.coverage.total_scenarios, "Evidence should ingest one result per scenario.");
assert(generatedEvidence.scenario_results.some((result) => result.type === "malformed_data" && result.status === "pass"), "Malformed-data scenario must execute and pass.");
assert(generatedEvidence.evidence_grades?.accessibility_verified === "pass", "Accessibility evidence grade should pass.");
assert(generatedEvidence.evidence_grades?.visual_verified === "pass", "Visual evidence grade should pass.");
assert(generatedEvidence.visual_screenshot_summary?.length === contract.coverage.visual_smoke_scenarios, "Visual proof should name every screenshot scenario.");

writeIndependentGoodTarget(independentGoodDir, contract);
const independentGoodVerify = runJson(["verify-target", "--out", outputDir, "--target", independentGoodDir]);
assert(independentGoodVerify.status === "pass", "Independent hand-written target should pass the contract.");
const independentGoodEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(independentGoodEvidence.status === "pass", "Independent passing target should write passing evidence.");
assert(independentGoodEvidence.evidence_grades?.runtime_overall === "pass", "Independent target runtime grade should pass.");

writeIndependentBadTarget(independentBadDir, contract);
const independentBadVerify = runJsonMaybeFail(["verify-target", "--out", outputDir, "--target", independentBadDir]);
assert(independentBadVerify.exitCode === 1, "Independent bad target should fail verify-target.");
assert(independentBadVerify.json?.status === "fail", "Independent bad target JSON should report fail.");
const independentBadEvidence = readJson(path.join(outputDir, "verification", "playwright-evidence.json"));
assert(independentBadEvidence.status === "fail", "Independent bad target should write failing evidence.");
assert(independentBadEvidence.evidence_grades?.runtime_overall === "fail", "Independent bad target runtime grade should fail.");
assert(independentBadEvidence.scenario_results.some((result) => result.status === "fail"), "Independent bad target should produce failed per-scenario evidence.");
assert(independentBadEvidence.blockers.some((blocker) => String(blocker).includes("Browser") || String(blocker).includes("Accessibility") || String(blocker).includes("Malformed")), "Independent bad target blockers should explain failed proof category.");

const summary = {
  status: "pass",
  outputDir,
  generatedTargetDir,
  independentGoodDir,
  independentBadDir,
  scenarios: contract.coverage.total_scenarios,
  malformedDataScenarios: contract.coverage.malformed_data_scenarios,
  generatedRuntimeGrade: generatedEvidence.evidence_grades.runtime_overall,
  independentGoodRuntimeGrade: independentGoodEvidence.evidence_grades.runtime_overall,
  independentBadRuntimeGrade: independentBadEvidence.evidence_grades.runtime_overall
};
writeJson(path.join(workspace, "real-verification-contract-summary.json"), summary);
console.log(JSON.stringify(summary, null, 2));
