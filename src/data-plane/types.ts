export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type DataPlaneRunStatus = "created" | "running" | "blocked" | "completed" | "failed";
export type DataPlaneHost = "cli" | "mcp" | "codex" | "claude_code" | "test" | "unknown";
export type DataPlaneArtifactType = "json" | "markdown" | "html" | "text" | "yaml" | "typescript" | "other";
export type DataPlanePhase =
  | "intake"
  | "clarification"
  | "evidence"
  | "draft_contract"
  | "approval"
  | "canonical_spec"
  | "test_first"
  | "implementation"
  | "verification"
  | "qa"
  | "repair"
  | "readiness"
  | "unknown";

export type ProjectionName = "lifecycle" | "evidence" | "contracts" | "verification" | "readiness";

export type DataPlaneEventType =
  | "run.created"
  | "intake.recorded"
  | "evidence.recorded"
  | "decision.recorded"
  | "lifecycle.gate_evaluated"
  | "contract.draft_recorded"
  | "contract.canonical_recorded"
  | "artifact.recorded"
  | "verification.recorded"
  | "qa.recorded"
  | "repair.recorded"
  | "readiness.evaluated"
  | "projection.updated";

export type DecisionStatus = "confirmed" | "candidate" | "missing" | "conflicted" | "blocked";
export type TaskStatus = "pending" | "running" | "pass" | "fail" | "blocked";
export type VerificationStatus = "pending" | "pass" | "fail" | "warning";

export interface AgentSession {
  session_id: string;
  host: DataPlaneHost;
  started_at: string;
  actor: string;
  metadata: JsonObject;
}

export interface AgentRun {
  run_id: string;
  schema_version: "1.0";
  project_slug: string;
  package_id: string | null;
  source_hash: string | null;
  output_dir: string | null;
  status: DataPlaneRunStatus;
  created_at: string;
  updated_at: string;
  sessions: AgentSession[];
  metadata: JsonObject;
}

export interface DataPlaneEvent {
  event_id: string;
  run_id: string;
  sequence: number;
  type: DataPlaneEventType;
  occurred_at: string;
  actor: string;
  phase: DataPlanePhase;
  payload: JsonObject;
}

export interface ArtifactRef {
  artifact_id: string;
  path: string;
  sha256: string | null;
}

export interface ArtifactRecord {
  artifact_id: string;
  run_id: string;
  ref: ArtifactRef;
  type: DataPlaneArtifactType;
  source_phase: DataPlanePhase;
  producer: string;
  bytes: number;
  lineage_event_ids: string[];
  created_at: string;
  metadata: JsonObject;
}

export interface ContractVersion {
  contract_id: string;
  run_id: string;
  version: string;
  phase: "draft" | "canonical" | "test_first" | "verification";
  artifact_refs: ArtifactRef[];
  created_at: string;
  metadata: JsonObject;
}

export interface LifecycleSnapshot {
  run_id: string;
  state: string;
  readiness_tier: string;
  implementation_authorized: boolean;
  ready_for_frontend_agent: boolean;
  blockers: string[];
  warnings: string[];
  updated_at: string;
}

export interface EvidenceRecord {
  evidence_id: string;
  run_id: string;
  source: string;
  level: string;
  summary: string;
  artifact_refs: ArtifactRef[];
  created_at: string;
  metadata: JsonObject;
}

export interface DecisionRecord {
  decision_id: string;
  run_id: string;
  status: DecisionStatus;
  summary: string;
  evidence_refs: string[];
  created_at: string;
  metadata: JsonObject;
}

export interface TaskRecord {
  task_id: string;
  run_id: string;
  status: TaskStatus;
  owner: string;
  summary: string;
  artifact_refs: ArtifactRef[];
  created_at: string;
  metadata: JsonObject;
}

export interface RepairRecord {
  repair_id: string;
  run_id: string;
  status: TaskStatus;
  source: string;
  task_refs: string[];
  created_at: string;
  metadata: JsonObject;
}

export interface VerificationRecord {
  verification_id: string;
  run_id: string;
  status: VerificationStatus;
  evidence_grade: string;
  artifact_refs: ArtifactRef[];
  created_at: string;
  metadata: JsonObject;
}

export interface DataPlaneProjection {
  projection_name: ProjectionName;
  run_id: string;
  updated_at: string;
  event_count: number;
  checksum: string;
  data: JsonObject;
}

export interface DataPlaneTimelineItem {
  event_id: string;
  sequence: number;
  type: DataPlaneEventType;
  phase: DataPlanePhase;
  occurred_at: string;
  actor: string;
  summary: string;
}

export interface DataPlaneReplay {
  run: AgentRun;
  events: DataPlaneEvent[];
  artifacts: ArtifactRecord[];
  projections: Record<ProjectionName, DataPlaneProjection>;
  timeline: DataPlaneTimelineItem[];
}

export interface CreateRunInput {
  runId?: string;
  projectSlug: string;
  packageId?: string | null;
  sourceHash?: string | null;
  outputDir?: string | null;
  status?: DataPlaneRunStatus;
  session?: AgentSession;
  metadata?: JsonObject;
  createdAt?: string;
}

export interface AppendEventInput {
  runId: string;
  type: DataPlaneEventType;
  phase?: DataPlanePhase;
  actor?: string;
  payload?: JsonObject;
  occurredAt?: string;
}

export interface WriteArtifactInput {
  runId: string;
  artifactId?: string;
  path: string;
  type: DataPlaneArtifactType;
  sourcePhase: DataPlanePhase;
  producer: string;
  bytes?: number;
  sha256?: string | null;
  lineageEventIds?: string[];
  metadata?: JsonObject;
  createdAt?: string;
}

export interface WriteProjectionInput {
  runId: string;
  projectionName: ProjectionName;
  data: JsonObject;
  eventCount?: number;
  updatedAt?: string;
  recordEvent?: boolean;
}
