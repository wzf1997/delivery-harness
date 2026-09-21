import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { reviewDigest, validateReview, readReviewJson } from "../src/review.js";
import type { ReviewPolicy, ReviewRecord } from "../src/review-types.js";
import { validateProject } from "../src/validate.js";
import { config, write } from "./helpers.js";

const now = new Date("2030-01-01T12:00:00Z");
let root: string;
let policy: ReviewPolicy;
let record: ReviewRecord;
function codes() { return validateReview(root, policy, record, now).diagnostics.map((item) => item.code); }
function approve(kind: "human" | "automatic" = "human") {
  record.decisions = [{ kind, outcome: "approved", reviewer: "maintainer", candidateDigest: reviewDigest(record.candidate),
    policyDigest: reviewDigest(policy), recordedAt: "2030-01-01T11:00:00Z", expiresAt: "2030-01-02T11:00:00Z",
    evidence: "evidence/review.txt", ...(kind === "automatic" ? { model: "synthetic-model", suitability: 0.99, risk: 0.01 } : {}) }];
}
function recheck() { record.checks[0]!.candidateDigest = reviewDigest(record.candidate); }

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "deliveryguard-review-"));
  write(root, "evidence/review.txt", "Synthetic review and check evidence; not a real approval.\n");
  policy = { schemaVersion: 1, id: "demo-policy", revision: "1", repositoryId: "web", branch: "feature/demo",
    environments: [{ id: "preview", kind: "test" }, { id: "live", kind: "production" }],
    allowedPaths: ["src", "tests"], requiredChecks: ["unit"], reviewers: ["maintainer"], allowHotfix: true,
    autoReview: { enabled: true, allowedPaths: ["src/ui"], excludedPaths: ["src/ui/auth"], maxFiles: 5,
      maxChangedLines: 100, maxAgeHours: 24, minSuitability: 0.95, maxRisk: 0.05 } };
  record = { schemaVersion: 1, candidate: { schemaVersion: 1, id: "candidate-1", repositoryId: "web",
    task: { id: "task-1", summary: "Restore button focus", acceptanceCriteria: ["Keyboard focus remains visible"], revision: "1", kind: "bug", changesRules: false, documentRevision: "spec-1" },
    author: "contributor", branch: "feature/demo", baseCommit: "0".repeat(40), commit: "a".repeat(40), tree: "b".repeat(40),
    environmentId: "preview", mode: "delivery", files: [{ path: "src/ui/button.ts", changedLines: 8 }], sensitiveFindings: [] },
    checks: [], decisions: [] };
  record.checks = [{ id: "unit", candidateDigest: reviewDigest(record.candidate), status: "pass", evidence: "evidence/review.txt" }];
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe("offline review routes", () => {
  it("accepts a bound human decision without granting action authority", () => {
    approve(); expect(validateReview(root, policy, record, now)).toMatchObject({ ok: true, route: "human", authorizesExternalAction: false });
  });
  it("blocks a candidate with no approval", () => { expect(codes()).toContain("review.approval-required"); });
  it.each(["tree", "author", "branch", "environmentId"] as const)("invalidates approval when %s changes", (field) => {
    approve(); record.candidate[field] = field === "tree" ? "c".repeat(40) : "changed"; recheck();
    expect(codes()).toContain("review.approval-required");
  });
  it("binds task and document revisions", () => {
    approve(); record.candidate.task.documentRevision = "spec-2"; recheck(); expect(codes()).toContain("review.approval-required");
  });
  it("invalidates approval when policy content changes without a revision bump", () => {
    approve(); policy.autoReview.maxRisk = 0.04; expect(codes()).toContain("review.approval-required");
  });
  it("does not permit self approval", () => {
    approve(); record.decisions[0]!.reviewer = record.candidate.author; policy.reviewers.push(record.candidate.author);
    record.decisions[0]!.policyDigest = reviewDigest(policy); expect(codes()).toContain("review.approval-required");
  });
  it("allows only bounded automatic review", () => {
    approve("automatic"); expect(validateReview(root, policy, record, now).route).toBe("automatic");
    record.decisions[0]!.risk = 0.5; expect(codes()).toContain("review.approval-required");
  });
  it.each(["sensitive", "excluded", "oversize", "rules", "production", "disabled", "unknown-model"])("falls back to human for %s", (caseName) => {
    if (caseName === "sensitive") record.candidate.sensitiveFindings.push("authorization");
    if (caseName === "excluded") record.candidate.files[0]!.path = "src/ui/auth/login.ts";
    if (caseName === "oversize") record.candidate.files[0]!.changedLines = 101;
    if (caseName === "rules") record.candidate.task.changesRules = true;
    if (caseName === "production") record.candidate.environmentId = "live";
    if (caseName === "disabled") policy.autoReview.enabled = false;
    recheck(); approve("automatic");
    if (caseName === "unknown-model") delete record.decisions[0]!.model;
    expect(codes()).toContain("review.approval-required");
  });
  it.each(["expired", "future", "long-lived"])("rejects %s automatic evidence", (kind) => {
    approve("automatic");
    if (kind === "expired") record.decisions[0]!.expiresAt = now.toISOString();
    if (kind === "future") record.decisions[0]!.recordedAt = "2030-01-01T13:00:00Z";
    if (kind === "long-lived") record.decisions[0]!.expiresAt = "2031-01-01T00:00:00Z";
    expect(codes()).toContain("review.approval-required");
  });
  it("human rejection overrides automatic and human approvals", () => {
    approve("automatic"); record.decisions.push({ ...record.decisions[0]!, kind: "human", outcome: "rejected", expiresAt: "2029-01-01T00:00:00Z" });
    expect(codes()).toContain("review.rejected");
  });
  it("allows a bug hotfix without review but still requires checks", () => {
    record.candidate.mode = "hotfix"; recheck(); expect(validateReview(root, policy, record, now).route).toBe("hotfix");
    record.checks = []; expect(codes()).toContain("review.check-missing");
  });
  it.each(["feature", "rules", "production", "disabled"])("blocks hotfix %s", (kind) => {
    record.candidate.mode = "hotfix";
    if (kind === "feature") record.candidate.task.kind = "feature";
    if (kind === "rules") record.candidate.task.changesRules = true;
    if (kind === "production") record.candidate.environmentId = "live";
    if (kind === "disabled") policy.allowHotfix = false;
    recheck(); expect(codes()).toContain("review.hotfix");
  });
  it("checks scope on directory boundaries", () => {
    record.candidate.files[0]!.path = "src-other/attack.ts"; recheck(); approve(); expect(codes()).toContain("review.scope");
  });
  it("rejects stale, failed, duplicated checks and missing artifacts", () => {
    approve(); record.checks[0]!.status = "fail"; expect(codes()).toContain("review.check");
    record.checks[0]!.status = "pass"; record.checks[0]!.candidateDigest = "0".repeat(64); expect(codes()).toContain("review.check");
    recheck(); record.checks.push({ ...record.checks[0]! }); expect(codes()).toContain("review.checks-duplicate");
    record.checks = [record.checks[0]!]; record.checks[0]!.evidence = "missing.txt"; expect(codes()).toContain("review.evidence");
  });
  it.each(["../escape", "/absolute", "src/../escape", "C:\\escape", "src//file", "src/./file"])("rejects unsafe path %s", (path) => {
    record.candidate.files[0]!.path = path; expect(codes().some((code) => code.startsWith("schema."))).toBe(true);
  });
  it("rejects symlink escapes for evidence and input", () => {
    const outside = mkdtempSync(join(tmpdir(), "deliveryguard-outside-"));
    try {
      write(outside, "fact.json", "{}"); symlinkSync(join(outside, "fact.json"), join(root, "escape.json"));
      expect(() => readReviewJson(root, "escape.json")).toThrow();
      approve(); record.decisions[0]!.evidence = "escape.json"; expect(codes()).toContain("review.evidence");
    } finally { rmSync(outside, { recursive: true, force: true }); }
  });
  it("rejects malformed numbers and unknown fields", () => {
    policy.autoReview.minSuitability = 2; expect(codes().some((code) => code.startsWith("schema."))).toBe(true);
    policy.autoReview.minSuitability = 0.95;
    Object.assign(record, { skipReview: true }); expect(codes().some((code) => code.includes("additionalProperties"))).toBe(true);
  });
  it("supports hidden repository files without allowing dot traversal", () => {
    policy.allowedPaths.push(".github"); record.candidate.files[0]!.path = ".github/workflows/check.yml";
    recheck(); approve(); expect(validateReview(root, policy, record, now).ok).toBe(true);
  });
  it("keeps a human rejection effective on the Hotfix route", () => {
    record.candidate.mode = "hotfix"; recheck(); approve(); record.decisions[0]!.outcome = "rejected";
    expect(codes()).toContain("review.rejected");
  });
  it("rejects duplicate environment identities", () => {
    policy.environments.push({ id: "preview", kind: "production" }); approve();
    expect(codes()).toContain("review.environment-duplicate");
  });
  it("rejects a missing integration observation", () => {
    record.candidate.mode = "integration"; recheck(); approve(); expect(codes()).toContain("review.integration-missing");
  });
  it("rejects an invalid evaluation clock", () => {
    approve(); expect(validateReview(root, policy, record, new Date("invalid")).ok).toBe(false);
  });
  it("hashes object key order consistently", () => {
    expect(reviewDigest(record.candidate)).toBe(reviewDigest(Object.fromEntries(Object.entries(record.candidate).reverse()) as typeof record.candidate));
  });
});

describe("integration evidence", () => {
  beforeEach(() => {
    record.candidate.mode = "integration";
    record.candidate.integration = { targetBranch: "test/demo", parents: ["c".repeat(40), "d".repeat(40)],
      targetHead: "c".repeat(40), sourceHead: "d".repeat(40), conflictPaths: ["src/ui/button.ts"],
      resolutionPaths: ["src/ui/button.ts"], observedAt: "2030-01-01T11:30:00Z", evidence: "evidence/review.txt" };
    recheck(); approve();
  });
  it("accepts consistent, current integration records with human approval", () => { expect(validateReview(root, policy, record, now).route).toBe("human"); });
  it("requires human review even with high automatic scores", () => { approve("automatic"); expect(codes()).toContain("review.approval-required"); });
  it("blocks mismatched parents", () => {
    record.candidate.integration!.parents.reverse(); recheck(); approve(); expect(codes()).toContain("review.integration-parents");
  });
  it("blocks resolution edits outside conflicts", () => {
    record.candidate.integration!.resolutionPaths.push("src/other.ts"); recheck(); approve(); expect(codes()).toContain("review.integration-scope");
  });
  it("blocks stale remote observations", () => {
    record.candidate.integration!.observedAt = "2030-01-01T10:00:00Z"; recheck(); approve(); expect(codes()).toContain("review.integration-stale");
  });
  it("does not allow production integration", () => {
    record.candidate.environmentId = "live"; recheck(); approve(); expect(codes()).toContain("review.integration-production");
  });
});

describe("project opt-in", () => {
  it("rejects a policy that relabels production as test", () => {
    record.candidate.mode = "hotfix";
    const settings = structuredClone(config);
    settings.repositories[0]!.id = "web";
    settings.environments = [{ id: "preview", kind: "production" }];
    settings.review = { policy: "policy.json", records: ["review.json"] };
    recheck();
    write(root, "policy.json", JSON.stringify(policy)); write(root, "review.json", JSON.stringify(record));
    write(root, "deliveryguard.config.json", JSON.stringify(settings));
    expect(validateProject(root).diagnostics.some((item) => item.code === "review.environment-mismatch")).toBe(true);
  });
  it("includes registered review failures in check without promoting lifecycle stages", () => {
    write(root, "policy.json", JSON.stringify(policy)); write(root, "review.json", JSON.stringify(record));
    const settings = structuredClone(config); settings.review = { policy: "policy.json", records: ["review.json"] };
    write(root, "deliveryguard.config.json", JSON.stringify(settings));
    const result = validateProject(root);
    expect(result.ok).toBe(false); expect(result.versions).toEqual([]);
    expect(result.diagnostics.some((item) => item.code === "review.approval-required")).toBe(true);
    settings.review.records = ["missing.json"]; write(root, "deliveryguard.config.json", JSON.stringify(settings));
    expect(validateProject(root).diagnostics.some((item) => item.code === "review.read")).toBe(true);
  });
});
