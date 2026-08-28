import { readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const skillsRoot = resolve("templates/codex/.agents/skills");
const repositorySkillsRoot = resolve(".agents/skills");

function skillDirectories(root = skillsRoot): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function filesBelow(root: string, directory = root): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = resolve(directory, entry.name);
    return entry.isDirectory() ? filesBelow(root, target) : [target.slice(root.length + 1)];
  });
}

const textResourceExtensions = new Set([".json", ".md", ".txt", ".yaml", ".yml"]);

function readSkillResource(file: string): string {
  return readFileSync(resolve(skillsRoot, file), "utf8");
}

describe("bundled Codex skills", () => {
  it("ships the complete provider-neutral workflow suite", () => {
    const names = skillDirectories();
    expect(names).toHaveLength(19);
    expect(names).toContain("deliveryguard-openspec-explore");
    expect(names).toContain("deliveryguard-fixture-plan");
    expect(names).toContain("deliveryguard-acceptance-handoff");
    expect(names).toContain("deliveryguard-knowledge-capture");
    expect(names).toContain("deliveryguard-request-diagnosis");
    expect(names).toContain("deliveryguard-real-device-test");
  });

  it("uses valid skill names", () => {
    for (const directory of skillDirectories()) {
      const contents = readFileSync(resolve(skillsRoot, directory, "SKILL.md"), "utf8");
      expect(contents).toMatch(/^---\r?\nname: deliveryguard-[a-z0-9-]+\r?\ndescription: .+\r?\n---/);
    }
  });

  it("excludes private coordinates from every textual skill resource", () => {
    const textResources = filesBelow(skillsRoot).filter((file) => textResourceExtensions.has(extname(file)));
    expect(textResources.length).toBeGreaterThan(19);

    for (const file of textResources) {
      const contents = readSkillResource(file);
      expect(contents).not.toMatch(/https?:\/\//i);
      expect(contents).not.toMatch(/[a-z][a-z0-9+.-]*:\/\//i);
      expect(contents).not.toMatch(/\/Users\/|[A-Za-z]:\\Users\\/);
      expect(contents).not.toMatch(/(?:token|secret|password)\s*[:=]\s*\S+/i);
      expect(contents).not.toMatch(/\b[A-F0-9]{40}\b/);
      expect(contents).not.toMatch(/\b[A-Z0-9]{10}\b/);
      expect(contents).not.toMatch(/\b\d{2,4}\s*,\s*\d{2,4}\b/);
      expect(contents).not.toMatch(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
      expect(contents).not.toMatch(/\b(?:[a-z0-9-]+\.)+(?:corp|internal|local)\b/i);
      expect(contents).not.toMatch(
        /(?:bundle|package)(?:\s+(?:id|identifier))?\s*[:=]\s*[a-z][a-z0-9-]*(?:\.[a-z0-9-]+){2,}/i,
      );
    }
  });

  it("encodes request-diagnosis evidence and confidence boundaries", () => {
    const skill = readSkillResource("deliveryguard-request-diagnosis/SKILL.md");
    expect(skill).toContain("first failing boundary");
    expect(skill).toContain("When a trace identifier is available");
    expect(skill).toContain("When no trace identifier is available");
    expect(skill).toContain("lower confidence");
    expect(skill).toContain("final error does not identify the root cause by itself");
    expect(skill).toContain("routing");
    expect(skill).toContain("authentication or authorization");
    expect(skill).toContain("deployment or version skew");
    expect(skill).toContain("infrastructure");
  });

  it("routes real-device work by platform and keeps layered outcomes independent", () => {
    const skill = readSkillResource("deliveryguard-real-device-test/SKILL.md");
    const android = readSkillResource("deliveryguard-real-device-test/references/android-mobile-mcp.md");
    const ios = readSkillResource("deliveryguard-real-device-test/references/ios-appium-xcuitest.md");

    expect(skill).toContain("ask whether to test Android or iOS");
    expect(skill).toContain("references/android-mobile-mcp.md");
    expect(skill).toContain("references/ios-appium-xcuitest.md");
    expect(skill).toContain("Success at one layer never proves a later layer");
    expect(skill).toContain("installing or uninstalling");
    expect(skill).toContain("code-signing");
    expect(skill).toContain("privileged tunnel");
    expect(skill).toContain("account credentials");
    expect(skill).toContain("mutating business or production data");

    expect(android).toContain("Mobile MCP");
    expect(android).toContain("actual package identifier");
    expect(android).toContain("Do not reuse old coordinates");
    expect(android).toContain("blocked");

    expect(ios).toContain("Appium");
    expect(ios).toContain("XCUITest");
    expect(ios).toContain("WebDriverAgent");
    expect(ios).toContain("RemoteXPC");
    expect(ios).toContain("WebView inspection is disabled");
    expect(ios).toContain("reachable, trusted, and unlocked");
  });

  it("keeps repository-discoverable skills identical to packaged templates", () => {
    expect(skillDirectories(repositorySkillsRoot)).toEqual(skillDirectories());
    const packagedFiles = filesBelow(skillsRoot).sort();
    expect(filesBelow(repositorySkillsRoot).sort()).toEqual(packagedFiles);
    for (const file of packagedFiles) {
      expect(readFileSync(resolve(repositorySkillsRoot, file))).toEqual(readFileSync(resolve(skillsRoot, file)));
    }
  });
});
