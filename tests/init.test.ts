import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { initializeProject } from "../src/init.js";

describe("init", () => {
  it("creates config and optional Codex guidance", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-init-"));
    const created = initializeProject(root, true);
    expect(created).toContain("deliveryguard.config.json");
    expect(readFileSync(join(root, ".agents/skills/deliveryguard-version/SKILL.md"), "utf8")).toContain("DeliveryGuard");
  });

  it("refuses to overwrite existing files", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-init-safe-"));
    initializeProject(root, false);
    expect(() => initializeProject(root, false)).toThrow("refusing to overwrite");
  });
});
