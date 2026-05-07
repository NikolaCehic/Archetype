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
    packageType?: string;
    productName?: string;
    readinessScore?: number;
    readinessTier?: string;
    readyForFrontendAgent?: boolean;
    blockers?: string[];
    warnings?: string[];
  }>(path.join(outputDir, "manifest.json"));
  const isDraft = topManifest.packageType === "draft_contract";
  const productModel = isDraft
    ? (readJsonFile<{ product_model?: { product_name?: string; product_type?: string; product_category?: string } }>(path.join(outputDir, "draft", "product-model.draft.json")).product_model ?? {})
    : readJsonFile<{ product_name?: string; product_type?: string; product_category?: string }>(path.join(outputDir, "product", "product-model.json"));
  const draftExperience = isDraft
    ? readJsonFile<{ routes?: Array<{ route?: string; screen_id?: string }>; screens?: Array<{ screen_id?: string; route?: string; states?: Record<string, { required?: boolean }> }> }>(path.join(outputDir, "draft", "experience-architecture.draft.json"))
    : null;
  const routeMap = isDraft
    ? { routes: draftExperience?.routes ?? [] }
    : readJsonFile<{ routes?: Array<{ route?: string; screen_id?: string }> }>(path.join(outputDir, "experience", "route-map.json"));
  const screenInventory = isDraft
    ? {
      screens: (draftExperience?.screens ?? []).map((screen) => ({
        ...screen,
        required_states: Object.entries(screen.states ?? {})
          .filter(([, state]) => state.required === true)
          .map(([state]) => state)
      }))
    }
    : readJsonFile<{ screens?: Array<{ screen_id?: string; route?: string; required_states?: string[] }> }>(path.join(outputDir, "screens", "screen-inventory.json"));

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
    readinessTier: topManifest.readinessTier ?? "unknown",
    readyForFrontendAgent: topManifest.readyForFrontendAgent ?? false,
    blockers,
    warnings,
    entrypoints: [
      "lifecycle/start-request.json",
      "lifecycle/context-completion.json",
      "lifecycle/context-matrix.json",
      "lifecycle/readiness-tiers.json",
      "lifecycle/implementation-phases.json",
      "lifecycle/clarification-turn.json",
      "lifecycle/clarification-state.json",
      "lifecycle/clarification-transcript.md",
      "lifecycle/approval-request.md",
      "lifecycle/approval-decision.json",
      "01-evidence/evidence-ledger.json",
      "01-evidence/missing-context.md",
      ...(isDraft ? [
        "lifecycle/contract-state.json",
        "draft/product-model.draft.json",
        "draft/experience-architecture.draft.json",
        "draft/design-system.draft.json",
        "draft/frontend-contract.draft.json",
        "draft/assumption-ledger.md",
        "draft/contract-approval-request.json"
      ] : []),
      "governance/non-negotiable-principles.json",
      "governance/evidence-decision-model.json",
      "governance/forbidden-behaviors.json",
      "governance/convergence-standard.json",
      "governance/frontend-practice-skills.json",
      "lifecycle/lifecycle-report.md",
      ...(!isDraft ? [
        "lifecycle/contract-state.json",
        "lifecycle/execution-state.json",
        "lifecycle/final-readiness-report.md",
        "spec/archetype-spec.md",
        "spec/archetype-spec.json",
        "test-first/test-first-contract.json",
        "test-first/test-first-plan.md",
        "test-first/test-quality-standard.json",
        "test-results/initial-red-test-run.md",
        "verification/playwright-verification-contract.json",
        "verification/playwright-evidence.json",
        "qa/scenario-catalog.json",
        "qa/playwright-results.json",
        "qa/malformed-data-results.json",
        "qa/accessibility-results.md",
        "qa/visual-regression-report.md",
        "qa/contract-drift-report.md",
        "reviews/specialist-review-summary.md",
        "10-revision/repair-task-queue.json",
        "10-revision/repair-plan.md",
        "AGENTS.md",
        "CLAUDE.md",
        "implementation-contract.md",
        "verification-plan.md"
      ] : []),
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
