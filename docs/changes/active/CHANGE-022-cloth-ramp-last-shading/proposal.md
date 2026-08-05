---
type: change
id: CHANGE-022
title: Cloth Gradientのランプ適用順序の反転（白黒シェーディング→グラデーション）
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-05
updated: 2026-08-05
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: []
related_code: [src/types/clothGradient.ts, src/lib/clothGradientRenderer.ts, src/components/ClothGradientPanel.tsx, tests/clothGradient.test.ts]
related_tests: [tests/clothGradient.test.ts]
human_review: completed
---

# CHANGE-022 Cloth Gradientのランプ適用順序の反転

## 背景・問題

現行の Cloth Gradient (CHANGE-021) は、フラグメントシェーダーで「グラデーションランプをサンプリングした色 (`rampColor`) にライティングを乗算し、その後にスペキュラー・フレネル色を加算」する順序で描画します。このため、ライティングやハイライトの色が乗ることで、ユーザーが指定したグラデーションの絵が暗く濁ったり、白や指定色のハイライトに覆われたりします。

## 変更理由

ユーザーが指定したグラデーションの絵が常に見えるようにするため、計算順序を逆転します。ライティング・スペキュラー・フレネルは「白黒のシェーディング」を生成するためだけに使い、その白黒輝度をグラデーションランプのインデックスとしてランプから色を決定します。これにより、布の凹凸や光の強弱は白黒の濃淡としてランプへ写像され、色相は常にユーザー指定のグラデーションが保たれます。

## ゴール・成功条件

- ライティング・スペキュラー・フレネルの結果が、グラデーションランプの位置 (0..1) を決める白黒輝度として使われる。
- 画面上のすべてのピクセルが、ユーザー指定のグラデーションランプの色相で描画される。
- ハイライト (スペキュラー・フレネル) も白黒輝度として加算され、グラデーションの明るい側の色で描画される。

## 対象

- `src/types/clothGradient.ts`: Ramp Mapping 重み (Light/Height/Fresnel/Flow Weight) と `rampLow` / `rampHigh` / `shadingMix` を廃止。`rampOffset` は維持。
- `src/lib/clothGradientRenderer.ts`: フラグメントシェーダーの合成順序変更と、不要 uniform の削除。
- `src/components/ClothGradientPanel.tsx`: Ramp Mapping グループの UI 整理。
- `tests/clothGradient.test.ts`: 廃止キーの検証追加。
- DocDD文書一式と active index の更新。

## 対象外

- Cloth Gradient の波・ノイズ・ライティングパラメータ (Amplitude, Frequency, Speed, Light Intensity, Ambient 等) の変更。
- スペキュラー色・フレネル色の**色相**を描画結果に残すこと (白黒輝度係数としてのみ使用)。
- CHANGE-021 の未完了タスク (current spec 統合、Archive) の処理。

## 影響を受ける現行仕様

- [CURRENT-EFFECT-STACK](../../../specs/current/effect-stack)
  - CLOTH-001 (CHANGE-021 delta) のランプ適用順序を MODIFIED する。

## 関連ADR

- なし

## 主なリスク

- **互換性**: 廃止キー (`lightWeight` 等) を含む旧 Preset を読み込むと、`normalizeClothGradientConfig` が未知キーとして無視し、保存時に消える。表示は正常に動作するが、廃止キーの値は保持されない。
- **見た目の変化**: Cloth Gradient の見た目は全体的に変わる (既存 Preset のクロスグラデーションの見た目が変化する)。これは本変更の意図どおり。
- **ロールバック**: フラグメントシェーダーと型の変更のみで、保存形式の変更はないため、コードの巻き戻しで復元可能。

## 未決定事項

なし (ユーザー決定済み: 重み廃止、ハイライトは白黒輝度としてのみ加算、新CHANGE作成)。
