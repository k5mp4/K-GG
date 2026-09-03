---
type: change
id: CHANGE-033
title: WebGL解析的Gradient Prefix統合
status: archived
change_kind: A
owners: [maintainer]
created: 2026-08-14
updated: 2026-09-03
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: [ADR-0004, ADR-0005, ADR-0010, ADR-0013, ADR-0017]
related_code: [src/lib/effectPipeline.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/types/distortion.ts, src/types/seamless.ts, src/types/flowGradient.ts, src/shaders/gradient.frag.glsl, src/shaders/postprocess/main.glsl, src/shaders/postprocess/diffuse.glsl, src/shaders/postprocess/stack.glsl, src/shaders/postprocess/glass-field.glsl, src/shaders/postprocess/glass-optics.glsl, src/shaders/postprocess/glass-compact.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/imageGradientProtected.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/webglCompilePolicy.test.ts, src/lib/webglPingPong.test.ts, src/lib/presetThumbnail.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/postprocessStack.test.ts]
human_review: completed
outcome: follow-up
migration: historical
follow_up: "issue-needed: 1920x1080 GPU/PNG parityと4経路の実ブラウザ確認を行う"
---

# CHANGE-033 WebGL解析的Gradient Prefix統合

## 背景・問題

Unified Effect Stack V2は、Baseの色場をtextureへ描画した後、Main Stackの各レイヤーをping-pong FBOで順に処理している。現在のV2ではGeneratorが持つNoiseとDiffuseを抑止し、stack側で評価することでレイヤー順序を維持している。

この方式では、Base GradientからNoise、DiffuseまでをGeneratorが解析的に連続評価できる場合でも、最初のtexture依存レイヤーまでの境界が明示されない。Glassは入力textureを必要とするため、境界を誤るとNoiseまたはDiffuseの二重適用、Glassが古いBaseを読む問題、後段レイヤーが元のGradientを再計算する問題が起きる。

既存のCHANGE-026はlegacy Diffuse／Stippleを保存位置で前段textureへ一度だけ適用する契約を承認済みである。今回の変更はStippleの契約を変更せず、V2の解析prefix境界という独立した設計変更として分離する。リモートの現行mainにはCHANGE-027（SANDBOX Seamless Tiling）、CHANGE-030（SANDBOX Flow Gradient Phase A）、CHANGE-032（Flow Gradient拡張）の仕様も存在するため、それらの固定段・実験段を横取りせず、SeamlessまたはFlowが有効な場合はprefixを無効にする。

## 変更理由

Generatorが既に持つ解析的なGradient、Noise、Diffuseの計算を、V2のtexture stackへ安全に接続するためである。最初のtexture依存レイヤーの直前でだけtexture化すれば、Glass以降の順序と入力textureを維持しながら、解析prefixの消費範囲と二重適用防止をRender Planで管理できる。

## ゴール・成功条件

- Baseから連続する解析可能なNoise／Diffuseを、Generatorの既存計算で一度だけ評価する。
- prefixの後ろにtexture依存レイヤーがある場合、解析結果を既存FBOへ一度だけ書き、そのtextureを最初のtexture依存レイヤーへ渡す。
- Glassは解析prefixの再計算ではなくprefix出力textureを読み、Glassの出力を後段レイヤーへ渡す。
- 順序不一致、source image、Image Gradient、Cloth、Mesh、Seamless、Flow、Normal、Prism、Particles、legacy Stippleは既存fallbackを維持する。
- Preview、Thumbnail、静止画・連番・動画Exportで同じRender Plan、seed、grain、scatter、座標、Glass入力境界を使う。

## 受け入れ条件

- AC-001: V2 Render Planがprefixの有効状態、消費レイヤー、最初のtexture依存レイヤー位置、fallback理由を返す。
- AC-002: Baseから `Noise`、`Diffuse` の順で連続するBlockまたはSmoothのprefixだけが有効になり、`Diffuse` → `Noise` はfallbackになる。
- AC-003: 有効なprefixに後段texture依存レイヤーがない場合はGeneratorを一度だけ最終出力へ描画し、後段レイヤーがある場合は既存のBase FBOへ一度だけ描画する。
- AC-004: prefixで消費したNoise／Diffuseをpostprocess loopで再実行せず、Glassを含む後段レイヤーは直前の出力textureを一度ずつ読む。
- AC-005: `Noise` → `Diffuse` → `Glass`、`Diffuse` → `Glass`、`Noise` → `Glass` → `Diffuse`、`Glass` → `Noise` → `Diffuse` の順序で、prefix経路とfallback経路が仕様どおりに切り替わる。
- AC-006: source image、Image Gradient、Cloth、Mesh、`seamless.enabled`、`effectPipeline.flowGradientEnabled`、Normal、Prism、Particles、legacy V1、legacy Stippleではprefixへ切り替えない。Flow GradientとSeamlessの既存固定段はこのchangeの実行順序を変更しない。
- AC-007: seed、grain、scatter、global coordinate、tile offset、resolution、time、animation、alphaの意味が既存Generatorと一致し、FBO全体のfilterは変更しない。
- AC-008: Preview、Thumbnail、静止画・連番・動画Exportが同じprefix判定とGlass入力境界を使い、Export専用の分岐を持たない。
- AC-009: 1920x1080、lossless PNG、Noise有効、Diffuse Block／Smooth、Scatter=47px、Grain=0.23px、Seed=0で4つの代表順序を比較し、新規Console errorとshader compile errorがない。
- AC-010: 既存のEffect Stack、Diffuse 6モード、Stipple、Image Gradient、Cloth、Mesh、Flow、Seamless、legacy presetの自動テストとDocsDD検証が成功する。

## 対象

- V2 Render Planの解析prefix判定、消費範囲、最初のtexture依存レイヤー境界、fallback理由。
- 既存Generatorと `gradFbo`／`gradTexture` を使ったprefix出力と、消費済みレイヤーをskipするV2実行経路。
- 既存のGlass field／optics／main shader assemblyを使った入力textureと後段textureの接続。
- Preview、Preset Thumbnail、still／sequence／video ExportのRender Plan共有。
- Render Plan、shader parity、Image Gradient protection、export program、ping-pong境界、代表PNGを用いた検証。
- `docs/specs/current/effect-stack.md`へのdelta統合、必要なADR、active／archive indexの同期。

## 対象外

- Glass自体の解析化、任意順序のshader融合、複数の解析prefix、または新しいEffect Stack kind。
- DiffuseのDither、Halftone、ASCII、legacy／Stippleの解析化。
- Cloth、Flow、Seamless、Image Gradient、source image、Mesh Gradient、Normal、Prism、Particlesの解析化。既存のFlow Gradient／Seamless固定段の実装変更も含めない。
- FBO texture filterをNEARESTへ変更すること、GPU間の画素完全一致、性能目標の新設。
- UI、Preset schema、保存値、既存のglobal stack orderの変更。
- CHANGE-026、CHANGE-027、CHANGE-030、CHANGE-032のWhy／What／対象外／ACや実装契約の変更。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)

## 関連ADR

- [ADR-0004 Postprocess Stackをping-pong FBOで描画する](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2を段階別ping-pong FBOで描画する](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0010 Image Gradient Sourceは画像テクスチャと色場を分離して描画する](../../../adr/0010-image-gradient-color-field-rendering)
- [ADR-0013 Mesh Gradationを単一Coons Patchの構造化データとして保持する](../../../adr/0013-mesh-gradient-data-model)
- [ADR-0017 V2の解析的Gradient Prefixを最初のtexture境界で固定する](../../../adr/0017-analytic-gradient-prefix)

## 主なリスク

- Generatorとpostprocessの両方でNoiseまたはDiffuseを評価すると、粒子密度、境界、seed位相が変わる。
- Glassが `gradTexture` ではなく古いBaseまたは別のping-pong textureを読むと、Glass後段の見た目と順序が壊れる。
- tile offset、global coordinate、resolution、grainの単位がGeneratorとstackでずれると、PreviewとExportの見た目が分岐する。
- Image Gradient、Mesh、Clothの保護経路をprefixが横取りすると、色だけでなく形状、alpha、転送textureの契約が変わる。
- `glass-compact.glsl` はリモートmainの既存source assemblyに含まれるため、別のGlass shaderを新設・重複登録すると専用program選択やcompile policyが分岐する。
- CHANGE-026のStipple契約とprefixを同じ条件で処理すると、approved changeの「前段textureへ一度だけ」契約を変更する危険がある。

## 未決定事項

- CHANGE-033をCHANGE-026、CHANGE-027、CHANGE-030、CHANGE-032と独立して承認するか。独立を提案するが、統合する場合は対象changeをreviewへ戻し、Why／What／対象外／ACを再承認する。
- 現行GeneratorとV2 noise stackのshader parityが確認できるNoise modeのallowlist。Seamless、Flow相当、unknown modeは初期値で除外する。
- Mesh Gradientをtexture-backed入力としてprefix対象外に固定するか。ADR-0013との整合上、対象外を提案する。
- Render Planのreasonを内部診断だけにするか、将来のデバッグ表示へ公開するか。初回は自動テストとvalidationで確認できる安定分類値に限定する。

## Finalization

- Finalized: 2026-09-03
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: 1920x1080 GPU/PNG parityと4経路の実ブラウザ確認を行う
