import type {
  ArchetypeInput,
  ArchetypePackage,
  CompilerOptions,
  E2EScenarioArtifacts,
  FrontendBuildSimulationArtifacts,
  Manifest,
  PlaywrightVerificationArtifacts,
  QualityArtifacts,
  ReadinessTier,
  RevisionArtifacts,
  SpecArtifacts,
  TargetExecutionArtifacts,
  TargetFrontendArtifacts,
  TestFirstArtifacts
} from "./types";
import { hashContent, slugify, stableId } from "./stable";
import { inferDomainProfile } from "../modules/domain";
import { buildIngestionArtifacts } from "../modules/sourceNormalization";
import { buildEvidenceLedger } from "../modules/evidence";
import { buildProductArtifacts } from "../modules/productModel";
import { buildExperienceArtifacts } from "../modules/experienceArchitecture";
import { buildDesignSystemArtifacts } from "../modules/designSystem";
import { buildFrontendContractArtifacts } from "../modules/frontendContract";
import { buildDSAGGraph } from "../modules/dsag";
import { buildQualityArtifacts } from "../quality/quality";
import { buildSchemaArtifacts } from "../schemas/coreSchemas";
import { buildLLMDecisionArtifacts } from "../modules/llmDecisionLayer";
import { buildReferenceSurfaceArtifacts } from "../modules/referenceSurfaces";
import { buildRevisionArtifacts } from "../modules/revisionProtocol";
import { buildFrontendBuildSimulationArtifacts } from "../modules/frontendBuildSimulation";
import { buildTargetFrontendArtifacts } from "../modules/targetFrontend";
import { buildPendingTargetExecutionArtifacts } from "../modules/targetExecution";
import { buildE2EScenarioArtifacts } from "../modules/e2eScenarios";
import { buildLifecycleArtifacts } from "../modules/lifecycle";
import { buildSpecArtifacts } from "../modules/spec";
import { buildTestFirstArtifacts } from "../modules/testFirstContracts";
import { buildPlaywrightVerificationArtifacts } from "../modules/playwrightVerification";
import { buildContractApprovalState, buildReadinessEvidence } from "../modules/nonNegotiablePrinciples";
import { recordCompiledPackage } from "../data-plane/packageRecorder";
import { artifactIndexForPackage } from "../artifacts/registry";

type CompilerPhaseName =
  | "context"
  | "draft"
  | "approval"
  | "canonical"
  | "test_first"
  | "verification"
  | "target"
  | "qa"
  | "repair";

type CompilerPhaseRecord = NonNullable<Manifest["compiler_phases"]>[number];

function phaseRecord(phase: CompilerPhaseName, status: CompilerPhaseRecord["status"], reason: string): CompilerPhaseRecord {
  return { phase, status, reason };
}

function phaseBlockedRecord(phase: CompilerPhaseName, reason: string): Record<string, unknown> {
  return {
    phase_status: "skipped",
    phase,
    reason
  };
}

function phaseBlockedSpecArtifacts(reason: string): SpecArtifacts {
  return {
    specJson: phaseBlockedRecord("canonical", reason),
    specMarkdown: `# Canonical Spec Skipped\n\n${reason}`
  };
}

function phaseBlockedTestFirstArtifacts(reason: string): TestFirstArtifacts {
  return {
    contractJson: { ...phaseBlockedRecord("test_first", reason), suites: [] },
    planMarkdown: `# Test-First Artifacts Skipped\n\n${reason}`,
    playwrightContractSpec: "",
    vitestContractSpec: ""
  };
}

function phaseBlockedPlaywrightArtifacts(reason: string): PlaywrightVerificationArtifacts {
  return {
    contractJson: { ...phaseBlockedRecord("verification", reason), scenarios: [] },
    planMarkdown: `# Playwright Verification Skipped\n\n${reason}`,
    configSource: "",
    specSource: "",
    evidenceJson: { ...phaseBlockedRecord("verification", reason), status: "skipped" },
    evidenceMarkdown: `# Playwright Evidence Skipped\n\n${reason}`
  };
}

function phaseBlockedRevisionArtifacts(reason: string): RevisionArtifacts {
  return {
    revisionProtocol: `# Revision Skipped\n\n${reason}`,
    artifactDependencyGraph: { ...phaseBlockedRecord("repair", reason), nodes: [], edges: [] },
    invalidationRules: { ...phaseBlockedRecord("repair", reason), rules: [] },
    initialChangeSet: phaseBlockedRecord("repair", reason),
    approvalGates: { ...phaseBlockedRecord("approval", reason), gates: [] },
    decisionDiffPolicy: `# Decision Diff Policy Skipped\n\n${reason}`,
    artifactInvalidationReport: `# Artifact Invalidation Skipped\n\n${reason}`,
    repairContract: phaseBlockedRecord("repair", reason),
    repairTaskQueue: { ...phaseBlockedRecord("repair", reason), status: "skipped", task_count: 0, tasks: [] },
    repairPlan: `# Repair Plan Skipped\n\n${reason}`,
    driftReport: { ...phaseBlockedRecord("repair", reason), status: "skipped", drift_count: 0 },
    driftReportMarkdown: `# Drift Report Skipped\n\n${reason}`
  };
}

function phaseBlockedBuildSimulationArtifacts(reason: string): FrontendBuildSimulationArtifacts {
  return {
    status: "warning",
    blockers: [],
    warnings: [reason],
    buildPlan: phaseBlockedRecord("target", reason),
    routeSimulation: phaseBlockedRecord("target", reason),
    componentResolution: phaseBlockedRecord("target", reason),
    patternResolution: phaseBlockedRecord("target", reason),
    stateCoverage: phaseBlockedRecord("target", reason),
    dataContractCoverage: phaseBlockedRecord("target", reason),
    acceptanceSimulation: phaseBlockedRecord("target", reason),
    simulationReport: `# Build Simulation Skipped\n\n${reason}`
  };
}

function phaseBlockedTargetFrontendArtifacts(reason: string): TargetFrontendArtifacts {
  return {
    sourceFileManifest: { ...phaseBlockedRecord("target", reason), files: [], blockers: [reason] },
    routeComponentMap: { ...phaseBlockedRecord("target", reason), routes: [], blockers: [reason] },
    codegenTasks: { ...phaseBlockedRecord("target", reason), tasks: [], blockers: [reason] },
    adapterInterfaceSource: "",
    sourceGenerationRunbook: `# Target Frontend Generation Skipped\n\n${reason}`
  };
}

function phaseBlockedTargetExecutionArtifacts(reason: string): TargetExecutionArtifacts {
  return {
    executionReport: { ...phaseBlockedRecord("target", reason), status: "skipped", summary: { playwright: "skipped" } },
    executionMarkdown: `# Target Execution Skipped\n\n${reason}`
  };
}

function phaseBlockedE2EArtifacts(reason: string): E2EScenarioArtifacts {
  return {
    scenarioCatalog: { ...phaseBlockedRecord("qa", reason), scenarios: [] },
    scenarioResults: { ...phaseBlockedRecord("qa", reason), status: "skipped", results: [] },
    findingsReport: `# E2E Scenario Execution Skipped\n\n${reason}`
  };
}

function buildDraftQualityArtifacts(input: {
  ingestion: ReturnType<typeof buildIngestionArtifacts>;
  evidence: ReturnType<typeof buildEvidenceLedger>;
  product: ReturnType<typeof buildProductArtifacts>;
  experience: ReturnType<typeof buildExperienceArtifacts>;
  designSystem: ReturnType<typeof buildDesignSystemArtifacts>;
  frontendContract: ReturnType<typeof buildFrontendContractArtifacts>;
  dsag: ReturnType<typeof buildDSAGGraph>;
}): QualityArtifacts {
  const blockers = [
    ...input.dsag.integrity.blockers.map((item) => `DSAG: ${item}`),
    ...input.ingestion.safetyFindings.filter((finding) => finding.severity === "blocker").map((finding) => `Safety blocker in ${finding.source_id}: ${finding.finding}`)
  ];
  const warnings = [
    ...input.evidence.missing_information.map((item) => `Missing context: ${item}`),
    ...input.evidence.risks.map((item) => item.claim ?? "Unspecified risk"),
    ...input.experience.uxFlowStateCompleteness.warnings.map((warning) => `UX flow/state completeness: ${warning}`),
    ...input.ingestion.safetyFindings.filter((finding) => finding.severity !== "blocker").map((finding) => `Safety ${finding.severity}: ${finding.finding} (${finding.source_id})`),
    ...input.dsag.integrity.warnings.map((item) => `DSAG warning: ${item}`)
  ];
  const validation = {
    status: blockers.length > 0 ? "fail" as const : warnings.length > 0 ? "warning" as const : "pass" as const,
    checks: [
      {
        id: "phase_safe_draft.core_artifacts",
        status: "pass" as const,
        details: "Draft compiler constructed only context, evidence, product, experience, design-system, and frontend draft inputs."
      },
      {
        id: "phase_safe_draft.canonical_artifacts_skipped",
        status: "pass" as const,
        details: "Canonical spec, test-first, Playwright, target, QA, and repair artifacts are skipped before bound approval."
      }
    ],
    blockers,
    warnings
  };
  const dimensions = {
    product_understanding: input.product.productModel ? 15 : 0,
    ux_architecture: input.experience.routeMap.routes.length > 0 && input.experience.screenSpecs.length > 0 ? 15 : 0,
    screen_spec_completeness: input.experience.uxFlowStateCompleteness.summary.incomplete_screens === 0 ? 15 : 8,
    design_system_coherence: input.dsag.integrity.status !== "fail" ? 15 : 0,
    accessibility_coverage: Object.keys(input.designSystem.accessibilityRules).length > 0 ? 15 : 0,
    frontend_contract_quality: input.frontendContract.frontendAgentInstructions.length > 0 ? 15 : 0,
    evidence_traceability: input.evidence.decisions.length > 0 ? 10 : 0
  };
  const rawScore = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const score = blockers.length > 0 ? Math.min(rawScore, 74) : warnings.length > 0 ? Math.min(rawScore, 89) : rawScore;
  const readinessBlockers = [...blockers];
  if (score < 75) readinessBlockers.push("Readiness score below frontend-agent threshold.");
  const readiness = {
    score,
    readinessTier: "ready_for_contract_draft" as ReadinessTier,
    readyForFrontendAgent: readinessBlockers.length === 0,
    dimensions,
    blockers: readinessBlockers,
    warnings,
    requiredHumanReview: [
      "Confirm user roles and permissions.",
      "Confirm backend data schema.",
      "Perform human accessibility review before compliance claims.",
      ...input.evidence.risks.map((risk) => `Review risk: ${risk.claim}`)
    ]
  };
  const draftReport = [
    "# Phase-Safe Draft Quality",
    "",
    "Canonical spec, test-first, Playwright, target, QA, and repair artifacts were not constructed before bound approval.",
    "",
    `Readiness score: ${readiness.score}`,
    `Warnings: ${warnings.length}`,
    `Blockers: ${readinessBlockers.length}`
  ].join("\n");
  return {
    validation,
    readiness,
    dsagIntegrityReport: "Phase-safe draft DSAG integrity was evaluated before canonical construction.",
    consistencyReport: draftReport,
    accessibilityReport: "Accessibility obligations are represented in the draft design-system contract and remain pending human/runtime review.",
    screenCoverageReport: `Draft covers ${input.experience.screenSpecs.length} screen specs.`,
    componentCoverageReport: "Draft component contracts are available for review before approval.",
    implementationReadinessReport: draftReport,
    unresolvedDecisions: input.evidence.missing_information.map((item) => `- ${item}`).join("\n"),
    exportReadinessChecklist: "Draft package is ready for human approval review; implementation remains blocked.",
    specCoverageAudit: {
      phase_status: "draft_only",
      ready_for_frontend_agent: readiness.readyForFrontendAgent,
      readiness_score: readiness.score
    },
    specCoverageReport: draftReport
  };
}

export function runArchetypeCompiler(input: ArchetypeInput, _options: CompilerOptions = {}): ArchetypePackage {
  const profile = inferDomainProfile(input);
  const projectSlug = slugify(input.projectName ?? profile.productType);
  const sourceHash = hashContent(input);
  const projectId = stableId("project", projectSlug, sourceHash);
  const operatingMode = input.operatingMode ?? "full_architecture";
  const contractApproval = buildContractApprovalState(input, { sourcePath: _options.sourcePath });

  const ingestion = buildIngestionArtifacts(input);
  const evidence = buildEvidenceLedger(input, profile, projectId, ingestion, {
    humanApproved: contractApproval.approved === true
  });
  const product = buildProductArtifacts(input, profile, evidence);
  const experience = buildExperienceArtifacts(input, profile, product, evidence);
  const designSystem = buildDesignSystemArtifacts(input, profile, experience);
  const frontendContract = buildFrontendContractArtifacts(input, profile, product, experience, designSystem);
  const schemas = buildSchemaArtifacts();
  const llm = buildLLMDecisionArtifacts();
  const referenceSurfaces = buildReferenceSurfaceArtifacts(experience, designSystem);
  const dsag = buildDSAGGraph({
    evidence,
    product,
    experience,
    designSystem,
    frontendContract
  });
  const draftQuality = buildDraftQualityArtifacts({
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    dsag
  });
  const draftLifecycle = buildLifecycleArtifacts(input, ingestion, evidence, draftQuality.readiness);
  const draftLifecycleGateBlockers = draftLifecycle.contextCompletion.status === "needs_clarification"
    ? draftLifecycle.contextMatrix.blockers
    : [];
  const draftApprovalBlockers = (contractApproval.blockers as string[] | undefined) ?? [];
  const draftPrincipleGateBlockers = draftLifecycle.contextCompletion.status === "complete" ? draftApprovalBlockers : [];
  const preliminaryImplementationAuthorized = Boolean(contractApproval.approved) && draftLifecycleGateBlockers.length === 0 && draftPrincipleGateBlockers.length === 0;

  const skippedBeforeApprovalReason = "Skipped before bound human approval; draft packages do not construct canonical, test, verification, target, QA, or repair artifacts.";
  if (!preliminaryImplementationAuthorized) {
    const lifecycle = draftLifecycle;
    const lifecycleGateBlockers = draftLifecycleGateBlockers;
    const lifecycleGateWarnings = lifecycle.contextMatrix.warnings;
    const approvalBlockers = draftApprovalBlockers;
    const principleGateBlockers = draftPrincipleGateBlockers;
    const gatedReadinessScore = lifecycleGateBlockers.length > 0 ? Math.min(draftQuality.readiness.score, 49) : draftQuality.readiness.score;
    const packageReadinessTier: ReadinessTier = lifecycle.contextCompletion.status === "needs_clarification"
      ? "ready_for_clarification"
      : principleGateBlockers.length > 0
        ? "ready_for_contract_approval"
        : "ready_for_contract_draft";
    const finalQuality: QualityArtifacts = {
      ...draftQuality,
      validation: draftQuality.validation,
      readiness: {
        ...draftQuality.readiness,
        score: gatedReadinessScore,
        readinessTier: packageReadinessTier,
        readyForFrontendAgent: false,
        blockers: [...new Set([...lifecycleGateBlockers, ...principleGateBlockers, ...draftQuality.readiness.blockers])],
        warnings: [...new Set([...lifecycleGateWarnings, ...draftQuality.readiness.warnings])]
      },
      specCoverageAudit: {
        ...draftQuality.specCoverageAudit,
        summary: {
          ready_for_frontend_agent: false,
          readiness_score: gatedReadinessScore
        }
      },
      specCoverageReport: draftQuality.specCoverageReport
        .replace(/Ready for frontend agent: .*/u, "Ready for frontend agent: false")
        .replace(/Readiness score: .*/u, `Readiness score: ${gatedReadinessScore}`),
      implementationReadinessReport: [
        draftQuality.implementationReadinessReport,
        "",
        "## Hardened Lifecycle Gates",
        "",
        `Context status: ${lifecycle.contextCompletion.status}`,
        `Contract approval status: ${String(contractApproval.status)}`,
        "",
        ...[...lifecycleGateBlockers, ...principleGateBlockers].map((blocker) => `- ${blocker}`)
      ].join("\n")
    };
    const implementationAuthorized = false;
    const finalReadinessTier = packageReadinessTier;
    const manifest: Manifest = {
      package_id: stableId("package", projectSlug, sourceHash),
      project_slug: projectSlug,
      spec_version: "2.0",
      schema_version: "1.0",
      source_hash: sourceHash,
      generated_at: new Date().toISOString(),
      operating_mode: operatingMode,
      export_target: "react-typescript-tailwind-css-variables",
      readiness_score: finalQuality.readiness.score,
      readiness_tier: finalReadinessTier,
      ready_for_frontend_agent: finalQuality.readiness.readyForFrontendAgent,
      implementation_authorized: implementationAuthorized,
      contract_approval: contractApproval,
      readiness_evidence: buildReadinessEvidence({
        readinessScore: finalQuality.readiness.score,
        readinessTier: finalReadinessTier,
        readyForFrontendAgent: finalQuality.readiness.readyForFrontendAgent,
        implementationAuthorized,
        contextStatus: lifecycle.contextCompletion.status
      }),
      blockers: finalQuality.readiness.blockers,
      warnings: finalQuality.readiness.warnings,
      artifact_index: artifactIndexForPackage("draft"),
      compiler_phases: [
        phaseRecord("context", "constructed", "Context, evidence, product, experience, design-system, and frontend draft inputs were constructed."),
        phaseRecord("draft", "constructed", "Draft contract inputs were constructed for human review."),
        phaseRecord("approval", "constructed", "Approval gate was evaluated before canonical construction."),
        phaseRecord("canonical", "skipped", skippedBeforeApprovalReason),
        phaseRecord("test_first", "skipped", skippedBeforeApprovalReason),
        phaseRecord("verification", "skipped", skippedBeforeApprovalReason),
        phaseRecord("target", "skipped", skippedBeforeApprovalReason),
        phaseRecord("qa", "skipped", skippedBeforeApprovalReason),
        phaseRecord("repair", "skipped", skippedBeforeApprovalReason)
      ]
    };
    const compiledPackage: ArchetypePackage = {
      manifest,
      lifecycle,
      spec: phaseBlockedSpecArtifacts(skippedBeforeApprovalReason),
      testFirst: phaseBlockedTestFirstArtifacts(skippedBeforeApprovalReason),
      playwright: phaseBlockedPlaywrightArtifacts(skippedBeforeApprovalReason),
      ingestion,
      evidence,
      product,
      experience,
      designSystem,
      frontendContract,
      dsag,
      schemas,
      llm,
      referenceSurfaces,
      revision: phaseBlockedRevisionArtifacts(skippedBeforeApprovalReason),
      buildSimulation: phaseBlockedBuildSimulationArtifacts(skippedBeforeApprovalReason),
      targetFrontend: phaseBlockedTargetFrontendArtifacts(skippedBeforeApprovalReason),
      targetExecution: phaseBlockedTargetExecutionArtifacts(skippedBeforeApprovalReason),
      e2e: phaseBlockedE2EArtifacts(skippedBeforeApprovalReason),
      quality: finalQuality
    };
    if (_options.dataPlane) {
      recordCompiledPackage(_options.dataPlane, compiledPackage, {
        outputDir: _options.outputDir,
        sourcePath: _options.sourcePath
      });
    }
    return compiledPackage;
  }

  const revision = buildRevisionArtifacts({
    evidence,
    product,
    experience,
    frontendContract,
    dsag
  });
  const buildSimulation = buildFrontendBuildSimulationArtifacts({
    experience,
    designSystem,
    frontendContract
  });
  const targetFrontend = buildTargetFrontendArtifacts({
    experience,
    designSystem,
    frontendContract
  });
  const targetExecution = buildPendingTargetExecutionArtifacts();
  const e2e = buildE2EScenarioArtifacts({
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    dsag
  });
  const quality = buildQualityArtifacts({
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    targetExecution,
    e2e,
    dsag
  });
  const lifecycle = buildLifecycleArtifacts(input, ingestion, evidence, quality.readiness);
  const lifecycleGateBlockers = lifecycle.contextCompletion.status === "needs_clarification"
    ? lifecycle.contextMatrix.blockers
    : [];
  const lifecycleGateWarnings = lifecycle.contextMatrix.warnings;
  const approvalBlockers = (contractApproval.blockers as string[] | undefined) ?? [];
  const principleGateBlockers = lifecycle.contextCompletion.status === "complete" ? approvalBlockers : [];
  const gatedReadinessScore = lifecycleGateBlockers.length > 0 ? Math.min(quality.readiness.score, 49) : quality.readiness.score;
  const packageReadinessTier: ReadinessTier = lifecycle.contextCompletion.status === "needs_clarification"
    ? "ready_for_clarification"
    : principleGateBlockers.length > 0
      ? "ready_for_contract_approval"
      : "ready_for_implementation";
  const qualityForManifest = lifecycleGateBlockers.length === 0 && principleGateBlockers.length === 0
    ? quality
    : {
      ...quality,
      validation: quality.validation,
      readiness: {
        ...quality.readiness,
        score: gatedReadinessScore,
        readinessTier: packageReadinessTier,
        readyForFrontendAgent: false,
        blockers: [...new Set([...lifecycleGateBlockers, ...principleGateBlockers, ...quality.readiness.blockers])],
        warnings: [...new Set([...lifecycleGateWarnings, ...quality.readiness.warnings])]
      },
      specCoverageAudit: {
        ...quality.specCoverageAudit,
        summary: {
          ...((quality.specCoverageAudit.summary as Record<string, unknown> | undefined) ?? {}),
          ready_for_frontend_agent: false,
          readiness_score: gatedReadinessScore
        }
      },
      specCoverageReport: quality.specCoverageReport
        .replace(/Ready for frontend agent: .*/u, "Ready for frontend agent: false")
        .replace(/Readiness score: .*/u, `Readiness score: ${gatedReadinessScore}`),
      implementationReadinessReport: [
        quality.implementationReadinessReport,
        "",
        "## Hardened Lifecycle Gates",
        "",
        `Context status: ${lifecycle.contextCompletion.status}`,
        `Contract approval status: ${String(contractApproval.status)}`,
        "",
        ...[...lifecycleGateBlockers, ...principleGateBlockers].map((blocker) => `- ${blocker}`)
      ].join("\n")
    };
  const implementationAuthorized = Boolean(contractApproval.approved) && lifecycleGateBlockers.length === 0 && principleGateBlockers.length === 0;
  const finalReadinessTier: ReadinessTier = implementationAuthorized ? "ready_for_implementation" : packageReadinessTier;
  const finalQuality = {
    ...qualityForManifest,
    readiness: {
      ...qualityForManifest.readiness,
      readinessTier: finalReadinessTier
    }
  };

  const manifest: Manifest = {
    package_id: stableId("package", projectSlug, sourceHash),
    project_slug: projectSlug,
    spec_version: "2.0",
    schema_version: "1.0",
    source_hash: sourceHash,
    generated_at: new Date().toISOString(),
    operating_mode: operatingMode,
    export_target: "react-typescript-tailwind-css-variables",
    readiness_score: finalQuality.readiness.score,
    readiness_tier: finalReadinessTier,
    ready_for_frontend_agent: finalQuality.readiness.readyForFrontendAgent,
    implementation_authorized: implementationAuthorized,
    contract_approval: contractApproval,
    readiness_evidence: buildReadinessEvidence({
      readinessScore: finalQuality.readiness.score,
      readinessTier: finalReadinessTier,
      readyForFrontendAgent: finalQuality.readiness.readyForFrontendAgent,
      implementationAuthorized,
      contextStatus: lifecycle.contextCompletion.status
    }),
    blockers: finalQuality.readiness.blockers,
    warnings: finalQuality.readiness.warnings,
    artifact_index: artifactIndexForPackage(
      "canonical",
      experience.screenSpecs.map((screen) => `05-screen-specs/${screen.screen_id.replace(/[.]/g, "-")}.yaml`)
    ),
    compiler_phases: [
      phaseRecord("context", "constructed", "Context, evidence, product, experience, design-system, and frontend contract inputs were constructed."),
      phaseRecord("draft", "constructed", "Draft contract inputs were constructed and approved."),
      phaseRecord("approval", "constructed", "Bound human approval was verified before canonical construction."),
      phaseRecord("canonical", "constructed", "Canonical spec was constructed after approval."),
      phaseRecord("test_first", "constructed", "Test-first artifacts were constructed from the canonical spec."),
      phaseRecord("verification", "constructed", "Playwright verification artifacts were constructed from canonical contracts."),
      phaseRecord("target", "constructed", "Target generation and execution scaffolding artifacts were constructed after approval."),
      phaseRecord("qa", "constructed", "QA scenario artifacts were constructed after approval."),
      phaseRecord("repair", "constructed", "Revision and repair artifacts were constructed after approval.")
    ]
  };

  const packageWithoutSpecTestFirstAndPlaywright: Omit<ArchetypePackage, "spec" | "testFirst" | "playwright"> = {
    manifest,
    lifecycle,
    ingestion,
    evidence,
    product,
    experience,
    designSystem,
    frontendContract,
    dsag,
    schemas,
    llm,
    referenceSurfaces,
    revision,
    buildSimulation,
    targetFrontend,
    targetExecution,
    e2e,
    quality: finalQuality
  };
  const spec = buildSpecArtifacts(packageWithoutSpecTestFirstAndPlaywright);
  const packageWithoutTestFirstAndPlaywright: Omit<ArchetypePackage, "testFirst" | "playwright"> = {
    ...packageWithoutSpecTestFirstAndPlaywright,
    spec
  };
  const testFirst = buildTestFirstArtifacts(packageWithoutTestFirstAndPlaywright);
  const packageWithoutPlaywright: Omit<ArchetypePackage, "playwright"> = {
    ...packageWithoutTestFirstAndPlaywright,
    testFirst
  };
  const playwright = buildPlaywrightVerificationArtifacts(packageWithoutPlaywright);

  const compiledPackage: ArchetypePackage = {
    ...packageWithoutPlaywright,
    playwright
  };
  if (_options.dataPlane) {
    recordCompiledPackage(_options.dataPlane, compiledPackage, {
      outputDir: _options.outputDir,
      sourcePath: _options.sourcePath
    });
  }
  return compiledPackage;
}
