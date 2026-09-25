---
type: change-delta
id: CHANGE-046
status: draft
---

# Delta

## ADDED Requirements

### VIDEO-MOTION-001 Effect Stack module

Add a Video Motion Effect Stack layer with browser video selection, play/stop, and Motion Feedback controls in the Postprocess property module. Motion Feedback is the only mode. Keep the panel mounted while another stack layer is selected so the source/runtime remains active.

### VIDEO-MOTION-002 reusable motion field

Add a replaceable motion-source boundary that outputs a small RGBA8 field. The initial source uses low-resolution decoded-frame luma patch matching; RG/B contain direction and magnitude, and A contains frame-change magnitude.

### VIDEO-MOTION-003 palette-preserving feedback

Add Motion Feedback as a lazy dedicated WebGL pass. It exposes bounded accumulation, decay, smear, stabilization, damping, and field smoothing controls. The pass caps history contribution so the current upstream frame remains visible, then projects the composed RGB to the nearest sampled color on the active Gradient Ramp so repeated feedback does not drift into muddy intermediate colors.

### VIDEO-MOTION-004 timeline and export synchronization

Map normalized timeline time linearly to the loaded video's duration. Preview seeks and export frame preparation share the same runtime; export awaits the target decoded frame before rendering, and Feedback history resets on source replacement, timeline discontinuity, and export start.

### PRESET-018 external source compatibility

Persist normalized Video Motion settings but exclude the video file, object URL, HTMLVideoElement, and motion history from portable Presets.

## Non-goals

Codec motion-vector extraction, full-resolution optical flow, audio analysis, and portable preset storage of the external video are deferred.

## MODIFIED Requirements

### Effect Stack layer contract

Add `videoMotion` to the canonical reorderable Effect Stack. Its enabled state is the primary V2 state and its render pass consumes and produces the ping-pong texture at its stack position. Noise, Glass, or another layer may be selected without stopping the Video Motion source.

## REMOVED Requirements

Motion Warp, Motion Palette, Motion Flow, and Motion Datamosh are removed from the feature before release; legacy draft preset values normalize to Motion Feedback.
