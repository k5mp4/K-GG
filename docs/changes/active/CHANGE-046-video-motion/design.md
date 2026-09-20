---
type: change-design
id: CHANGE-046
status: draft
---

# Design

`VideoMotionSource` owns a 64×36 sampling canvas, luma buffers, and an RGBA8 field. Each decoded frame is reduced to luma; a 5×5 offset neighborhood is searched with a small patch SAD. Exact matches are treated as high confidence, flat-region ties prefer zero displacement, and the selected direction is damped/smoothed into RG, with magnitude in B and normalized raw frame change in A. The public source contract is only the field, so a codec-vector or optical-flow provider can replace the fallback later.

The document model stores `VideoMotionConfig` and normalizes it at every command/preset boundary. `VideoMotionPanel` is mounted by the Postprocess property module even when another Effect Stack layer is selected, so selecting Noise or Glass does not tear down the muted, visually hidden HTML video runtime. The panel dispatches a frame event and exposes source/shader status, field statistics, and a color/arrow field preview for diagnosis.

The renderer lazily compiles `videoMotion`, uploads the field and active Gradient Ramp to the dedicated Motion Feedback pass, and applies it at the Video Motion layer's position in the V2 Effect Stack. The pass always writes to the ping-pong target so following layers receive its output; Feedback is copied from that layer output after each frame. History contribution is capped at 82%, guaranteeing at least 18% of the newly evaluated upstream frame before the outer effect blend, so animated Noise and other upstream layers remain visible. The composed RGB is projected to the closest of 32 samples from the active Gradient Ramp before storage, preventing repeated temporal averaging from drifting into desaturated intermediate colors. `VideoMotionRuntime` maps normalized timeline time to `video.duration`; the shared timeline clock is the authoritative per-frame preview time, preview seeks are handled asynchronously, and export awaits the same target decoded frame before rendering. Feedback is reset on a timeline jump, source replacement, or export session boundary. Missing input or an unavailable lazy program leaves the existing renderer path available.
