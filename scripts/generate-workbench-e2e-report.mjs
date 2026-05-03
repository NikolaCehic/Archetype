import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const artifactDir = path.join(root, "tmp", "workbench-ui-e2e");
const scenariosPath = path.join(root, "tests", "workbench", "malformed-scenarios.json");
const playwrightPath = path.join(artifactDir, "playwright-results.json");

fs.mkdirSync(artifactDir, { recursive: true });

const scenarios = readJson(scenariosPath, []);
const playwright = readJson(playwrightPath, null);
const tests = playwright ? flattenSuites(playwright.suites ?? []) : [];
const scenarioResults = scenarios.map((scenario) => {
  const test = tests.find((item) => item.title.includes(`malformed ${scenario.id}:`));
  return {
    id: scenario.id,
    title: scenario.title,
    flow: scenario.flow,
    risk: scenario.risk,
    malformedData: scenario.malformedData,
    expectedText: scenario.expectedText,
    status: test?.status ?? "not-run",
    durationMs: test?.durationMs ?? 0,
    error: test?.error ?? null
  };
});

const suiteSummary = summarizeTests(tests);
const generatedAt = new Date().toISOString();

fs.writeFileSync(
  path.join(artifactDir, "malformed-scenarios.json"),
  `${JSON.stringify({ generatedAt, count: scenarios.length, scenarios }, null, 2)}\n`
);

fs.writeFileSync(
  path.join(artifactDir, "malformed-scenario-results.json"),
  `${JSON.stringify({ generatedAt, summary: summarizeScenarioResults(scenarioResults), results: scenarioResults }, null, 2)}\n`
);

fs.writeFileSync(
  path.join(artifactDir, "malformed-scenario-results.md"),
  scenarioMarkdown(generatedAt, scenarioResults)
);

fs.writeFileSync(
  path.join(artifactDir, "ui-test-suite.md"),
  suiteMarkdown(generatedAt, suiteSummary, tests)
);

console.log(`Workbench E2E artifacts written to ${path.relative(root, artifactDir)}`);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function flattenSuites(suites) {
  return suites.flatMap((suite) => [
    ...(suite.specs ?? []).map(specToResult),
    ...flattenSuites(suite.suites ?? [])
  ]);
}

function specToResult(spec) {
  const allResults = (spec.tests ?? []).flatMap((test) => test.results ?? []);
  const statuses = allResults.map((result) => result.status);
  const failed = allResults.find((result) => result.status !== "passed");
  return {
    title: spec.title,
    file: spec.file,
    status: spec.ok === true && statuses.every((status) => status === "passed") ? "passed" : failed?.status ?? "failed",
    durationMs: allResults.reduce((sum, result) => sum + (result.duration ?? 0), 0),
    error: failed?.error?.message ?? failed?.errors?.[0]?.message ?? null
  };
}

function summarizeTests(tests) {
  return {
    total: tests.length,
    passed: tests.filter((test) => test.status === "passed").length,
    failed: tests.filter((test) => test.status !== "passed").length,
    durationMs: tests.reduce((sum, test) => sum + test.durationMs, 0)
  };
}

function summarizeScenarioResults(results) {
  return {
    total: results.length,
    passed: results.filter((result) => result.status === "passed").length,
    failed: results.filter((result) => result.status !== "passed").length
  };
}

function scenarioMarkdown(generatedAt, results) {
  const summary = summarizeScenarioResults(results);
  return [
    "# Workbench Malformed-Data E2E Results",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Scenarios: ${summary.total}`,
    `Passed: ${summary.passed}`,
    `Needs attention: ${summary.failed}`,
    "",
    "| ID | Flow | Status | Expected signal | Risk |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((result) => `| ${escapeCell(result.id)} | ${escapeCell(result.flow)} | ${escapeCell(result.status)} | ${escapeCell(result.expectedText)} | ${escapeCell(result.risk)} |`),
    ""
  ].join("\n");
}

function suiteMarkdown(generatedAt, summary, tests) {
  return [
    "# Workbench UI Test Suite",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Tests: ${summary.total}`,
    `Passed: ${summary.passed}`,
    `Failed: ${summary.failed}`,
    `Duration: ${summary.durationMs}ms`,
    "",
    "## Coverage",
    "",
    "- Full navigation shell across every Workbench view.",
    "- AI-readable selectors and actions exposed through `data-agent-view` and `data-agent-action`.",
    "- Human workflow for saving, validating, composing source/gap/revision records, and exporting handoff JSON.",
    "- 20 malformed-data scenarios across generation, source intake, workspace import, state restore, contract gaps, and revision requests.",
    "",
    "## Test Inventory",
    "",
    "| Status | Test | Duration | Error |",
    "| --- | --- | ---: | --- |",
    ...tests.map((test) => `| ${escapeCell(test.status)} | ${escapeCell(test.title)} | ${test.durationMs}ms | ${escapeCell(test.error ?? "")} |`),
    ""
  ].join("\n");
}

function escapeCell(value) {
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>")
    .trim();
}
