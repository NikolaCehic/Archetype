import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

interface PackageValidationResult {
  status: "pass" | "fail";
  outputDir: string;
  checkedFiles: number;
  blockers: string[];
  warnings: string[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function readJsonSafe<T>(filePath: string, blockers: string[], description: string): T | null {
  try {
    return readJson<T>(filePath);
  } catch (error) {
    blockers.push(`${description} is not parseable JSON: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

export function validateExportedPackage(outputDir: string): PackageValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const topManifestPath = path.join(outputDir, "manifest.json");
  const agentsPath = path.join(outputDir, "AGENTS.md");
  const claudePath = path.join(outputDir, "CLAUDE.md");
  const implementationContractPath = path.join(outputDir, "implementation-contract.md");
  const verificationPlanPath = path.join(outputDir, "verification-plan.md");
  const manifestPath = path.join(outputDir, "00-manifest", "manifest.json");
  const readinessPath = path.join(outputDir, "00-manifest", "implementation-readiness.json");
  const schemaReportPath = path.join(outputDir, "00-manifest", "schema-validation-report.json");
  const dsagPath = path.join(outputDir, "03-experience-architecture", "dsag.json");
  const routeMapPath = path.join(outputDir, "03-experience-architecture", "route-map.json");
  const screenInventoryPath = path.join(outputDir, "03-experience-architecture", "screen-inventory.json");
  const frontendAgentInstructionsPath = path.join(outputDir, "06-frontend-agent-contract", "frontend-agent-instructions.md");

  if (!existsSync(topManifestPath)) blockers.push("Missing manifest.json.");
  if (!existsSync(agentsPath)) blockers.push("Missing AGENTS.md.");
  if (!existsSync(claudePath)) blockers.push("Missing CLAUDE.md.");
  if (!existsSync(implementationContractPath)) blockers.push("Missing implementation-contract.md.");
  if (!existsSync(verificationPlanPath)) blockers.push("Missing verification-plan.md.");
  if (!existsSync(manifestPath)) blockers.push("Missing 00-manifest/manifest.json.");
  if (!existsSync(readinessPath)) blockers.push("Missing 00-manifest/implementation-readiness.json.");
  if (!existsSync(schemaReportPath)) blockers.push("Missing 00-manifest/schema-validation-report.json.");
  if (!existsSync(dsagPath)) blockers.push("Missing 03-experience-architecture/dsag.json.");
  if (!existsSync(routeMapPath)) blockers.push("Missing 03-experience-architecture/route-map.json.");
  if (!existsSync(screenInventoryPath)) blockers.push("Missing 03-experience-architecture/screen-inventory.json.");
  if (!existsSync(frontendAgentInstructionsPath)) blockers.push("Missing 06-frontend-agent-contract/frontend-agent-instructions.md.");
  if (blockers.length > 0) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const topManifest = readJsonSafe<{
    artifacts?: Array<{ id?: string; path?: string; required?: boolean }>;
  }>(topManifestPath, blockers, "Top-level manifest");
  const manifest = readJsonSafe<{
    artifact_index?: string[];
    ready_for_frontend_agent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(manifestPath, blockers, "Internal manifest");
  const readiness = readJsonSafe<{
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
    score?: number;
  }>(readinessPath, blockers, "Readiness report");
  const schemaReport = readJsonSafe<{
    status?: string;
    blockers?: string[];
  }>(schemaReportPath, blockers, "Schema validation report");
  const dsag = readJsonSafe<{
    integrity?: {
      status?: string;
      blockers?: string[];
    };
  }>(dsagPath, blockers, "DSAG graph");
  const routeMap = readJsonSafe<{ routes?: unknown[] }>(routeMapPath, blockers, "Route map");
  const screenInventory = readJsonSafe<{ screens?: unknown[] }>(screenInventoryPath, blockers, "Screen inventory");

  if (!topManifest || !manifest || !readiness || !schemaReport || !dsag || !routeMap || !screenInventory) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  if (!Array.isArray(routeMap.routes) || routeMap.routes.length === 0) {
    blockers.push("Route map has no parseable routes.");
  }
  if (!Array.isArray(screenInventory.screens) || screenInventory.screens.length === 0) {
    blockers.push("Screen inventory has no parseable screens.");
  }

  const artifactIndex = manifest.artifact_index ?? [];
  let checkedFiles = 0;
  for (const artifact of artifactIndex) {
    if (artifact.includes("*")) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact))) {
      blockers.push(`Manifest artifact missing: ${artifact}`);
    }
  }
  for (const artifact of topManifest.artifacts ?? []) {
    if (artifact.required === false || !artifact.path) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact.path))) {
      blockers.push(`Top-level manifest artifact missing: ${artifact.path}`);
    }
  }

  if (manifest.ready_for_frontend_agent !== readiness.readyForFrontendAgent) {
    blockers.push("Manifest readiness and readiness report disagree.");
  }
  if (readiness.readyForFrontendAgent && (readiness.blockers?.length ?? 0) > 0) {
    blockers.push("Readiness report marks package ready while blockers exist.");
  }
  if (schemaReport.status === "fail" || (schemaReport.blockers?.length ?? 0) > 0) {
    blockers.push("Schema validation report contains blockers.");
  }
  if (dsag.integrity?.status === "fail" || (dsag.integrity?.blockers?.length ?? 0) > 0) {
    blockers.push("DSAG integrity report contains blockers.");
  }
  if ((readiness.score ?? 0) < 75) {
    blockers.push("Readiness score is below frontend-agent threshold.");
  }

  warnings.push(...(manifest.warnings ?? []));
  warnings.push(...(readiness.warnings ?? []));

  return {
    status: blockers.length > 0 ? "fail" : "pass",
    outputDir,
    checkedFiles,
    blockers,
    warnings: [...new Set(warnings)]
  };
}
