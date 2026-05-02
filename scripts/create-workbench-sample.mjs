import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const inputDir = path.resolve(process.argv[2] ?? "tmp/archetype-output");
const outputFile = path.resolve(process.argv[3] ?? "workbench/public/sample-package.json");

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(inputDir, relativePath), "utf8"));
}

function readText(relativePath) {
  return readFileSync(path.join(inputDir, relativePath), "utf8");
}

function walk(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full, base));
    else files.push(path.relative(base, full));
  }
  return files.sort();
}

function artifactKind(filePath) {
  if (filePath.endsWith(".json")) return "json";
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "yaml";
  if (filePath.endsWith(".md")) return "markdown";
  if (filePath.endsWith(".css")) return "css";
  if (filePath.endsWith(".ts")) return "typescript";
  return "text";
}

function artifactDigest(filePath) {
  const buffer = readFileSync(path.join(inputDir, filePath));
  return {
    path: filePath,
    hash: createHash("sha256").update(buffer).digest("hex"),
    bytes: buffer.byteLength,
    kind: artifactKind(filePath)
  };
}

if (!existsSync(inputDir)) {
  throw new Error(`Package output not found: ${inputDir}`);
}

const artifactFiles = walk(inputDir);
const screenFiles = walk(path.join(inputDir, "05-screen-specs")).filter((file) => file.endsWith(".yaml"));
const bundle = {
  generatedAt: new Date().toISOString(),
  artifacts: artifactFiles.map(artifactDigest),
  manifest: readJson("00-manifest/manifest.json"),
  readiness: readJson("00-manifest/implementation-readiness.json"),
  schemaValidation: readJson("00-manifest/schema-validation-report.json"),
  schemaIndex: readJson("00-manifest/schema-index.json"),
  evidence: readJson("01-evidence/evidence-ledger.json"),
  sourceAnalysis: readJson("01-evidence/source-analysis-report.json"),
  productModel: readJson("02-product-model/product-model.json"),
  userModel: readJson("02-product-model/user-model.json"),
  routeMap: readJson("03-experience-architecture/route-map.json"),
  screenInventory: readJson("03-experience-architecture/screen-inventory.json"),
  dsag: readJson("03-experience-architecture/dsag.json"),
  componentContracts: readJson("04-design-system/components/component-contracts.json"),
  componentRegistry: readJson("04-design-system/components/component-registry.json"),
  patternRegistry: readJson("04-design-system/patterns/pattern-registry.json"),
  primitiveTokens: readJson("04-design-system/tokens/primitive-tokens.json"),
  semanticTokens: readJson("04-design-system/tokens/semantic-tokens.json"),
  buildManifest: readJson("06-frontend-agent-contract/build-manifest.json"),
  componentUsageMap: readJson("06-frontend-agent-contract/component-usage-map.json"),
  dataContracts: readJson("06-frontend-agent-contract/data-contracts.json"),
  acceptanceCriteria: readJson("06-frontend-agent-contract/acceptance-criteria.json"),
  buildSimulation: {
    buildPlan: readJson("11-build-simulation/build-plan.json"),
    routeSimulation: readJson("11-build-simulation/route-simulation.json"),
    componentResolution: readJson("11-build-simulation/component-resolution.json"),
    patternResolution: readJson("11-build-simulation/pattern-resolution.json"),
    stateCoverage: readJson("11-build-simulation/state-coverage.json"),
    dataContractCoverage: readJson("11-build-simulation/data-contract-coverage.json"),
    acceptanceSimulation: readJson("11-build-simulation/acceptance-simulation.json"),
    report: readText("11-build-simulation/frontend-build-simulation-report.md")
  },
  revision: {
    dependencyGraph: readJson("10-revision/artifact-dependency-graph.json"),
    invalidationRules: readJson("10-revision/invalidation-rules.json"),
    approvalGates: readJson("10-revision/approval-gates.json"),
    initialChangeSet: readJson("10-revision/initial-change-set.json"),
    protocol: readText("10-revision/revision-protocol.md")
  },
  reports: {
    dsagIntegrity: readText("08-quality/dsag-integrity-report.md"),
    consistency: readText("08-quality/consistency-report.md"),
    accessibility: readText("08-quality/accessibility-report.md"),
    safety: readText("08-quality/safety-report.md"),
    readiness: readText("08-quality/implementation-readiness-report.md")
  },
  screens: screenFiles.map((file) => ({
    path: `05-screen-specs/${file}`,
    name: file.replace(".yaml", ""),
    content: readText(`05-screen-specs/${file}`)
  }))
};

mkdirSync(path.dirname(outputFile), { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(bundle, null, 2)}\n`);
console.log(`Wrote workbench sample bundle: ${outputFile}`);
