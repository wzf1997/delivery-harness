# DeliveryGuard v0.2.0 candidate validation

- Candidate revision: `dd55d4200d0ea5aa88cbdae723dafe83ad28554e`
- Branch: `codex/deliveryguard-v0-2-diagnosis-mobile`
- Captured at: `2026-08-28T09:17:08Z`
- Environment: local macOS worktree, Node.js 24, pnpm 11.19.0

## Request-diagnosis contract

`quick_validate.py` accepted `deliveryguard-request-diagnosis`. The complete test suite passed 21 tests across six files, including first-failing-boundary behavior, trace and no-trace confidence handling, root-cause categories, and the read-only authorization boundary.

Result: pass.

## Real-device routing contract

`quick_validate.py` accepted `deliveryguard-real-device-test`. Contract tests verified the Android Mobile MCP route, iOS Appium/XCUITest route, platform question, blocker reporting, independent device/native/WebView/H5 outcomes, and authorization gates.

No physical device was operated. This release validates the reusable skill and packaged runbooks, not a business application or device environment.

Result: pass.

## Public and sensitive-data boundary

The repository sensitive-content scan passed across 134 files. Skill-resource tests scanned every textual skill resource for private URLs, credentials, absolute user paths, account addresses, fixed coordinates, and device or signing identifiers. Repository and initializer skill trees were byte-for-byte identical.

Result: pass.

## Package and clean initialization

`pnpm pack` completed after rerunning the full check. The `deliveryguard@0.2.0` archive contained 19 skills plus one Android and one iOS runbook. Installing that archive into a clean temporary project and running `deliveryguard init --codex` produced CLI version `0.2.0`, 19 installed skills, and both runbook files.

The repository check passed with `v0.2.0` at `specified`; the wholly synthetic example remained `released`.

Result: pass.
