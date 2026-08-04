# Validation

受け入れ条件を実装前に定義し、実装後に自動検証結果と手動確認の未実施項目を記録する。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `src/types/distortion.ts`, DiffuseパネルのInputDrum | partial |
| AC-002 | shader parity / manual | `src/lib/effectShaderParity.test.ts`, WebGLキャンバス | partial |
| AC-003 | shader parity / manual | ASCII文字列変更後のWebGLキャンバス | partial |
| AC-004 | unit / manual | 適応ソース・2本のBezier・粒度変化 | partial |
| AC-005 | manual | Diffuseパネルのコンパクト表示 | manual |
| AC-006 | unit / manual | `src/lib/sceneEvaluation.glass.test.ts`, duration変更時のSlit再生 | partial |
| AC-007 | manual | Stretch Glow Tint、Postprocess Distort Brush Mode | manual |
| AC-008 | preset / unit | 旧Diffuse presetの読み込み | partial |
| AC-009 | unit / shader parity / manual | Halftone／ASCIIの背景色、ASCII描画、粒度適応時のセル形状 | partial |

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
