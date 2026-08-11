---
type: change
id: CHANGE-026
title: Diffuse旧アルゴリズムのEffect Stack対応
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-11
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/types/distortion.ts, src/components/BlockNoisePanel.tsx, src/lib/effectPipeline.ts, src/lib/webgl.ts, src/shaders/gradient.frag.glsl, src/shaders/postprocess/diffuse.glsl, src/shaders/postprocess/main.glsl, src/lib/presetModel.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/imageGradientProtected.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/parameterLimits.test.ts, src/store/gradientStore.effectPipeline.test.ts]
human_review: completed
---

# CHANGE-026 Diffuse旧アルゴリズムのEffect Stack対応

> 実装状態（2026-08-11）: AC-002未達のため停止中。現在のコードは比較用の候補実装であり、最終方式ではない。試行内容、代替案、再開時の判断基準は`design.md`を参照する。

## 背景・問題

現行K-GGのDiffuseにはBlock／Smooth／Dither／Halftone／ASCIIがあるが、Effect Stack V2で使うDiffuseのUV変位処理は、旧 `kagaribi15_grad` のDiffuseが持っていた細粒の局所ノイズ変位と一致しない。

旧版の代表的な見た目では、`Scatter` と `Grain` を中心に、形状のコントラストとシャープなラインを維持したまま、色境界付近にだけ微細な粒子状の崩れが現れる。現行モードの意味を変更せずに、この旧方式をEffect Stack内の一つのDiffuseレイヤーとして選択できる必要がある。

## 変更理由

旧版で作成された表現を現行のEffect Stackへ移行できるようにし、既存のBlock／Smooth等を調整して旧見た目へ無理に寄せることを避ける。旧方式を独立モードとして保存・再読込できれば、既存Presetと現行の描画方式を壊さずに旧表現を再現できる。

## ゴール・成功条件

- Diffuseに旧版の細粒ノイズ変位を使う `Stipple` モードを追加する。保存値は内部的に `legacy` とする。
- `Stipple` は既存の `Scatter`、`Grain`、`Seed`、`Seed Per Frame` だけで調整でき、Halftone／ASCII用のセル塗りや背景色を適用しない。
- `Stipple` は、提示された旧Diffuseパネルの出力を作った旧`gradient.frag.glsl`のハッシュと`0.01px`下限を使う。Effect Stack V2ではこのGenerator方式の粒子場を直前のテクスチャ入力へ適用する。
- `Stipple` が唯一の有効レイヤーでも、Effect Stack V2はGenerator直結最適化を使わず、旧Generator方式の粒子場をテクスチャ入力へ適用する。
- Effect Stack V2のDiffuseレイヤーを他の主スタックレイヤーの前後へ置いた場合、直前のテクスチャを入力として旧方式を一度だけ適用する。
- 既存のBlock／Smooth／Dither／Halftone／ASCII、既存Preset、Legacy V1の見た目を変更しない。

## 受け入れ条件

- AC-001: Diffuseで表示名 `Stipple`、保存値 `legacy` を選択・保存・再読込でき、旧版と同じハッシュ、`0.01px`下限、調整項目を使う。
- AC-002: 代表設定 `Scatter=47px`、`Grain=0.23px`、`Seed=0` で、色境界へ広い中間色のぼけを作らず、形状のコントラストとシャープな境界を維持した微粒子状の崩れになる。
- AC-003: Direct GeneratorとEffect Stack V2が同じ旧方式を使い、Stipple単独時もV2は直前テクスチャへ適用する。
- AC-004: Effect Stack内でStippleを移動しても保存済み位置で直前テクスチャへ一度だけ適用する。
- AC-005: Preset、Preview、Thumbnail、静止画・連番・動画書き出しへ同じ設定と描画方式を引き継ぐ。
- AC-006: 既存のDiffuse 5モード、既存Preset、Legacy V1の契約を変更しない。

## 対象

- Diffuseのモード型、UI選択肢、WebGLモードマッピング。
- 旧版Block相当のハッシュ変位を、現在のタイル座標・Effect Stack入力テクスチャへ適用する描画経路。
- 旧方式のモード値のPreset保存、読込、Preview、Thumbnail、静止画・連番・動画書き出しへの引き継ぎ。
- 既存モードとの後方互換性を確認する自動テストと、代表設定を使った再現可能な手動確認。

## 対象外

- 既存のBlock／Smooth／Dither／Halftone／ASCIIのアルゴリズム変更。
- 旧版のUI全体、ヒストグラム、GradientやNoiseの仕様移植。
- 旧版Smoothと新方式を切り替える追加サブモード。
- Diffuseレイヤーの複数インスタンス化、Effect Stackの種類・順序モデル変更。
- スクリーンショットとの画素完全一致、GPUごとの固定性能保証。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI入力コントロール](../../../specs/current/ui-controls)
- [Preset](../../../specs/current/preset-system)

## 関連ADR

- [ADR-0004 Postprocess Stack Rendering](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2](../../../adr/0005-unified-effect-stack-v2)

## 主なリスク

- 旧方式の細かい `Grain` 値は、タイル描画の座標系や解像度スケールを誤ると粒子密度が変わる。
- Effect Stack入力に対して旧方式の変位を適用する位置を誤ると、境界ではなく形状全体が過度に崩れる。
- `Grain` が1px未満のとき、旧Generatorの`mediump`計算とStackの`highp`計算では同じ数式でもハッシュ格子が変わる。
- Direct描画とStack描画の片方だけを更新すると、Preview・Thumbnail・Exportで見た目が分岐する。
- 新しいモード値を既定値や旧Presetの補完処理へ誤って混ぜると、既存作品の見た目が変わる。

## 決定事項

- UI表示名は `Stipple`、Presetへ保存する内部モード値は `legacy` とする。
- 代表設定の手動確認値は `Scatter=47px`、`Grain=0.23px`、`Seed=0` とする。
