---
name: deliveryguard-real-device-test
description: Plan and run authorized Android or iOS real-device validation with separate device, native, WebView, and H5 conclusions.
---

# Real-device test

Use this skill when the user asks to validate an application or embedded web experience on a physical Android or iOS device.

If the platform is not stated and cannot be established from the active device context, ask whether to test Android or iOS before interacting with a device. If the platform is already known, do not ask again.

- For Android, read and follow [references/android-mobile-mcp.md](references/android-mobile-mcp.md). Do not load the iOS runbook.
- For iOS, read and follow [references/ios-appium-xcuitest.md](references/ios-appium-xcuitest.md). Do not load the Android runbook.

Before execution, identify the target build or application, environment class, authorized test path, starting state, expected assertions, allowed side effects, and evidence destination. Use repository-relative paths for retained evidence and redact private coordinates. DeliveryGuard does not install or bundle a device service, automation server, private adapter, application, credential, or fixed device configuration.

Obtain current, explicit authorization before any of these actions:

- installing or uninstalling an application or automation helper;
- changing code-signing configuration, trust, developer mode, or other system settings;
- starting a privileged tunnel or running a command with elevated privileges;
- entering account credentials, one-time codes, payment details, or other secrets;
- creating, updating, deleting, purchasing, messaging, or otherwise mutating business or production data.

User presence at the device is not authorization for an unmentioned side effect. When authorization is absent, stop before the action and report the exact blocker.

Report these layers independently:

1. **Device connection** — discovered, reachable, unlocked, and trusted as required.
2. **Native automation** — application launched and native interaction or smoke assertion completed.
3. **WebView discovery** — an inspectable web context was found and selected when the path uses embedded web content.
4. **H5 assertion** — the intended page state or DOM behavior was actually verified.

Success at one layer never proves a later layer. If the device is absent or locked, the automation provider is unavailable, WebView inspection is disabled, or the target state requires an unauthorized write, return a precise `blocked` result. Clean up sessions, recordings, tunnels, helper processes, and temporary tooling started for the run.
