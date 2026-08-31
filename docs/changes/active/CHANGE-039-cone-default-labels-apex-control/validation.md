---
type: validation
id: CHANGE-039
title: Cone Default Seam, English Mode Labels, and Simple Apex Control
status: approved
---

# Validation

実装と自動検証を完了した。ブラウザでの実ドラッグ・focus操作とWebGL上の最終的な見た目は、利用可能なブラウザ接続が確立できないため未確認として残す。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 既定Seam Mode | unit / preset compatibility | `src/types/coneView.test.ts`、`src/lib/coneView.test.ts` | pass（新規状態・欠落／不正値はMirror、明示値は維持） |
| AC-002 英語表示 | component / manual | `src/components/CustomSelect.test.tsx`、Seam Mode表示経路 | automated pass（日本語locale相当のSSRでlabel／候補／titleを英語固定、ブラウザ目視は未確認） |
| AC-003 円形Apex handle | component / manual | `src/components/ConeApexEditor.test.tsx`、ドラッグ・Reset・focus確認 | automated pass（単一円形button・補助要素なし・既存アクセシビリティ属性を確認、実操作は未確認） |
| AC-004 既存方式と描画経路 | unit / source review | 既存Cone／Gradient Reapply／Presetテスト | pass（7ファイル33テスト） |
| AC-005 文書同期 | command | `npm run docs:check`、`npm run docs:build` | pass |

## Commands

- `npm test -- --run src/lib/coneSeam.test.ts src/types/coneView.test.ts src/lib/coneView.test.ts src/lib/coneViewRenderer.test.ts src/lib/presetModel.diffuse.test.ts src/components/CustomSelect.test.tsx src/components/ConeApexEditor.test.tsx` — pass（7 files / 33 tests）
- `npm test -- --run` — pass（76 files / 438 tests）
- `npm run lint` — pass（0 errors / 21 warnings; 既存のHooks、`any`、Fast Refresh等の警告）
- `npm run build` — pass（Tauri import分割とchunk sizeの既存警告あり）
- `npm run docs:check` — pass（41 legacy specs / 8 current specs / 29 changes / 18 ADRs）
- `npm run docs:build` — pass（25.69s）
- `node C:\Users\fjkg\.agents\skills\impeccable\scripts\detect.mjs --json src/components/ConeApexEditor.tsx src/components/ConeViewPanel.tsx src/components/CustomSelect.tsx` — pass（`[]`）
- `git diff --check` — pass

## 未確認事項

- Browser接続を確立できず、実画面での日本語locale表示、Apexドラッグ、Reset、keyboard focus、WebGLのシーム見た目は未確認。
- 未確認項目が残るため、CHANGE-039はactiveに保持し、Archiveへの移動は行っていない。
