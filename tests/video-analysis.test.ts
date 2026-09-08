import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const script = resolve("templates/codex/.agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs");

describe("video frame extraction helper", () => {
  it("selects actual variable frame times and preserves the final frame", () => {
    const moduleUrl = pathToFileURL(script).href;
    const source = `import { selectFrames } from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify(selectFrames([5, 5.04, 5.11, 5.5, 5.91], 0, undefined, 0.1, false)));`;
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8" });

    expect(result.status).toBe(0);
    const selected = JSON.parse(result.stdout) as { selected: number[]; relativeTimes: number[] };
    expect(selected.selected).toEqual([0, 2, 3, 4]);
    expect(selected.relativeTimes.at(-1)).toBeCloseTo(0.91);
  });

  it("rejects remote and missing media without invoking a decoder", () => {
    for (const source of ["https://example.invalid/video.mp4", resolve("missing-video.mp4")]) {
      const result = spawnSync(process.execPath, [script, "extract", source], { encoding: "utf8" });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('"ok":false');
    }
  });

  it("provides help without requiring local media tools", () => {
    const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("extract <video>");
  });
});
