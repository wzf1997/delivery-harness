<p align="center">
  <img src="docs/assets/deliveryguard-hero.webp" alt="DeliveryGuard blue robotic cat mascot guarding an evidence-driven software delivery path" width="100%" />
</p>

# DeliveryGuard

[简体中文](README.zh-CN.md)

[![CI](https://github.com/wzf1997/delivery-harness/actions/workflows/ci.yml/badge.svg)](https://github.com/wzf1997/delivery-harness/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/deliveryguard.svg)](https://www.npmjs.com/package/deliveryguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Evidence-driven software delivery.** DeliveryGuard turns specifications, source commits, acceptance evidence, repair checks, and production deployment anchors into explicit gates that both humans and coding agents can verify.

> Developer Preview: the `v0.x` schemas and CLI may change as real-world feedback arrives.

## Why DeliveryGuard?

Software delivery often collapses different claims into one vague “done.” DeliveryGuard keeps them separate:

```text
planned -> specified -> implemented -> verified -> released
```

- A proposal is not implementation.
- A green test is not acceptance coverage.
- Acceptance is not production release.
- A preview URL is not a production deployment anchor.
- A repair needs reproducible red, green, and regression evidence.

DeliveryGuard records facts and derives the highest defensible stage. It does not deploy software, call business services, send messages, or run an agent platform.

## Quick start

```sh
npx deliveryguard init --codex
npx deliveryguard check
npx deliveryguard status
```

Initialization is non-destructive: existing files are never overwritten. The generated project contains `deliveryguard.config.json`, a reusable `AGENTS.md` harness contract, `.deliveryguard/`, `openspec/changes/`, and 17 optional, provider-neutral Codex skills covering the full delivery workflow.

This repository also installs the same suite at [`.agents/skills`](.agents/skills) so contributors and Codex can use it directly. Tests require that the repository copy and npm initializer templates remain byte-for-byte identical.

## Commands

| Command | Purpose |
| --- | --- |
| `deliveryguard init [--codex]` | Create a safe starter layout |
| `deliveryguard check [--json]` | Validate every configured gate |
| `deliveryguard status [--json]` | Show derived lifecycle stages |
| `deliveryguard version validate [path]` | Validate version records |
| `deliveryguard acceptance validate <path> --version <path>` | Validate evidence coverage |
| `deliveryguard repair validate [path]` | Validate Repair Cases |
| `deliveryguard repair run <path> --phase <phase>` | Run declared argv checks without a shell |

Use `-C <directory>` before a command to target another project.

## JavaScript and TypeScript API

```ts
import { defineConfig, deriveVersionStatus, validateProject } from "deliveryguard";

const config = defineConfig({
  schemaVersion: 1,
  // typed project configuration
});

const result = validateProject(process.cwd());
```

The package exports `DeliveryGuardConfig`, `VersionRecord`, `EvidenceManifest`, `RepairCase`, `Diagnostic`, schema validation, project validation, and status derivation.

## Explore the workflow

[`examples/synthetic-shop`](examples/synthetic-shop) is a fictional two-repository project with an applied OpenSpec change, complete evidence coverage, a verified Repair Case, and concrete synthetic deployment anchors.

```sh
deliveryguard -C examples/synthetic-shop check
```

Read the [architecture](docs/architecture.md), [configuration reference](docs/configuration.md), [Codex skill catalog](docs/codex-skills.md), and [brand guide](docs/brand.md) next.

## Contributing and security

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). DeliveryGuard is clean-room work; its origin and inspiration are documented in [PROVENANCE.md](PROVENANCE.md).

## License

[MIT](LICENSE) © 2026 wzf1997.
