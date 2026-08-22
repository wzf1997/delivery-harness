# Security policy

## Supported versions

The latest published minor release receives security fixes. During the developer preview, fixes may include breaking schema changes with migration notes.

## Reporting a vulnerability

Use GitHub's private security advisory flow for the repository. If that is unavailable, contact `582344150@qq.com` with a minimal reproduction and no live credentials or personal data. Do not open a public issue for an unpatched vulnerability.

## Execution model

`deliveryguard check` is read-only and never executes Repair Case commands. `deliveryguard repair run` executes repository-authored argv directly with `shell: false`; review Repair Cases as executable code before running them. DeliveryGuard does not authenticate external document, source-control, CI, or deployment systems.
