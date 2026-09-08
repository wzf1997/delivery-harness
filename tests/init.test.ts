import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { initializeProject } from "../src/init.js";

describe("init", () => {
  it("creates config and optional Codex guidance", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-init-"));
    const created = initializeProject(root, true);
    expect(created.every((item) => !item.includes("\\"))).toBe(true);
    expect(created).toContain("deliveryguard.config.json");
    expect(created).toContain("AGENTS.md");
    expect(readFileSync(join(root, "AGENTS.md"), "utf8")).toContain("DeliveryGuard facts");
    expect(readFileSync(join(root, ".agents/skills/deliveryguard-version/SKILL.md"), "utf8")).toContain("DeliveryGuard");
    expect(
      readdirSync(join(root, ".agents/skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory()),
    ).toHaveLength(20);
    expect(created).toContain(".agents/skills/deliveryguard-acceptance/assets/report-template.md");
    expect(created).toContain(".agents/skills/deliveryguard-fixture-plan/references/scenario-matrix.md");
    expect(created).toContain(".agents/skills/deliveryguard-request-diagnosis/SKILL.md");
    expect(created).toContain(".agents/skills/deliveryguard-real-device-test/SKILL.md");
    expect(created).toContain(".agents/skills/deliveryguard-acceptance/references/local-verification.md");
    expect(created).toContain(".agents/skills/deliveryguard-video-diagnosis/SKILL.md");
    expect(created).toContain(".agents/skills/deliveryguard-video-diagnosis/references/frame-review.md");
    expect(created).toContain(".agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs");
    expect(created).toContain(
      ".agents/skills/deliveryguard-real-device-test/references/android-mobile-mcp.md",
    );
    expect(created).toContain(
      ".agents/skills/deliveryguard-real-device-test/references/ios-appium-xcuitest.md",
    );
  });

  it("refuses to overwrite existing files", () => {
    const root = mkdtempSync(join(tmpdir(), "deliveryguard-init-safe-"));
    initializeProject(root, false);
    expect(() => initializeProject(root, false)).toThrow("refusing to overwrite");
  });
});
