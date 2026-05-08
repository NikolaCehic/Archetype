import path from "node:path";
import {
  FileDataPlane,
  queryDataPlaneArtifact,
  queryDataPlaneArtifacts,
  queryDataPlaneLifecycle,
  queryDataPlaneReplay,
  queryDataPlaneStatus,
  queryDataPlaneTimeline
} from "../../data-plane";
import type { DataPlaneArtifactType, DataPlaneEventType, DataPlanePhase } from "../../data-plane";
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

function numberValue(record: JsonRecord, key: string): number | undefined {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function phaseValue(record: JsonRecord, key: string): DataPlanePhase | undefined {
  const value = stringValue(record, key);
  return value ? value as DataPlanePhase : undefined;
}

function eventTypeValue(record: JsonRecord, key: string): DataPlaneEventType | undefined {
  const value = stringValue(record, key);
  return value ? value as DataPlaneEventType : undefined;
}

function artifactTypeValue(record: JsonRecord, key: string): DataPlaneArtifactType | undefined {
  const value = stringValue(record, key);
  return value ? value as DataPlaneArtifactType : undefined;
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
      },
      phase: {
        type: "string",
        description: "Optional event phase filter."
      },
      type: {
        type: "string",
        description: "Optional event type filter."
      },
      limit: {
        type: "number",
        description: "Optional maximum number of events to return."
      }
    },
    required: ["outputDir", "runId"]
  },
  run(args: unknown): JsonRecord {
    const { record, outputDir, dataPlane } = outputDirFromArgs(args);
    return {
      ...queryDataPlaneTimeline(dataPlane, outputDir, stringValue(record, "runId"), {
        phase: phaseValue(record, "phase"),
        type: eventTypeValue(record, "type"),
        limit: numberValue(record, "limit")
      })
    };
  }
};

export const dataPlaneArtifactsTool: McpToolDefinition = {
  name: "archetype_data_plane_artifacts",
  description: "Return Agent Data Plane ArtifactRecords for one run with optional phase, type, priority, and limit filters.",
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
      },
      phase: {
        type: "string",
        description: "Optional artifact source phase filter."
      },
      type: {
        type: "string",
        description: "Optional artifact type filter."
      },
      readPriority: {
        type: "string",
        description: "Optional read priority filter: hot, warm, or cold."
      },
      limit: {
        type: "number",
        description: "Optional maximum number of artifacts to return."
      }
    },
    required: ["outputDir", "runId"]
  },
  run(args: unknown): JsonRecord {
    const { record, outputDir, dataPlane } = outputDirFromArgs(args);
    return {
      ...queryDataPlaneArtifacts(dataPlane, outputDir, stringValue(record, "runId"), {
        phase: phaseValue(record, "phase"),
        type: artifactTypeValue(record, "type"),
        readPriority: stringValue(record, "readPriority") || undefined,
        limit: numberValue(record, "limit")
      })
    };
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

export const dataPlaneLifecycleTool: McpToolDefinition = {
  name: "archetype_data_plane_lifecycle",
  description: "Return lifecycle and readiness projections for one run without reading the artifact tree.",
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
    return { ...queryDataPlaneLifecycle(dataPlane, outputDir, stringValue(record, "runId")) };
  }
};
