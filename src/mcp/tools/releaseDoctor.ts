import path from "node:path";
import { runReleaseDoctor } from "../../release/doctor";
import type { JsonRecord, McpToolDefinition } from "./shared";

export const releaseDoctorTool: McpToolDefinition = {
  name: "archetype_release_doctor",
  description: "Return the package install, plugin setup, and lifecycle readiness report for Archetype.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  run(): JsonRecord {
    return runReleaseDoctor(path.resolve(__dirname, "..", "..", "..")) as unknown as JsonRecord;
  }
};
