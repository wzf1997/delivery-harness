# DeliveryGuard v0.2.0 diagnosis and real-device skills

## Problem

Delivery teams need reusable guidance for diagnosing request-chain failures and validating software on physical mobile devices. Existing project-specific procedures often mix private infrastructure coordinates, business data, and device identities into the workflow, making them unsafe to publish or reuse.

## Scope

- Add a trace-first, read-only request-diagnosis skill for page, API, and multi-service failures.
- Add a single cross-platform real-device skill with conditionally loaded Android Mobile MCP and iOS Appium/XCUITest runbooks.
- Preserve distinct evidence and outcomes for device, native, WebView, and H5 layers.
- Mirror the skills into the npm initializer and update public documentation, provenance, changelog, package metadata, and tests.
- Prepare an evidence-accurate `v0.2.0` version record without claiming source submission, acceptance, deployment, or release.

## Non-goals

- Add or install a Mobile MCP server, Appium server, device farm, or private platform adapter.
- Include fixed application, account, device, signing, environment, or business coordinates.
- Change the DeliveryGuard CLI command surface or JSON Schema contracts.
- Operate a physical device or add automatic package publication, release, deployment, or external-data writes to the product. Release closure remains a separate authorized operation.

## Public contracts

- `deliveryguard-request-diagnosis` identifies the first failing boundary, separates observable status layers, classifies the cause, states confidence and unknowns, and proposes a next step without silently fixing anything.
- `deliveryguard-real-device-test` asks for a platform only when missing, routes Android to Mobile MCP and iOS to Appium/XCUITest, rediscovers runtime state, and reports each validation layer independently.
- Sensitive or externally mutating device actions require explicit authorization at the time of action.
- Repository and initializer copies of every bundled skill remain byte-for-byte identical.

## Risks and mitigations

- **False root-cause claims:** require first-boundary evidence and lower confidence when trace correlation is unavailable.
- **Overstated device success:** make connectivity, native automation, WebView discovery, and H5 assertions separate results.
- **Stale coordinates:** rediscover devices, applications, contexts, and screen elements for each run.
- **Private-data leakage:** test every textual skill resource and run the repository sensitive-data scan before packaging.
- **Unauthorized side effects:** explicitly gate installation, signing, privileged tunneling, credentials, settings, and business writes.

## Acceptance

- Both new skills pass the repository skill validator.
- The suite contains 19 skills, and initializer copies match repository copies byte-for-byte.
- A clean `init --codex` installation contains both skills and both mobile runbooks.
- Behavioral contract tests cover platform routing, trace and no-trace diagnosis, blockers, layered outcomes, and authorization gates.
- `pnpm check`, repository and synthetic-example checks, package creation, and packed-artifact smoke validation pass.
