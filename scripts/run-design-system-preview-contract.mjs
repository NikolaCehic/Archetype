import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

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
  assert(existsSync(draftPath), `${label}: design draft must exist.`);
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
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-system-preview"), `${label}: manifest missing design-system-preview.`);
  assert(manifest.artifacts?.some((artifact) => artifact.id === "design-system-review"), `${label}: manifest missing design-system-review.`);
  assert(internalManifest.artifact_index?.includes("draft/design-system-preview.html"), `${label}: internal manifest missing preview.`);
  assert(internalManifest.artifact_index?.includes("draft/design-system-review.md"), `${label}: internal manifest missing review.`);
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

const baseInput = readJson(path.join(root, "examples", "saas-dashboard-intake.json"));
writeFileSync(approvedInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Design preview contract",
    approvedAt: "2026-05-07T00:00:00.000Z",
    artifactRefs: [
      "draft/contract-approval-request.json",
      "draft/design-system.draft.json",
      "draft/design-system-preview.html"
    ]
  }
}, null, 2)}\n`);
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
    "draft/design-system-preview.html",
    "draft/design-system-review.md"
  ]
};
writeFileSync(path.join(workspace, "design-system-preview-summary.json"), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
