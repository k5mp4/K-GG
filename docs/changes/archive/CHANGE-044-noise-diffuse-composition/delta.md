# Spec Delta

## ADDED Requirements

### EFFECT-026 Noise→Diffuseの旧Generator UV合成

Effect Stack V2で有効な`Noise`の直後に有効な`Diffuse`があり、DiffuseがBlockまたはSmoothの場合、解析的Gradient Prefixで両レイヤーを消費できない経路でも、同じ入力textureからNoiseのUV変換を一度行った後にDiffuseのグローバル座標変位を加え、`I(N(x) + D(x))`として一度だけサンプリングする。NoiseとDiffuseのglobalCoord、seed、time、subpixel Grain、Scatter、Tile offset、full resolutionは既存の各レイヤー契約に従う。

先頭の解析可能な`Noise → Diffuse`は既存Generatorのprefixで一度だけ評価する。非隣接順序、`Diffuse → Noise`、`Noise → Diffuse → Slit`、Dither／Halftone／ASCII／Stippleおよびその他の非対象モードはこの合成契約を適用せず、既存のTexture StackまたはSlit出力座標評価を使う。Preview、Thumbnail、静止画、連番、動画、Tileは同じRender Planを使う。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
