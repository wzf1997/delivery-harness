# DeliveryGuard v0.3.0 candidate validation

- Candidate revision: `ccd3b20a5695ca514727c190e4d3e26861917a9a`
- Branch: `codex/deliveryguard-v0-3-harness-refresh`
- Captured at: `2026-09-08T03:11:12Z`
- Environment: local macOS worktree, Node.js 24.19.0, pnpm 11.19.0

## Video-diagnosis contract

`quick_validate.py` accepted `deliveryguard-video-diagnosis`. Contract tests require actual frame or player inspection, decoded-frame timestamps, explicit sampling limits, separation of pixel evidence from requests and root cause, and a handoff to request diagnosis when runtime evidence exists.

A generated two-second technical test pattern was sampled at 0.5-second intervals. The helper produced five indexed frames, retained the final decoded frame at `00:00:01.900`, reported audio as not analyzed, and omitted the absolute source path from the index. No user recording, application screen, account, or business data was used.

Result: pass.

## Verification and acceptance routing

`quick_validate.py` accepted the revised `deliveryguard-acceptance` skill. Contract tests verified distinct routes for focused local verification, formal full-version acceptance, and report-only handoff. They also require a blocked device, account, environment, or tool to stop only dependent cases while preserving the blocker and continuing independent authorized checks.

Result: pass.

## Public and sensitive-data boundary

The repository sensitive-content scan passed across 152 files. Skill-resource tests included Markdown, JSON, YAML, JavaScript, Python, shell, and text resources. The candidate contains no source-project script, private attachment workflow, business-specific isolation rule, internal host, environment coordinate, device identity, account, absolute user path, credential, or personal screenshot. Repository and initializer skill trees were byte-for-byte identical.

Result: pass.

## Package and clean initialization

`pnpm check` passed 26 tests across seven files, TypeScript validation, build, CLI smoke checks, documentation links, brand assets, and the sensitive-content scan. Repository validation reported `v0.3.0` as `specified`; the wholly synthetic example remained `released`.

`pnpm pack` created `deliveryguard@0.3.0`. Installing that archive into a clean temporary project and running `deliveryguard init --codex` produced CLI version `0.3.0`, 20 installed skills, the video-diagnosis references and helper, and the local-verification reference.

Result: pass.
