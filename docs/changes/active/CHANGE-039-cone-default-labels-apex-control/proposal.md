---
type: change
id: CHANGE-039
title: Cone Default Seam, English Mode Labels, and Simple Apex Control
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-31
updated: 2026-08-31
current_specs: [CURRENT-GRADIENT, CURRENT-PRESET, CURRENT-UI-CONTROLS]
related_adrs: []
related_code: [src/types/coneView.ts, src/lib/coneView.ts, src/components/ConeViewPanel.tsx, src/components/CustomSelect.tsx, src/components/ConeApexEditor.tsx, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/types/coneView.test.ts, src/lib/coneView.test.ts, src/components/CustomSelect.test.tsx, src/components/ConeApexEditor.test.tsx]
human_review: completed
---

# CHANGE-039 Cone Default Seam, English Mode Labels, and Simple Apex Control

## 背景・問題

CHANGE-037で追加したConeの3方式は現在Edge Weldが既定値です。また、Seam Modeの候補名は`uiLabels.ts`の自動翻訳により日本語ロケールでは「ミラー反復」「エッジ溶接」「グラデーション再適用」と表示されます。利用者が方式を見分けるための固有名は、言語設定に左右されず英語で表示したいという要望があります。

頂点ハンドルはドラッグ可能な円に加えて、破線の外周リング、水平・垂直の補助線、内側の点を重ねているため、操作点としては情報量が多く見えます。

## 変更理由

最も一般的な反復表現を初期状態にし、Seam Modeの固有名を英語へ統一することで、方式の識別と既存ドキュメント・実装名との対応を明確にします。頂点ハンドルはシアン色を維持した単一の円形操作点へ整理し、位置・ドラッグ・リセット・アクセシビリティは維持します。

## ゴール・成功条件

- 新規状態、および`seamMode`が欠落・不正な状態の既定Seam Modeが`Mirror Repeat`になる。
- 明示的に保存された`weld`／`reapply`／`mirror`はそのまま復元される。
- ConeのSeam Mode候補名とプロパティ名が、言語設定に関係なく`Mirror Repeat`、`Edge Weld`、`Gradient Reapply`、`Seam Mode`として表示される。
- Apex handleが補助リング・十字線・内側マーカーを持たない単一のシアン円になり、既存のドラッグ範囲、リセット、キーボード向け名称を維持する。
- 既存のGradient Reapply計算、Preset保存対象、Preview／Export経路は変更しない。

## 対象

- Coneの既定値とCone設定normalizerの欠落・不正値フォールバック。
- Cone Seam Modeの表示名を英語固定にするための表示経路。
- Cone頂点ハンドルの円形UIの簡素化と必要なUIテスト。
- current spec、利用者向けヘルプ、CHANGE-037との互換性記録の同期。

## 対象外

- Mirror Repeat、Edge Weld、Gradient Reapplyのシーム計算アルゴリズム。
- Presetへ保存するSANDBOX項目の追加・削除。
- Seam Mode以外のアプリ全体のパラメータ名の英語固定。
- Apex X／Apex Yの値域、座標計算、Coneメッシュ形状、ドラッグ操作の仕様変更。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [Preset System](../../../specs/current/preset-system)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- なし

## 主なリスク

- `seamMode`がない旧PresetはEdge WeldからMirror Repeatへ変わるため、旧Presetの見た目が変わる可能性があります。明示的な`weld`保存値は維持します。
- 円形ハンドルを小さくしすぎるとポインター操作が難しくなるため、見た目を簡素化しても十分なボタンのヒット領域を残します。
- 表示名の英語固定はCone Seam Modeだけに限定し、既存の全体翻訳規則とは境界を明記します。

## 未決定事項

- なし。上記の対象、対象外、旧Presetフォールバック変更を確認したうえで、人間レビューにより`status: approved`、`human_review: completed`へ進めます。
