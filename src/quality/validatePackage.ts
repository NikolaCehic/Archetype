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

export function validateExportedPackage(outputDir: string): PackageValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const manifestPath = path.join(outputDir, "00-manifest", "manifest.json");
  const readinessPath = path.join(outputDir, "00-manifest", "implementation-readiness.json");
  const schemaReportPath = path.join(outputDir, "00-manifest", "schema-validation-report.json");
  const dsagPath = path.join(outputDir, "03-experience-architecture", "dsag.json");

  if (!existsSync(manifestPath)) blockers.push("Missing 00-manifest/manifest.json.");
  if (!existsSync(readinessPath)) blockers.push("Missing 00-manifest/implementation-readiness.json.");
  if (!existsSync(schemaReportPath)) blockers.push("Missing 00-manifest/schema-validation-report.json.");
  if (!existsSync(dsagPath)) blockers.push("Missing 03-experience-architecture/dsag.json.");
  if (blockers.length > 0) {
    return { status: "fail", outputDir, checkedFiles: 0, blockers, warnings };
  }

  const manifest = readJson<{
    artifact_index?: string[];
    ready_for_frontend_agent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(manifestPath);
  const readiness = readJson<{
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
    score?: number;
  }>(readinessPath);
  const schemaReport = readJson<{
    status?: string;
    blockers?: string[];
  }>(schemaReportPath);
  const dsag = readJson<{
    integrity?: {
      status?: string;
      blockers?: string[];
    };
  }>(dsagPath);

  const artifactIndex = manifest.artifact_index ?? [];
  let checkedFiles = 0;
  for (const artifact of artifactIndex) {
    if (artifact.includes("*")) continue;
    checkedFiles += 1;
    if (!existsSync(path.join(outputDir, artifact))) {
      blockers.push(`Manifest artifact missing: ${artifact}`);
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
