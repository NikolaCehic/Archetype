import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

interface SimulationValidationResult {
  status: "pass" | "warning" | "fail";
  outputDir: string;
  blockers: string[];
  warnings: string[];
  summary: Record<string, unknown>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function simulateExportedPackage(outputDir: string): SimulationValidationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const simulationReportPath = path.join(outputDir, "11-build-simulation", "route-simulation.json");
  const componentResolutionPath = path.join(outputDir, "11-build-simulation", "component-resolution.json");
  const patternResolutionPath = path.join(outputDir, "11-build-simulation", "pattern-resolution.json");
  const stateCoveragePath = path.join(outputDir, "11-build-simulation", "state-coverage.json");
  const dataCoveragePath = path.join(outputDir, "11-build-simulation", "data-contract-coverage.json");
  const acceptancePath = path.join(outputDir, "11-build-simulation", "acceptance-simulation.json");

  for (const filePath of [
    simulationReportPath,
    componentResolutionPath,
    patternResolutionPath,
    stateCoveragePath,
    dataCoveragePath,
    acceptancePath
  ]) {
    if (!existsSync(filePath)) blockers.push(`Missing build simulation artifact: ${path.relative(outputDir, filePath)}`);
  }
  if (blockers.length > 0) {
    return { status: "fail", outputDir, blockers, warnings, summary: {} };
  }

  const routes = readJson<{ routes?: Array<{ status?: string; blockers?: string[] }> }>(simulationReportPath).routes ?? [];
  const components = readJson<{ screens?: Array<{ status?: string; missing_components?: string[] }> }>(componentResolutionPath).screens ?? [];
  const patterns = readJson<{ screens?: Array<{ status?: string; missing_patterns?: string[] }> }>(patternResolutionPath).screens ?? [];
  const states = readJson<{ screens?: Array<{ status?: string; missing_required_states?: string[] }> }>(stateCoveragePath).screens ?? [];
  const data = readJson<{ screens?: Array<{ status?: string; missing_data_contracts?: string[] }> }>(dataCoveragePath).screens ?? [];
  const acceptance = readJson<{ screens?: Array<{ status?: string; criteria_count?: number }> }>(acceptancePath).screens ?? [];

  for (const [label, collection] of Object.entries({ routes, components, patterns, states, data, acceptance })) {
    for (const item of collection as Array<{ status?: string; blockers?: string[] }>) {
      if (item.status === "fail") blockers.push(`${label} simulation contains a failed item.`);
    }
  }

  const summary = {
    routes: routes.length,
    screens_with_component_resolution: components.length,
    screens_with_pattern_resolution: patterns.length,
    screens_with_state_coverage: states.length,
    screens_with_data_coverage: data.length,
    screens_with_acceptance_criteria: acceptance.filter((item) => (item.criteria_count ?? 0) > 0).length
  };

  if (blockers.length === 0) {
    warnings.push("Standalone simulation validates generated build contracts; it does not compile generated frontend source code.");
  }

  return {
    status: blockers.length > 0 ? "fail" : warnings.length > 0 ? "warning" : "pass",
    outputDir,
    blockers,
    warnings,
    summary
  };
}
