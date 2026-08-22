# Architecture

[简体中文](architecture.zh-CN.md)

DeliveryGuard is a file-based validation toolkit. It consumes repository facts, derives lifecycle stages, and emits diagnostics for people, CI, and coding agents. It has no network connector or privileged runtime.

## Layers

1. **Public schemas** define configuration, version records, evidence manifests, and Repair Cases with JSON Schema Draft 2020-12.
2. **Semantic validators** enforce relationships that JSON Schema cannot express: unique identifiers, complete document coverage, valid repository references, OpenSpec readiness, red/green commits, and production deployment coverage.
3. **Stage derivation** computes `planned`, `specified`, `implemented`, `verified`, or `released` from facts. The stage is never stored as an override.
4. **CLI and TypeScript API** expose the same validators. `--json` output is the stable integration surface for automation.
5. **Harness layer** combines the installed `AGENTS.md`, [Codex skill suite](codex-skills.md), and OpenSpec records. It governs how agents prepare facts but cannot bypass core gates or perform external writes on behalf of the core.

## Gate model

- `specified`: one primary document exists and the configured OpenSpec policy is satisfied.
- `implemented`: every required repository has submitted or merged source.
- `verified`: implementation is ready, acceptance is `passed`, every document and requirement is covered, every case passes, and evidence paths exist.
- `released`: verification is ready when required, every required repository has a successful production deployment, and the release has concrete anchors and time.

Acceptance and release remain orthogonal facts even though stage derivation is sequential. A failed production deployment does not erase prior acceptance evidence.

## Trust boundaries

All paths must be repository-relative. Repair commands are untrusted repository content and run only after an explicit `repair run`; `check` never executes them. Commands are argv arrays passed directly to the operating system with `shell: false`, bounded working directories, and timeouts.

Document references, deployment anchors, and remote repository URLs are opaque evidence. DeliveryGuard validates their presence and relationships but does not authenticate external systems.
