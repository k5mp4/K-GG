---
id: ADR-0004
title: Postprocess Stackをping-pong FBOで描画する
status: accepted
date: 2026-07-08
deciders: [maintainer]
related_specs: [SPEC-012]
supersedes: []
---

# ADR-0004: Postprocess Stackをping-pong FBOで描画する

## コンテキスト

Postprocessを複数適用して順序変更するには、前段エフェクトの画像結果を次段エフェクトの
入力として渡す必要がある。既存実装は単一Postprocessモードを1回だけ描画し、PrismはGlow用に
専用の合成パスを持つ。Particlesは画像変形ではなく最終オーバーレイとして描画される。

## 決定

Postprocess画像系エフェクトは、WebGLのping-pong FBO/textureで順に描画する。各レイヤーは
前段textureを読み、次段FBOまたは最終Framebufferへ書く。Prismはscratch FBOへ本体を描き、
必要に応じてBlur FBOでGlowを作り、指定された出力先へ合成する。ParticlesはSPEC-011 v1では
スタックに含めず、既存どおり最終オーバーレイとして扱う。

## 理由

ping-pong FBOは画像処理スタックの一般的な構造で、Mirror、Glass、Prismなどの順序差を
そのまま表現できる。既存GLSLとパラメータを大きく分割せずに再利用でき、旧プリセットの
単一エフェクト挙動も1レイヤーのスタックとして維持できる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 1つの巨大シェーダーで全順序を分岐する | 順序の組み合わせが増えるほど分岐が複雑になり、Prism Glowのような複数パス処理に向かない |
| CPU/Canvas 2DでPostprocessを積む | プレビュー、高解像度出力、既存WebGL結果の一致を維持しにくい |
| Particlesも同じスタックに入れる | 粒子描画をFBO化し、後段Postprocessへ渡す設計が別途必要になる |

## 結果

### 利点

- ユーザーがPostprocess画像系エフェクトの順序を視覚的に制御できる。
- 既存のPostprocess詳細パラメータとGLSLを再利用できる。
- 旧プリセットを1レイヤーのスタックとして移行できる。

### 欠点・コスト

- 有効レイヤー数に比例して描画パス数が増える。
- PrismのGlowなど、中間FBOを使うエフェクトは読み書き先の管理が複雑になる。
- 同種エフェクト複数インスタンスやParticles自由順序化は別設計が必要になる。

## 再検討条件

同種エフェクトの複数インスタンス化、Particlesの自由順序化、Diffuse/Noiseを含む全効果の
統合スタック化を行う場合は、データモデルと描画パイプラインを再検討する。
