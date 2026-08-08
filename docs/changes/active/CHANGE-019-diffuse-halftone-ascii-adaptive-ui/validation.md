# Validation

受け入れ条件を実装前に定義し、実装後に自動検証結果と手動確認の未実施項目を記録する。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `src/types/distortion.ts`, DiffuseパネルのInputDrum | partial |
| AC-002 | shader parity / manual | `src/lib/effectShaderParity.test.ts`, WebGLキャンバス | partial |
| AC-003 | shader parity / manual | ASCIIアトラスのY反転除去、`src/lib/effectShaderParity.test.ts`, WebGLキャンバス | partial |
| AC-004 | unit / manual | 適応ソース・2本のBezier・粒度変化（Block/Smoothの拡散セルサイズへの反映を含む） | partial |
| AC-005 | manual | Diffuseパネルのコンパクト表示 | manual |
| AC-006 | unit / manual | `src/lib/sceneEvaluation.glass.test.ts`, duration変更時のSlit再生 | partial |
| AC-007 | manual | Stretch Glow Tint、Postprocess Distort Brush Mode | manual |
| AC-008 | preset / unit | 旧Diffuse presetの読み込み | partial |
| AC-009 | unit / shader parity / manual | Halftone／ASCIIの背景色、ASCII描画、粒度適応時のセル形状（セル内座標をベースセル基準へ固定し、形状サイズをセルサイズ比でスケール、Block/Smoothの拡散セルへも反映） | partial |

## 不具合修正（ASCII描画とアダプティブグレイン）

CHANGE-019の実装後に報告された2つの描画不具合を修正した。

1. **ASCIIが描画されない**: ASCIIアトラスは`UNPACK_FLIP_Y_WEBGL = 0`でアップロードされる（Canvasのrow 0がテクスチャv=0）のに、シェーダーは`1.0 - atlasUv.y`でサンプリングしていた。row 0の文字セルはv=0.75〜1.0、つまり空のrow 3を参照するため、文字が表示されず背景色だけになった。シェーダーを`atlasUv`の直接サンプリングへ変更し、row 0の文字が正しく描画されるようにした（`src/shaders/postprocess/diffuse.glsl`、`src/shaders/gradient.frag.glsl`）。
2. **アダプティブグレインのセル形状が崩れる**: `diffuseCellFraction`がセル内座標を`cellSize`で割っていたため、粒度適応時にドット／文字の大きさが粒度と逆方向に変化し、セル境界も不均一になった。セル内座標をベースセルサイズ基準（`baseSize`）で固定し、Halftoneの半径とASCIIの文字を`cellSize / baseSize`倍でスケールするよう修正した。粒度適応を無効にした場合は従来と同じ見た目になる（`diffuseCellFraction`、`applyDiffuseHalftone`、`applyDiffuseAscii`）。
3. **アダプティブグレインがBlock/Smoothへ反映されない**: 粒度適応はHalftone/ASCIIのセルサイズにのみ実装されており、Block/Smoothの拡散セルサイズは`u_diffuseGrain`固定だった。`diffusePanelDisplacement`（Stack）とBlock/Smooth拡散（Legacy）のセルグリッドを`diffuseCellSizeAtCoord`で求めた適応粒度（`cellSize`）で分割するよう変更し、グレインカーブとアマウントが拡散セルサイズへ反映されるようにした。
4. **アダプティブセルの斜め変形と形状のはみ出し**: `diffuseDomainWarp`がX/Y相互混在のsin（シアー）を使っていたため、粒度が変わるたびにセルが斜めに変形して見えた。等方的なワープへ変更し、セルがアスペクト比を維持したまま拡大するようにした。また`applyDiffuseHalftone`／`applyDiffuseAscii`が`cellScale`でセル内座標を拡大していたため、ドットや文字が隣セルへはみ出していた。セルフラクションをそのまま使い、形状・グリフが自分のセル内に収まるようにした。

## 実行結果

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `npm test -- --run` | pass | 53 files / 280 tests。Node 24.12.0で実行 |
| `npm exec vitest run src/lib/sceneEvaluation.glass.test.ts src/lib/presetThumbnail.test.ts src/lib/effectShaderParity.test.ts src/lib/videoExportFrames.test.ts` | pass | Slit速度同期・旧Preset互換・shader parity・書き出し計算の対象41 tests |
| `npm run lint` | pass | エラーなし。既存warning 24件 |
| `npm exec tsc -- --noEmit --pretty false` | pass | 追加した背景色型とWebGL uniform配線を含む型検査成功 |
| `npm run build` | pass | TypeScript／本番Viteビルド成功。既存のchunk-size warningあり |
| `npm run docs:check` | pass | 41 legacy specs、5 current specs、9 changes、14 ADRsを検査 |
| `npm run docs:build` | pass | dead linkなしでドキュメントサイト生成成功 |
| `git diff --check` | pass | 空白エラーなし |
| `npx vitest run` | pass | 不具合修正後の全54 files / 292 tests。shader parityテストをASCIIアトラス直接サンプリング・粒度スケール・Block/Smoothへの粒度反映の検証へ更新 |

自動テストはDiffuseの5モードuniform parity、Halftone／ASCIIのフラグメント解像度サンプリング、指定背景色のuniform配線、RGBマスクによるASCIIアトラス、ベースセル単位の粒度適応、暗部セルの不透明出力、固定ASCIIアトラス行、通常／Glass専用Postprocess shaderの条件分岐、Slitの速度調整済みアニメーション時計、Timeline Loopの除去、Loop／PingPong速度、静止条件、パラメータ制限を確認した。WebGLキャンバス上のHalftone／ASCIIの最終的な見た目、コンパクトUI、Stretch／Distortの操作感、旧Presetの実機読み込みは未実施のため、該当項目はpartialまたはmanualとして残している。

## Commands

- `npm test -- --run`
- `npm exec vitest run src/lib/sceneEvaluation.glass.test.ts src/lib/presetThumbnail.test.ts src/lib/effectShaderParity.test.ts src/lib/videoExportFrames.test.ts`
- `npm run lint`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`
- `npm run docs:check`
- `npm run docs:build`
- `git diff --check`
