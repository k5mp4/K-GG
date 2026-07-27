---
type: current
id: CURRENT-GRADIENT
title: Gradient System
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-07-27
requirement_ids: [GRAD-001, GRAD-002, GRAD-003, GRAD-004, GRAD-005, GRAD-006, GRAD-007, GRAD-008]
related_adrs: [ADR-0001, ADR-0003, ADR-0010, ADR-0013]
related_changes: [CHANGE-001]
related_code: [src/types/gradient.ts, src/types/imageGradient.ts, src/store/gradientStore.ts, src/lib/gradientRampUtils.ts, src/lib/imageGradient.ts, src/lib/meshGradientField.ts, src/lib/sceneEvaluation.ts, src/lib/webgl.ts, src/lib/presetModel.ts]
related_tests: [src/types/gradient.test.ts, src/lib/imageGradient.test.ts, src/lib/imageGradientProtected.test.ts, src/lib/meshGradient.test.ts, src/lib/proportionalRampEdit.test.ts, src/lib/sceneEvaluation.glass.test.ts]
---

# Gradient System

## 目的

Gradient Systemは、色と透明度のRamp、空間的な配置、画像由来の入力、Mesh Gradation、アニメーション可能な勾配状態を一つの編集対象として扱います。ここでいう「グラデーション」は、ランプだけでなく、ランプへ渡す座標・入力値も含みます。

## 現在の要件

### GRAD-001 対応するグラデーションとRamp

現在は `linear`、`radial`、`fourcolor`、`diamond`、`angle`、`bezier`、`mesh` の7種類を選択できます。各グラデーションは色ストップを持ち、必要に応じて透明度ストップを持ちます。色の補間方式、色空間、変数、繰り返し、ミラーはRampの設定として保存されます。

色ストップの位置は0〜1の範囲、色はHex値として扱います。編集後や外部データ読込後も、描画へ渡す前に安全な値へ正規化します。

### GRAD-002 アンカーとBezier

通常のグラデーションはUV空間のアンカーを使い、グラデーションの種類に応じて必要なアンカーを解釈します。Bezierは2つの制御点を持ち、アンカーと併せて曲線軸を定義します。利用者が選択したグラデーションの変更は、種類に対応する既定アンカーを適用します。

### GRAD-003 Image Gradient Source

Image Gradient Sourceを有効にすると、画像の `luminance`、`red`、`green`、`blue` のいずれかをRamp入力として使えます。画像チャンネル値とアンカー配色値の寄与は、0〜1のAnchor Influenceで混合します。元画像の読込状態や画像データ自体は設定スナップショットへ含めず、再起動後・別環境では再読込が必要です。

画像が利用できない場合は、保存された設定を破棄せず、通常のグラデーションへ安全にフォールバックします。画像のアルファとCover配置は、画像グラデーションの外部契約です。

### GRAD-004 Mesh Gradation

Mesh Gradationは単一の2×2 Coons Patchです。4つのコーナー、4辺それぞれの2つの制御点、4つの色位置、bilinear補間を `gradient.mesh` に保持します。MVPでは複数セルの編集や複数パッチは提供しません。

Meshのコーナーはキーフレーム対象ですが、辺の制御点と色位置は現在静的です。座標は有限値へ正規化され、描画の数値計算を不安定にする極端な値は制限されます。

### GRAD-005 アニメーションとキーフレーム

アニメーション状態は、再生の有効化、ループ、速度、強度、継続時間、FPS、方向、イージング、機能別の影響範囲を持ちます。Rampの色・位置・透明度、通常アンカー、Meshコーナーは安定したプロパティIDを持つキーフレームで編集できます。

勾配固有の可変部分と、Noise・Diffuse・Slit・Stretch・Postprocessなど他領域の自動/キー制御は別のトラックとして扱います。機能が無効な場合、その機能に属するトラックは描画へ反映しません。

### GRAD-006 保存・読込と後方互換性

Gradientの状態はPresetの状態スナップショットに含まれます。古いデータで欠落している任意フィールドは既定値で補完し、未知・非有限・範囲外の値は正規化します。Meshがない旧Presetは従来のGradientとして読み込み、Meshの描画は有効にしません。

既存の `gradientType` 識別値と、Rampの旧値を読み込める互換性は維持します。保存形式を変更する場合は、Gradient Systemの変更仕様と必要なADRを先に作成します。

### GRAD-007 描画経路の一貫性

通常プレビュー、静止画、連番、動画のシーン評価は共通の時間評価と描画経路を使用します。Presetサムネイルも保存時の正規化状態から1フレームを描画します。WebGLを利用できない場合の軽量プレビューは、互換性を保つためのフォールバックであり、同一の描画実装そのものではありません。

Image Gradient Sourceでは、画像本体の形状・アルファを固定し、色場だけに対象の変形を適用する保護経路を使用します。対象外となる形状変形系レイヤーの扱いはEffect Stackの現行仕様とADR-0010に従います。

### GRAD-008 編集時の境界条件

Rampの位置・透明度・アンカー・Meshの座標は有限値と範囲を確認してから保存・描画します。ストップの編集はRampの範囲外へ移動させず、既存のストップIDを保つことでキーフレームとの対応を維持します。手動入力や破損したPresetが正規化できない場合は、アプリ全体を壊さず対象状態を既定値へ戻します。

## 他領域との関係

- Preset Systemは、Gradientの設定、キーフレーム、関連するエフェクト設定を状態スナップショットとして保存します。
- Effect Stackは、Gradientを生成した後の色場・画像場を処理します。Image Gradient Sourceの保護動作は両仕様にまたがります。
- Animationは、Gradientの一部プロパティと各エフェクトの時間評価を共通の時刻で評価します。

## 変更履歴

この現行仕様の初期整理に参照したLegacy Change Specificationは次のとおりです。

- [SPEC-009 Image Gradient Source](../SPEC-009-image-gradient-source)
- [SPEC-019 Gradient Rampストップ編集](../SPEC-019-proportional-gradient-stop-editing)
- [SPEC-030 Image Gradient保護描画](../SPEC-030-image-gradient-protected-rendering)
- [SPEC-040 Mesh Gradation](../SPEC-040-mesh-gradation)
- [SPEC-031〜033 アニメーション関連](../index#legacy-change-specifications)

Legacy SPECは変更理由と当時の受け入れ条件の履歴であり、現在の要件を読むための必須資料ではありません。SPEC-008は未承認のため、この現行仕様の根拠に含めていません。

## 未確認・今後の現行仕様化

本書はコードと自動テストで確認できる現在の契約を中心に整理しています。実機GPUごとの描画品質、全GradientTypeのPreview/Exportの画素一致、巨大画像の性能保証はこの移行では再計測していません。変更時は手動確認結果を変更仕様のvalidationへ記録してください。
