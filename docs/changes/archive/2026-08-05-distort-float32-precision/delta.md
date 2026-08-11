# Delta: CHANGE-020-distort-float32-precision

## ADDED Requirements

### DISTORT-001 歪みマップテクスチャの浮動小数点化

WebGL2コンテキストにおける `manualDistortTexture` は `gl.RGBA32F` (32-bit float RGBA) 内部フォーマットを使用し、データ転送時に `Float32Array` および `gl.FLOAT` データ型を使用する。これにより歪みマップの 8-bit 量子化による階段状の描画段差・ブロックノイズを排除し、連続した滑らかな歪み変位を提供する。

## MODIFIED Requirements

### DISTORT-002 歪みマップ転送処理における精度維持

CPU側の Catmull-Rom スプライン補間による変位計算結果（dx, dy）は、0.0〜1.0 に正規化した小数値のまま `Float32Array` バッファへ代入する。従来行っていた `Math.round(...) * 255` による 8-bit 整数への丸め処理を取り除き、シェーダー側のサンプリング精度を高精度に維持する。

## REMOVED Requirements

なし
