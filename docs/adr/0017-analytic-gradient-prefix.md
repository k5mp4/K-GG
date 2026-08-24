---
id: ADR-0017
title: V2の解析的Gradient Prefixを最初のtexture境界で固定する
status: accepted
date: 2026-08-14
deciders: [maintainer]
related_specs: [SPEC-012, SPEC-013, SPEC-014, SPEC-015, SPEC-018, SPEC-040]
supersedes: []
---

# ADR-0017: V2の解析的Gradient Prefixを最初のtexture境界で固定する

## コンテキスト

Unified Effect Stack V2は、`Base → Surface → Main Stack → Prism → Flow Gradient → Particles`の段を持ち、Main Stackのtexture effectをping-pong FBOで順に処理する。Seamlessは有効時に2D色処理結果へ適用する最終境界処理である。Generator側にはGradient、Noise、Diffuseを一つのfragment shaderで評価する計算があるが、V2の順序可変stackでは各layerの入力textureを保持する必要がある。

NoiseとDiffuseがBaseから連続し、Generatorの計算と一致する場合まで毎回texture化すると、解析prefixの境界と二重適用防止をRender Planで表現しにくい。一方、Glass、geometry、special stageを解析prefixへ混ぜると、入力textureと後段出力の契約が壊れる。

## 決定

CHANGE-033では、V2の先頭から連続する解析可能なNoise／DiffuseだけをRender Planのanalytic prefixとして消費する。prefixの後ろに最初のtexture依存layerがある場合、その直前で既存のBase FBOへ一度だけ出力し、以後は通常のtexture stackを使う。Glassはprefix出力または直前textureを読み、Glass出力を後段へ渡す。Glassのsourceはリモートmainに既存の`glass-field.glsl`、`glass-optics.glsl`、`glass-compact.glsl`を含む専用assemblyを再利用する。

source image、Image Gradient、Cloth、Mesh、Flow相当、Seamless、Normal、Prism、Particles、legacy V1、legacy Stipple、未対応mode、順序不一致は解析prefixから除外し、既存fallbackを使う。`effectPipeline.flowGradientEnabled`または`seamless.enabled`が有効な場合は、既存のFlow固定段またはSeamless最終境界処理を維持するためprefixを無効にする。FBO texture filter、保存形式、global stack orderは変更しない。

## 理由

- 既存のGenerator計算を再利用でき、Noise／Diffuseの二重評価をRender Planの消費範囲で防げる。
- Glass以降の入力textureとping-pong順序を既存ADR-0004／0005の責務へ残せる。
- Image Gradient、Cloth、Mesh、Stippleの既存保護・互換性契約を解析最適化から分離できる。
- Flow GradientとSeamlessの既存固定段・最終境界処理を解析prefixから分離できる。
- prefixを安全に表現できない構成を既存fallbackへ戻せるため、段階導入とrollbackが容易である。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 全てのlayerを既存FBOで処理する | 解析prefixの計算とtexture境界を統合できず、今回の目的を満たさない |
| 全FBOをNEARESTへ変更する | Stipple以外のeffectへ影響し、既存のLINEAR契約を変更する |
| 任意順序を一つの巨大なshaderへ融合する | Glass、geometry、special stageのtexture入力責務とcompile負荷が増える |
| Glassの入力を解析Gradientへ変更する | Glassのtexture effect契約と後段のcurrent texture連鎖を壊す |
| 既存の`glass-compact.glsl`とは別のGlass shaderを追加する | リモートmainの専用source assemblyを複製し、program keyとcompile policyを分岐させる |

## 結果

### 利点

- 解析prefixの有効／無効条件と消費layerがRender Planで説明できる。
- Glass直前のtexture境界が一つになり、後段は既存ping-pong責務を使える。
- Preview、Thumbnail、Exportで同じ判定を共有できる。
- 実装が失敗した場合はprefixをdisabledにして既存V2へrollbackできる。

### 欠点・コスト

- 初期allowlistとshader parityを維持するテストが必要になる。
- 解析prefixとfallbackの両方について、seed、tile、resolution、Glass入力のブラウザ確認が必要になる。
- Mesh、Flow、Seamless、legacy Stippleなどは別の経路に残り、全effectの一律最適化にはならない。

## 再検討条件

- Glass、Image Gradient、Cloth、Mesh、Seamless、Stippleを解析的に評価する要件が承認された場合。
- GeneratorとV2 stackのNoise／Diffuse parityを維持できないGPUまたはshader compile条件が判明した場合。
- Render Planの部分消費が複数の新機能で増え、単一prefixでは責務を説明できなくなった場合。
