import { existsSync } from "node:fs";
import path from "node:path";
import { runArchetypeCompiler } from "../../core/pipeline";
import type { ArchetypeInput } from "../../core/types";
import { assessContextGate } from "../../modules/contextGate";
import { FileDataPlane, mergeManifestArtifacts, recordClarificationPackage, recordCompiledPackage, recordExportedArtifacts } from "../../data-plane";
import { exportClarificationPackage } from "../../output/exportClarificationPackage";
import { exportDraftPackage } from "../../output/exportDraftPackage";
import { exportPackage } from "../../output/exportPackage";
import {
  artifactType,
  assertSafeOutputDirectory,
  asRecord,
  booleanValue,
  ensureExists,
  readJsonFile,
  resolveDeclaredPath,
  statusFromReadiness,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function dataPlaneForOutput(outputDir: string): FileDataPlane {
  return new FileDataPlane({ rootDir: path.join(outputDir, "data-plane") });
}

export const generatePackageTool: McpToolDefinition = {
  name: "archetype_generate_package",
  description: "Run the Archetype compiler and write an agent-readable archetype-output package.",
  inputSchema: {
    type: "object",
    properties: {
      inputPath: {
        type: "string",
        description: "Path to an Archetype intake JSON file."
      },
      outputDir: {
        type: "string",
        description: "Directory where the generated contract package should be written."
      },
      overwrite: {
        type: "boolean",
        description: "Whether an existing outputDir may be replaced. Defaults to true."
      }
    },
    required: ["inputPath", "outputDir"]
  },
  run(args: unknown): JsonRecord {
    const record = asRecord(args);
    const inputPath = resolveDeclaredPath(record.inputPath, "", "inputPath");
    const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
    const overwrite = booleanValue(record, "overwrite", true);
    ensureExists(inputPath, "inputPath");
    assertSafeOutputDirectory(outputDir, "outputDir");
    if (existsSync(outputDir) && !overwrite) throw new Error(`outputDir already exists: ${outputDir}`);

    const input = readJsonFile<ArchetypeInput>(inputPath);
    const contextGate = assessContextGate(input);
    if (contextGate.status === "needs_clarification") {
      const clarificationPackage = exportClarificationPackage(input, contextGate, outputDir, inputPath, { force: overwrite });
      const dataPlaneRun = recordClarificationPackage(dataPlaneForOutput(outputDir), input, contextGate, clarificationPackage, {
        outputDir,
        sourcePath: inputPath
      });
      const artifacts = clarificationPackage.artifacts.map((artifact) => ({
        id: artifact.id,
        path: path.join(outputDir, artifact.path),
        type: artifact.type,
        required: artifact.required
      }));

      return {
        status: "warning",
        outputDir,
        packageType: "clarification",
        readinessScore: clarificationPackage.readiness.score,
        readinessTier: clarificationPackage.readiness.readinessTier,
        readyForFrontendAgent: false,
        blockers: contextGate.blockers,
        warnings: contextGate.warnings,
        nextQuestion: contextGate.questions[0]?.question ?? null,
        dataPlaneRunId: dataPlaneRun.run_id,
        artifacts
      };
    }

    const compiled = runArchetypeCompiler(input, {
      sourcePath: inputPath,
      outputDir
    });

    if (compiled.manifest.implementation_authorized !== true) {
      const draftPackage = exportDraftPackage(compiled, outputDir, { force: overwrite });
      const dataPlane = dataPlaneForOutput(outputDir);
      const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
        outputDir,
        sourcePath: inputPath
      });
      recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outputDir, draftPackage);
      const artifacts = draftPackage.artifacts.map((artifact) => ({
        id: artifact.id,
        path: path.join(outputDir, artifact.path),
        type: artifact.type,
        required: artifact.required
      }));
      const blockers = compiled.quality.readiness.blockers;
      const warnings = compiled.quality.readiness.warnings;

      return {
        status: "warning",
        outputDir,
        packageType: "draft_contract",
        readinessScore: compiled.quality.readiness.score,
        readinessTier: "ready_for_contract_approval",
        readyForFrontendAgent: false,
        blockers,
        warnings,
        dataPlaneRunId: dataPlaneRun.run_id,
        artifacts
      };
    }

    exportPackage(compiled, outputDir, { force: overwrite });

    const topManifest = readJsonFile<{
      artifacts?: Array<{ id?: string; path: string; type?: string; required?: boolean }>;
    }>(path.join(outputDir, "manifest.json"));
    const dataPlane = dataPlaneForOutput(outputDir);
    const dataPlaneRun = recordCompiledPackage(dataPlane, compiled, {
      outputDir,
      sourcePath: inputPath
    });
    recordExportedArtifacts(dataPlane, dataPlaneRun.run_id, outputDir, {
      artifacts: mergeManifestArtifacts(topManifest.artifacts ?? [], compiled.manifest.artifact_index),
      manifest: topManifest
    });
    const artifacts = (topManifest.artifacts ?? []).map((artifact) => ({
      id: artifact.id,
      path: path.join(outputDir, artifact.path),
      type: artifact.type ?? artifactType(artifact.path),
      required: artifact.required ?? true
    }));
    const blockers = compiled.quality.readiness.blockers;
    const warnings = compiled.quality.readiness.warnings;

    return {
      status: statusFromReadiness(blockers, warnings),
      outputDir,
      readinessScore: compiled.quality.readiness.score,
      readinessTier: compiled.manifest.readiness_tier,
      readyForFrontendAgent: compiled.quality.readiness.readyForFrontendAgent,
      blockers,
      warnings,
      dataPlaneRunId: dataPlaneRun.run_id,
      artifacts
    };
  }
};
