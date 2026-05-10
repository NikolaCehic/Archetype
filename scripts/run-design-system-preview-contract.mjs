import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const root = process.cwd();
const workspace = path.join(root, "tmp", "design-system-preview-contract");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const approvedOutputDir = path.join(workspace, "approved-output");

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
    return { exitCode: 0, json: runJson(args) };
  } catch (error) {
    const stdout = String(error.stdout ?? "");
    return {
      exitCode: Number(error.status ?? 1),
      json: stdout ? JSON.parse(stdout) : null
    };
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function assertPreview(outputDir, label) {
  const previewPath = path.join(outputDir, "draft", "design-system-preview.html");
  const reviewPath = path.join(outputDir, "draft", "design-system-review.md");
  const draftPath = path.join(outputDir, "draft", "design-system.draft.json");
  const directionsPath = path.join(outputDir, "draft", "design-directions.json");
  const gatePath = path.join(outputDir, "draft", "design-quality-gate.json");
  const rubricPath = path.join(outputDir, "draft", "design-craft-rubric.md");
  assert(existsSync(draftPath), `${label}: design draft must exist.`);
  assert(existsSync(directionsPath), `${label}: design directions must exist.`);
  assert(existsSync(gatePath), `${label}: design quality gate must exist.`);
  assert(existsSync(rubricPath), `${label}: design craft rubric must exist.`);
  assert(existsSync(previewPath), `${label}: preview HTML must exist.`);
  assert(existsSync(reviewPath), `${label}: review markdown must exist.`);

  const preview = readFileSync(previewPath, "utf8");
  const review = readFileSync(reviewPath, "utf8");
  for (const expected of [
    "data-archetype-artifact=\"draft-design-system-preview\"",
    "data-source-artifact=\"draft/design-system.draft.json\"",
    "data-source-scope=\"HL-17\"",
    "Colors",
    "Typography",
    "Design Directions",
    "Design Quality Gate",
    "Anti-Slop Rules",
    "Source strength",
    "Source signature",
    "Components",
    "Component States",
    "Token Tables",
    "Full Draft Contract Data",
    "not app code",
    "not the source of truth"
  ]) {
    assert(preview.includes(expected), `${label}: preview missing ${expected}.`);
  }
  assert(!/<script\b/i.test(preview), `${label}: preview must be static and script-free.`);
  for (const expected of [
    "Source scope: HL-17",
    "draft/design-system.draft.json",
    "draft/design-system-preview.html",
    "one clarification question",
    "No implementation agent may build product UI from this preview alone."
  ]) {
    assert(review.includes(expected), `${label}: review markdown missing ${expected}.`);
  }

  const manifest = readJson(path.join(outputDir, "manifest.json"));
  const internalManifest = readJson(path.join(outputDir, "00-manifest", "manifest.json"));
  const directions = readJson(directionsPath);
  const gate = readJson(gatePath);
  const rubric = readFileSync(rubricPath, "utf8");
  assert(Array.isArray(directions) && directions.length >= 3, `${label}: design directions must expose at least three options.`);
  assert(directions.every((direction) => String(direction.id ?? "").startsWith("direction-signaldesk-")), `${label}: design directions must be source-derived for the product, not global presets.`);
  assert(directions.every((direction) => direction.source_signature && direction.source_strength && Array.isArray(direction.derived_from) && direction.derived_from.includes("source_user_context")), `${label}: design directions must expose source bindings.`);
  assert(directions.every((direction) => Array.isArray(direction.material_alignment) && direction.material_alignment.length > 0 && Array.isArray(direction.route_screen_alignment) && direction.route_screen_alignment.length > 0), `${label}: design directions must expose material and route alignment.`);
  assert(!directions.some((direction) => ["Graphite Command Surface", "Editorial Workbench", "Instrument Panel"].includes(String(direction.name))), `${label}: design directions must not use reusable demo names.`);
  assert(gate.source_scope === "design-quality-gate", `${label}: design quality gate must identify source scope.`);
  assert(gate.status === "pass", `${label}: design quality gate must pass.`);
  assert(gate.selected_direction_id && directions.some((direction) => direction.id === gate.selected_direction_id), `${label}: selected direction must resolve.`);
  assert(gate.implementation_blocked_until_human_review === true, `${label}: design quality gate must block implementation until human review.`);
  assert(gate.shadcn_tailwind_policy?.shadcn_required === true, `${label}: design gate must require shadcn.`);
  assert(gate.shadcn_tailwind_policy?.tailwind_required === true, `${label}: design gate must require Tailwind.`);
  assert(gate.anti_slop_rules?.some((rule) => rule.includes("No default blue-gray SaaS palette")), `${label}: anti-slop rules must reject blue-gray SaaS.`);
  assert(gate.anti_slop_rules?.some((rule) => rule.includes("No reusable Archetype demo directions")), `${label}: anti-slop rules must reject reusable demo directions.`);
  assert(gate.checks?.some((check) => check.id === "DQ-08" && check.status === "pass"), `${label}: design gate must prove source-bound directions.`);
  assert(gate.checks?.some((check) => check.id === "DQ-09" && check.status === "pass"), `${label}: design gate must block preset directions.`);
  assert(rubric.includes("Visual Craft Rubric") && rubric.includes("Default blue-gray SaaS") && rubric.includes("shadcn defaults"), `${label}: rubric must encode visual craft blockers.`);
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-system-preview"), `${label}: manifest missing design-system-preview.`);
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-system-review"), `${label}: manifest missing design-system-review.`);
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-directions"), `${label}: manifest missing design-directions.`);
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-quality-gate"), `${label}: manifest missing design-quality-gate.`);
  assert(internalManifest.artifact_index?.includes("draft/design-system-preview.html"), `${label}: internal manifest missing preview.`);
  assert(internalManifest.artifact_index?.includes("draft/design-system-review.md"), `${label}: internal manifest missing review.`);
  assert(internalManifest.artifact_index?.includes("draft/design-directions.json"), `${label}: internal manifest missing directions.`);
  assert(internalManifest.artifact_index?.includes("draft/design-quality-gate.json"), `${label}: internal manifest missing quality gate.`);
}

const draftGenerate = runJson(["generate", "--input", "examples/saas-dashboard-intake.json", "--out", draftOutputDir]);
assert(draftGenerate.packageType === "draft_contract", "unapproved fixture should generate draft contract.");
assertPreview(draftOutputDir, "draft");

const summary = runJson(["summarize", "--out", draftOutputDir]);
assert(summary.entrypoints.includes("draft/design-system-preview.html"), "summarize must expose preview HTML.");
assert(summary.entrypoints.includes("draft/design-system-review.md"), "summarize must expose review markdown.");
assert(runJson(["validate", "--out", draftOutputDir]).status === "pass", "draft package with preview must validate.");

const previewPath = path.join(draftOutputDir, "draft", "design-system-preview.html");
const originalPreview = readFileSync(previewPath, "utf8");
writeFileSync(previewPath, originalPreview.replace("data-source-artifact=\"draft/design-system.draft.json\"", "data-source-artifact=\"missing\""));
const failedPreviewValidate = runJsonMaybeFail(["validate", "--out", draftOutputDir]);
assert(failedPreviewValidate.exitCode === 1, "validate must fail when preview loses source-artifact traceability.");
assert(failedPreviewValidate.json?.blockers?.some((blocker) => String(blocker).includes("data-source-artifact")), "validate should name missing preview traceability.");
writeFileSync(previewPath, originalPreview);
rmSync(previewPath);
const missingPreviewValidate = runJsonMaybeFail(["validate", "--out", draftOutputDir]);
assert(missingPreviewValidate.exitCode === 1, "validate must fail when preview HTML is missing.");
assert(missingPreviewValidate.json?.blockers?.some((blocker) => String(blocker).includes("draft/design-system-preview.html")), "validate should name missing preview HTML.");

createApprovedIntakeFixture({
  root,
  workspace,
  approvedInputPath,
  approvedBy: "Design preview contract",
  approvedAt: "2026-05-07T00:00:00.000Z"
});
const approvedGenerate = runJson(["generate", "--input", approvedInputPath, "--out", approvedOutputDir]);
assert(approvedGenerate.readyForFrontendAgent === true, "approved fixture should be ready for implementation.");
assertPreview(approvedOutputDir, "approved");
assert(runJson(["validate", "--out", approvedOutputDir]).status === "pass", "approved package with preview must validate.");

const result = {
  status: "pass",
  draftOutputDir,
  approvedOutputDir,
  artifacts: [
    "draft/design-system.draft.json",
    "draft/design-directions.json",
    "draft/design-quality-gate.json",
    "draft/design-craft-rubric.md",
    "draft/design-system-preview.html",
    "draft/design-system-review.md"
  ]
};
writeFileSync(path.join(workspace, "design-system-preview-summary.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
