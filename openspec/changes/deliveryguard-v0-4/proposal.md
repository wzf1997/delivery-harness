# DeliveryGuard v0.4.0 candidate review workflows

## Requirements

- Validate one complete task-and-code candidate with checks bound to its digest and approvals bound to both candidate and policy digests.
- Support explicit non-production bug Hotfix, bounded automatic-review evidence and human-reviewed test integration evidence. Preserve human rejection precedence.
- Include optional registered records in project checks; preserve all existing lifecycle gates.
- Provide CLI, public schemas, TypeScript exports, bilingual documentation, synthetic fixtures and mirrored review/handoff guidance.
- Remain a provider-neutral offline validator. No proprietary implementation, identity authentication, model invocation, remote Git verification or external write is included.

## Acceptance

Test stale/rejected approvals, source and scope mismatch, unsafe paths, failed checks, automatic fallback, production exclusions and integration invariants. Verify package installation and initialization, schema/API contents, CLI exit codes, synthetic project checks and sensitive-content scans.
