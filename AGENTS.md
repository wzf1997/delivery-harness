# DeliveryGuard contributor instructions

DeliveryGuard is a public, clean-room delivery validation toolkit. Preserve its generic scope and synthetic-only examples.

## Development contract

- Use pnpm only and support the Node range declared in `package.json`.
- Keep schemas, semantic validators, CLI output, tests, and bilingual core docs consistent.
- A lifecycle stage is derived from facts; never add a manual status override.
- Keep acceptance distinct from release and OpenSpec intent distinct from source evidence.
- All repository paths must be relative and constrained to the selected root.
- Repair commands are argv arrays executed with `shell: false`; `check` must never execute them.
- Do not add deployment, messaging, business-data, credential, or proprietary platform integrations to the core.
- Bundled skills may describe provider-neutral plans and evidence contracts, but must not embed private adapters, endpoints, environment coordinates, business schemas, or automatic external writes.
- Use fictional names, `.invalid` domains, and synthetic artifacts in every example and test.

Before completion run `pnpm check`, validate `examples/synthetic-shop`, pack the npm artifact, and smoke-test it in a clean temporary directory. Publishing, pushing, and external repository changes require explicit user authorization.
