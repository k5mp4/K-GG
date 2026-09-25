---
type: change-tasks
id: CHANGE-046
status: draft
---

- [x] Inspect existing SANDBOX, Effect Stack, store, preset, render-plan, shader, and video code paths.
- [x] Add Video Motion document state, commands, defaults, normalization, and preset compatibility.
- [x] Add browser video input, play/stop controls, and shared low-resolution motion source.
- [x] Add the lazy Motion Feedback pass with bounded history and Gradient Ramp color projection.
- [x] Correct frame-difference confidence and flat-region tie handling; add field diagnostics and a visual vector preview.
- [x] Add focused normalization and shader-source tests.
- [x] Add estimator regression tests for static frames and clean translations.
- [x] Map normalized timeline time to video time for preview and export; reset feedback on discontinuities.
- [x] Reduce Video Motion to Motion Feedback and normalize draft legacy mode values.
- [x] Add `videoMotion` to the canonical Effect Stack and keep its property panel/runtime mounted across layer selection.
- [x] Route the V2 render pass through the stack position and export program plan.
- [ ] Run browser/GPU manual validation with representative MP4 files.
- [ ] Decide whether a future export contract should accept an explicit codec-vector motion-source session.
