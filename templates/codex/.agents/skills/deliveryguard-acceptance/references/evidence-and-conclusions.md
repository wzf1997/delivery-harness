# Evidence and conclusions

- Evidence must identify the case, observed result, environment, source revision, and capture time.
- A screenshot is useful only when it shows the relevant state; prefer machine-readable logs for deterministic checks.
- `passed` requires complete registered coverage and passing cases.
- Any verified failure makes the run `failed`.
- An unavailable dependency that prevents a required case makes the run `blocked`.
- `skipped` is not equivalent to `passed` and requires a reason.
- Acceptance does not imply a production release.
