---
type: delta
id: CHANGE-039
title: Cone Default Seam, English Mode Labels, and Simple Apex Control
status: approved
---

# Delta

## ADDED Requirements

### UI-022 — Cone Apex circular handle

Coneの頂点操作点は、シアン色の単一の円形ボタンとして表示する。外周の補助リング、水平・垂直の補助線、内側の別マーカーは表示しない。ドラッグ可能な位置、-2..2の正規化範囲、Reset Position、`aria-label`と`title`は維持する。

## MODIFIED Requirements

### GRAD-020 — Cone Texture Flow

Coneの既定Seam ModeをEdge WeldからMirror Repeatへ変更する。Edge WeldとGradient Reapplyは選択可能な方式として残し、Flow Cycles、Seam Blend、Preview／Exportの位相契約は変更しない。

### PRESET-013 — Cone設定の永続化

保存された`mirror`、`weld`、`reapply`はそれぞれの方式として復元する。`seamMode`が欠落、未知、非有限、旧削除値の場合のフォールバックをEdge WeldからMirror Repeatへ変更する。保存形式のキーは変更しない。

### UI-019 — SANDBOX Edit LayerとCone設定

ConeのSeam Modeプロパティ名と候補名は言語設定に関係なく英語で表示する。表示名は`Seam Mode`、`Mirror Repeat`、`Edge Weld`、`Gradient Reapply`とする。説明文、Apex hint、その他のアプリ全体のパラメータ翻訳は変更しない。頂点ハンドルの外観はUI-022に従う。

## REMOVED Requirements

なし。
