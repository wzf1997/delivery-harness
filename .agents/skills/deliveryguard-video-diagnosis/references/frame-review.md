# Frame review

## Cover transitions, not only duration

Use coarse sampling to build an operation timeline across the full recording. For each relevant open, input, scroll, selection, navigation, submit, completion, or dismissal, compare the state before the transition, the divergent state, and the stable result or recovery.

Increase density around transitions or unclear events. A short interval such as 0.1 seconds is useful for ordinary UI changes; use every decoded frame for a small window when adjacent sampled frames conflict or a transient may fall between them. Split runs before they exceed the helper's frame limit rather than increasing the interval to skip the event.

Open original-size frames when thumbnails cannot establish text, geometry, occlusion, or movement. Compare a small set with the same crop or viewport and retain enough surrounding context to distinguish application UI from player controls or content shown inside the recording.

## Evidence threshold

- Cite the actual frame timestamps for the normal or earlier state, the divergence, and the recovery or persistent result.
- A frame proves only what was visible at that instant. It does not prove duration, intent, touch input, request success, or persistence.
- Distinguish local content motion, whole-viewport motion, keyboard or system transitions, and player scaling.
- Separate observed behavior, contract mismatch, candidate implementation cause, and missing runtime evidence.
- Repeated symptoms may share a finding, but independently visible failures still need their own timeline evidence.
- Do not classify expected animation, operating-system UI, capture artifacts, or player overlays as product defects without comparison evidence.

If denser review cannot answer the question because the source lacks resolution, frames, touch indicators, audio, or network evidence, state that precise limitation. Sampling cannot recover information the source never captured.
