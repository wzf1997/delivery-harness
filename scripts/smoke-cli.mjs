import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const cli = resolve("dist/cli.js");

function run(args, expected, env = process.env) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env });
  if (result.status !== expected) {
    throw new Error(`deliveryguard ${args.join(" ")} exited ${result.status}, expected ${expected}\n${result.stdout}\n${result.stderr}`);
  }
  return result.stdout;
}

const version = run(["--version"], 0).trim();
if (version !== "0.5.0") throw new Error(`CLI reported ${version}, expected 0.5.0`);

const self = run(["check"], 0);
if (!self.includes("v0.1.0: implemented")) throw new Error("self-check did not report implemented");

const example = run(["-C", "examples/synthetic-shop", "check"], 0);
if (!example.includes("v1.2.0: released")) throw new Error("synthetic example did not report released");

const initialized = mkdtempSync(resolve(tmpdir(), "deliveryguard-cli-init-"));
run(["-C", initialized, "init", "--codex"], 0);
run(["-C", initialized, "init", "--codex"], 2);
run(["-C", initialized, "check"], 0);

const invalid = mkdtempSync(resolve(tmpdir(), "deliveryguard-cli-invalid-"));
writeFileSync(resolve(invalid, "deliveryguard.config.json"), "{}\n", "utf8");
run(["-C", invalid, "check"], 1);
run(["not-a-command"], 2);

const reviewRoot = mkdtempSync(resolve(tmpdir(), "deliveryguard-cli-review-"));
cpSync(resolve("examples/synthetic-shop/reviews"), resolve(reviewRoot, "reviews"), { recursive: true });
const reviewArgs = ["-C", reviewRoot, "review", "validate", "reviews/hotfix.json", "--policy", "reviews/policy.json", "--json"];
const review = JSON.parse(run(reviewArgs, 0));
if (review.route !== "hotfix" || review.authorizesExternalAction !== false) throw new Error("invalid review route or authority");
const digests = JSON.parse(run(["-C", reviewRoot, "review", "digest", "reviews/hotfix.json", "--policy", "reviews/policy.json"], 0));
const reviewPath = resolve(reviewRoot, "reviews/hotfix.json");
const record = JSON.parse(readFileSync(reviewPath, "utf8"));
if (digests.candidateDigest !== record.checks[0].candidateDigest || !/^[a-f0-9]{64}$/.test(digests.policyDigest)) {
  throw new Error("review digest mismatch");
}
record.candidate.environmentId = "production";
writeFileSync(reviewPath, JSON.stringify(record));
const blocked = JSON.parse(run(reviewArgs, 1));
if (!blocked.diagnostics.some((item) => item.code === "review.hotfix")) throw new Error("production Hotfix was not blocked");
run(["-C", reviewRoot, "review", "validate", "../outside.json", "--policy", "reviews/policy.json"], 2);

// Jev smoke tests are strictly offline, including when the invoking shell has a key.
const jevPolicyPath = resolve(reviewRoot, "reviews/policy.json");
const jevPolicy = JSON.parse(readFileSync(jevPolicyPath, "utf8"));
jevPolicy.autoReview.enabled = true;
writeFileSync(jevPolicyPath, JSON.stringify(jevPolicy));
record.candidate.environmentId = "test";
record.candidate.mode = "delivery";
writeFileSync(reviewPath, JSON.stringify(record));
const nextDigest = JSON.parse(run(["-C", reviewRoot, "review", "digest", "reviews/hotfix.json", "--policy", "reviews/policy.json"], 0));
record.checks[0].candidateDigest = nextDigest.candidateDigest;
writeFileSync(reviewPath, JSON.stringify(record));
const jevArgs = ["-C", reviewRoot, "review", "jev", "reviews/hotfix.json", "--policy", "reviews/policy.json", "--json"];
const jevPreview = JSON.parse(run(jevArgs, 0));
if (jevPreview.sent !== false || !jevPreview.request?.questions?.ui_only) throw new Error("Jev preview is not local-only");
const noKey = { ...process.env, TYPESAFE_API_KEY: "" };
const jevFailure = JSON.parse(run([...jevArgs, "--send", "--output", "jev-output"], 1, noKey));
if (jevFailure.status !== "human-required" || !jevFailure.diagnostics.some((item) => item.code === "jev.credentials")) {
  throw new Error("missing Jev credentials did not fail closed");
}
const savedReview = JSON.parse(readFileSync(resolve(reviewRoot, jevFailure.record), "utf8"));
if (savedReview.decisions.length) throw new Error("missing credentials manufactured an approval");
run([...jevArgs, "--send", "--output", "jev-output"], 2, noKey);

console.log("CLI smoke check passed (exit codes 0, 1, and 2). ");
