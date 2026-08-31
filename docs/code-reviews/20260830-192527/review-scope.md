# CHANGE-037 review scope

Review only the following files and the CHANGE-037 hunks in the shared working tree.

## Source and tests

- src/components/ConeViewPanel.tsx
- src/components/PresetPanel.tsx
- src/i18n/messages.ts
- src/i18n/uiLabels.ts
- src/lib/coneSeam.ts
- src/lib/coneSeam.test.ts
- src/lib/coneView.test.ts
- src/lib/coneViewRenderer.ts
- src/lib/presetModel.diffuse.test.ts
- src/lib/presetModel.ts
- src/types/coneView.test.ts
- src/types/coneView.ts

## User-facing documentation and current specifications

- src/docs/help.en.md
- src/docs/help.md
- docs/specs/current/effect-stack.md
- docs/specs/current/gradient-system.md
- docs/specs/current/preset-system.md
- docs/specs/current/ui-controls.md
- docs/specs/current/video-export.md
- docs/changes/active/index.md (only the CHANGE-037 entry)
- docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/proposal.md
- docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/delta.md
- docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/design.md
- docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/tasks.md
- docs/changes/active/CHANGE-037-sandbox-preset-cone-seam-reapply/validation.md

Use `git diff -U10 HEAD -- <tracked-path>` for tracked paths and read the two untracked source files and five CHANGE-037 files directly. Do not use the aggregate `git diff` file list because it includes unrelated user WIP.

## Explicit exclusions

Do not review or modify the separate After Effects WIP: docs/adr/index.md, docs/adr/0018-tauri-after-effects-connector.md, docs/specs/current/index.md, docs/specs/current/after-effects-integration.md, docs/specs/index.md, docs/changes/active/CHANGE-038-after-effects-native-integration/, and docs/plans/2026-08-30-1836-feat-after-effects-native-integration-plan.md.
