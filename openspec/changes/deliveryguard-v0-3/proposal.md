# DeliveryGuard v0.3.0 harness guidance refresh

## Problem

Recent delivery-harness usage exposed two reusable gaps: recorded UI failures need a disciplined visual timeline before request or root-cause diagnosis, and small local verification requests are too easily confused with formal version acceptance. Project-specific implementations also accumulate personal tooling and business rules that are unsafe to promote into a public harness.

## Scope

- Add a provider-neutral video-diagnosis skill with progressive source and frame-review guidance.
- Add an independently implemented local frame-extraction helper that preserves decoded-frame timestamps and omits absolute source paths from its index.
- Route focused verification, formal acceptance, and report-only handoff explicitly.
- Continue independent checks when one evidence layer is blocked while preserving the blocker.
- Keep personal tooling out of installed repository contracts.
- Update public documentation, package metadata, tests, and the mirrored npm initializer for a 20-skill suite.

## Non-goals

- Copy source-project code, internal attachment procedures, business terminology, environment coordinates, or fixed tool paths.
- Add a run ledger or make validation write hidden state.
- Change the CLI commands, TypeScript API, or JSON Schema contracts.
- Commit, push, publish, deploy, message, or operate a real browser or device as part of this local preparation.

## Public contracts

- `deliveryguard-video-diagnosis` establishes only visually supported facts and reports the observed range, sampling density, audio scope, timeline, evidence, inferences, and unknowns.
- Its extractor accepts local files only, requires an existing FFmpeg toolchain, preserves actual decoded-frame timestamps, creates a unique temporary output, and does not include the absolute source path in the index.
- `deliveryguard-acceptance` selects focused verification, formal version acceptance, or report-only handoff without promoting a narrower result.
- One blocked evidence dependency stops only dependent checks; independent authorized checks continue and the blocker remains visible.
- Repository and initializer copies of every skill remain byte-for-byte identical and free of private coordinates.

## Risks and mitigations

- **False visual conclusions:** require actual frame review, before-divergence-after evidence, and explicit sampling limits.
- **Media leakage:** default to temporary local output, omit absolute paths, and require authorization plus redaction before persistence or upload.
- **Unsafe media handling:** reject URLs, disable non-file protocols, avoid shell execution, and cap each extraction run.
- **Overstated acceptance:** route local verification separately and forbid full-version state changes without complete coverage.
- **Private knowledge leakage:** independently rewrite generic behavior, scan script resources, and exclude business-specific guards and coordinates.

## Acceptance

- The new and changed skills pass the skill validator and their behavior-contract tests.
- Unit tests cover variable-frame-time selection, tail-frame preservation, remote and missing media rejection, and dependency-free help.
- `init --codex` installs 20 skills, the new references and script, and the local-verification reference.
- Repository and template skill trees remain identical.
- `pnpm check`, repository and synthetic-example checks, package creation, and packed-artifact initialization smoke validation pass.
