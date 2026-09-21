import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";

import { error, hasErrors } from "./diagnostics.js";
import { resolveInside } from "./io.js";
import { validateSchema } from "./schemas.js";
import type { ReviewCandidate, ReviewPolicy, ReviewRecord } from "./review-types.js";
import type { Diagnostic } from "./types.js";

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  const encoded = JSON.stringify(value);
  if (encoded === undefined) throw new Error("review digests require JSON values");
  return encoded;
}

/** Hash the complete candidate or policy, never the enclosing record with its decisions. */
export function reviewDigest(value: ReviewCandidate | ReviewPolicy): string {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

/** Constrain reads, including symlink targets, to regular files inside the project. */
export function reviewFile(root: string, path: string): string {
  const target = realpathSync(resolveInside(root, path));
  const fromRoot = relative(realpathSync(resolve(root)), target);
  if (fromRoot === ".." || fromRoot.startsWith("../") || isAbsolute(fromRoot) || !statSync(target).isFile()) {
    throw new Error("review input must be a regular file inside the project");
  }
  return target;
}

export function readReviewJson<T>(root: string, path: string): T {
  return JSON.parse(readFileSync(reviewFile(root, path), "utf8")) as T;
}

function matches(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export interface ReviewResult {
  ok: boolean;
  route: "human" | "automatic" | "hotfix" | "blocked";
  diagnostics: Diagnostic[];
  /** Always false: evidence consistency is not permission to perform an external action. */
  authorizesExternalAction: false;
}

export function validateReview(root: string, policy: ReviewPolicy, record: ReviewRecord, now = new Date()): ReviewResult {
  const diagnostics = [...validateSchema("review-policy", policy), ...validateSchema("review-record", record)];
  const finish = (route: ReviewResult["route"]): ReviewResult => ({
    ok: !hasErrors(diagnostics), route: hasErrors(diagnostics) ? "blocked" : route,
    diagnostics, authorizesExternalAction: false,
  });
  if (hasErrors(diagnostics)) return finish("blocked");
  const fail = (code: string, message: string) => diagnostics.push(error(`review.${code}`, message));
  const artifact = (path: string) => {
    try { reviewFile(root, path); } catch { fail("evidence", `missing or unsafe evidence: ${path}`); }
  };
  if (!Number.isFinite(now.getTime())) { fail("clock", "evaluation time is invalid"); return finish("blocked"); }
  const candidate = record.candidate;
  const digest = reviewDigest(candidate);
  const policyDigest = reviewDigest(policy);
  const environment = policy.environments.find((item) => item.id === candidate.environmentId);
  if (new Set(policy.environments.map((item) => item.id)).size !== policy.environments.length) {
    fail("environment-duplicate", "environment IDs must be unique");
  }
  if (!environment) fail("environment", "candidate environment is not configured");
  if (candidate.repositoryId !== policy.repositoryId || candidate.branch !== policy.branch) {
    fail("source", "candidate must match the policy repository and development branch");
  }
  const paths = candidate.files.map((item) => item.path);
  if (new Set(paths).size !== paths.length) fail("files-duplicate", "changed paths must be unique");
  if (paths.some((path) => !matches(path, policy.allowedPaths))) fail("scope", "candidate exceeds the policy file scope");
  if (new Set(record.checks.map((item) => item.id)).size !== record.checks.length) fail("checks-duplicate", "check IDs must be unique");
  for (const check of record.checks) {
    if (check.candidateDigest !== digest || check.status !== "pass") fail("check", `check ${check.id} is failing or stale`);
    artifact(check.evidence);
  }
  for (const id of policy.requiredChecks) {
    if (!record.checks.some((check) => check.id === id)) fail("check-missing", `required check ${id} is missing`);
  }
  if (candidate.mode !== "integration" && candidate.integration) fail("integration-unexpected", "integration evidence requires integration mode");
  if (candidate.mode === "integration") {
    const integration = candidate.integration;
    if (!integration) fail("integration-missing", "integration evidence is required");
    else {
      if (environment?.kind === "production") fail("integration-production", "integration candidates are non-production only");
      if (integration.parents[0] !== integration.targetHead || integration.parents[1] !== integration.sourceHead ||
          integration.targetHead === integration.sourceHead || integration.targetBranch === candidate.branch) {
        fail("integration-parents", "integration requires distinct target and source parents in that order");
      }
      if (integration.resolutionPaths.some((path) => !integration.conflictPaths.includes(path) || !paths.includes(path))) {
        fail("integration-scope", "resolution changes must be in both the conflict set and changed files");
      }
      const observed = Date.parse(integration.observedAt);
      if (observed > now.getTime() || now.getTime() - observed > 3_600_000) {
        fail("integration-stale", "remote observation must be no more than one hour old and not in the future");
      }
      artifact(integration.evidence);
    }
  }
  // A current human rejection survives expiry and policy edits. A changed candidate must be reviewed afresh.
  if (record.decisions.some((item) => item.kind === "human" && item.outcome === "rejected" && item.candidateDigest === digest)) {
    fail("rejected", "this candidate has a human rejection; prepare a new candidate revision");
  }
  if (candidate.mode === "hotfix") {
    if (!policy.allowHotfix || candidate.task.kind !== "bug" || candidate.task.changesRules || environment?.kind === "production") {
      fail("hotfix", "hotfix requires an enabled policy, an existing-behavior bug, and a non-production environment");
    }
    return finish("hotfix");
  }
  const valid = record.decisions.filter((item) => item.outcome === "approved" && item.candidateDigest === digest &&
    item.policyDigest === policyDigest && Date.parse(item.recordedAt) <= now.getTime() &&
    Date.parse(item.expiresAt) > now.getTime() && Date.parse(item.expiresAt) > Date.parse(item.recordedAt));
  const human = valid.find((item) => item.kind === "human" && policy.reviewers.includes(item.reviewer) && item.reviewer !== candidate.author);
  if (human) { artifact(human.evidence); return finish("human"); }
  const auto = policy.autoReview;
  const eligible = auto.enabled && candidate.mode === "delivery" && !candidate.task.changesRules &&
    environment?.kind !== "production" && candidate.sensitiveFindings.length === 0 &&
    paths.every((path) => matches(path, auto.allowedPaths) && !matches(path, auto.excludedPaths)) &&
    paths.length <= auto.maxFiles && candidate.files.reduce((sum, file) => sum + file.changedLines, 0) <= auto.maxChangedLines;
  const automatic = eligible ? valid.find((item) => item.kind === "automatic" && item.model?.trim() &&
    item.suitability !== undefined && item.suitability >= auto.minSuitability && item.risk !== undefined && item.risk <= auto.maxRisk &&
    now.getTime() - Date.parse(item.recordedAt) <= auto.maxAgeHours * 3_600_000 &&
    Date.parse(item.expiresAt) - Date.parse(item.recordedAt) <= auto.maxAgeHours * 3_600_000) : undefined;
  if (automatic) { artifact(automatic.evidence); return finish("automatic"); }
  fail("approval-required", "a current human approval is required; automatic evidence is absent, stale, ineligible, or below threshold");
  return finish("blocked");
}
