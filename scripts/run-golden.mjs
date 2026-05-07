import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const examplesDir = path.join(root, "examples");
const outRoot = path.join(root, "tmp", "golden");
rmSync(outRoot, { recursive: true, force: true });
mkdirSync(outRoot, { recursive: true });

const examples = readdirSync(examplesDir)
  .filter((file) => file.endsWith("-intake.json") && file !== "safety-intake.json")
  .sort();

const results = [];
for (const example of examples) {
  const name = example.replace("-intake.json", "");
  const outDir = path.join(outRoot, name);
  execFileSync("node", ["dist/cli.js", "generate", "--input", path.join(examplesDir, example), "--out", outDir], {
    cwd: root,
    stdio: "pipe"
  });
  const readiness = JSON.parse(readFileSync(path.join(outDir, "00-manifest", "implementation-readiness.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(path.join(outDir, "manifest.json"), "utf8"));
  const packageType = manifest.packageType ?? "contract";
  const isClarification = packageType === "clarification";
  const isDraft = packageType === "draft_contract";
  const contextQuestionsPath = path.join(outDir, "lifecycle", "clarification-questions.json");
  const contextQuestions = existsSync(contextQuestionsPath) ? JSON.parse(readFileSync(contextQuestionsPath, "utf8")) : [];
  const dsagPath = path.join(outDir, "03-experience-architecture", "dsag.json");
  const dsag = isClarification || isDraft ? null : JSON.parse(readFileSync(dsagPath, "utf8"));

  if (isClarification || isDraft) {
    if (existsSync(path.join(outDir, "spec", "archetype-spec.json"))) {
      throw new Error(`${example} generated a canonical spec even though it is a ${packageType} package.`);
    }
    if (existsSync(path.join(outDir, "test-first", "test-first-contract.json"))) {
      throw new Error(`${example} generated a test-first contract even though it is a ${packageType} package.`);
    }
    if (existsSync(path.join(outDir, "implementation-contract.md"))) {
      throw new Error(`${example} generated an implementation contract even though it is a ${packageType} package.`);
    }
  }

  results.push({
    example,
    output: path.relative(root, outDir),
    package_type: packageType,
    score: readiness.score,
    ready: readiness.readyForFrontendAgent,
    blockers: readiness.blockers.length,
    warnings: readiness.warnings.length,
    next_question: contextQuestions[0]?.question ?? null,
    dsag_status: dsag?.integrity.status ?? null,
    dsag_nodes: dsag?.nodes.length ?? 0,
    dsag_edges: dsag?.edges.length ?? 0
  });
}

writeFileSync(path.join(outRoot, "golden-summary.json"), `${JSON.stringify({ results }, null, 2)}\n`);
writeFileSync(
  path.join(outRoot, "golden-summary.md"),
  [
    "# Golden Example Summary",
    "",
    "| Example | Package | Score | Ready | Blockers | Warnings | Next Question | DSAG | Nodes | Edges |",
    "|---|---|---:|---|---:|---:|---|---|---:|---:|",
    ...results.map((result) => `| ${result.example} | ${result.package_type} | ${result.score} | ${result.ready} | ${result.blockers} | ${result.warnings} | ${result.next_question ?? ""} | ${result.dsag_status ?? ""} | ${result.dsag_nodes} | ${result.dsag_edges} |`)
  ].join("\n")
);

console.log(JSON.stringify({ results }, null, 2));
