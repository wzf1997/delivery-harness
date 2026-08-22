import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.startsWith("node_modules/") && !file.startsWith("dist/") && !file.endsWith("pnpm-lock.yaml"));

const configuredTerms = (process.env.DELIVERYGUARD_DENYLIST ?? "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const patterns = [
  { name: "absolute user path", pattern: /(?:\/Users\/[^/\s]+\/|[A-Za-z]:\\Users\\[^\\\s]+\\)/ },
  { name: "private key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "credential assignment", pattern: /(?:api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["'][^"']{12,}["']/i },
  { name: "bearer token", pattern: /authorization\s*:\s*bearer\s+[A-Za-z0-9._-]{12,}/i },
  { name: "internal-looking URL", pattern: /https?:\/\/[^\s/]*(?:internal|corp|intranet)\.[^\s/]+/i },
  ...configuredTerms.map((term) => ({ name: `denylist term ${term}`, pattern: new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })),
];

const findings = [];
for (const file of files) {
  if (/\.(?:png|jpe?g|webp|gif|ico|woff2?|zip|tgz)$/i.test(file)) continue;
  let contents;
  try {
    contents = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const item of patterns) {
    if (item.pattern.test(contents)) findings.push(`${file}: ${item.name}`);
  }
}

if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Sensitive-content scan passed (${files.length} files).`);
}
