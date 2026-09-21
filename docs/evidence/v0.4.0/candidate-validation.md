# DeliveryGuard v0.4.0 candidate validation

Validated locally on 2026-09-21 with Node 24 and pnpm 11.

- `pnpm check` passed 76 tests across 8 files, type checking, build, CLI smoke checks, documentation links, asset validation and sensitive-content scan.
- Review tests cover current approvals, candidate/policy changes, rejection precedence, non-production Hotfix, bounded automatic review, integration records, unsafe paths, symlink escapes and project environment consistency.
- `pnpm pack` produced version 0.4.0. A clean temporary installation reported CLI 0.4.0, installed the mirrored review guidance with `init --codex`, and validated the synthetic Hotfix route without external-action authorization.
- The synthetic project check passed; its fictional release is independent of the review fixture.
- Repository and initializer skill trees remain byte-identical. Public-content scans include source-project names and private-coordinate exclusions; no private source or history was imported.

These checks establish local candidate acceptance, not an authenticated external review, model execution, remote Git verification or npm publication. Publication evidence will be recorded separately after the registry confirms it.

Accepted source candidate: `affc554f2e089f76e24784d5cf2a83899d9be2e3`, pushed to `codex/deliveryguard-review-workflows`. Public history scan passed for 204 pre-existing text blobs; package integrity strings were distinguished from complete private names.
