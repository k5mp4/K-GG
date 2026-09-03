---
type: delta
id: CHANGE-037
title: SANDBOX Preset Coverage and Cone Color Reapply Seams
status: approved
---

# Delta

## ADDED Requirements

### PRESET-017 — SANDBOX設定の完全保存

Presetのstateは、既存のCone、Normal、Prism、Particles、Flow Gradient、Seamlessに加えてClothの永続化対象設定を保存・復元する。保存時に一部のSANDBOX設定を省略せず、旧Presetで欠落している任意設定は各モジュールの既定値へ正規化する。Canvas／Cloth／Coneの表示面と選択中Edit Layerは保存しない。

### GRAD-022 — Cone Color Reapply Seam

Coneは既存の `Mirror Repeat`／`Edge Weld` に加えて `Gradient Reapply` を選択できる。新方式は処理済みCanvasの継ぎ目両側のRGB端色から対応する目標色を求め、継ぎ目からの距離に応じたraised-cosine重みでRGBへ色差補正を適用する。alphaは補正前の中心サンプルを保持し、alphaの差を混合重みとして使用しない。U／Vの四隅では両軸の目標色を組み合わせる。

## MODIFIED Requirements

### PRESET-013 — Cone設定の永続化

ConeのPreset保存項目へ `Gradient Reapply` を表すSeam Modeを追加する。既存の `mirror`／`weld`、既定値Edge Weld、未知・非有限・旧削除値をEdge Weldへ戻す後方互換規則は維持する。

### GRAD-020 — Cone Texture Flow

Texture RepeatとFlow Cyclesの反復境界は、3方式から選択した処理で連続化する。新方式でもFlowの移動方向、normalizedTime、Direct Projectionの固定V offset、Preview／Exportの位相契約は変更しない。

### UI-019 — SANDBOX Edit LayerとCone設定

ConeのSeam Mode選択肢へ `Gradient Reapply` を追加し、RGB色場を再適用してalphaを継ぎ目補正へ使わない方式であることを日本語・英語で説明する。既存の2方式、設定範囲、SANDBOXの表示面切替は維持する。

### CLOTH-003 — Preset永続化とエラーフォールバック

SANDBOXのPreset保存操作はClothの全設定をstateへ含め、Clothを含む既存のモジュール設定を一つの保存・復元スナップショットとして扱う。表示面の選択状態は従来どおり保存しない。

## REMOVED Requirements

なし。
