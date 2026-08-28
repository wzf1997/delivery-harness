# Android Mobile MCP runbook

Use the Mobile MCP capabilities provided by the current environment. DeliveryGuard does not install, configure, or emulate that service. If it is unavailable, report the Android test as blocked and name the missing capability.

## Discover current state

1. List available devices for this run. Select the intended physical Android device and confirm it is reachable and unlocked.
2. List installed applications on that device and resolve the target's actual package identifier from live results. Do not assume a remembered identifier.
3. Capture an initial screenshot and query the current screen elements. Treat element bounds as ephemeral.
4. Confirm the target build or environment and the user-authorized navigation path before interaction.

No device identifier, package identifier, application scheme, element coordinate, account, or environment value may be copied from a previous run or embedded in reusable evidence.

## Execute the authorized path

1. Launch the resolved application or open the approved route using Mobile MCP.
2. Before every tap, long press, swipe, or text entry, query the live screen again and select the current element. Prefer accessibility labels or visible text. Do not reuse old coordinates.
3. Capture a screenshot before the material action and after the expected state settles. Use a bounded recording when motion, timing, or intermittent behavior is part of the assertion.
4. If the application exits, freezes, or shows an unexpected blank state, collect the current screen and available crash evidence. Distinguish a native crash from a live native shell with failed embedded content.
5. Do not cross an authorization boundary for installation, account input, system changes, purchases, messaging, or business-data mutation.

## Conclude and clean up

Record the selected device only in transient, redacted form. Report device connection, native automation, WebView discoverability when relevant, and the final H5 assertion separately. A successful launch, URL handoff, or visible native toolbar is not proof that embedded content rendered correctly.

Stop any recording and terminate only the sessions or application state that the authorized test created. Retain only the minimum redacted screenshots, recordings, and crash excerpts required by the evidence contract.
