# Delta: CHANGE-021-cloth-gradient

## ADDED Requirements

### CLOTH-001 SANDBOX 3D 布メッシュ Base Generator
SANDBOX内に Three.js (`ClothGradientRenderer`) を用いた 3D 布状メッシュ描画モジュールを追加する。波打つ頂点変形、変形後法線計算、環境光・スポットライトによる立体陰影処理を適用し、K-GG 既存の Gradient Ramp (`stops`, `opacityStops`, `rampInterpolation` 等) からの色決定結果（Ramp Lookup）を統合してビジュアルを生成する。

### CLOTH-002 オフスクリーンテクスチャ転送と Effect Stack 完全分離
Three.js の描画は非表示 Offscreen Canvas で行い、そのレンダリング結果を K-GG の WebGLContext 側 `ctx.gradTexture` へ `gl.texSubImage2D` で転送する。画面上に直接別 Canvas を重ねず、既存の全 Effect Stack (Noise, Slit, Stretch, Distort, Mirror, Kaleidoscope, Voronoi, Glass, Diffuse, Normal Map, Prism, Particles) への入力 Base Texture として供給する。

### CLOTH-003 Preset 永続化とエラーフォールバック
Cloth Gradient の全パラメータ (Surface Wave, Organic Motion, Lighting, Specular, Fresnel, Ramp Mapping, Quality) は Preset およびストアに永続化され、旧 Preset 読み込み時も安全に初期化される。レンダラーの初期化や描画に失敗した場合は黒画面を起こさず既存 Base Gradient に自動フォールバックする。

## MODIFIED Requirements

### SANDBOX-001 SANDBOX パネルモジュールの拡張
SANDBOX パネルのモジュール選択肢に `Cloth Gradient` を追加し、アクティブカウント表示を `4/4` に更新する。モジュールの ON/OFF 状態およびプログラミングステータス（applied / fallback / preparing）を UI 上に可視化する。

## REMOVED Requirements

なし
