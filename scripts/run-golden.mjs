import { rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
  const dsag = JSON.parse(readFileSync(path.join(outDir, "03-experience-architecture", "dsag.json"), "utf8"));
  results.push({
    example,
    output: path.relative(root, outDir),
    score: readiness.score,
    ready: readiness.readyForFrontendAgent,
    blockers: readiness.blockers.length,
    warnings: readiness.warnings.length,
    dsag_status: dsag.integrity.status,
    dsag_nodes: dsag.nodes.length,
    dsag_edges: dsag.edges.length
  });
}

writeFileSync(path.join(outRoot, "golden-summary.json"), `${JSON.stringify({ results }, null, 2)}\n`);
writeFileSync(
  path.join(outRoot, "golden-summary.md"),
  [
    "# Golden Example Summary",
    "",
    "| Example | Score | Ready | Blockers | Warnings | DSAG | Nodes | Edges |",
    "|---|---:|---|---:|---:|---|---:|---:|",
    ...results.map((result) => `| ${result.example} | ${result.score} | ${result.ready} | ${result.blockers} | ${result.warnings} | ${result.dsag_status} | ${result.dsag_nodes} | ${result.dsag_edges} |`)
  ].join("\n")
);

console.log(JSON.stringify({ results }, null, 2));
