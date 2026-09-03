---
type: design
id: CHANGE-039
title: Cone Default Seam, English Mode Labels, and Simple Apex Control
status: approved
---

# Design

## 既定値と互換性

`DEFAULT_CONE_SEAM_MODE`を`mirror`へ変更し、Cone normalizerが値を受け取れない場合も同じ既定値を返す。明示的な`weld`や`reapply`は有効値として変換せず、既存Presetの利用者が保存した方式を維持する。保存形式versionは上げない。

## 表示名

Seam Modeの候補は、既存の共通UIラベル翻訳を介さず、ConeのCustomSelectへ英語表示を渡す。必要な表示経路だけにlocalization opt-outを適用し、アプリ全体の日本語パラメータ名は変更しない。ラベル、選択中の値、展開候補、titleが同じ英語名になるようにする。

## Apex handle

`ConeApexEditor`のドラッグ処理と`getConeApexCanvasPoint`は変更せず、補助的な`div`と内側の`span`を削除して、既存buttonを単一の円形マーカーとして使う。シアンの塗り、暗色の境界、視認性を保つ柔らかな影、`touchAction: none`、十分な操作領域を維持する。

## テスト

- Cone type testで既定値、欠落・不正値フォールバック、明示的な3方式の復元を確認する。
- UI testでSeam Modeのlabel／候補／titleの英語固定と、Apex editorが単一円形buttonを提供し補助線を描画しないことを確認する。
- 既存Cone flow／Preset／Gradient Reapply testを再実行する。
