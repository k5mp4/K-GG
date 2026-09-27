# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| Effect StackでDatamoshをON/OFFでき、PostprocessのEdit Layerで設定できる | manual（headless Chromium、UI操作） | Effect Stack → Datamosh、Postprocess → Edit Layer → Datamosh | pass |
| 履歴を使った崩れ表現が出る | manual（headless Chromium + SwiftShader、アニメーション再生中の画面取得） | Noise + Datamosh（既定値、Block Variance 0.5、Luma Stretch 0.8、Saturation Stretch 0.5） | pass（大きさの異なるブロック、色ごとに長さの違う筋状の引きずり、破損を確認） |
| 設定の正規化と旧Video Motionの移行 | unit | `src/types/datamosh.test.ts` | pass |
| DatamoshがEffect Stackレイヤーとしてtexture経路で描画され、旧`videoMotion`が同じ位置へ写像される | unit | `src/lib/effectPipeline.test.ts` | pass |
| Export用programにdatamoshが含まれ、shaderが3 chunkで組み立てられる | unit | `src/lib/webglExportPrograms.test.ts` | pass |
| Datamosh設定とEffect Stackレイヤーの有効状態が同期する | unit | `src/store/gradientStore.effectPipeline.test.ts` | pass |
| PostprocessにDatamoshパネルが常時mountされる | component | `src/components/PostprocessPanel.test.tsx` | pass |
| datamosh programがWebGL2でcompile/linkする | e2e | `tests/e2e/shaders.spec.ts`（`npm run check:render`） | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | 結果はPRに記載 |
| Shader compile | `npm run check:render` | pass |

## Release Gate

- 実GPUでのDatamosh有効時のフレーム時間（1920×1080）。headlessのSwiftShaderではDatamoshのON/OFFで差が出ないほど基盤が遅く、測定できていない。
- Video Motion sourceで実動画を読み込み、Preview再生とExportで同じ崩れ方になること。
- Tauri版での動作（`npm run tauri:dev`で起動は確認済み、画面操作は未確認）。

## Observation

- 旧Video Motion Presetを読み込んだときの見た目の差（Stabilization非対応）。
- 長時間再生時のLINEAR再サンプルによる履歴のぼけ具合。

## Commands

- `npm run docs:check`
- `npm run change:check`
