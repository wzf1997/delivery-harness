---
name: deliveryguard-video-diagnosis
description: Diagnose visual and interaction failures from recordings or accessible video players without treating pixels as request or root-cause proof.
---

# Video diagnosis

Use this skill when a user reports a visual, timing, or interaction problem shown in a recording. Do not use it for video editing, production, or ordinary content summarization.

Choose one available source and read [references/sources.md](references/sources.md) for that source type. Prefer the original local media file, then an accessible player, and use a bounded screen capture only when the original cannot be obtained without bypassing access controls. If a local file is available, `node <skill-dir>/scripts/extract-frames.mjs doctor` checks the media tools and `node <skill-dir>/scripts/extract-frames.mjs extract <video>` creates a timestamped frame index in a temporary run directory.

Actually inspect the frames or player. Metadata, a generated index, and a single screenshot do not prove that the recording was reviewed. Start with a coarse timeline that covers the whole observed range, then read [references/frame-review.md](references/frame-review.md) and inspect each relevant state transition more densely. Use actual decoded-frame timestamps. State the observed range and sampling density, and never claim that sparse sampling excludes a shorter event.

Pause, replay, and seek within the recording when the available tool permits it. Do not click real business actions merely because the recording demonstrates them. Keep player buffering, capture loss, decoding artifacts, and the recorded application behavior as separate hypotheses.

Video evidence can establish visible state and timing. It cannot by itself establish touch coordinates, network requests, server state, persistent writes, or root cause. When request evidence exists, hand the bounded time window and visible divergence to `deliveryguard-request-diagnosis`. A video is supporting evidence, not a substitute for a reproducible Repair Case or formal acceptance coverage.

Report:

1. source type and the exact range actually observed;
2. sampling density and whether audio was analyzed;
3. a timeline of before, divergence, and stable result or recovery;
4. visible facts, separated from inferences;
5. relevant contract, code, request, or runtime evidence;
6. unverified layers and the smallest next step that would distinguish them.

Keep generated media outside the repository by default. Do not overwrite the source, upload it, or persist frames in shared evidence without explicit authorization and redaction.
