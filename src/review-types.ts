/** Provider-neutral, offline review evidence. These records are not authenticated approvals. */
export interface ReviewPolicy {
  schemaVersion: 1;
  id: string;
  revision: string;
  repositoryId: string;
  branch: string;
  environments: Array<{ id: string; kind: "test" | "staging" | "production" }>;
  allowedPaths: string[];
  requiredChecks: string[];
  reviewers: string[];
  allowHotfix: boolean;
  autoReview: {
    enabled: boolean;
    allowedPaths: string[];
    excludedPaths: string[];
    maxFiles: number;
    maxChangedLines: number;
    maxAgeHours: number;
    minSuitability: number;
    maxRisk: number;
  };
}

export interface ReviewCandidate {
  schemaVersion: 1;
  id: string;
  repositoryId: string;
  task: { id: string; summary: string; acceptanceCriteria: string[]; revision: string; kind: "feature" | "bug"; changesRules: boolean; documentRevision: string };
  author: string;
  branch: string;
  baseCommit: string;
  commit: string;
  tree: string;
  environmentId: string;
  mode: "delivery" | "hotfix" | "integration";
  files: Array<{ path: string; changedLines: number }>;
  /** Findings supplied by a trusted external scanner, not inferred by this validator. */
  sensitiveFindings: string[];
  integration?: {
    targetBranch: string;
    parents: [string, string];
    targetHead: string;
    sourceHead: string;
    conflictPaths: string[];
    resolutionPaths: string[];
    observedAt: string;
    evidence: string;
  };
}

export interface ReviewRecord {
  schemaVersion: 1;
  candidate: ReviewCandidate;
  checks: Array<{ id: string; candidateDigest: string; status: "pass" | "fail"; evidence: string }>;
  decisions: Array<{
    kind: "human" | "automatic";
    outcome: "approved" | "rejected";
    reviewer: string;
    candidateDigest: string;
    policyDigest: string;
    recordedAt: string;
    expiresAt: string;
    evidence: string;
    model?: string;
    suitability?: number;
    risk?: number;
  }>;
}
