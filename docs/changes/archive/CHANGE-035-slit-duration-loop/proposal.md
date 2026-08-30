---
type: change
id: CHANGE-035
title: Slit Motionのduration境界ループ
status: archived
change_kind: B
owners: [maintainer]
created: 2026-08-30
updated: 2026-08-30
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/lib/slitAnimation.ts, src/lib/webgl.ts]
related_tests: [src/lib/slitAnimation.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/effectShaderParity.test.ts]
human_review: completed
---

# CHANGE-035 Slit Motionのduration境界ループ

## 背景・問題

現行のSlit Motionは、秒ベースのアニメーション時計へ`offsetSpeed`を乗算して位相を求めている。既定値の`duration=5s`、`speed=1`、`offsetSpeed=0.3`では、再生開始時の位相が0、5秒時点の位相が0.5になるため、durationのラップで再び0秒へ戻るとスリット位置が不連続になる。Legacy描画経路とUnified Effect Stack V2描画経路の両方が同じ計算を持つため、両経路で発生しうる。

## 変更理由

アニメーションのduration境界でSlitの位相を周期的に閉じ、Preview・Thumbnail・静止画・連番・動画Exportの再生がシームレスにループするようにするためである。既存の秒ベース`slitAnimationTime`と`offsetSpeed`のUI・保存形式は維持する。

## ゴール・成功条件

- durationの開始と終了で、Slit shaderへ渡す周期位相が一致する。
- 既定値を含む任意のduration／animation speedで、Slitのサイクル数をduration内の整数へ量子化する。
- LegacyとUnified Effect Stack V2が同じ純粋な位相計算を使用する。
- Slit Motionが無効、`animMode=off`、または`offsetSpeed=0`の場合は既存どおり静止する。

## 受け入れ条件

- AC-001: 既定の`duration=5s`、`speed=1`、`offsetSpeed=0.3`で、0秒と5秒のSlit shader位相が一致する。
- AC-002: duration内のサイクル数は`abs(offsetSpeed) * loopPeriod`に最も近い1以上の整数とし、正負のOffset Speedの進行方向を維持する。
- AC-003: Legacy SlitとV2 Stack Slitが共通の位相計算を使い、Slitの秒ベース評価値、Preview／Exportの共通時計、既存の無効時挙動を変更しない。
- AC-004: 回帰テスト、DocsDD検査、Lint、Buildが成功し、既存のWebGL関連変更を上書きしない。

## 対象

- Slit Motionのduration基準の周期位相計算。
- LegacyおよびUnified Effect Stack V2のWebGL uniformへの位相設定。
- 位相計算の単体テストと、既存のscene evaluation／shader parityテストの回帰強化。
- `CURRENT-EFFECT-STACK`のdurationループ仕様の明確化。

## 対象外

- SlitのUI、保存形式、`offsetSpeed`の既定値、`animMode`の仕様変更。
- `slitAnimationTime`の秒単位やPreview／Exportのアニメーション時計の変更。
- 位相モーション、`phaseSpeed`、Timeline Loop、他の効果のループ計算の変更。
- GPU描画方式、shaderのスリット形状、既存のEffect Stack順序の変更。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)

## 実装上の判断

Slit shaderの`fract`／周期関数は整数周期の位相差を同一結果として扱うため、duration内のサイクル数を最近傍の整数へ量子化する。これにより、任意の`offsetSpeed`を完全に維持する代わりに、duration境界の連続性を優先する。既存のCloth duration loopと同じ考え方を共通の純粋関数へ切り出す。
