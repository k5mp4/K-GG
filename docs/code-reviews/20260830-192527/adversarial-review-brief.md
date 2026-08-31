Intent: Include all SANDBOX settings in preset save snapshots, especially Cloth and Cone, and add a selectable Cone Gradient Reapply seam algorithm without removing the existing modes. Reapply should correct gradient RGB colors at texture seams, preserve the center alpha, and use the same renderer path for Preview and Export.

Material risk divisions:

1. Preset save/load boundary: the explicit state snapshot in PresetPanel and presetModel must carry Cloth, Cone, and related SANDBOX settings without adding transient display state. Representative paths: src/components/PresetPanel.tsx, src/lib/presetModel.ts, src/lib/presetModel.diffuse.test.ts.
2. Cone mode compatibility: the new reapply value must survive normalization and preset round trips while mirror/weld and legacy fallback behavior remain stable. Representative paths: src/types/coneView.ts, src/lib/coneView.ts, src/components/ConeViewPanel.tsx.
3. Color reapplication math: CPU reference behavior and GLSL must agree for U seams, V seams, corners, blend boundaries, clamping, and center-alpha preservation. Check texture sample count and the interaction of axis and corner corrections. Representative paths: src/lib/coneSeam.ts, src/lib/coneSeam.test.ts, src/lib/coneViewRenderer.ts.
4. Surface parity and contracts: UI labels, help/current specs, tests, and Preview/Export wiring must describe and exercise the same three modes. Representative paths: src/i18n/, src/docs/, docs/specs/current/, docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/.

Cross-division interaction: verify that a saved reapply mode loads into the same renderer branch as an interactively selected mode, and that the new color correction does not change alpha or the existing mode branches.

Excluded files: the separate After Effects WIP under docs/adr, docs/specs/current, docs/changes/active/CHANGE-038-after-effects-native-integration, and docs/plans.
