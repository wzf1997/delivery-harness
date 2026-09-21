import { existsSync, mkdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { resolveInside } from "../io.js";
import { validateReview } from "../review.js";
import type { ReviewPolicy, ReviewRecord } from "../review-types.js";
import type { JevReviewResult } from "./jev.js";

export function jevOutputDirectory(root: string, output: string): string {
  if (!/^(?!.*(?:^|\/)\.{1,2}(?:\/|$))[A-Za-z0-9_.@-]+(?:\/[A-Za-z0-9_.@-]+)*$/.test(output)) {
    throw new Error("output must be a new normalized repository-relative directory");
  }
  const destination = resolveInside(root, output);
  const parent = realpathSync(dirname(destination));
  const fromRoot = relative(realpathSync(resolve(root)), parent);
  if (fromRoot === ".." || fromRoot.startsWith("../") || isAbsolute(fromRoot) || existsSync(destination)) {
    throw new Error("output must be a new directory inside the project; existing output is never overwritten");
  }
  return destination;
}

export function saveJevReview(root: string, output: string, policy: ReviewPolicy, record: ReviewRecord, result: JevReviewResult): string {
  const destination = jevOutputDirectory(root, output);
  mkdirSync(destination, { mode: 0o700 });
  const evidencePath = `${output}/evidence.json`;
  // Evidence is persisted before any approval references it.
  writeFileSync(resolve(destination, "evidence.json"), JSON.stringify(result.evidence, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const updated = structuredClone(record);
  updated.decisions = updated.decisions.filter((decision) =>
    decision.kind !== "automatic" || decision.candidateDigest !== result.evidence.candidateDigest);
  if (result.status === "approved" && result.decision) {
    if (result.decision.evidence !== evidencePath) throw new Error("approval evidence path does not match output");
    updated.decisions.push(result.decision);
    if (!validateReview(root, policy, updated).ok) throw new Error("generated approval no longer validates; no review record was written");
  }
  const recordPath = `${output}/review.json`;
  writeFileSync(resolveInside(root, recordPath), JSON.stringify(updated, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  return recordPath;
}
