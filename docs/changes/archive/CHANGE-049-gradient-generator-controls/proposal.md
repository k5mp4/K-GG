---
type: change
id: CHANGE-049
title: Color Palette GeneratorをGradient Generatorに整理
status: archived
change_kind: F
owners: [maintainer]
created: 2026-09-21
updated: 2026-09-25
current_specs: [CURRENT-GRADIENT]
related_adrs: []
related_code: [src/components/ColorPaletteGenerator.tsx, src/components/GradientRamp.tsx, src/App.tsx, src/lib/gradientGenerator.ts, src/lib/perceptualGradient.ts, src/i18n/messages.ts]
related_tests: [src/lib/gradientGenerator.test.ts, src/lib/perceptualGradient.test.ts]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: Gradient Generatorのブラウザー表示・stop編集・Apply動作を確認しValidationを記録"
---

# CHANGE-049 Color Palette GeneratorをGradient Generatorに整理

## Request source

Direct request。カラーパレットジェネレーターから配色補助と画像抽出を外し、基準色を活かして直感的に編集できるグラデーション生成画面にする。

## 変更理由

配色補助と画像抽出がGradient Generatorと並んでおり、中心となる編集作業が分かりにくい。GeneratorのFamilyによって可変設定が増えるとApply操作の位置が変わり、基準色の色相・彩度・輝度も十分に生成へ反映されていない。

## ゴール・受け入れ条件

- Color Palette GeneratorにはGradient Generatorだけを表示する。
- Base / Start Colorの次にプレビューと色ストップを表示し、その直後にAlgorithmを置く。Shuffle／Apply操作はAlgorithm直後に固定し、Family固有設定の表示数で移動しない。
- Base / Start Colorの色相を起点にする既存の多色生成ロジックを保ち、Hue Travel入力だけをなくす（元の既定移動量を内部で維持する）。Color Intensity、Brightness、Contrastは既存アルゴリズムの調整として使う。
- Tweeq Color Pickerから色ストップを個別編集でき、Apply前はGradient状態を変更しない。生成設定を変えると手動色編集をリセットする。
- Contrastとstop数を含む既存の生成調整、Family、Shuffleは利用できる。
- Preset形式、Gradient Rampの通常編集、Image Overlay／Maskは変更しない。

## Current Spec

[Gradient System](../../../specs/current/gradient-system)のGRAD-011、GRAD-012、GRAD-014、GRAD-026を同期する。

## 検証

Merge Gateは実行した型チェック、lint、docs checkを記録する。自動テストは今回追加・実行しない。ブラウザーでの表示確認は実施結果をValidationへ記録する。

## Finalization

- Finalized: 2026-09-25
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Gradient Generatorのブラウザー表示・stop編集・Apply動作を確認しValidationを記録
