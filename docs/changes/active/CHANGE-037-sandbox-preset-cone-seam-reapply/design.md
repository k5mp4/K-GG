---
type: design
id: CHANGE-037
title: SANDBOX Preset Coverage and Cone Color Reapply Seams
status: approved
---

# Design

## 採用する実装方針

Preset保存時にUI側で個別列挙しているSANDBOX stateを共通のスナップショット構築経路へ揃え、Cloth設定の取りこぼしをなくす。`makePreset` と既存の読込normalizerを保存・読込の境界として維持し、表示面の一時stateは追加しない。

Coneの新方式は `seamMode: 'reapply'` として既存の `mirror`／`weld` と同列に追加する。既定値は変更せず、旧値・未知値はEdge Weldへ戻す。

## 色再適用アルゴリズム

処理済みCanvasは、その時刻に評価されたGradientとEffect Stackの色場を含む唯一の入力テクスチャとして扱う。新方式は別のアニメーション状態や外部画像を持たず、現在の入力CanvasからU／V各軸の端色を参照する。

各軸について、同じ軸位置の左端／右端（または上端／下端）のRGBを読み、次の目標色を作る。

```text
target = 0.5 * (edgeA.rgb + edgeB.rgb)
correction = target - sideEdge.rgb
result.rgb = clamp(center.rgb + correction * raisedCosineWeight, 0, 1)
result.a = center.a
```

`raisedCosineWeight` は継ぎ目上で1、Blend Widthの内側境界で0になる。`correction`を単純なRGBA `mix` とせず、中心サンプルへRGB差分として適用することで、継ぎ目近傍の細部を残しながら端色だけを目標色へ寄せる。alphaは補正前サンプルをそのまま返すため、透明度を継ぎ目の合成量として利用しない。両軸が同時に継ぎ目へ入る四隅では、水平・垂直の補正後の色を4端色の平均へ`seamX * seamY`の重みで寄せ、両軸の重みが1のとき必ず4端色の平均へ収束させる。

GPUシェーダーとCPU基準テストは同じ端色参照、重み、clamp、alpha保持の式を共有できる純粋な補助関数を持つ。既存方式のシェーダー分岐と出力式は変更しない。

## データモデル

`ConeSeamMode` に `reapply` を追加する。`ConeViewConfig.seamMode` とPresetのJSONキーは既存形式のまま拡張し、保存形式のversionは上げない。`normalizeConeViewConfig` は `mirror`、`weld`、`reapply` だけを受け付け、欠落・未知・非有限値は `weld` を返す。

## 状態管理

新方式は既存のCone設定Store setter、Preset snapshot、Preview／ExportのRendererへ同じ `ConeViewConfig` として渡す。Cone設定の変更は既存どおり最後に完了した処理済みCanvasへ即時再マッピングする。

## UI構成

既存のCone Seam Mode CustomSelectへ `Gradient Reapply` を追加する。ヘルプと説明では、既存方式との比較、RGB色差の再適用、alphaを継ぎ目補正に使わないことを短く示す。既存の方式名・既定値・Blend Width操作は変えない。

## 描画・外部プロセス・Tauri側の変更

ConeのPreviewとExportは同じ `ConeViewRenderer` の新分岐を使う。処理済みCanvasのテクスチャを引き続き使用し、Rust／Tauri、FFmpeg、外部画像処理依存は変更しない。

## 変更対象の主要ファイル

コード:

- `src/types/coneView.ts`
- `src/lib/coneView.ts`
- `src/lib/coneViewRenderer.ts`
- `src/components/ConeViewPanel.tsx`
- `src/components/PresetPanel.tsx`
- `src/lib/presetModel.ts`
- `src/i18n/messages.ts`
- `src/i18n/uiLabels.ts`
- `src/docs/help.md`
- `src/docs/help.en.md`

テスト:

- `src/types/coneView.test.ts`
- `src/lib/coneView.test.ts`
- `src/lib/presetModel.diffuse.test.ts` または保存スナップショットの専用テスト
- `src/lib/presetThumbnail.test.ts`

## 代替案とトレードオフ

- 現行Edge Weldを置き換える案は、既存Presetの描画結果と利用者の比較可能性を壊すため採用しない。
- ConeへGradientConfigを別テクスチャとして渡して再評価する案は、アニメーション済みGradient、Image Gradient、Effect Stack結果との同期経路を二重化するため採用しない。処理済みCanvasのRGB色場を基準にすることで、Preview／Exportの入力を一つに保つ。
- 単純なRGBA crossfadeを新方式にする案は、alphaが色補正へ混ざる現状の懸念を解消できないため採用しない。

## 移行方法

旧Presetに `seamMode` がない場合は既定のEdge Weldを使用する。`reapply` は新しい値としてそのまま保存・復元し、旧アプリでは未知値としてEdge Weld相当へ正規化される。既存の保存形式version、外部入力除外、Thumbnailの2D契約は変更しない。

## ロールバック方法

新しいUI選択肢と `reapply` 分岐を削除しても、旧Presetの `seamMode` は既存normalizerによりEdge Weldへ戻る。既存の `mirror`／`weld`、Presetの他SANDBOX設定、表示面の一時stateは変更しない。
