import path from "node:path";
import {
  asRecord,
  readJsonFile,
  resolveDeclaredPath,
  statusFromReadiness,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function summarizePackage(outputDir: string): JsonRecord {
  const topManifest = readJsonFile<{
    productName?: string;
    readinessScore?: number;
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(path.join(outputDir, "manifest.json"));
  const productModel = readJsonFile<{
    product_name?: string;
    product_type?: string;
    product_category?: string;
  }>(path.join(outputDir, "product", "product-model.json"));
  const routeMap = readJsonFile<{ routes?: Array<{ route?: string; screen_id?: string }> }>(
    path.join(outputDir, "experience", "route-map.json")
  );
  const screenInventory = readJsonFile<{
    screens?: Array<{ screen_id?: string; route?: string; required_states?: string[] }>;
  }>(path.join(outputDir, "screens", "screen-inventory.json"));

  const blockers = topManifest.blockers ?? [];
  const warnings = topManifest.warnings ?? [];
  const routes = routeMap.routes ?? [];
  const screens = screenInventory.screens ?? [];
  const requiredStates = [...new Set(screens.flatMap((screen) => screen.required_states ?? []))].sort();

  return {
    status: statusFromReadiness(blockers, warnings),
    outputDir,
    product: productModel.product_name ?? topManifest.productName ?? "Unknown product",
    productType: productModel.product_type ?? "Unknown product type",
    productCategory: productModel.product_category ?? "Unknown category",
    routes: routes.length,
    screens: screens.length,
    routeMap: routes.map((route) => ({ route: route.route, screenId: route.screen_id })),
    requiredStates,
    readinessScore: topManifest.readinessScore ?? 0,
    readyForFrontendAgent: topManifest.readyForFrontendAgent ?? false,
    blockers,
    warnings,
    entrypoints: [
      "lifecycle/context-completion.json",
      "lifecycle/lifecycle-report.md",
      "spec/archetype-spec.md",
      "spec/archetype-spec.json",
      "test-first/test-first-contract.json",
      "test-first/test-first-plan.md",
      "verification/playwright-verification-contract.json",
      "verification/playwright-evidence.json",
      "AGENTS.md",
      "CLAUDE.md",
      "implementation-contract.md",
      "verification-plan.md",
      "manifest.json"
    ]
  };
}

export const summarizePackageTool: McpToolDefinition = {
  name: "archetype_summarize_package",
  description: "Return compact product, route, screen, readiness, blocker, and warning context for an agent.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      }
    },
    required: ["outputDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    return summarizePackage(outputDir);
  }
};
