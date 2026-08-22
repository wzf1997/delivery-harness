import { existsSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";

import { error, hasErrors, warning } from "./diagnostics.js";
import { readJson, resolveInside } from "./io.js";
import { validateRepairCase } from "./repair.js";
import { validateSchema } from "./schemas.js";
import { deriveVersionStatus } from "./status.js";
import type {
  DeliveryGuardConfig,
  Diagnostic,
  EvidenceManifest,
  ProjectValidation,
  VersionRecord,
  RepairCase,
  VersionStatus,
} from "./types.js";

function jsonFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .flatMap((entry) => {
      const target = resolve(path, entry.name);
      return entry.isDirectory() ? jsonFiles(target) : extname(entry.name) === ".json" ? [target] : [];
    })
    .sort();
}

function duplicateDiagnostics(values: string[], code: string, label: string): Diagnostic[] {
  const seen = new Set<string>();
  const diagnostics: Diagnostic[] = [];
  for (const value of values) {
    if (seen.has(value)) diagnostics.push(error(code, `duplicate ${label} ${value}`));
    seen.add(value);
  }
  return diagnostics;
}

export function validateConfig(config: DeliveryGuardConfig): Diagnostic[] {
  const diagnostics = validateSchema("config", config);
  if (hasErrors(diagnostics)) return diagnostics;
  diagnostics.push(...duplicateDiagnostics(config.repositories.map((item) => item.id), "config.repository-duplicate", "repository"));
  diagnostics.push(...duplicateDiagnostics(config.environments.map((item) => item.id), "config.environment-duplicate", "environment"));
  diagnostics.push(...duplicateDiagnostics(config.documentTypes, "config.document-type-duplicate", "document type"));
  if (!config.environments.some((item) => item.kind === "production")) {
    diagnostics.push(warning("config.production-missing", `no production environment is configured`));
  }
  return diagnostics;
}

export function validateEvidence(
  root: string,
  record: VersionRecord,
  evidence: EvidenceManifest,
): Diagnostic[] {
  const diagnostics = validateSchema("evidence", evidence);
  if (hasErrors(diagnostics)) return diagnostics;
  if (evidence.version !== record.version) {
    diagnostics.push(error("evidence.version", `evidence version ${evidence.version} does not match ${record.version}`));
  }
  diagnostics.push(...duplicateDiagnostics(evidence.documents.map((item) => item.documentId), "evidence.document-duplicate", "document"));
  diagnostics.push(...duplicateDiagnostics(evidence.requirements.map((item) => item.id), "evidence.requirement-duplicate", "requirement"));
  diagnostics.push(...duplicateDiagnostics(evidence.cases.map((item) => item.id), "evidence.case-duplicate", "case"));

  const documentIds = new Set(record.documents.map((item) => item.id));
  const coveredDocumentIds = new Set(evidence.documents.map((item) => item.documentId));
  for (const id of documentIds) {
    if (!coveredDocumentIds.has(id)) diagnostics.push(error("evidence.document-missing", `document ${id} has no evidence coverage`));
  }
  for (const id of coveredDocumentIds) {
    if (!documentIds.has(id)) diagnostics.push(error("evidence.document-unknown", `evidence references unknown document ${id}`));
  }

  const requirements = new Map(evidence.requirements.map((item) => [item.id, item]));
  const cases = new Map(evidence.cases.map((item) => [item.id, item]));
  for (const document of evidence.documents) {
    for (const requirementId of document.requirementIds) {
      if (!requirements.has(requirementId)) {
        diagnostics.push(error("evidence.requirement-unknown", `document ${document.documentId} references unknown requirement ${requirementId}`));
      }
    }
  }
  for (const requirement of evidence.requirements) {
    for (const caseId of requirement.caseIds) {
      if (!cases.has(caseId)) diagnostics.push(error("evidence.case-unknown", `requirement ${requirement.id} references unknown case ${caseId}`));
    }
  }
  for (const testCase of evidence.cases) {
    if (new Set(["pass", "fail"]).has(testCase.status) && testCase.evidence.length === 0) {
      diagnostics.push(error("evidence.artifact-required", `${testCase.status} case ${testCase.id} requires evidence`));
    }
    if (new Set(["blocked", "skipped"]).has(testCase.status) && !testCase.note?.trim()) {
      diagnostics.push(error("evidence.note-required", `${testCase.status} case ${testCase.id} requires a note`));
    }
    for (const artifact of testCase.evidence) {
      try {
        if (!existsSync(resolveInside(root, artifact))) {
          diagnostics.push(error("evidence.artifact-missing", `evidence file does not exist`, artifact));
        }
      } catch (cause) {
        diagnostics.push(error("evidence.artifact-path", String(cause), artifact));
      }
    }
  }
  return diagnostics;
}

export function validateVersion(
  root: string,
  config: DeliveryGuardConfig,
  record: VersionRecord,
): VersionStatus {
  const schemaDiagnostics = validateSchema("version", record);
  if (hasErrors(schemaDiagnostics)) return { version: record.version || "unknown", stage: "planned", diagnostics: schemaDiagnostics };

  let evidenceValid = false;
  const evidenceDiagnostics: Diagnostic[] = [];
  if (record.acceptance.evidence) {
    try {
      const evidencePath = resolveInside(root, record.acceptance.evidence);
      if (!existsSync(evidencePath)) {
        evidenceDiagnostics.push(error("acceptance.evidence-missing", `evidence manifest does not exist`, record.acceptance.evidence));
      } else {
        const evidence = readJson<EvidenceManifest>(evidencePath);
        evidenceDiagnostics.push(...validateEvidence(root, record, evidence));
        evidenceValid = !hasErrors(evidenceDiagnostics) && evidence.cases.every((item) => item.status === "pass");
        if (!evidence.cases.every((item) => item.status === "pass")) {
          evidenceDiagnostics.push(error("acceptance.cases-not-passing", `all acceptance cases must pass`));
        }
      }
    } catch (cause) {
      evidenceDiagnostics.push(error("acceptance.evidence-read", String(cause), record.acceptance.evidence));
    }
  }
  const status = deriveVersionStatus(config, record, root, evidenceValid);
  status.diagnostics.unshift(...schemaDiagnostics, ...evidenceDiagnostics);
  return status;
}

export function validateProject(root = process.cwd()): ProjectValidation {
  const diagnostics: Diagnostic[] = [];
  const configPath = resolve(root, "deliveryguard.config.json");
  if (!existsSync(configPath)) {
    diagnostics.push(error("config.missing", `deliveryguard.config.json is missing`, configPath));
    return { ok: false, diagnostics, versions: [] };
  }

  let config: DeliveryGuardConfig;
  try {
    config = readJson<DeliveryGuardConfig>(configPath);
  } catch (cause) {
    diagnostics.push(error("config.read", String(cause), configPath));
    return { ok: false, diagnostics, versions: [] };
  }
  diagnostics.push(...validateConfig(config));
  if (hasErrors(diagnostics)) return { ok: false, diagnostics, versions: [] };

  const versionDirectory = resolveInside(root, config.paths.versions);
  const versionFiles = jsonFiles(versionDirectory);
  if (versionFiles.length === 0) diagnostics.push(warning("version.none", `no version records found`, config.paths.versions));
  const versions: VersionStatus[] = [];
  for (const file of versionFiles) {
    try {
      const record = readJson<VersionRecord>(file);
      versions.push(validateVersion(root, config, record));
    } catch (cause) {
      diagnostics.push(error("version.read", String(cause), file));
    }
  }
  for (const file of jsonFiles(resolveInside(root, config.paths.repairs))) {
    try {
      diagnostics.push(...validateRepairCase(root, readJson<RepairCase>(file)));
    } catch (cause) {
      diagnostics.push(error("repair.read", String(cause), file));
    }
  }
  diagnostics.push(...versions.flatMap((item) => item.diagnostics));
  return { ok: !hasErrors(diagnostics), diagnostics, versions };
}

export function findJsonFiles(root: string, path: string): string[] {
  return jsonFiles(resolveInside(root, path));
}
