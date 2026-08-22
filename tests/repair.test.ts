import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { runRepairPhase, validateRepairCase } from "../src/repair.js";
import type { RepairCase } from "../src/types.js";
import { write } from "./helpers.js";

function git(root: string, args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function fixture(): { root: string; baseline: string; candidate: string } {
  const root = mkdtempSync(join(tmpdir(), "deliveryguard-repair-"));
  git(root, ["init", "-b", "main"]);
  git(root, ["config", "core.hooksPath", "/dev/null"]);
  git(root, ["config", "user.name", "DeliveryGuard Test"]);
  git(root, ["config", "user.email", "test@example.invalid"]);
  write(root, "check.mjs", "process.exit(1);\n");
  git(root, ["add", "check.mjs"]);
  git(root, ["commit", "-m", "baseline"]);
  const baseline = git(root, ["rev-parse", "HEAD"]);
  write(root, "check.mjs", "console.log('fixed');\n");
  git(root, ["add", "check.mjs"]);
  git(root, ["commit", "-m", "candidate"]);
  return { root, baseline, candidate: git(root, ["rev-parse", "HEAD"]) };
}

function repair(root: string, baseline: string, candidate: string): RepairCase {
  return {
    schemaVersion: 1,
    id: "DEMO-101",
    title: "Retry is safe",
    stage: "verified",
    status: "done",
    classification: "code",
    baseline: { repository: ".", commit: baseline },
    candidate: { repository: ".", commit: candidate },
    symptom: { environment: "test", expected: "retry succeeds", actual: "retry fails" },
    phases: {
      reproduction: [{ id: "baseline-fails", command: [process.execPath, "check.mjs"], expectedExitCode: 1 }],
      targeted: [{ id: "candidate-passes", command: [process.execPath, "check.mjs"], expectedExitCode: 0, outputPattern: "fixed" }],
      regression: [{ id: "regression-passes", command: [process.execPath, "check.mjs"], expectedExitCode: 0 }],
    },
  };
}

describe("repair cases", () => {
  it("requires different baseline and candidate commits", () => {
    const { root, candidate } = fixture();
    const invalid = repair(root, candidate, candidate);
    expect(validateRepairCase(root, invalid).some((item) => item.code === "repair.red-green-commits")).toBe(true);
  });

  it("runs argv directly on the declared candidate commit", async () => {
    const { root, baseline, candidate } = fixture();
    const results = await runRepairPhase(root, repair(root, baseline, candidate), "targeted");
    expect(results).toHaveLength(1);
    expect(results[0]?.passed).toBe(true);
  });

  it("refuses to run reproduction on the wrong commit", async () => {
    const { root, baseline, candidate } = fixture();
    await expect(runRepairPhase(root, repair(root, baseline, candidate), "reproduction")).rejects.toThrow("requires");
  });
});
