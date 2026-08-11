---
type: change
id: CHANGE-018
title: SANDBOX描画モジュールの新設
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-03
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0005, ADR-0012]
related_code: [src/App.tsx, src/components/CustomSelect.tsx, src/components/NormalMapPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/components/DistortOverlay.tsx, src/components/SandboxPanel.tsx, src/components/Toggle.tsx, src/store/gradientStore.ts, src/components/PresetPanel.tsx, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/effectPipeline.ts, src/lib/normalMap.ts, src/lib/webgl.ts, src/shaders/normalmap.frag.glsl, src/i18n/messages.ts, src/i18n/uiLabels.ts, src/docs/help.md, src/docs/help.en.md]
related_tests: [src/lib/effectPipeline.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/lib/presetPreview.test.ts, src/lib/presetThumbnail.test.ts, src/lib/webglShaderSources.test.ts, src/lib/webglNormalMapParity.test.ts, 'manual: SANDBOX selector and module controls browser check', 'manual: Legacy/V2 Normal Map parity check']
human_review: completed
---

# CHANGE-018 SANDBOX描画モジュールの新設

## 背景・問題

現在、`Normal` はTOPバーの独立項目、`Prism` と `Particles` はキャンバス上のEffect Stack固定段に配置されています。これらは主スタックの順序を編集する効果とは目的が異なりますが、入口が分散しているため、グラデーションの色や形を直接編集する機能と、自由な描画表現を組み立てる機能の境界が分かりにくくなっています。

## 変更理由

グラデーションへ順番に適用する主スタックと、表面・光線・粒子のような独立した描画モジュールをUI上で分けます。利用者が複数の描画モジュールを一つの場所から試せるようにし、今後のグラフィック表現を追加できる入口を用意します。

仮称は `SANDBOX` とします。名称は「自由に組み合わせて試す描画領域」という役割を短く表せるため採用しますが、最終名称は人間レビューで確定します。

## ゴール・成功条件

- TOPバーに `SANDBOX` の項目を一つ追加する。
- `Normal`、`Prism`、`Particles` の有効化と既存パラメータ編集を、SANDBOXの一つのパネルから行えるようにする。
- Postprocessの`Edit Layer`と同じ選択UIで、SANDBOX内の3モジュールから編集対象を一つ選べるようにする。
- Effect StackにはGradientに直接適用する主スタックの編集だけを残し、Prism／Particlesの固定段トグルを重複表示しない。
- TOPバーの独立`Distort`入口を廃止し、Postprocessの`Distort`を唯一の手描きDistort編集・描画入口として扱う。
- Effect Stack導入前のNormal Mapと同じ入力・向き・パラメータ結果になるよう、V2のNormal描画経路を修正する。
- 既存の描画順、Preset保存形式、Preview／Thumbnail／Exportの結果を、対象機能の統合に必要な互換処理を除いて変更しない。

## 対象

- TOPバーの項目構成、左プロパティパネルの構成、Effect Stackの固定段UI。
- Normal、Prism、Particlesの既存トグル、既存パラメータコントロール、状態表示。
- SANDBOXの編集対象選択状態と、選択したモジュールの詳細表示。
- TOPバーの`Distort`入口の削除と、Postprocess `Distort`への状態・描画経路の統合。
- Legacy V1／Effect Stack V2間でNormal Mapの入力、エンコード、向き、Strength、Blur、Angle、Bevel Size、Invertを一致させる描画修正と回帰検証。
- 既存の`normalMap`、`effectPipeline.prismEnabled`、`effectPipeline.particlesEnabled`、Prism／Particlesパラメータをそのまま利用する状態連携。
- 日本語・英語のSANDBOX表示名、説明、アクセシブルなラベル。
- 主スタック用Postprocess編集UIからPrism／Particlesの重複入口を整理すること。

## 対象外

- Prism、Particlesのシェーダー、描画アルゴリズム、パラメータ範囲、描画順の変更。Normalは旧経路との互換修正に限って描画経路を変更する。
- 新しい描画モジュール、モジュールの並べ替え、モジュール間のブレンド順を変更する機能。
- SANDBOXの選択状態をPreset JSONへ保存すること。
- Distortの新しいアルゴリズム、ブラシ操作、パラメータ範囲の追加。既存の`manualDistort`を含む旧Presetは読み込み互換の対象とする。
- Normal Map以外のSurface、Radon、画像オーバーレイなど、今回明示していない機能のSANDBOXへの追加。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0005 Unified Effect Stack V2](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0012 型付きローカライズとアイコン意味論](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

- 既存のPostprocess編集入口からPrism／Particlesを除く際に、設定編集への導線を失う可能性がある。
- SANDBOXパネルを単一の長いフォームにすると、Normal／Prism／Particlesの境界が見えにくくなる可能性がある。
- 固定段UIを移動するだけでも、Effect Stackの別ウィンドウ表示とモバイル表示に重複や取りこぼしが生じる可能性がある。
- `manualDistort`とPostprocessのDistort設定を統合する際、旧Presetの入力を失うと既存作品の見た目が変わる可能性がある。
- Normalの旧経路とV2経路で、入力テクスチャ、FBOの解像度、RGBA法線エンコードのどれかがずれると、画面上の凹凸方向や色が変わる可能性がある。

## 実装決定

- 今回の表示名は`SANDBOX`とする。将来より説明的な名称へ変更する場合は、別の変更として扱う。
- SANDBOX内部は、Postprocessの`Edit Layer`と同じ`CustomSelect`形式の選択要素で3モジュールを切り替え、選択中モジュールの詳細だけを表示する。
- Normalの既存Betaバッジは維持し、既存機能であることと実験的位置づけを明示する。
- 新規状態ではPostprocessの`Distort`を手描きDistortの正規の編集・描画源とし、`manualDistort`は旧Preset互換の読み込み経路として扱う。
- Normalは旧Legacy経路との代表ケース比較を受け入れ条件に含め、V2専用の別計算へ黙って置き換えない。
