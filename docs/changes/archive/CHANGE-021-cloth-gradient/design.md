# CHANGE-021-cloth-gradient Design

## Architecture

Three.js を用いて独立した WebGL レンダラー `ClothGradientRenderer` をカプセル化し、K-GG のレンダリングループから同期的に呼び出す構造を採用します。

```text
[K-GG State / Store]
       ↓ (normalizedTime, ClothGradientConfig, RampData)
[renderSceneAtTime / renderGradient]
       ↓
[ClothGradientRenderer (Three.js Offscreen)]
   - PlaneGeometry (48x48 / 96x96 / 160x160)
   - Custom ShaderMaterial (Vertex Wave + Ramp Lookup Fragment)
   - THREE.DataTexture (Ramp Data)
   - THREE.WebGLRenderer (Offscreen Canvas)
       ↓
   gl.texSubImage2D / FBO Render
       ↓
[ctx.gradTexture (K-GG WebGL Context)]
       ↓
[Surface (Normal Map) -> Effect Stack -> Prism -> Particles]
```

## Detailed Technical Specifications

### 1. Offscreen Rendering & Texture Transfer
- Three.js の `THREE.WebGLRenderer` を非表示 DOM Canvas にバインド。
- 描画要求時に `renderer.render(scene, camera)` を呼び出し、得られた DOM Canvas を `gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas)` によって K-GG 側の `ctx.gradTexture` へ全サイズ転送。
- オフスクリーン描写のため、K-GG の WebGL ステートを破壊しません。

### 2. Vertex & Fragment Shader
- **Vertex Shader**:
  - `evaluateClothHeight`: $q = p + \text{domainWarp}(p) \times \text{warpStrength}$
  - 方向性波: $w_1 = \sin(\text{dot}(q, d_1) f_1 + t \cdot s_1) \cdot a_1$, $w_2 = \sin(\text{dot}(q, d_2) f_2 - t \cdot s_2) \cdot a_2$
  - ノイズ詳細: $\text{noise}(q \cdot scale + t \cdot speed) \cdot amp$
  - 変形後法線: 有限差分 ($\epsilon$) により接線ベクトル $T_x, T_y$ を求め、外積 $\text{normalize}(T_x \times T_y)$ で生成。
- **Fragment Shader**:
  - ライティング: Hemisphere Ambient + Spot Light (Lambert + Blinn-Phong Specular) + Fresnel
  - Ramp Signal: $S = \text{diffuse} \cdot w_{\text{light}} + \text{height}_{01} \cdot w_{\text{height}} + \text{fresnel} \cdot w_{\text{fresnel}} + \text{flowNoise} \cdot w_{\text{flow}} + \text{offset}$
  - Ramp Lookup: $T = \text{smoothstep}(\text{low}, \text{high}, \text{clamp}(S, 0, 1))$
  - カラー合成: $\text{rampColor} \times \text{lighting}$ に Specular と Fresnel Color を加算。

### 3. Tile Export Support
- `TileRenderOptions` (`fullWidth`, `fullHeight`, `offsetX`, `offsetY`, `tileWidth`, `tileHeight`) が指定された場合、Orthographic Camera の Viewport/Frustum Offset およびシェーダーの UV 原点 `(offsetX / fullWidth, offsetY / fullHeight)`、サイズ `(tileWidth / fullWidth, tileHeight / fullHeight)` を補正し、結合後に継ぎ目が一切発生しないように調整します。

### 4. Error Fallback & Lifecycle
- `try-catch` と初期化チェックを用意。Three.js の描画が何らかの理由で不可な場合は、既存 Base Gradient 描画パスを自動選択。
- メモリリーク防止のため `dispose()` で Geo, Mat, Tex, Renderer を安全に解放。
