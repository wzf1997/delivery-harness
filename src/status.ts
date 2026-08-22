import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { error, hasErrors } from "./diagnostics.js";
import { resolveInside } from "./io.js";
import type { DeliveryGuardConfig, Diagnostic, VersionRecord, VersionStatus } from "./types.js";

const implementedSourceStatuses = new Set(["submitted", "merged"]);
const specifiedOpenSpecStatuses = new Set(["ready", "applied", "archived"]);

function duplicateValues(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function validateOpenSpec(root: string, config: DeliveryGuardConfig, record: VersionRecord): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!record.openSpec) {
    if (config.policies.requireOpenSpec && record.documents.length > 0) {
      diagnostics.push(error("openspec.required", `${record.version} requires an OpenSpec change`));
    }
    return diagnostics;
  }

  let changePath: string;
  try {
    changePath = resolveInside(root, record.openSpec.path);
  } catch (cause) {
    diagnostics.push(error("openspec.path", String(cause), record.openSpec.path));
    return diagnostics;
  }
  if (!existsSync(changePath)) {
    diagnostics.push(error("openspec.missing", `OpenSpec change path does not exist`, record.openSpec.path));
    return diagnostics;
  }

  if (specifiedOpenSpecStatuses.has(record.openSpec.status)) {
    for (const artifact of ["proposal.md", "tasks.md"]) {
      const artifactPath = resolve(changePath, artifact);
      if (!existsSync(artifactPath)) {
        diagnostics.push(error("openspec.artifact-missing", `${artifact} is required for ${record.openSpec.status}`, record.openSpec.path));
      }
    }
  }

  if (new Set(["applied", "archived"]).has(record.openSpec.status)) {
    const tasksPath = resolve(changePath, "tasks.md");
    if (existsSync(tasksPath) && /^\s*- \[ \]/m.test(readFileSync(tasksPath, "utf8"))) {
      diagnostics.push(error("openspec.tasks-incomplete", `OpenSpec tasks contain unchecked items`, record.openSpec.path));
    }
  }
  return diagnostics;
}

export function deriveVersionStatus(
  config: DeliveryGuardConfig,
  record: VersionRecord,
  root = process.cwd(),
  evidenceValid = false,
): VersionStatus {
  const diagnostics: Diagnostic[] = [];
  const repositoryIds = new Set(config.repositories.map((item) => item.id));
  const environmentIds = new Set(config.environments.map((item) => item.id));

  for (const id of duplicateValues(record.documents.map((item) => item.id))) {
    diagnostics.push(error("version.document-duplicate", `duplicate document id ${id}`));
  }
  for (const document of record.documents) {
    if (!config.documentTypes.includes(document.type)) {
      diagnostics.push(error("version.document-type", `unknown document type ${document.type}`, document.id));
    }
  }
  const primaryCount = record.documents.filter((item) => item.primary === true).length;
  if (record.documents.length > 0 && primaryCount !== 1) {
    diagnostics.push(error("version.primary-document", `exactly one document must have primary=true`));
  }

  diagnostics.push(...validateOpenSpec(root, config, record));

  for (const id of duplicateValues(record.sources.map((item) => item.repositoryId))) {
    diagnostics.push(error("version.source-duplicate", `duplicate source for repository ${id}`));
  }
  for (const source of record.sources) {
    if (!repositoryIds.has(source.repositoryId)) {
      diagnostics.push(error("version.source-repository", `unknown repository ${source.repositoryId}`));
    }
  }
  for (const deployment of record.deployments) {
    if (!repositoryIds.has(deployment.repositoryId)) {
      diagnostics.push(error("version.deployment-repository", `unknown repository ${deployment.repositoryId}`));
    }
    if (!environmentIds.has(deployment.environmentId)) {
      diagnostics.push(error("version.deployment-environment", `unknown environment ${deployment.environmentId}`));
    }
    if (deployment.anchor.trim().toLowerCase() === "pending") {
      diagnostics.push(error("version.deployment-anchor", `deployment anchor must be concrete`));
    }
  }

  const specReady =
    record.documents.length > 0 &&
    primaryCount === 1 &&
    (!config.policies.requireOpenSpec ||
      (record.openSpec !== undefined && specifiedOpenSpecStatuses.has(record.openSpec.status))) &&
    !diagnostics.some((item) => item.code.startsWith("openspec.") || item.code.startsWith("version.document"));

  const requiredRepositories = config.repositories.filter((item) => item.required);
  const sourcesReady = requiredRepositories.every((repository) => {
    const source = record.sources.find((item) => item.repositoryId === repository.id);
    return source !== undefined && implementedSourceStatuses.has(source.status);
  });
  if (record.sources.length > 0 && !specReady) {
    diagnostics.push(error("version.source-before-spec", `source facts cannot advance before specification is ready`));
  }

  const implemented = specReady && sourcesReady;
  if (record.acceptance.status === "passed" && !record.acceptance.evidence) {
    diagnostics.push(error("acceptance.evidence-required", `passed acceptance requires an evidence manifest`));
  }
  if (record.acceptance.status === "passed" && !implemented) {
    diagnostics.push(error("acceptance.before-source", `acceptance cannot pass before required source is submitted`));
  }
  if (record.acceptance.status === "passed" && !evidenceValid) {
    diagnostics.push(error("acceptance.evidence-invalid", `acceptance evidence is missing or incomplete`));
  }
  const verified = implemented && record.acceptance.status === "passed" && evidenceValid;

  let productionDeploymentsReady = true;
  const productionIds = new Set(config.environments.filter((item) => item.kind === "production").map((item) => item.id));
  if (record.release.status === "published") {
    if (!record.release.anchor || record.release.anchor.trim().toLowerCase() === "pending") {
      diagnostics.push(error("release.anchor-required", `published release requires a concrete anchor`));
    }
    if (!record.release.releasedAt) {
      diagnostics.push(error("release.time-required", `published release requires releasedAt`));
    }
    productionDeploymentsReady = requiredRepositories.every((repository) =>
      record.deployments.some(
        (deployment) =>
          deployment.repositoryId === repository.id &&
          productionIds.has(deployment.environmentId) &&
          deployment.status === "succeeded",
      ),
    );
    if (!productionDeploymentsReady) {
      diagnostics.push(error("release.production-evidence", `every required repository needs a successful production deployment`));
    }
    if (config.policies.requireAcceptanceBeforeRelease && !verified) {
      diagnostics.push(error("release.before-acceptance", `release cannot publish before acceptance passes`));
    }
  }

  const released =
    record.release.status === "published" &&
    productionDeploymentsReady &&
    Boolean(record.release.anchor && record.release.releasedAt) &&
    (!config.policies.requireAcceptanceBeforeRelease || verified);

  let stage: VersionStatus["stage"] = "planned";
  if (specReady) stage = "specified";
  if (implemented) stage = "implemented";
  if (verified) stage = "verified";
  if (released) stage = "released";

  return { version: record.version, stage, diagnostics };
}

export function statusIsValid(status: VersionStatus): boolean {
  return !hasErrors(status.diagnostics);
}
