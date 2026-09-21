import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { Command, CommanderError } from "commander";

import { hasErrors } from "./diagnostics.js";
import { initializeProject } from "./init.js";
import { readJson } from "./io.js";
import { runRepairPhase, validateRepairCase } from "./repair.js";
import { readReviewJson, reviewDigest, validateReview } from "./review.js";
import type { ReviewPolicy, ReviewRecord } from "./review-types.js";
import { validateSchema } from "./schemas.js";
import type { DeliveryGuardConfig, Diagnostic, EvidenceManifest, RepairCase, VersionRecord } from "./types.js";
import { findJsonFiles, validateConfig, validateEvidence, validateProject, validateVersion } from "./validate.js";

const program = new Command();
program
  .name("deliveryguard")
  .description("Evidence-driven software delivery gates")
  .version("0.5.0")
  .option("-C, --root <path>", "project root", process.cwd())
  .exitOverride();

function root(): string {
  return resolve(program.opts<{ root: string }>().root);
}

function printDiagnostics(diagnostics: Diagnostic[], json: boolean): void {
  if (json) {
    console.log(JSON.stringify({ ok: !hasErrors(diagnostics), diagnostics }, null, 2));
    return;
  }
  if (diagnostics.length === 0) {
    console.log("DeliveryGuard: passed");
    return;
  }
  for (const item of diagnostics) {
    const location = item.path ? ` (${item.path})` : "";
    console.log(`${item.severity.toUpperCase()} ${item.code}${location}: ${item.message}`);
  }
}

function setGateExit(diagnostics: Diagnostic[]): void {
  if (hasErrors(diagnostics)) process.exitCode = 1;
}

program
  .command("init")
  .description("initialize DeliveryGuard without overwriting files")
  .option("--codex", "add the provider-neutral Codex skill suite")
  .action((options: { codex?: boolean }) => {
    const created = initializeProject(root(), options.codex === true);
    console.log(`Created ${created.join(", ")}`);
  });

program
  .command("check")
  .description("validate the complete delivery project")
  .option("--json", "emit machine-readable output")
  .action((options: { json?: boolean }) => {
    const result = validateProject(root());
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      for (const version of result.versions) console.log(`${version.version}: ${version.stage}`);
      printDiagnostics(result.diagnostics, false);
    }
    if (!result.ok) process.exitCode = 1;
  });

program
  .command("status")
  .description("show derived delivery stages")
  .option("--json", "emit machine-readable output")
  .action((options: { json?: boolean }) => {
    const result = validateProject(root());
    if (options.json) console.log(JSON.stringify({ ok: result.ok, versions: result.versions }, null, 2));
    else for (const version of result.versions) console.log(`${version.version}\t${version.stage}`);
    if (!result.ok) process.exitCode = 1;
  });

const versionCommand = program.command("version").description("version record commands");
versionCommand
  .command("validate")
  .argument("[path]", "version JSON path")
  .option("--json", "emit machine-readable output")
  .action((path: string | undefined, options: { json?: boolean }) => {
    const configPath = resolve(root(), "deliveryguard.config.json");
    const config = readJson<DeliveryGuardConfig>(configPath);
    const configDiagnostics = validateConfig(config);
    const files = path ? [resolve(root(), path)] : findJsonFiles(root(), config.paths.versions);
    const statuses = files.map((file) => validateVersion(root(), config, readJson<VersionRecord>(file)));
    const diagnostics = [...configDiagnostics, ...statuses.flatMap((item) => item.diagnostics)];
    if (options.json) console.log(JSON.stringify({ ok: !hasErrors(diagnostics), statuses, diagnostics }, null, 2));
    else {
      for (const status of statuses) console.log(`${status.version}: ${status.stage}`);
      printDiagnostics(diagnostics, false);
    }
    setGateExit(diagnostics);
  });

const acceptanceCommand = program.command("acceptance").description("acceptance evidence commands");
acceptanceCommand
  .command("validate")
  .argument("<path>", "evidence JSON path")
  .requiredOption("--version <path>", "version JSON path")
  .option("--json", "emit machine-readable output")
  .action((path: string, options: { version: string; json?: boolean }) => {
    const evidence = readJson<EvidenceManifest>(resolve(root(), path));
    const version = readJson<VersionRecord>(resolve(root(), options.version));
    const diagnostics = validateEvidence(root(), version, evidence);
    printDiagnostics(diagnostics, options.json === true);
    setGateExit(diagnostics);
  });

const reviewCommand = program.command("review").description("review evidence and optional explicit provider evaluation; never authorizes external actions");
reviewCommand.command("digest")
  .argument("<path>", "review record path")
  .requiredOption("--policy <path>", "trusted review policy path")
  .action((path: string, options: { policy: string }) => {
    const record = readReviewJson<ReviewRecord>(root(), path);
    const policy = readReviewJson<ReviewPolicy>(root(), options.policy);
    const diagnostics = [...validateSchema("review-record", record), ...validateSchema("review-policy", policy)];
    if (hasErrors(diagnostics)) { printDiagnostics(diagnostics, true); setGateExit(diagnostics); return; }
    console.log(JSON.stringify({ candidateDigest: reviewDigest(record.candidate), policyDigest: reviewDigest(policy) }, null, 2));
  });
reviewCommand.command("validate")
  .argument("<path>", "review record path")
  .requiredOption("--policy <path>", "trusted review policy path")
  .option("--json", "emit machine-readable output")
  .action((path: string, options: { policy: string; json?: boolean }) => {
    const result = validateReview(root(), readReviewJson<ReviewPolicy>(root(), options.policy), readReviewJson<ReviewRecord>(root(), path));
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Review evidence route: ${result.route}; external action authorization: none`);
      printDiagnostics(result.diagnostics, false);
    }
    setGateExit(result.diagnostics);
  });

reviewCommand.command("jev")
  .description("preview or explicitly send a minimal task summary to the optional Jev adapter")
  .argument("<path>", "review record path")
  .requiredOption("--policy <path>", "trusted review policy path")
  .option("--model <id>", "Jev model alias or pinned version", "jev-latest")
  .option("--send", "send the previewed summary to TypeSafe using TYPESAFE_API_KEY")
  .option("--output <directory>", "new root-relative output directory; its parent must exist")
  .option("--json", "emit machine-readable output")
  .action(async (path: string, options: { policy: string; model: string; send?: boolean; output?: string; json?: boolean }) => {
    const { prepareJevReview, runJevReview } = await import("./adapters/jev.js");
    const { jevOutputDirectory, saveJevReview } = await import("./adapters/jev-files.js");
    const policy = readReviewJson<ReviewPolicy>(root(), options.policy);
    const record = readReviewJson<ReviewRecord>(root(), path);
    const preview = prepareJevReview(root(), policy, record, options.model);
    if (!options.send || !preview.ok) {
      console.log(JSON.stringify({ ...preview, sent: false }, null, 2));
      if (!preview.ok) process.exitCode = 1;
      return;
    }
    if (!options.output) throw new Error("--send requires --output with a new directory inside the project");
    jevOutputDirectory(root(), options.output);
    const result = await runJevReview(root(), policy, record, {
      ...(process.env.TYPESAFE_API_KEY ? { apiKey: process.env.TYPESAFE_API_KEY } : {}),
      model: options.model, evidencePath: `${options.output}/evidence.json`,
    });
    // Do not write a model decision against input files changed during the request.
    if (JSON.stringify(policy) !== JSON.stringify(readReviewJson(root(), options.policy)) ||
        JSON.stringify(record) !== JSON.stringify(readReviewJson(root(), path))) {
      throw new Error("input files changed during Jev evaluation; no output was written");
    }
    const output = saveJevReview(root(), options.output, policy, record, result);
    if (options.json) console.log(JSON.stringify({ status: result.status, diagnostics: result.diagnostics, record: output, authorizesExternalAction: false }, null, 2));
    else {
      console.log(`Jev: ${result.status}; review record: ${output}; external action authorization: none`);
      printDiagnostics(result.diagnostics, false);
    }
    if (result.status !== "approved") process.exitCode = 1;
  });

const repairCommand = program.command("repair").description("repair case commands");
repairCommand
  .command("validate")
  .argument("[path]", "repair JSON path")
  .option("--json", "emit machine-readable output")
  .action((path: string | undefined, options: { json?: boolean }) => {
    const config = readJson<DeliveryGuardConfig>(resolve(root(), "deliveryguard.config.json"));
    const files = path ? [resolve(root(), path)] : findJsonFiles(root(), config.paths.repairs);
    const diagnostics = files.flatMap((file) => validateRepairCase(root(), readJson<RepairCase>(file)));
    printDiagnostics(diagnostics, options.json === true);
    setGateExit(diagnostics);
  });

repairCommand
  .command("run")
  .argument("<path>", "repair JSON path")
  .requiredOption("--phase <phase>", "reproduction, targeted, or regression")
  .option("--json", "emit machine-readable output")
  .action(async (path: string, options: { phase: string; json?: boolean }) => {
    if (!new Set(["reproduction", "targeted", "regression"]).has(options.phase)) {
      throw new Error(`invalid repair phase ${options.phase}`);
    }
    const repair = readJson<RepairCase>(resolve(root(), path));
    const results = await runRepairPhase(root(), repair, options.phase as "reproduction" | "targeted" | "regression");
    if (options.json) console.log(JSON.stringify({ ok: results.every((item) => item.passed), results }, null, 2));
    else for (const result of results) console.log(`${result.passed ? "PASS" : "FAIL"} ${result.checkId} (${result.durationMs}ms)`);
    if (!results.every((item) => item.passed)) process.exitCode = 1;
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (cause) {
    if (cause instanceof CommanderError) {
      if (new Set(["commander.helpDisplayed", "commander.version"]).has(cause.code)) return;
      process.exitCode = 2;
      return;
    }
    console.error(cause instanceof Error ? cause.message : String(cause));
    process.exitCode = 2;
  }
}

void main();
