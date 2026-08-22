# Configuration reference

[简体中文](configuration.zh-CN.md)

`deliveryguard.config.json` is the project entry point. All configured paths are relative to the repository root.

- `project`: stable project id and display name.
- `stableBranch`: the project's real stable branch; DeliveryGuard does not assume `main` or `master`.
- `repositories`: source repositories involved in delivery. Required repositories participate in implementation and production gates.
- `environments`: named environments classified as development, test, staging, or production.
- `documentTypes`: project-specific document categories accepted by version records.
- `paths`: locations for versions, acceptance evidence, repairs, and OpenSpec changes.
- `policies.requireOpenSpec`: requires a ready or later OpenSpec change before `specified`.
- `policies.requireAcceptanceBeforeRelease`: prevents `released` without verified acceptance.
- `policies.requireDedicatedWorktree`: records the collaboration policy for agent instructions; the validator does not create or delete worktrees.

## Records

One JSON file represents one version. Source and deployment records are per repository. Deployment environments must exist in configuration, commits use 7–40 hexadecimal characters, and all published releases need concrete non-`pending` anchors.

Evidence manifests must cover every registered document. Each document maps to requirements, each requirement maps to cases, passing and failing cases point to existing evidence files, and blocked or skipped cases explain why.

Repair Cases use repository-relative paths and argv arrays. The runner verifies that the selected repository is currently checked out at the phase's declared commit before execution.
