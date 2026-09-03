---
type: change
id: CHANGE-037
title: SANDBOX Preset Coverage and Cone Color Reapply Seams
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-30
updated: 2026-09-03
current_specs: [CURRENT-GRADIENT, CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-VIDEO-EXPORT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0007, ADR-0008]
related_code: [src/components/PresetPanel.tsx, src/components/ConeViewPanel.tsx, src/components/ConeCanvas.tsx, src/lib/coneView.ts, src/lib/coneViewRenderer.ts, src/lib/coneSeam.ts, src/lib/presetModel.ts, src/types/coneView.ts, src/i18n/messages.ts, src/i18n/uiLabels.ts, src/docs/help.md, src/docs/help.en.md]
related_tests: [src/types/coneView.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/presetThumbnail.test.ts]
human_review: completed
outcome: follow-up
migration: historical
follow_up: "issue-needed: Cone 3x3反復、Preview/Export、実GPUのRelease Gateを確認する"
---

# CHANGE-037 SANDBOX Preset Coverage and Cone Color Reapply Seams

## 背景・問題

SANDBOXの各モジュールは同じ編集対象に属しているが、現在のPreset保存ボタンが作るスナップショットにはCloth設定が含まれていない。Cone設定は保存経路に存在するものの、SANDBOX全体の設定が保存・復元されることを一つの受入条件として確認できるテストが不足している。

また、Coneの既存Seam処理は継ぎ目付近のRGBAサンプルを直接補正するため、入力Canvasの透明度まで継ぎ目の合成結果へ影響する。色の連続性を得るために不透明度を動かしているように見え、グラデーションの見た目が薄くなることがある。

## 変更理由

SANDBOXの設定をPresetへ確実に持ち運べるようにし、Coneでは既存のSeam方式を互換性のため残したまま、色場を中心に継ぎ目を整える選択肢を追加する。新方式を選択した利用者が、透明度の変化ではなく現在の処理済みCanvasのRGB色差を補正した結果を比較できるようにする。

## ゴール・成功条件

- Presetの保存・読込で、Cloth、Cone、Normal、Prism、Particles、Flow Gradient、Seamlessの永続化対象設定が欠落しない。
- Canvas／Cloth／Coneの表示面、SANDBOXの選択中Edit Layerなど一時的な表示状態は従来どおり保存しない。
- ConeのSeam Modeに `Gradient Reapply` を追加し、既存の `Mirror Repeat` と `Edge Weld` を削除・変更せずに比較できる。
- `Gradient Reapply` は継ぎ目の端色からRGB色差を求め、raised-cosine重みで色だけを再適用する。alphaは補正前サンプルを保持し、alphaを合成重みとして使わない。
- Preview、静止画、連番、動画で同じCone設定と同じシェーダー分岐を使う。

## 対象

- SANDBOX設定をPreset保存スナップショットへ集約し、旧Presetの欠落値を既定値へ正規化する。
- Coneの新しい色再適用Seam Mode、その正規化、UI表示、Preset保存、Preview／Exportへの伝播。
- 新方式のRGB連続性、alpha保持、既存方式の分岐維持を検証するテスト。
- 日本語・英語の方式名、説明、利用者向けヘルプの同期。

## 対象外

- 既存の `Mirror Repeat`／`Edge Weld` の削除、名称変更、既定値変更。
- `renderViewMode`、選択中Edit Layer、Three.js Renderer、Cone表示面そのもののPreset保存。
- Cone以外のシーム処理や、画像内容を推定して欠損を生成するテクスチャ合成。
- OpenCV、GIMP、その他の外部画像処理ランタイムや新しい依存関係。
- Coneの全エフェクトを別途再評価する新しい描画段階。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [Effect Stack](../../../specs/current/effect-stack)
- [Preset System](../../../specs/current/preset-system)
- [動画・連番フレーム出力](../../../specs/current/video-export)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0007 Preset Library Storage Format](../../../adr/0007-preset-library-storage-format)
- [ADR-0008 Preset Rendered Thumbnails](../../../adr/0008-preset-rendered-thumbnails)

保存形式のバージョンアップは行わず、既存の任意フィールドと正規化規則を拡張する。新しい長期アーキテクチャ判断は追加しない。

## 主なリスク

- 新方式がRGBを補正しすぎると、継ぎ目は連続でも細部が平坦に見える可能性がある。
- 端色の参照位置やsRGB空間での補正がGPUとCPU基準実装でずれると、PreviewとExportで見た目が一致しない可能性がある。
- 旧Presetの未知の `seamMode` を誤って新方式へ変換すると、既存画像の見た目が変わる。

## 承認済みの実装判断

- 表示ラベルは英語を `Gradient Reapply`、日本語を `グラデーション再適用` とする。
- 端色補正は既存の `CanvasTexture` と同じsRGBの正規化チャンネル空間で行う。CPU基準関数とGPUシェーダーは同じRGB加算・クランプ規則を使う。
- 上記の判断と本changeの範囲は、2026-08-30に利用者が承認した。

## Finalization

- Finalized: 2026-09-03
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Cone 3x3反復、Preview/Export、実GPUのRelease Gateを確認する
