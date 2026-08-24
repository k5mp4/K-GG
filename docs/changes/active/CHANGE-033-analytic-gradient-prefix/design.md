# Design

## 採用する実装方針

V2の正規化済みEffect Pipelineから、解析prefixをpureに判定する。Render Planへ次の意味を持つ診断情報を追加する。

- `enabled`: prefixを使うか。
- `consumedLayers`: Generatorで一度だけ評価するNoise／Diffuse。
- `firstTextureLayerIndex`: `enabledLayers`内でprefixの直後にある最初のtexture依存layerのindex。後段がない場合は`null`とする。
- `reason`: enabled、direct、texture boundary、invalid order、protected input、unsupported modeなど、判定を再現できる分類値。

既存の`V2RenderPlanOptions`にある`seamlessEnabled`と`flowGradientEnabled`を判定入力として再利用する。`seamless.enabled`または`effectPipeline.flowGradientEnabled`が有効な場合は、Flow／Seamlessの既存固定段・最終境界処理を維持するため、解析prefixを無効にする。Exportのprogram selectionも同じFlow有効状態をRender Planへ渡す。

判定対象は、正規化済みstackの先頭から連続するNoise／Diffuseだけとする。NoiseとDiffuseの順序が逆、または先頭から解析prefixとして表現できないlayerが先にある場合はprefix全体を無効にする。prefix後のNoise／Diffuseは通常のpostprocess layerとして処理する。

解析可能なGradientは、現在のGeneratorが計算式で評価するGradient typeに限定する。MeshはADR-0013の構造化データと整合させるため対象外にする。NoiseはGeneratorとV2 noise stackのparityを確認できる現行modeをallowlistにし、Noiseの`type: seamless`／`noiseLoopMode: seamless`、Flow相当、unknown modeを拒否する。DiffuseはBlockとSmoothだけを許可し、legacy／Stippleを含む他modeを拒否する。Diffuseの既存6モードとStippleのlegacy契約をprefix allowlistへ取り込まない。

## データモデル

保存形式、Preset schema、Zustand stateは変更しない。解析prefixはrender時の一時的なRender Plan情報であり、保存値から再構築できる。`getV2RenderPlan`とExport program selectionは同じ入力から同じ計画を作る。

既存の`framebufferAllocationMode`はdirect／core／fullという全体資源要件を保持する。解析prefixは部分的なlayer消費と境界を表すため、allocation modeへ意味を混ぜず、Render Plan内の別情報として扱う。

## 状態管理

V2 render開始時にRender Planを一度作り、program readiness、Generator uniform gate、Baseの出力先、Main Stackの開始位置へ渡す。Preview、Thumbnail、Exportは既存のscene evaluation経路を使い、renderごとに同じ入力を評価する。

Image Gradient protected、Cloth、Normal、Prism、Particles、legacy V1、legacy Stippleは既存の分岐を先に優先し、解析prefix判定へ渡さないか、明示的にdisabled reasonを返す。未対応条件で例外を投げず、既存fallbackを選ぶ。

## UI構成

UI、Preset schema、表示名、入力コントロールは変更しない。Render Planのreasonは初回は自動テストとvalidationから確認できる内部診断に限定し、ユーザー向け表示は別changeとする。

## 描画・外部プロセス・Tauri側の変更

V2実行は既存の`gradFbo`／`gradTexture`とping-pong textureを再利用する。

1. prefixが有効で後段texture layerがない場合、Generatorを最終出力または既存の後段固定段の入力へ一度だけ描画する。
2. prefixが有効で後段texture layerがある場合、Generatorを`gradFbo`へ一度だけ描画し、`currentTexture`を`gradTexture`にする。
3. Main Stack loopは最初のtexture境界から開始し、`consumedLayers`を再実行しない。
4. Glassは既存のGlass V2専用programで`gradTexture`または直前textureを読み、target textureを後段へ渡す。Glassの出力後は既存のPrism、Flow Gradient、Seamless、Particlesの順序・境界を維持する。
5. prefixが無効なら、現在のBase-to-FBO、Main Stack、固定段、最終境界処理をそのまま使う。

Generatorの既存`gradient.frag.glsl`計算を再利用する。Noise、Diffuseの式をGlassや新しい解析prefix shaderへ複製しない。GLSL source assemblyは`src/lib/webglShaderSources.ts`の既存順序とprogram keyを保つ。リモートmainに既に存在する`src/shaders/postprocess/glass-compact.glsl`を既存のspecialized Glass source assembly経由で利用し、同名shaderの新設や二重登録は行わない。Glassは`glass-field.glsl`、`glass-optics.glsl`、`glass-compact.glsl`、`main.glsl`の既存構成を使う。

FBO texture filterは変更しない。NEARESTによる全体修正はCHANGE-026で採用していない方針と衝突し、他のeffectの見た目を変更するため対象外とする。

## 変更対象の主要ファイル

### コード

- `src/lib/effectPipeline.ts`: 解析prefixの型、判定、V2 Render Planへの統合。
- `src/lib/webgl.ts`: Generator gate、prefix境界、consumed layer skip、program readiness、fallback、Flow／Seamlessの固定段維持。
- `src/lib/webglShaderSources.ts`: 既存Glass source assemblyとprogram要求の整合。新しいGlass shaderは追加しない。
- `src/shaders/gradient.frag.glsl`: 既存GeneratorのNoise-before-Diffuse parityを維持するための必要最小限のuniform gate。
- `src/shaders/postprocess/main.glsl`: Glass入力とpostprocess layerの再実行防止に必要な確認または調整。
- `src/shaders/postprocess/diffuse.glsl`、`src/shaders/postprocess/stack.glsl`: 既存のDiffuse／Noise parityを維持し、prefix消費後に重複適用しないための確認。
- `src/shaders/postprocess/glass-field.glsl`、`src/shaders/postprocess/glass-optics.glsl`、`src/shaders/postprocess/glass-compact.glsl`: 既存Glass source assemblyとprefix出力texture入力の互換性確認。内容の複製や別variantの追加は行わない。

### テスト

- `src/lib/effectPipeline.test.ts`
- `src/lib/effectShaderParity.test.ts`
- `src/lib/imageGradientProtected.test.ts`
- `src/lib/webglExportPrograms.test.ts`
- `src/lib/webglShaderSources.test.ts`
- `src/lib/webglCompilePolicy.test.ts`
- `src/lib/webglPingPong.test.ts`
- `src/lib/presetThumbnail.test.ts`
- `src/lib/sceneEvaluation.glass.test.ts`
- `src/lib/postprocessStack.test.ts`

## 代替案とトレードオフ

| 案 | 採用しなかった理由 |
| --- | --- |
| 全てのlayerを既存FBOで処理する | 既存契約は守れるが、解析prefixの境界とGenerator／stack parityをRender Planで表現できない |
| FBO textureを全体的にNEARESTへ変更する | Stipple以外のeffectへ影響し、CHANGE-026の検討結果と衝突する |
| 任意順序を一つの巨大な解析shaderへ融合する | Glass、geometry、special stageのtexture入力契約を壊し、fallback条件が複雑になる |
| CHANGE-026へprefixを追加する | Stippleのapproved ACと責任範囲が変わるため、独立changeよりreview単位が不明瞭になる |
| 既存のGlass source assemblyとは別に`glass-compact.glsl`を新設・登録する | リモートmainには既に同ファイルとspecialized Glass assemblyがあるため、二重登録でprogram keyとcompile policyが分岐する |

## 移行方法

保存形式や既存Presetの移行は不要である。Render Planがdisabledまたはprogram compile／readinessに失敗した場合は既存V2 FBO stackへfallbackする。既存legacy V1、Stipple、Image Gradient、Cloth、Mesh、Flow Gradient、Seamlessには解析prefixを適用しない。リモートmainで承認済みのCHANGE-027／CHANGE-030と、draftのCHANGE-032の仕様・実装範囲は変更しない。

実装前にproposal、delta、design、ADRを人間レビューへ出す。承認後にWhy／What、対象外、AC、互換性を変える場合はreviewへ戻し、再承認する。

## ロールバック方法

Render Planの解析prefix選択をdisabledに戻し、現在のBase-to-FBOと全layer loopを使えば機能単位でrollbackできる。保存形式の変更がないため、旧版へ戻すためのPreset migrationは不要である。実装途中の専用uniform、テストfixture、diagnostic fieldは、採用しない場合に残さない。
