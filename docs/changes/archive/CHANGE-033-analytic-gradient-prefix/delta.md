# Delta

## ADDED Requirements

### EFFECT-024 解析的Gradient Prefixとtexture境界

Effect Stack V2は、解析的に評価できるBase Gradientの直後にあるNoiseおよびDiffuseの連続prefixを、Generatorの一回の評価として扱える。prefixで消費できるのは、GeneratorとV2 noise stackの計算が一致するNoise modeと、BlockまたはSmoothのDiffuseだけとする。NoiseはDiffuseより前に置かれなければならない。Mesh GradientはADR-0013の構造化データ契約に従い、prefix対象外とする。

prefixの後ろにMain Stackのtexture依存レイヤーがある場合、prefixの最終色を最初のtexture依存レイヤーの直前で一度だけtexture化する。最初のtexture依存レイヤーがGlassの場合、既存の`glass-field.glsl`、`glass-optics.glsl`、`glass-compact.glsl`を使う専用Glass source assemblyでこのtextureを入力とし、Glassの出力を後段レイヤーの入力とする。prefixの後ろにtexture依存レイヤーがない場合、Generatorの一回の出力を後段の固定段または最終結果へ渡す。

`source image`、Image Gradient、Cloth、Mesh、`effectPipeline.flowGradientEnabled`、`seamless.enabled`、Normal、Prism、Particles、legacy V1、legacy Stipple、順序不一致、未対応modeではこの方式を使わず、既存のV2またはlegacy fallbackを使う。Flow GradientとSeamlessはMain Stack prefixの後にある既存の固定段・境界処理として扱い、有効時はprefixを無効にする。prefixに含めたNoiseおよびDiffuseは、stackで再度適用しない。

この変更は既存のglobal order（`Base → Surface → Main Stack → Prism → Flow Gradient → Particles`）、Seamlessの最終境界処理、FBO filter、Diffuseのlegacy／Stipple契約、Preview／Thumbnail／Exportの共通評価契約を変更しない。

## MODIFIED Requirements

### EFFECT-003 固定段と描画順

Global orderは`Base → Surface → Main Stack → Prism → Flow Gradient → Particles`を維持し、Seamlessが有効な場合は既存仕様どおり2D色処理結果への最終境界処理として後置する。V2 Main Stackの先頭に解析prefixが成立する場合だけ、Baseから最初のtexture依存レイヤーまでを一回のGenerator出力として消費し、その後は保存済みのMain Stack順序と既存の固定段で処理する。Flow GradientまたはSeamlessが有効な場合はprefixを使わず、各段の既存経路を使う。prefixが成立しない場合も従来どおり各レイヤーをtexture入出力で処理する。

### EFFECT-004 DiffuseとImage Gradient Source

Image Gradient Source、source image、またはClothの保護経路では解析prefixを使わない。Image Gradientの既存の形状・alpha保護、Clothの既存経路、Diffuseの既存位置契約を優先し、解析prefixは通常の解析的Gradient入力だけに限定する。

### EFFECT-006 描画失敗からの復旧

Render Planが解析prefixを安全に選択できない場合、既存のV2 FBO stackまたはlegacy経路へfallbackする。`seamless.enabled`または`effectPipeline.flowGradientEnabled`が有効な場合も、固定段を維持するためprefixを選択しない。prefixの有効状態、消費範囲、最初のtexture境界、fallback理由は再現可能な診断情報として検証できる。

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset Thumbnail、静止画・連番・動画Exportは、同じscene evaluationと正規化済みEffect Pipelineから同じ解析prefix判定とtexture境界を得る。ExportだけがGenerator直結、FBO境界、Glass入力、Flow／Seamlessの有効状態を変更してはならない。

### EFFECT-008 GLASSの決定性

Glassは、解析prefixが有効な場合もprefix出力textureを入力とし、Glassの出力textureを後段へ渡す。既存の専用Glass source assemblyを再利用し、別のcompact shaderを追加しない。同じ入力texture、パラメータ、time、orderでは、PreviewとExportで同じGlass入力境界とfallback選択を使う。

## REMOVED Requirements

なし。
