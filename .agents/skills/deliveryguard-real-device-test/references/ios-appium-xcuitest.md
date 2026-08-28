# iOS Appium and XCUITest runbook

Use this runbook for an authorized test on a physical iOS device. Keep all discovered device, signing, application, account, and environment coordinates transient and out of reusable repository content.

## Discover prerequisites

1. Discover the active Xcode toolchain, attached physical devices, current trust and unlock state, target application, and available development-signing identities from the local environment.
2. Confirm that the target device, operating-system version, Xcode version, Appium version, XCUITest driver, and WebDriverAgent path are compatible.
3. Ask the user to complete device trust, passcode entry, developer-mode confirmation, Apple account prompts, or other secret-bearing steps on the device or in the system UI.
4. Obtain explicit authorization before changing signing, registering a device, installing a helper, modifying system settings, or using elevated privileges.

Do not infer a team identifier from a display label or retain a device identifier, bundle identifier, device name, account, or certificate subject in the repository.

## Prepare isolated automation

Create disposable tooling and Appium state in a temporary location outside the project. Do not reuse a global Appium home when that could alter the user's existing drivers or plugins. Install or update tooling only when authorized.

Build and sign WebDriverAgent with values discovered during this run. Treat a successful build as signing evidence, not application or H5 acceptance. If a modern device requires a RemoteXPC tunnel, explain why and request authorization before starting any privileged tunnel. Record the assigned endpoint only transiently.

Start Appium with the isolated state, then create an XCUITest session using the selected live device and application. Keep credentials out of capabilities and logs. Bound startup and command timeouts so a disconnected or locked device produces a clear blocker.

## Validate each layer

1. **Device:** confirm the selected physical device remains reachable, trusted, and unlocked.
2. **Native:** launch the intended application and perform a minimal, non-mutating native smoke assertion using freshly discovered elements.
3. **WebView:** request detailed contexts, wait for the expected inspectable web context, and switch to that context. `NATIVE_APP`, a successful deep link, or a launched application does not prove WebView access.
4. **H5:** assert a stable page property such as the expected URL class, title, DOM landmark, or visible non-sensitive content. Switch back to native context when later native interaction is required.

If no web context appears, report whether WebView inspection is disabled, the page never loaded, the application exposes no inspectable context, or the cause remains unknown. Do not label the H5 layer passed from a screenshot alone when a DOM assertion was required.

## Clean up

Delete the Appium session, stop Appium, stop any tunnel and WebDriverAgent or build processes started for the run, and remove disposable tooling when safe. Verify those processes and listening endpoints are gone. Do not uninstall the target application, remove signing material, or revert system settings without explicit authorization.

Report device, native, WebView, and H5 outcomes independently with redacted evidence and exact blockers.
