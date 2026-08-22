import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { deriveVersionStatus } from "../src/status.js";
import { validateEvidence, validateProject } from "../src/validate.js";
import { config, createValidProject, evidence, version, write } from "./helpers.js";

describe("delivery gates", () => {
  it("derives released only from complete evidence and deployment facts", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-valid-"));
    createValidProject(root);
    const result = validateProject(root);
    expect(result.ok).toBe(true);
    expect(result.versions).toHaveLength(1);
    expect(result.versions[0]?.stage).toBe("released");
  });

  it("blocks a published release without every required production deployment", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-release-"));
    createValidProject(root);
    const invalid = structuredClone(version);
    invalid.deployments = invalid.deployments.filter((item) => item.repositoryId === "web-app");
    const status = deriveVersionStatus(config, invalid, root, true);
    expect(status.stage).toBe("verified");
    expect(status.diagnostics.some((item) => item.code === "release.production-evidence")).toBe(true);
  });

  it("requires complete document coverage", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-evidence-"));
    createValidProject(root);
    const invalid = structuredClone(evidence);
    invalid.documents = [];
    const diagnostics = validateEvidence(root, version, invalid);
    expect(diagnostics.some((item) => item.code === "evidence.document-missing" || item.code.startsWith("schema."))).toBe(true);
  });

  it("does not accept unchecked OpenSpec tasks as applied", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-openspec-"));
    createValidProject(root);
    write(root, "openspec/changes/reliable-checkout/tasks.md", "- [ ] Finish implementation\n");
    const status = deriveVersionStatus(config, version, root, true);
    expect(status.stage).toBe("planned");
    expect(status.diagnostics.some((item) => item.code === "openspec.tasks-incomplete")).toBe(true);
  });
});
