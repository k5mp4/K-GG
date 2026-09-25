---
type: change
id: CHANGE-046
title: Effect Stack Video Motion
status: archived
change_kind: F
owners: [maintainer]
created: 2026-09-19
updated: 2026-09-25
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET]
related_adrs: []
related_code: [src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/components/VideoMotionPanel.tsx, src/types/videoMotion.ts, src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/sceneRenderPlan.ts, src/lib/videoMotionSource.ts, src/lib/videoMotionRuntime.ts, src/lib/webgl.ts, src/shaders/video-motion.frag.glsl, src/store/documentSlice.ts, src/store/documentActions.ts, src/lib/presetModel.ts]
related_tests: [src/types/videoMotion.test.ts, src/lib/videoMotionSource.test.ts, src/lib/effectPipeline.test.ts, src/lib/webglExportPrograms.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/lib/webglShaderSources.test.ts, src/components/PostprocessPanel.test.tsx]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: 実MP4でのmotion再生・Export parityと代表動画でのGPU品質確認"
---

# CHANGE-046 Effect Stack Video Motion

## Request source

Direct request. Add a K-GG Effect Stack layer that derives a reusable motion field from a browser video input and applies palette-preserving Motion Feedback.

## Scope

- Add the Video Motion Effect Stack layer and its Motion Feedback property module.
- Add a replaceable motion-source boundary backed by low-resolution decoded-frame patch matching.
- Add one lazy WebGL feedback pass with bounded history and Gradient Ramp color projection.
- Make the loaded video's decoded frame clock follow the normalized timeline for preview and frame export.
- Persist normalized settings only; keep the external video and runtime field out of Presets.

## Out of scope

- Codec motion-vector extraction, full-resolution optical flow, audio analysis, and video-file persistence.
- Codec motion-vector extraction and full-resolution optical flow remain out of scope.

## Finalization

- Finalized: 2026-09-25
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: 実MP4でのmotion再生・Export parityと代表動画でのGPU品質確認
