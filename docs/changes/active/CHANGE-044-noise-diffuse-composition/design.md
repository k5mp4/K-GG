# Design

## Render Plan

`getV2RenderPlan`は正規化済みの有効レイヤー列から、隣接する`Noise → Diffuse`のindexと適用可否を`noiseDiffuseComposition`として返す。先頭の解析prefixが両レイヤーを消費する場合、または非隣接、Slit出力座標が必要な順序、非対象Diffuse mode、Image Gradient保護経路では専用programを要求しない。専用programを使う場合はstandalone `noiseStack`を要求せず、rendererとExportの両方が同じprogram planを参照する。

## Shader

`noise-diffuse-main.glsl`は、画面の`gl_FragCoord + u_tileOffset`からglobal UVを作り、`stackNoiseUv`を一度だけ評価する。次に同じglobalCoordから`diffusePanelDisplacement`を一度評価し、Noise後のglobal sample coordinateへ加算して入力textureを一度サンプリングする。適応Diffuseの色入力はNoise後のsource coordinateから取得し、現行のDiffuse curve契約を保つ。Block／Smoothだけを有効対象とし、他のmodeは従来の分離passへ残す。

専用programは既存Noise実装とDiffuse実装を組み合わせるが、`KGG_STACK_NOISE_ONLY`で不要なVoronoi／Slit実装を除外し、source textureのtile変換は専用mainで行う。既存のping-pong FBO、texture filter、uniform upload、global hash配置は変更しない。

## 実行とfallback

V2のlayer loopはRender Planのpair indexで2つの論理レイヤーを一つのdrawへまとめ、Diffuseのloop反復をskipする。専用shaderがlazy compile中はBaseを提示し、compile失敗後はstandalone Noiseと既存Diffuse passへ戻れる。`Diffuse → Slit`ではpair化せず、既存のSlit出力座標評価を優先する。

## 代替案とトレードオフ

Noise出力FBOへ一度書いてからDiffuseを行う案は、`N(x + D(x))`相当の再サンプリングになり、Issue #45の旧Generator合成を再現できないため採用しない。一般postprocess shaderへ新しいeffect modeを追加する案は、重いshaderのcompile境界と既存modeへ影響を広げるため、専用lazy programに分離する。

## ロールバック

Render Planの`noiseDiffuseStack`要求と専用program選択を外せば、既存のstandalone Noise／Diffuse stackへ戻せる。UI、Preset schema、既存のanalytic prefix、Slit／Stippleの境界は独立している。
