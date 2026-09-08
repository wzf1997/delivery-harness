# Video sources

Use only a source the user identified or clearly placed in scope. Discover available tools before choosing a path; do not assume a browser, connector, download API, or screen recorder exists.

## Local media

Use a provided local path directly. If the user only names a project recording, search the selected repository for common video extensions and ask only when multiple candidates remain. The bundled extractor accepts a local regular file, never a URL, and writes to a new temporary run directory. A missing decoder, unsupported format, damaged file, or file with no video stream is a blocker for extraction rather than evidence that the application failed.

## Attachment or document

Use an available authorized connector only for the named message, document, or attachment. Do not scan unrelated conversations, extract session credentials, invent identifiers, or retain signed download locations. Validate that a downloaded file is media before analyzing it. If download access is unavailable, use an authorized player or ask the user to provide the file.

## Browser or application player

Use the player the user selected. Normal pause, replay, and seek controls are allowed during read-only review. Do not bypass access control, protected playback, or download restrictions. Record the range that was actually viewed. Player buffering or a blank capture is not proof that the original recording contains the same failure.

## Screen capture

Use screen capture only when the target window and privacy scope can be constrained. Capture the shortest useful interval, exclude unrelated windows and microphone audio, and stop when the bounded interval ends. If permissions, protected content, or tool limitations prevent reliable capture, state the exact blocker. Screen-capture time is not video time unless a visible player clock establishes that mapping.

## Local extraction helper

The helper requires Node.js plus `ffmpeg` and `ffprobe` already available on `PATH`, or explicitly configured with `DELIVERYGUARD_FFMPEG` and `DELIVERYGUARD_FFPROBE`. Missing dependencies do not authorize installing software or changing shell configuration.

```sh
node .agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs doctor
node .agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs extract recordings/example.mp4
node .agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs extract recordings/example.mp4 --start 12 --end 16 --interval 0.1
node .agents/skills/deliveryguard-video-diagnosis/scripts/extract-frames.mjs extract recordings/example.mp4 --start 12 --end 13 --every-frame
```

The generated index stores the source filename, digest, media metadata, actual decoded-frame timestamps, and sampling parameters. It intentionally omits the absolute source path. Treat the index as a generation record, not proof that a person or agent viewed the frames.
