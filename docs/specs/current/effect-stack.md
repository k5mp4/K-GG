---
type: current
id: CURRENT-EFFECT-STACK
title: Effect Stack
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-08-02
requirement_ids: [EFFECT-001, EFFECT-002, EFFECT-003, EFFECT-004, EFFECT-005, EFFECT-006, EFFECT-007, EFFECT-008, EFFECT-009, EFFECT-010, EFFECT-011]
related_adrs: [ADR-0004, ADR-0005, ADR-0010]
related_changes: [CHANGE-001, CHANGE-011, CHANGE-012, CHANGE-013, CHANGE-014, CHANGE-015]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/effectStackTransition.ts, src/lib/postprocessStack.ts, src/lib/effectStackWindow.ts, src/lib/postprocessAnimation.ts, src/lib/sceneEvaluation.ts, src/lib/glass.ts, src/lib/webgl.ts, src/components/PostprocessStackPanel.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessPanel.tsx, src/shaders/postprocess/glass-optics.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectStackTransition.test.ts, src/lib/effectStackWindow.test.ts, src/lib/postprocessStack.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/effectStackDrag.test.ts, src/lib/effectShaderParity.test.ts, src/lib/glass.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/store/gradientStore.glass.test.ts, src/lib/sceneEvaluation.glass.test.ts]
---

# Effect Stack

## 目的

Effect Stackは、Gradientから得た画像・色場へ複数の効果を適用し、その順序と有効状態を編集可能にする機能です。ユーザーが編集する主スタックと、処理の意味や複数パス要件が異なる固定段を分けます。

## 現在の要件

### EFFECT-001 主スタックの効果

Unified Effect Stack V2の主スタックは、`Noise`、`Slit`、`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`、`Diffuse`の9種類です。`Glass`はGLASS V2の描画経路を使用します。各種類はスタック内に一度だけ存在し、同じ種類の複数インスタンスは現在サポートしません。

主スタックは既知の種類を正規化して保持します。未知の種類や重複は保存・読込時に除外され、欠落した既知の種類は無効状態で補完されます。旧Presetの`glassV2`は`glass`へ写像され、旧`glass`と同時に存在する場合も一つへ統合されます。

### EFFECT-002 有効化と順序

利用者は主スタックの各効果を有効/無効に切り替え、順序を手動またはランダムに並べ替え、選択中の効果を変更できます。現在の実装は任意の新しい種類を追加・削除するモデルではなく、既知の9種類を無効化することで「使わない」状態を表現します。

新規V2状態の既定順は `Noise → Slit → Stretch → Distort → Mirror → Kaleidoscope → Voronoi → Glass → Diffuse` で、Diffuseが既定で有効です。ユーザーが保存した順序と有効状態はPresetへ保存されます。ランダム化操作では9種類を一度ずつ含む順列を作り、有効状態・選択状態・固定段を維持します。現在の描画結果から目標順序の結果へ400msの`easeInOut`表示ブレンドを行い、完了後に目標順序を確定します。

### EFFECT-003 固定段と描画順

V2の全体順序は `Base → Surface → Main Stack → Prism → Particles` です。Normal/MatcapはSurface、PrismはGlowを含む専用段、Particlesは最終オーバーレイとして扱い、主スタックの並べ替え対象には含めません。

有効な主スタックレイヤーは前段の結果を次段の入力として処理します。レイヤーが0件の場合の直接描画、軽量な主スタック、追加の中間バッファが必要な構成は描画計画として一貫して決定されます。

### EFFECT-004 DiffuseとImage Gradient Source

Diffuseは主スタック内の一つのレイヤーです。旧来の固定最終段として別に二重適用しません。Image Gradient Sourceが有効なとき、画像本体の形状・アルファを変える `Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass` は保護経路の対象外となり、色場の契約を壊さないよう扱われます。

### EFFECT-005 旧Presetとの互換性

`effectPipeline`を持たない旧PresetはLegacy V1として読み込みます。旧来のPostprocess設定に残る`effectMode: glass`およびstackの`kind: glass`は、読み込み時に`glassV2`へ正規化し、正規化後のPostprocess状態には旧Glassを残しません。V2の状態を持つPresetでは `effectPipeline` が有効状態と順序の一次情報です。

### EFFECT-006 描画失敗からの復旧

描画に必要なプログラムとバッファは、現在の描画計画に必要なものだけを準備します。準備中・失敗・フォールバックの状態はEffect Stack UIへ反映され、失敗した効果があっても保存済みPresetのデータ自体は失われません。再試行や別構成への変更で描画計画を再評価できます。

GPUやブラウザ固有のコンパイル結果・性能を一律に保証する仕様ではありません。復旧可能性は、純粋な描画計画のテストと実機確認を分けて検証します。

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset thumbnail、静止画・連番・動画のレンダリングは、Glass（GLASS V2）の色設定を含む同じ正規化されたEffect Pipelineとシーン評価を共有します。出力形式ごとに別のHue、Saturation、Tint計算を持ちません。外部画像が保存されないPresetのthumbnailは、画像入力なしで安全に生成できるフォールバック状態から作成します。

有効レイヤーが増えるほど描画パスや中間バッファのコストが増えますが、現在は固定FPSや固定レイテンシの数値保証を置きません。性能を変更する場合は、対象構成・解像度・GPU・測定方法を変更仕様へ明記します。

### EFFECT-008 GLASSの決定性

Effect StackのGlassは、同一の入力texture、同一のパラメータ、同一のnormalizedTime、同一のEffect Stack順序に対して、直前の描画履歴やevent loopの状態に依存しないRGBA結果を返します。描画にはGLASS V2専用programを使用し、export中に描画program、fallback方針、render planを変更しません。

### EFFECT-009 Glassの色調整

Glassは、既存の表面形状、屈折、波長依存分散を維持したまま、色収差成分のHueとSaturation、透過光のTint、ハイライトのTintを個別に調整できます。Chromatic Aberrationは`0..80px`、Hueは`-180°..180°`、Saturationは`0..200%`、Tintは`#RRGGBB`で保持します。

Hueの既定値は`0°`、Saturationの既定値は`100%`、両Tintの既定値は`#FFFFFF`です。すべて既定値の場合は変更前のGLASS V2のRGBA計算をそのまま使用します。Hue／Saturationは入力Gradient全体ではなく色収差残差だけへ作用し、Tintは透過光とハイライトへ独立して作用します。

### EFFECT-010 主スタック順序のランダム化

ユーザーがランダム化操作を実行すると、主スタック9種類の順序だけをランダムな順列へ変更します。各レイヤーの有効状態、レイヤー設定、選択中の種類、Prism／Particlesなど固定段の状態は変更しません。ランダム化は描画フレームやexportフレームごとには実行せず、ユーザー操作時に一度だけ実行します。

### EFFECT-011 Altクリックによるソロレイヤー

主スタックのレイヤー行またはオンオフToggleをAltクリックすると、クリックしたレイヤーだけを有効にし、その他の主スタックレイヤーを無効にします。最初のソロ化時に現在の主スタックの有効状態を一時保持し、同じ対象をもう一度Altクリックするとソロ化前へ復元します。ソロ中に別レイヤーをAltクリックした場合は対象だけを切り替えます。ソロ化によって新たに無効化されたレイヤーの状態欄には黄色の`STAY`を表示します。固定段とレイヤー設定値は変更せず、ソロ状態は既存の`enabled`値としてPresetへ保存します。専用の`solo`保存キーは持ちません。

## 他領域との関係

- Gradient SystemはEffect Stackの入力画像・色場と、Image Gradient Sourceの保護条件を定義します。
- Preset SystemはEffect Pipeline、各効果の設定、選択状態を保存します。
- Animationは、Noise・Diffuse・Slit・Stretch・Postprocessの時間依存状態を有効状態と共に評価します。

## 変更履歴

- [SPEC-012 Postprocess Effect Stack](../SPEC-012-postprocess-effect-stack)
- [SPEC-013 Unified Effect Stack V2](../SPEC-013-unified-effect-stack-v2)
- [SPEC-014〜018 Effect Stackの安定化・配置・Glass](../index#legacy-change-specifications)
- [SPEC-027 Diffuse輝度カーブ](../SPEC-027-diffuse-luminance-curve)
- [SPEC-029 パラメータ制限](../SPEC-029-unified-parameter-limits)
- [SPEC-034〜035 Noise拡張](../index#legacy-change-specifications)
- [CHANGE-011 GLASS／GLASS V2書き出し決定性修正](../../changes/active/CHANGE-011-deterministic-glass-export/proposal)
- [CHANGE-012 GLASS V2色調整コントロール](../../changes/archive/CHANGE-012-glass-v2-color-controls/proposal)
- [CHANGE-013 Effect Stack GlassをGLASS V2へ統合](../../changes/active/CHANGE-013-glass-v2-only/proposal)
- [CHANGE-014 Effect Stackのランダム順序とソロレイヤー](../../changes/active/CHANGE-014-effect-stack-controls/proposal)
- [CHANGE-015 Effect Stack別ウィンドウの復旧](../../changes/active/CHANGE-015-effect-stack-window-repair/proposal)

Legacy SPECは履歴参照用です。現行の主スタック、固定段、互換性はこの文書と関連ADRを先に確認します。

## 未確認・今後の現行仕様化

GPUごとのシェーダーコンパイル失敗率、全効果の実機画素一致、主スタックの同種複数インスタンス、Prism/Particles/Normalの自由順序化は未保証です。必要になった時点で別の変更仕様とADRを作成します。
