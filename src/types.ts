export type DocumentType = string;
export type SourceStatus = "local" | "submitted" | "merged";
export type AcceptanceStatus = "pending" | "passed" | "failed" | "blocked";
export type DeploymentStatus = "started" | "succeeded" | "failed" | "rolled-back";
export type ReleaseStatus = "pending" | "published" | "failed" | "rolled-back";
export type DerivedStage = "planned" | "specified" | "implemented" | "verified" | "released";
export type CaseStatus = "pass" | "fail" | "blocked" | "skipped";

export interface RepositoryConfig {
  id: string;
  path?: string;
  remote?: string;
  required: boolean;
}

export interface EnvironmentConfig {
  id: string;
  kind: "development" | "test" | "staging" | "production";
}

export interface DeliveryGuardConfig {
  $schema?: string;
  schemaVersion: 1;
  project: { id: string; name: string };
  stableBranch: string;
  repositories: RepositoryConfig[];
  environments: EnvironmentConfig[];
  documentTypes: DocumentType[];
  paths: {
    versions: string;
    acceptance: string;
    repairs: string;
    openspec: string;
  };
  policies: {
    requireOpenSpec: boolean;
    requireAcceptanceBeforeRelease: boolean;
    requireDedicatedWorktree: boolean;
  };
}

export interface VersionDocument {
  id: string;
  type: string;
  title: string;
  ref: string;
  primary?: boolean;
  revision?: string | number;
}

export interface VersionRecord {
  $schema?: string;
  schemaVersion: 1;
  version: string;
  title: string;
  documents: VersionDocument[];
  openSpec?: {
    changeId: string;
    path: string;
    status: "proposed" | "ready" | "applied" | "archived";
  };
  sources: Array<{
    repositoryId: string;
    branch: string;
    commit: string;
    status: SourceStatus;
  }>;
  acceptance: {
    status: AcceptanceStatus;
    evidence?: string;
    report?: string;
  };
  deployments: Array<{
    repositoryId: string;
    environmentId: string;
    branch: string;
    commit: string;
    status: DeploymentStatus;
    anchor: string;
    recordedAt: string;
  }>;
  release: {
    status: ReleaseStatus;
    anchor?: string;
    releasedAt?: string;
  };
}

export interface EvidenceManifest {
  $schema?: string;
  schemaVersion: 1;
  version: string;
  documents: Array<{ documentId: string; requirementIds: string[] }>;
  requirements: Array<{ id: string; description: string; caseIds: string[] }>;
  cases: Array<{
    id: string;
    title: string;
    status: CaseStatus;
    evidence: string[];
    note?: string;
  }>;
}

export interface RepairCheck {
  id: string;
  command: string[];
  cwd?: string;
  expectedExitCode: number;
  outputPattern?: string;
  timeoutMs?: number;
}

export interface RepairCase {
  $schema?: string;
  schemaVersion: 1;
  id: string;
  title: string;
  stage: "reported" | "reproduced" | "diagnosed" | "resolved" | "verified" | "closed";
  status: "active" | "blocked" | "done" | "wont-fix" | "duplicate";
  classification:
    | "code"
    | "requirement-gap"
    | "configuration"
    | "data"
    | "external-dependency"
    | "test-infrastructure"
    | "unknown";
  baseline?: { repository: string; commit: string };
  candidate?: { repository: string; commit: string };
  symptom: { environment: string; expected: string; actual: string };
  phases: {
    reproduction: RepairCheck[];
    targeted: RepairCheck[];
    regression: RepairCheck[];
  };
}

export interface Diagnostic {
  code: string;
  message: string;
  path?: string;
  severity: "error" | "warning";
}

export interface VersionStatus {
  version: string;
  stage: DerivedStage;
  diagnostics: Diagnostic[];
}

export interface ProjectValidation {
  ok: boolean;
  diagnostics: Diagnostic[];
  versions: VersionStatus[];
}

export interface RepairRunResult {
  checkId: string;
  passed: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
}
