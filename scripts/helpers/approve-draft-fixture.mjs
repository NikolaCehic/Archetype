import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

function runCliJson(root, args) {
  const stdout = execFileSync("node", ["dist/cli.js", ...args, "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  return JSON.parse(stdout);
}

function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function createApprovedIntakeFixture(input) {
  const root = input.root ?? process.cwd();
  const workspace = input.workspace;
  const approvedInputPath = input.approvedInputPath;
  const sourceInputPath = input.sourceInputPath ?? `${approvedInputPath.replace(/\.json$/u, "")}.source.json`;
  const draftOutputDir = input.draftOutputDir ?? `${approvedInputPath.replace(/\.json$/u, "")}.draft-output`;
  const baseInput = input.baseInput ?? readJson(input.baseInputPath ?? path.join(root, "examples", "saas-dashboard-intake.json"));
  if (!workspace || !approvedInputPath) throw new Error("createApprovedIntakeFixture requires workspace and approvedInputPath.");
  rmSync(draftOutputDir, { recursive: true, force: true });
  writeJson(sourceInputPath, baseInput);
  const draft = runCliJson(root, ["generate", "--input", sourceInputPath, "--out", draftOutputDir, "--force"]);
  const approval = runCliJson(root, [
    "approve-draft",
    "--draft",
    draftOutputDir,
    "--input",
    sourceInputPath,
    "--out",
    approvedInputPath,
    "--approved-by",
    input.approvedBy ?? "Archetype contract fixture",
    "--approved-at",
    input.approvedAt ?? "2026-05-08T00:00:00.000Z",
    "--force"
  ]);
  return {
    draft,
    approval,
    sourceInputPath,
    draftOutputDir,
    approvedInputPath
  };
}
