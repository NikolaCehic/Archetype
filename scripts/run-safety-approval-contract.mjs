import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "safety-approval-contract");
const intakePath = path.join(root, "examples", "saas-dashboard-intake.json");
const draftOutputDir = path.join(workspace, "draft-output");
const approvedInputPath = path.join(workspace, "approved-intake.json");
const canonicalOutputDir = path.join(workspace, "canonical-output");
const rawInputPath = path.join(workspace, "raw-approved-intake.json");
const rawOutputDir = path.join(workspace, "raw-output");
const targetDir = path.join(workspace, "generated-target");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runJson(args) {
  const stdout = execFileSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

function runJsonMaybeFail(args) {
  const result = spawnSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  let json;
  try {
    json = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Command did not return JSON: ${args.join(" ")}\nstdout=${result.stdout}\nstderr=${result.stderr}\n${error}`);
  }
  return {
    exitCode: result.status ?? 1,
    json
  };
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const draft = runJson(["generate", "--input", intakePath, "--out", draftOutputDir]);
assert(draft.packageType === "draft_contract", "base fixture should generate a draft package.");
assert(existsSync(path.join(draftOutputDir, ".archetype-output-marker")), "generated output must include .archetype-output-marker.");

const rerunWithoutForce = runJsonMaybeFail(["generate", "--input", intakePath, "--out", draftOutputDir]);
assert(rerunWithoutForce.exitCode === 1, "non-empty generated output should require --force before replacement.");
assert(String(rerunWithoutForce.json.message ?? "").includes("--force"), "non-force replacement error should name --force.");

const rerunWithForce = runJson(["generate", "--input", intakePath, "--out", draftOutputDir, "--force"]);
assert(rerunWithForce.packageType === "draft_contract", "marked output should be replaceable with --force.");

const unmarkedDir = path.join(workspace, "unmarked-output");
mkdirSync(unmarkedDir, { recursive: true });
writeFileSync(path.join(unmarkedDir, "sentinel.txt"), "do not delete\n");
const unmarkedAttempt = runJsonMaybeFail(["generate", "--input", intakePath, "--out", unmarkedDir, "--force"]);
assert(unmarkedAttempt.exitCode === 1, "unmarked non-empty output must not be deleted even with --force.");
assert(existsSync(path.join(unmarkedDir, "sentinel.txt")), "unmarked output sentinel must survive failed generate.");

const fakeProject = path.join(workspace, "fake-project");
mkdirSync(fakeProject, { recursive: true });
writeFileSync(path.join(fakeProject, "package.json"), "{\"private\":true}\n");
writeFileSync(path.join(fakeProject, "sentinel.txt"), "do not delete\n");
const fakeProjectAttempt = runJsonMaybeFail(["generate", "--input", intakePath, "--out", fakeProject, "--force"]);
assert(fakeProjectAttempt.exitCode === 1, "project-like output must not be deleted.");
assert(existsSync(path.join(fakeProject, "sentinel.txt")), "project sentinel must survive failed generate.");

const approved = runJson([
  "approve-draft",
  "--draft",
  draftOutputDir,
  "--input",
  intakePath,
  "--out",
  approvedInputPath,
  "--approved-by",
  "Safety Approval Contract",
  "--approved-at",
  "2026-05-08T00:00:00.000Z"
]);
assert(approved.status === "success", "approve-draft should create a bound approval.");
assert(existsSync(approved.approvalArtifactPath), "approve-draft should write a proof sidecar.");

const baseInput = readJson(intakePath);
writeFileSync(rawInputPath, `${JSON.stringify({
  ...baseInput,
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Raw Approval",
    approvedAt: "2026-05-08T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json"]
  }
}, null, 2)}\n`);
const rawGenerate = runJson(["generate", "--input", rawInputPath, "--out", rawOutputDir]);
assert(rawGenerate.packageType === "draft_contract", "raw edited approval must not authorize canonical generation.");
assert(rawGenerate.blockers.some((blocker) => String(blocker).includes("approvalArtifactPath")), "raw approval should expose proof blocker.");
const rawEvidence = readJson(path.join(rawOutputDir, "01-evidence", "evidence-ledger.json"));
assert(rawEvidence.inferences.every((item) => item.evidence_level !== "user_confirmed_assumption"), "raw approval must not canonicalize inference evidence.");
assert(rawEvidence.decisions.some((decision) => decision.status === "candidate"), "raw approval must keep inference-backed decisions candidate.");

const canonical = runJson(["generate", "--input", approvedInputPath, "--out", canonicalOutputDir]);
assert(canonical.readyForFrontendAgent === true, "bound approval should authorize implementation readiness.");
assert(canonical.readinessTier === "ready_for_implementation", "bound approval should produce canonical implementation readiness.");
const approvalDecision = readJson(path.join(canonicalOutputDir, "lifecycle", "approval-decision.json"));
assert(approvalDecision.approval_digest === approved.approvalDigest, "approval decision must preserve approval digest.");
assert(approvalDecision.draft_package_id === approved.draftPackageId, "approval decision must preserve draft package id.");

const fakeTarget = path.join(workspace, "fake-target-project");
mkdirSync(fakeTarget, { recursive: true });
writeFileSync(path.join(fakeTarget, "package.json"), "{\"private\":true}\n");
writeFileSync(path.join(fakeTarget, "sentinel.txt"), "do not delete\n");
const unsafeTarget = runJsonMaybeFail(["write-target", "--out", canonicalOutputDir, "--target", fakeTarget, "--force"]);
assert(unsafeTarget.exitCode === 1, "write-target must reject project-like target replacement.");
assert(existsSync(path.join(fakeTarget, "sentinel.txt")), "target sentinel must survive failed write-target.");

const targetWrite = runJson(["write-target", "--out", canonicalOutputDir, "--target", targetDir]);
assert(targetWrite.status === "pass", "write-target should pass into a new target directory.");
assert(existsSync(path.join(targetDir, ".archetype-target-marker")), "generated target must include .archetype-target-marker.");
const targetRewriteWithoutForce = runJsonMaybeFail(["write-target", "--out", canonicalOutputDir, "--target", targetDir]);
assert(targetRewriteWithoutForce.exitCode === 1, "existing target should require --force.");
const targetRewriteWithForce = runJson(["write-target", "--out", canonicalOutputDir, "--target", targetDir, "--force"]);
assert(targetRewriteWithForce.status === "pass", "marked target should be replaceable with --force.");

const summary = {
  status: "pass",
  draftOutputDir,
  canonicalOutputDir,
  targetDir,
  approvalDigest: approved.approvalDigest,
  safetyChecks: [
    "output-marker",
    "nonempty-output-force-required",
    "unmarked-output-preserved",
    "project-output-preserved",
    "raw-approval-blocked",
    "bound-approval-authorized",
    "project-target-preserved",
    "target-marker"
  ]
};

writeFileSync(path.join(workspace, "safety-approval-contract-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
