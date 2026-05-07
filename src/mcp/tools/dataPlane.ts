import path from "node:path";
import {
  FileDataPlane,
  queryDataPlaneArtifact,
  queryDataPlaneReplay,
  queryDataPlaneStatus,
  queryDataPlaneTimeline
} from "../../data-plane";
import {
  asRecord,
  resolveDeclaredPath,
  stringValue,
  type JsonRecord,
  type McpToolDefinition
} from "./shared";

function dataPlaneForOutput(outputDir: string): FileDataPlane {
  return new FileDataPlane({ rootDir: path.join(outputDir, "data-plane") });
}

function dataPlaneRootForOutput(outputDir: string): string {
  return path.join(outputDir, "data-plane");
}

function outputDirFromArgs(args: unknown): { record: JsonRecord; outputDir: string; dataPlane: FileDataPlane } {
  const record = asRecord(args);
  const outputDir = resolveDeclaredPath(record.outputDir, "archetype-output", "outputDir");
  return {
    record,
    outputDir,
    dataPlane: dataPlaneForOutput(outputDir)
  };
}

export const dataPlaneStatusTool: McpToolDefinition = {
  name: "archetype_data_plane_status",
  description: "Return deterministic Agent Data Plane run status for an archetype-output directory.",
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
    const { outputDir, dataPlane } = outputDirFromArgs(args);
    return { ...queryDataPlaneStatus(dataPlane, outputDir, dataPlaneRootForOutput(outputDir)) };
  }
};

export const dataPlaneTimelineTool: McpToolDefinition = {
  name: "archetype_data_plane_timeline",
  description: "Return a deterministic timeline of Agent Data Plane events for one run.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      runId: {
        type: "string",
        description: "Agent Data Plane run ID."
      }
    },
    required: ["outputDir", "runId"]
  },
  run(args: unknown): JsonRecord {
    const { record, outputDir, dataPlane } = outputDirFromArgs(args);
    return { ...queryDataPlaneTimeline(dataPlane, outputDir, stringValue(record, "runId")) };
  }
};

export const dataPlaneReadArtifactTool: McpToolDefinition = {
  name: "archetype_data_plane_read_artifact",
  description: "Read one Agent Data Plane ArtifactRecord by artifact ID without reading the generated artifact content.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      artifactId: {
        type: "string",
        description: "Agent Data Plane artifact ID."
      },
      runId: {
        type: "string",
        description: "Optional run ID to restrict the artifact lookup."
      }
    },
    required: ["outputDir", "artifactId"]
  },
  run(args: unknown): JsonRecord {
    const { record, outputDir, dataPlane } = outputDirFromArgs(args);
    return {
      ...queryDataPlaneArtifact(
        dataPlane,
        outputDir,
        stringValue(record, "artifactId"),
        stringValue(record, "runId") || undefined
      )
    };
  }
};

export const dataPlaneReplayRunTool: McpToolDefinition = {
  name: "archetype_data_plane_replay_run",
  description: "Replay one Agent Data Plane run from append-only events and artifact records.",
  inputSchema: {
    type: "object",
    properties: {
      outputDir: {
        type: "string",
        description: "Generated archetype-output directory."
      },
      runId: {
        type: "string",
        description: "Agent Data Plane run ID."
      }
    },
    required: ["outputDir", "runId"]
  },
  run(args: unknown): JsonRecord {
    const { record, outputDir, dataPlane } = outputDirFromArgs(args);
    return { ...queryDataPlaneReplay(dataPlane, outputDir, stringValue(record, "runId")) };
  }
};
