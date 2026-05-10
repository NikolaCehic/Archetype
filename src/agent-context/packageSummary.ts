import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ConsumerPlaneReport } from "../consumer-plane";

export type PackageSummaryMode = "compact" | "compat";
export type PackageSummaryStatus = "success" | "warning" | "error";

interface TopManifest {
  packageType?: string;
  productName?: string;
  readinessScore?: number;
  readinessTier?: string;
  readyForFrontendAgent?: boolean;
  blockers?: string[];
  warnings?: string[];
}

interface PhasePackageManifest {
  packageType?: "phase_package";
  sourcePackageKind?: string;
  phaseId?: string;
}

interface ProductModel {
  product_name?: string;
  product_type?: string;
  product_category?: string;
}

interface RouteRecord {
  route?: string;
  screen_id?: string;
}

interface ScreenRecord {
  screen_id?: string;
  route?: string;
  required_states?: string[];
  states?: Record<string, { required?: boolean }>;
}

interface AgentContextPhaseIndex {
  phases?: Array<{
    phase_id?: string;
    status?: string;
    path?: string;
  }>;
}

export interface PackageSummary extends Record<string, unknown> {
  status: PackageSummaryStatus;
  outputDir: string;
  product: string;
  productType: string;
  productCategory: string;
  routes: number;
  screens: number;
  routeMap: Array<{ route?: string; screenId?: string }>;
  requiredStates: string[];
  readinessScore: number;
  readinessTier: string;
  readyForFrontendAgent: boolean;
  blockers: string[];
  warnings: string[];
  compactEntrypoints: string[];
  consumerPlane: {
    path: string;
    currentPhase?: string;
    nextAction?: string;
    userMessage?: string;
    maxDefaultArtifactBytes?: number;
    firstReads: string[];
  };
  phaseBundles: Array<{
    phaseId?: string;
    status?: string;
    path?: string;
  }>;
  boundedReadPolicy: {
    startHere: string;
    maxDefaultArtifactBytes: number;
    readFullArtifactsOnlyWhen: string[];
  };
  entrypoints: string[];
}

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function statusFromReadiness(blockers: string[], warnings: string[]): PackageSummaryStatus {
  if (blockers.length > 0 || warnings.length > 0) return "warning";
  return "success";
}

function readAgentContextPhaseIndex(outputDir: string): AgentContextPhaseIndex {
  const phaseIndexPath = path.join(outputDir, "agent-context", "phase-bundles", "index.json");
  if (!existsSync(phaseIndexPath)) return {};
  return readJsonFile<AgentContextPhaseIndex>(phaseIndexPath);
}

function readConsumerPlaneSummary(outputDir: string): PackageSummary["consumerPlane"] {
  const consumerPlanePath = path.join(outputDir, "agent-context", "consumer-plane.json");
  if (!existsSync(consumerPlanePath)) {
    return {
      path: "agent-context/consumer-plane.json",
      firstReads: []
    };
  }
  const consumerPlane = readJsonFile<ConsumerPlaneReport>(consumerPlanePath);
  return {
    path: "agent-context/consumer-plane.json",
    currentPhase: consumerPlane.current_phase.phase_id,
    nextAction: consumerPlane.next_action.type,
    userMessage: consumerPlane.user_experience.say_this_now,
    maxDefaultArtifactBytes: consumerPlane.token_budget.default_max_artifact_bytes,
    firstReads: consumerPlane.read_plan.first_reads
  };
}

function legacyEntrypoints(isDraft: boolean): string[] {
  return [
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
      "draft/design-directions.json",
      "draft/design-quality-gate.json",
      "draft/design-craft-rubric.md",
      "draft/design-system-preview.html",
      "draft/design-system-review.md",
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
      "draft/design-directions.json",
      "draft/design-quality-gate.json",
      "draft/design-craft-rubric.md",
      "draft/design-system-preview.html",
      "draft/design-system-review.md",
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
  ];
}

export function buildPackageSummary(outputDir: string, mode: PackageSummaryMode = "compact"): PackageSummary {
  const manifestPath = path.join(outputDir, "manifest.json");
  const phasePackagePath = path.join(outputDir, "phase-package.json");
  const phaseManifest = !existsSync(manifestPath) && existsSync(phasePackagePath) ? readJsonFile<PhasePackageManifest>(phasePackagePath) : null;
  const topManifest = existsSync(manifestPath)
    ? readJsonFile<TopManifest>(manifestPath)
    : {
      packageType: phaseManifest?.sourcePackageKind === "draft_contract" ? "draft_contract" : "draft_contract",
      productName: undefined,
      readinessScore: undefined,
      readinessTier: "ready_for_contract_approval",
      readyForFrontendAgent: false,
      blockers: [],
      warnings: []
    };
  const isClarification = topManifest.packageType === "clarification";
  const isDraft = topManifest.packageType === "draft_contract";
  const productModel = isDraft
    ? (readJsonFile<{ product_model?: ProductModel }>(path.join(outputDir, "draft", "product-model.draft.json")).product_model ?? {})
    : isClarification
      ? {}
      : readJsonFile<ProductModel>(path.join(outputDir, "product", "product-model.json"));
  const draftExperience = isDraft
    ? readJsonFile<{ routes?: RouteRecord[]; screens?: ScreenRecord[] }>(path.join(outputDir, "draft", "experience-architecture.draft.json"))
    : null;
  const routeMap = isDraft
    ? { routes: draftExperience?.routes ?? [] }
    : isClarification
      ? { routes: [] }
      : readJsonFile<{ routes?: RouteRecord[] }>(path.join(outputDir, "experience", "route-map.json"));
  const screenInventory = isDraft
    ? {
      screens: (draftExperience?.screens ?? []).map((screen) => ({
        ...screen,
        required_states: Object.entries(screen.states ?? {})
          .filter(([, state]) => state.required === true)
          .map(([state]) => state)
      }))
    }
    : isClarification
      ? { screens: [] }
      : readJsonFile<{ screens?: ScreenRecord[] }>(path.join(outputDir, "screens", "screen-inventory.json"));

  const blockers = topManifest.blockers ?? [];
  const warnings = topManifest.warnings ?? [];
  const routes = routeMap.routes ?? [];
  const screens = screenInventory.screens ?? [];
  const requiredStates = [...new Set(screens.flatMap((screen) => screen.required_states ?? []))].sort();
  const consumerPlane = readConsumerPlaneSummary(outputDir);
  const compactEntrypoints = [
    "agent-context/consumer-plane.json",
    "agent-context/context-summary.json",
    "agent-context/phase-bundles/index.json"
  ];
  const phaseIndex = readAgentContextPhaseIndex(outputDir);
  const phaseBundles = (phaseIndex.phases ?? []).map((phase) => ({
    phaseId: phase.phase_id,
    status: phase.status,
    path: phase.path
  }));

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
    compactEntrypoints,
    consumerPlane,
    phaseBundles,
    boundedReadPolicy: {
      startHere: consumerPlane.path,
      maxDefaultArtifactBytes: consumerPlane.maxDefaultArtifactBytes ?? 6000,
      readFullArtifactsOnlyWhen: [
        "The consumer plane and compact phase bundle list the artifact as a required read.",
        "A verifier needs exact source text.",
        "A blocker, warning, or repair item needs source evidence."
      ]
    },
    entrypoints: mode === "compat" ? [...compactEntrypoints, ...legacyEntrypoints(isDraft)] : compactEntrypoints
  };
}
