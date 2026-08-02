# Delta

## ADDED Requirements

### PRESET-010 Glassレイヤーの統合正規化

旧Presetに保存された`glass`と`glassV2`は、読み込み時に新しい単一の`glass`へ正規化される。統合後のレイヤーは最初のGlass系レイヤーの位置を維持し、複数レイヤーの`enabled`を論理和で引き継ぐ。

## MODIFIED Requirements

### EFFECT-001 主スタックの効果

主スタックのGlass系効果を`Glass`一種類へ統合する。`Glass`はGLASS V2の実装を使用し、`Glass V2`という別レイヤーは新規状態・UI・正規化後の状態に存在しない。

### EFFECT-002 有効化と順序

新規V2状態の既定順は、現行の`Glass`と`Glass V2`を一つの`Glass`へ置き換えた順序とする。旧状態の`glass`／`glassV2`は一つへ統合し、統合後の有効状態は入力レイヤーの論理和とする。

### EFFECT-004 DiffuseとImage Gradient Source

Image Gradient Sourceの保護対象に含まれるGlassは、GLASS V2として一度だけ扱う。旧GLASSの別レイヤーを保護対象・描画対象として追加しない。

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset thumbnail、静止画・連番・動画は、統合後の一つのGLASS V2由来`Glass`レイヤーと同じ正規化済みEffect Pipelineを共有する。

### EFFECT-009 GLASS V2の色調整

GLASS V2の色調整を、UI上の`Glass`へ表示・適用する。`Chromatic Aberration`の上限を`40px`から`80px`へ広げ、保存値の正規化、UI、shader clamp、tile paddingへ一貫して反映する。`Chromatic Saturation`の上限は`200%`のまま維持する。

### UI-007 Postprocess Glassの入力

PostprocessのプロパティモジュールにはGlassを一つだけ表示し、表示上の`Glass`はGLASS V2を使用する。旧`Glass`の選択肢と`Glass V2`という別表示は削除する。Transmission TintとHighlight TintはTweeqの`InputColor`で編集し、変更時は既存の大文字HEX値をPostprocess設定へ反映する。

Transmission TintとHighlight TintのInputColorは同じ表示幅を使用し、ラベル長や値により横幅が変わらない。

### PRESET-011 Postprocess Glassの互換正規化

旧Postprocess設定の`effectMode: glass`およびstackの`kind: glass`は読み込み時に`glassV2`へ写像する。`glass`と`glassV2`が重複する場合は、最初の位置を維持して有効状態を論理和で統合する。正規化後のPostprocess設定には旧`glass`を残さない。

## REMOVED Requirements

### EFFECT-001内の旧GLASS別レイヤー

旧GLASSを独立した主スタックレイヤーとして扱う要件を廃止する。理由は描画不安定性と、GLASS V2への実装統一である。既存Presetの旧識別値は、互換正規化で新しい`glass`へ写像する。

### Postprocessプロパティモジュール内の旧Glass選択肢

旧`Glass`選択肢と`Glass V2`の二重表示を廃止し、GLASS V2を表示上の一つの`Glass`として扱う。
