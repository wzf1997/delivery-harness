import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import type { FormatsPlugin } from "ajv-formats";

import type { Diagnostic } from "./types.js";

export type SchemaName = "config" | "version" | "evidence" | "repair-case";

const require = createRequire(import.meta.url);
const loadedFormats = require("ajv-formats") as FormatsPlugin | { default: FormatsPlugin };
const addFormats: FormatsPlugin = "default" in loadedFormats ? loadedFormats.default : loadedFormats;
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);

const validators = new Map<SchemaName, ValidateFunction>();

function schemaPath(name: SchemaName): string {
  return fileURLToPath(new URL(`../schemas/${name}.schema.json`, import.meta.url));
}

function validator(name: SchemaName): ValidateFunction {
  const cached = validators.get(name);
  if (cached) return cached;
  const schema = JSON.parse(readFileSync(schemaPath(name), "utf8")) as object;
  let compiled: ValidateFunction;
  try {
    compiled = ajv.compile(schema);
  } catch (cause) {
    const id = (schema as { $id?: string }).$id;
    if (id) ajv.removeSchema(id);
    throw cause;
  }
  validators.set(name, compiled);
  return compiled;
}

function formatError(name: SchemaName, item: ErrorObject): Diagnostic {
  const location = item.instancePath || "/";
  return {
    code: `schema.${name}.${item.keyword}`,
    message: `${location} ${item.message ?? "is invalid"}`,
    path: location,
    severity: "error",
  };
}

export function validateSchema(name: SchemaName, value: unknown): Diagnostic[] {
  const validate = validator(name);
  return validate(value) ? [] : (validate.errors ?? []).map((item) => formatError(name, item));
}
