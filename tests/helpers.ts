import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { DeliveryGuardConfig, EvidenceManifest, VersionRecord } from "../src/types.js";

export const config: DeliveryGuardConfig = {
  schemaVersion: 1,
  project: { id: "demo-shop", name: "Demo Shop" },
  stableBranch: "main",
  repositories: [
    { id: "web-app", path: ".", required: true },
    { id: "order-api", remote: "https://example.invalid/order-api.git", required: true },
  ],
  environments: [
    { id: "test", kind: "test" },
    { id: "production", kind: "production" },
  ],
  documentTypes: ["product-requirement", "technical-design", "issue-report"],
  paths: {
    versions: ".deliveryguard/versions",
    acceptance: ".deliveryguard/acceptance",
    repairs: ".deliveryguard/repairs",
    openspec: "openspec/changes",
  },
  policies: {
    requireOpenSpec: true,
    requireAcceptanceBeforeRelease: true,
    requireDedicatedWorktree: true,
  },
};

export const version: VersionRecord = {
  schemaVersion: 1,
  version: "v1.0.0",
  title: "Reliable checkout",
  documents: [
    {
      id: "checkout-prd",
      type: "product-requirement",
      title: "Reliable checkout",
      ref: "docs/requirements/checkout.md",
      primary: true,
    },
  ],
  openSpec: {
    changeId: "reliable-checkout",
    path: "openspec/changes/reliable-checkout",
    status: "applied",
  },
  sources: [
    { repositoryId: "web-app", branch: "feature/checkout", commit: "1111111", status: "merged" },
    { repositoryId: "order-api", branch: "feature/checkout", commit: "2222222", status: "merged" },
  ],
  acceptance: {
    status: "passed",
    evidence: ".deliveryguard/acceptance/v1.0.0/evidence.json",
    report: "docs/acceptance/v1.0.0.md",
  },
  deployments: [
    {
      repositoryId: "web-app",
      environmentId: "production",
      branch: "release/v1.0.0",
      commit: "1111111",
      status: "succeeded",
      anchor: "deploy-web-100",
      recordedAt: "2026-01-01T10:00:00.000Z",
    },
    {
      repositoryId: "order-api",
      environmentId: "production",
      branch: "release/v1.0.0",
      commit: "2222222",
      status: "succeeded",
      anchor: "deploy-api-100",
      recordedAt: "2026-01-01T10:05:00.000Z",
    },
  ],
  release: {
    status: "published",
    anchor: "release-100",
    releasedAt: "2026-01-01T10:10:00.000Z",
  },
};

export const evidence: EvidenceManifest = {
  schemaVersion: 1,
  version: "v1.0.0",
  documents: [{ documentId: "checkout-prd", requirementIds: ["checkout-idempotent"] }],
  requirements: [
    {
      id: "checkout-idempotent",
      description: "Repeated checkout requests create one order",
      caseIds: ["checkout-retry"],
    },
  ],
  cases: [
    {
      id: "checkout-retry",
      title: "Retry creates one order",
      status: "pass",
      evidence: ["docs/evidence/checkout-retry.txt"],
    },
  ],
};

export function write(root: string, path: string, contents: string): void {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents, "utf8");
}

export function createValidProject(root: string): void {
  write(root, "deliveryguard.config.json", JSON.stringify(config, null, 2));
  write(root, ".deliveryguard/versions/v1.0.0.json", JSON.stringify(version, null, 2));
  write(root, ".deliveryguard/acceptance/v1.0.0/evidence.json", JSON.stringify(evidence, null, 2));
  write(root, "docs/evidence/checkout-retry.txt", "PASS\n");
  write(root, "openspec/changes/reliable-checkout/proposal.md", "# Reliable checkout\n");
  write(root, "openspec/changes/reliable-checkout/tasks.md", "- [x] Implement idempotency\n");
}
