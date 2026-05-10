import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { hashContent } from "../core/stable";
import type { ArchetypeInput, ContractApprovalInput } from "../core/types";

export interface DraftApprovalArtifactHash {
  path: string;
  sha256: string;
  bytes: number;
}

export interface DraftContractFingerprint {
  fingerprint_version: "1.0";
  route_count: number;
  routes: Array<{
    route: string;
    screen_id: string;
  }>;
  screen_count: number;
  screens: Array<{
    screen_id: string;
    route: string;
  }>;
  component_count: number;
  component_names: string[];
  token_digest: string;
  frontend_contract_digest: string;
  fingerprint_digest: string;
}

export interface DraftApprovalProof {
  approval_artifact_version: "1.0";
  approval_kind: "draft_contract_approval";
  draft_package_id: string;
  draft_source_hash: string;
  draft_package_checksum: string;
  contract_fingerprint: DraftContractFingerprint;
  approved_artifact_refs: string[];
  approved_assumption_ids: string[];
  approved_by: string;
  approver_type: "human";
  approved_at: string;
  artifact_hashes: DraftApprovalArtifactHash[];
  approval_digest: string;
}

export interface DraftApprovalResult {
  approvedInput: ArchetypeInput;
  approvalProof: DraftApprovalProof;
  approvalArtifactPath: string;
  approvalArtifactRelativePath: string;
}

export const REQUIRED_DRAFT_APPROVAL_REFS = [
  "draft/contract-approval-request.json",
  "draft/frontend-contract.draft.json",
  "draft/product-model.draft.json",
  "draft/experience-architecture.draft.json",
  "draft/design-system.draft.json",
  "draft/assumption-ledger.md",
  "lifecycle/context-matrix.json",
  "01-evidence/evidence-ledger.json"
];

export function inputSourceHashForApproval(input: ArchetypeInput): string {
  const { contractApproval: _contractApproval, ...withoutContractApproval } = input;
  return hashContent(withoutContractApproval);
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

function artifactHash(draftDir: string, relativePath: string): DraftApprovalArtifactHash {
  const filePath = path.join(draftDir, relativePath);
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new Error(`Draft approval cannot find required artifact: ${relativePath}`);
  }
  const content = readFileSync(filePath);
  return {
    path: relativePath,
    sha256: hashContent(content.toString("utf8")),
    bytes: content.byteLength
  };
}

function proofDigest(proof: Omit<DraftApprovalProof, "approval_digest">): string {
  return hashContent(proof);
}

function normalizeArtifactRefs(artifactRefs: string[] | undefined): string[] {
  return [...new Set([...(artifactRefs ?? []), ...REQUIRED_DRAFT_APPROVAL_REFS])].sort();
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringField(value: unknown, key: string): string {
  const field = asRecord(value)[key];
  return typeof field === "string" ? field : "";
}

function buildDraftContractFingerprint(draftDir: string): DraftContractFingerprint {
  const experience = readJson<Record<string, unknown>>(path.join(draftDir, "draft", "experience-architecture.draft.json"));
  const design = readJson<Record<string, unknown>>(path.join(draftDir, "draft", "design-system.draft.json"));
  const frontend = readJson<Record<string, unknown>>(path.join(draftDir, "draft", "frontend-contract.draft.json"));
  const routes = asArray(experience.routes).map((route) => ({
    route: stringField(route, "route"),
    screen_id: stringField(route, "screen_id")
  })).filter((route) => route.route && route.screen_id);
  const screens = asArray(experience.screens).map((screen) => ({
    screen_id: stringField(screen, "screen_id"),
    route: stringField(screen, "route")
  })).filter((screen) => screen.screen_id && screen.route);
  const componentNames = asArray(design.components)
    .map((component) => stringField(component, "name"))
    .filter(Boolean)
    .sort();
  const tokenDigest = hashContent(asRecord(design.tokens));
  const frontendContractDigest = hashContent({
    routing: frontend.routing,
    data_contracts: frontend.data_contracts,
    data_operation_contracts: frontend.data_operation_contracts,
    action_contracts: frontend.action_contracts,
    form_contracts: frontend.form_contracts,
    verification_strategy: frontend.verification_strategy
  });
  const withoutDigest = {
    fingerprint_version: "1.0" as const,
    route_count: routes.length,
    routes,
    screen_count: screens.length,
    screens,
    component_count: componentNames.length,
    component_names: componentNames,
    token_digest: tokenDigest,
    frontend_contract_digest: frontendContractDigest
  };
  return {
    ...withoutDigest,
    fingerprint_digest: hashContent(withoutDigest)
  };
}

export function verifyDraftApprovalProofDigest(proof: DraftApprovalProof): boolean {
  const { approval_digest: _digest, ...withoutDigest } = proof;
  return proof.approval_digest === proofDigest(withoutDigest);
}

export function createDraftApproval(input: {
  intake: ArchetypeInput;
  intakePath: string;
  draftDir: string;
  approvedInputPath: string;
  approvedBy: string;
  approvedAt?: string;
  approvedAssumptionIds?: string[];
  artifactRefs?: string[];
}): DraftApprovalResult {
  const approvedBy = input.approvedBy.trim();
  if (!approvedBy) throw new Error("--approved-by is required to create a bound draft approval.");

  const draftDir = path.resolve(input.draftDir);
  const approvedInputPath = path.resolve(input.approvedInputPath);
  const internalManifestPath = path.join(draftDir, "00-manifest", "manifest.json");
  if (!existsSync(internalManifestPath)) throw new Error(`Draft package is missing ${internalManifestPath}.`);

  const internalManifest = readJson<{
    package_id?: string;
    source_hash?: string;
    package_type?: string;
    artifact_index?: string[];
  }>(internalManifestPath);
  if (internalManifest.package_type !== "draft_contract") {
    throw new Error("approve-draft requires a draft_contract package.");
  }

  const sourceHash = inputSourceHashForApproval(input.intake);
  if (internalManifest.source_hash !== sourceHash) {
    throw new Error(`Draft source hash mismatch. Expected ${sourceHash}, found ${internalManifest.source_hash ?? "missing"}.`);
  }
  if (!internalManifest.package_id) throw new Error("Draft package manifest is missing package_id.");

  const approvedArtifactRefs = normalizeArtifactRefs(input.artifactRefs);
  const artifactHashes = approvedArtifactRefs.map((relativePath) => artifactHash(draftDir, relativePath));
  const contractFingerprint = buildDraftContractFingerprint(draftDir);
  const draftPackageChecksum = hashContent({
    draft_package_id: internalManifest.package_id,
    draft_source_hash: sourceHash,
    artifact_hashes: artifactHashes,
    contract_fingerprint: contractFingerprint
  });
  const proofWithoutDigest: Omit<DraftApprovalProof, "approval_digest"> = {
    approval_artifact_version: "1.0",
    approval_kind: "draft_contract_approval",
    draft_package_id: internalManifest.package_id,
    draft_source_hash: sourceHash,
    draft_package_checksum: draftPackageChecksum,
    contract_fingerprint: contractFingerprint,
    approved_artifact_refs: approvedArtifactRefs,
    approved_assumption_ids: input.approvedAssumptionIds ?? [],
    approved_by: approvedBy,
    approver_type: "human",
    approved_at: input.approvedAt ?? new Date().toISOString(),
    artifact_hashes: artifactHashes
  };
  const approvalProof: DraftApprovalProof = {
    ...proofWithoutDigest,
    approval_digest: proofDigest(proofWithoutDigest)
  };

  const approvalArtifactPath = `${approvedInputPath.replace(/\.json$/u, "")}.approval.json`;
  const approvalArtifactRelativePath = path.relative(path.dirname(approvedInputPath), approvalArtifactPath);
  const contractApproval: ContractApprovalInput = {
    approved: true,
    approverType: "human",
    approvedBy,
    approvedAt: approvalProof.approved_at,
    artifactRefs: approvedArtifactRefs,
    approvalArtifactPath: approvalArtifactRelativePath,
    approvalDigest: approvalProof.approval_digest,
    draftPackageId: approvalProof.draft_package_id,
    sourceHash: approvalProof.draft_source_hash,
    packageChecksum: approvalProof.draft_package_checksum,
    approvedAssumptionIds: approvalProof.approved_assumption_ids
  };
  const approvedInput: ArchetypeInput = {
    ...input.intake,
    contractApproval
  };

  mkdirSync(path.dirname(approvalArtifactPath), { recursive: true });
  writeFileSync(approvalArtifactPath, `${JSON.stringify(approvalProof, null, 2)}\n`);
  writeFileSync(approvedInputPath, `${JSON.stringify(approvedInput, null, 2)}\n`);

  return {
    approvedInput,
    approvalProof,
    approvalArtifactPath,
    approvalArtifactRelativePath
  };
}

export function readDraftApprovalProof(filePath: string): DraftApprovalProof {
  const proof = readJson<DraftApprovalProof>(filePath);
  if (proof.approval_artifact_version !== "1.0" || proof.approval_kind !== "draft_contract_approval") {
    throw new Error("Approval artifact is not an Archetype draft contract approval proof.");
  }
  return proof;
}
