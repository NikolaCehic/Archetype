import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const workspace = path.join(root, "tmp", "demo");
const intakePath = path.join(workspace, "archetype.intake.json");
const outputDir = path.join(workspace, "archetype-output");
const targetDir = path.join(workspace, "generated-frontend");

rmSync(workspace, { recursive: true, force: true });
mkdirSync(workspace, { recursive: true });

function runJson(args) {
  const stdout = execFileSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

const doctor = runJson(["doctor"]);
const init = runJson(["init", "--template", "saas-dashboard", "--out", intakePath, "--force"]);
const approvedIntake = {
  ...JSON.parse(readFileSync(intakePath, "utf8")),
  contractApproval: {
    approved: true,
    approverType: "human",
    approvedBy: "Demo script",
    approvedAt: "2026-05-06T00:00:00.000Z",
    artifactRefs: ["spec/archetype-spec.json", "implementation-contract.md", "test-first/test-first-contract.json"]
  }
};
writeFileSync(intakePath, `${JSON.stringify(approvedIntake, null, 2)}\n`);
const generate = runJson(["generate", "--input", intakePath, "--out", outputDir]);
const validate = runJson(["validate", "--out", outputDir]);
const summarize = runJson(["summarize", "--out", outputDir]);
const writeTarget = runJson(["write-target", "--out", outputDir, "--target", targetDir, "--force"]);
const verifyTarget = runJson(["verify-target", "--out", outputDir, "--target", targetDir]);
const repair = runJson(["repair", "--out", outputDir, "--target", targetDir]);

const blockers = [...new Set([...(generate.blockers ?? []), ...(validate.blockers ?? []), ...(verifyTarget.blockers ?? [])])];
const warnings = [...new Set([...(generate.warnings ?? []), ...(validate.warnings ?? []), ...(verifyTarget.warnings ?? [])])];

const summary = {
  status: validate.status === "pass" && verifyTarget.status === "pass" ? "pass" : "warning",
  intakePath,
  outputDir,
  targetDir,
  readinessScore: generate.readinessScore,
  readyForFrontendAgent: generate.readyForFrontendAgent,
  routes: summarize.routes,
  screens: summarize.screens,
  blockers,
  warnings,
  commands: {
    doctor: doctor.status,
    init: init.status,
    generate: generate.status,
    validate: validate.status,
    summarize: summarize.status,
    writeTarget: writeTarget.status,
    verifyTarget: verifyTarget.status,
    repair: repair.status
  },
  repair: {
    taskCount: repair.taskCount,
    artifacts: repair.artifacts
  }
};

writeFileSync(path.join(workspace, "demo-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
