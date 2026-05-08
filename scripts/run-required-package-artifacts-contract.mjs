import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { createApprovedIntakeFixture } from "./helpers/approve-draft-fixture.mjs";

const require = createRequire(import.meta.url);
const root = process.cwd();
const workspace = path.join(root, "tmp", "required-package-artifacts-contract");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

const { requiredCompletePackageArtifactPaths } = require("../dist/artifacts/registry.js");
const requiredArtifacts = requiredCompletePackageArtifactPaths();

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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

createApprovedIntakeFixture({ root, workspace, approvedInputPath, approvedBy: "Required package artifacts contract" });

const generate = runJson(["generate", "--input", approvedInputPath, "--out", outputDir]);
assert(generate.readyForFrontendAgent === true, "required artifact fixture should be human-approved.");

const topManifest = readJson(path.join(outputDir, "manifest.json"));
const internalManifest = readJson(path.join(outputDir, "00-manifest", "manifest.json"));
const topPaths = new Set((topManifest.artifacts ?? []).filter((artifact) => artifact.required !== false).map((artifact) => artifact.path));
const internalPaths = new Set(internalManifest.artifact_index ?? []);
for (const artifact of requiredArtifacts) {
  assert(existsSync(path.join(outputDir, artifact)), `Complete package missing required artifact ${artifact}.`);
  assert(topPaths.has(artifact), `Top-level manifest missing required artifact ${artifact}.`);
  assert(internalPaths.has(artifact), `Internal manifest missing required artifact ${artifact}.`);
}

const approvalDecision = readJson(path.join(outputDir, "lifecycle", "approval-decision.json"));
assert(approvalDecision.source_scope === "HL-12", "approval decision must identify HL-12.");
assert(approvalDecision.approved === true, "approval decision must preserve human approval.");
assert(approvalDecision.traceability?.approval_request === "lifecycle/approval-request.md", "approval decision must trace approval request.");
assert(approvalDecision.traceability?.evidence_ledger === "01-evidence/evidence-ledger.json", "approval decision must trace evidence ledger.");

const approvalRequest = readFileSync(path.join(outputDir, "lifecycle", "approval-request.md"), "utf8");
for (const expected of ["Source scope: HL-12", "draft/contract-approval-request.json", "## Confirmed Facts", "## Candidate Assumptions"]) {
  assert(approvalRequest.includes(expected), `approval request missing ${expected}.`);
}
const specialistSummary = readFileSync(path.join(outputDir, "reviews", "specialist-review-summary.md"), "utf8");
for (const expected of ["Source scope: HL-12", "draft/specialist-review.json", "No agent can approve its own work.", "## Frontend Practice Gate"]) {
  assert(specialistSummary.includes(expected), `specialist review summary missing ${expected}.`);
}
const initialRed = readFileSync(path.join(outputDir, "test-results", "initial-red-test-run.md"), "utf8");
for (const expected of ["Source scope: HL-12", "test-first/test-first-contract.json", "test-first/test-quality-standard.json", "pending_until_target_agent_runs_tests"]) {
  assert(initialRed.includes(expected), `initial red test run missing ${expected}.`);
}
const finalReadiness = readFileSync(path.join(outputDir, "lifecycle", "final-readiness-report.md"), "utf8");
for (const expected of ["Source scope: HL-12", "Every complete package preserves traceable contract evidence.", "verification/playwright-evidence.json"]) {
  assert(finalReadiness.includes(expected), `final readiness report missing ${expected}.`);
}

const summarize = runJson(["summarize", "--out", outputDir]);
for (const artifact of ["lifecycle/implementation-phases.json", "draft/design-system-preview.html", "draft/design-system-review.md", "governance/convergence-standard.json", "lifecycle/approval-request.md", "lifecycle/approval-decision.json", "reviews/specialist-review-summary.md", "test-results/initial-red-test-run.md", "lifecycle/final-readiness-report.md"]) {
  assert(summarize.entrypoints.includes(artifact), `summarize missing required artifact entrypoint ${artifact}.`);
}

const validate = runJson(["validate", "--out", outputDir]);
assert(validate.status === "pass", "validate should pass with every required complete package artifact.");

const removedPath = path.join(outputDir, "lifecycle", "approval-decision.json");
const removed = readFileSync(removedPath, "utf8");
rmSync(removedPath);
const failedValidate = (() => {
  try {
    runJson(["validate", "--out", outputDir]);
    return null;
  } catch (error) {
    return String(error.stderr ?? error.message ?? error);
  }
})();
assert(failedValidate !== null, "validate should fail when approval decision is missing.");
writeFileSync(removedPath, removed);

runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
const verify = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
assert(verify.status === "pass", "verify-target should pass for required artifact fixture.");
const finalAfterVerify = readFileSync(path.join(outputDir, "lifecycle", "final-readiness-report.md"), "utf8");
assert(finalAfterVerify.includes("Target execution status: pass"), "final readiness report should update after target verification.");
assert(finalAfterVerify.includes("Playwright evidence status: pass"), "final readiness report should include passing Playwright evidence.");

const summary = {
  status: "pass",
  outputDir,
  targetDir,
  requiredArtifacts: requiredArtifacts.length,
  verified: verify.status
};
writeFileSync(path.join(workspace, "required-package-artifacts-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
