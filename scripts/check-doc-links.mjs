import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const markdownFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "*.md"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.startsWith("node_modules/"));

const failures = [];
const markdownLink = /!?\[[^\]]*\]\(([^)]+)\)/g;
for (const file of markdownFiles) {
  const contents = readFileSync(file, "utf8");
  for (const match of contents.matchAll(markdownLink)) {
    const destination = match[1]?.trim().replace(/^<|>$/g, "");
    if (!destination || /^(?:https?:|mailto:|#)/.test(destination)) continue;
    const path = destination.split("#", 1)[0];
    if (path && !existsSync(resolve(dirname(file), decodeURIComponent(path)))) {
      failures.push(`${file}: missing ${destination}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Documentation link check passed (${markdownFiles.length} files).`);
}
