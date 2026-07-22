---
id: SPEC-028
title: 意味的角度入力のInputAngle統一
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-21
depends_on: [SPEC-021, SPEC-022]
related_adrs: [ADR-0006, ADR-0009]
related_code: [src/components/SliderField.tsx, src/lib/tweeqAngle.ts, src/lib/parameterLimits.ts, src/components/GradientRamp.tsx, src/components/NoiseDistortionPanel.tsx, src/components/SlitScanPanel.tsx, src/components/NormalMapPanel.tsx, src/components/RadonPanel.tsx, src/components/IridescencePanel.tsx, src/components/PostprocessPanel.tsx, src/components/TimelineBar.tsx]
related_tests: [src/lib/tweeqAngle.test.ts, src/lib/parameterLimits.test.ts, 'manual: semantic angle controls']
human_review: completed
---

# SPEC-028: 意味的角度入力のInputAngle統一

## ゴール・成功条件

角度、回転、方向を意味する既存の数値入力をTweeq`InputAngle`へ統一し、保存形式と描画計算を変更せずに、視覚的な回転操作と直接入力を提供する。

## 対象

Gradient Angle、SlitのAngle/Offset Angle/モード別方向、NoiseのDomain Warp回転・Drift・AE Sub Rotation、Normal Map、Radon、Iridescence、PostprocessのKaleidoscope/Voronoi/Glass/Particles、Animation Directionを対象とする。強度を意味する`seamlessTwist`は対象外とする。

## 方針

`SliderField`へ角度単位指定を追加する。表示は度数、既存の度数保存値はそのまま、ラジアン保存値は表示時のみ度数へ変換する。角度は`[0,360)`へ正規化し、キーフレームは従来のモデル単位で更新する。

## 受け入れ条件

- AC-001: 対象項目がすべてInputAngleで表示される。
- AC-002: ダイヤル、直接入力、キーフレーム、プリセット読込が既存の状態・描画単位と互換する。
- AC-003: Domain Warpのラジアン保存値が度数UIと相互変換される。
- AC-004: 負値・多回転値・非有限値は安全に正規化される。

## 移行・互換性

プリセット、キーフレーム、GLSL uniformの保存単位は変更しない。

## 未決定事項

なし。
