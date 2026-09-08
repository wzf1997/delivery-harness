# Local verification

Use this mode for a focused implementation, defect, page, API, or a small explicitly named set of cases. It answers whether the scoped behavior has evidence now; it does not decide acceptance for an entire registered version.

1. Define the exact behavior, environment class, and observable pass condition from the current request and applicable contract.
2. Run the smallest deterministic checks that cover the changed behavior, then add runtime, browser, device, or data checks only when they are relevant and authorized.
3. Keep layers separate: build or static checks, page rendering, interaction, request behavior, persistence, device runtime, and external deployment are distinct results.
4. Record the commands or interactions actually performed, their result, and repository-relative evidence when the project requires it.
5. If a dependency is blocked, report the affected layer precisely and continue checks that do not depend on it. Do not convert missing evidence into a pass or a global task failure.

Return the scoped result, passed checks, failed checks, blocked or untested layers, and the smallest next step. Do not create or update a full-version Evidence Manifest, acceptance report, or `passed` status unless the user explicitly requested formal version acceptance and complete coverage exists.
