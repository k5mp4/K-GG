# Validation

計測環境: Windows 11、NVIDIA GeForce RTX 3060 Ti、Playwright Chromium（`--use-angle=d3d11 --enable-gpu`、ANGLE Direct3D11）。WebView2と同じANGLE/Direct3D11経路だが、Tauri上のWebView2では未計測。コンパイル時間はShaderキャッシュを避けるため新しいプロファイルで計測した。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| 最初のGPU描画が数秒以内に表示される | 本番ビルド（`vite build` + `vite preview`）の起動ログ | bootstrap `gradient`のcompile completed時刻 | 変更前 11.5秒 → 変更後 3.2秒 |
| スプラッシュ後のEffect有効化が数秒以内に反映される | 開発サーバーでスプラッシュ後にEffect Stackの行を順に有効化し、Canvasの変化までの時間を計測 | Voronoi（stackCore待ち）1.3秒、Kaleidoscope／Slit／Noise／Glass 0.1〜0.3秒、Texture 0.9秒 | 変更前はスプラッシュ後20秒以上変化なし（`generator`のコンパイル完了が約112秒後） |
| 全Program（全Noise variantを含む）がWebGL2でコンパイル・リンクできる | e2e | `tests/e2e/shaders.spec.ts`（22 + 13×3 Program） | pass |
| 同じシーンの描画結果が変わらない | 変更前後の開発サーバーで同一シーンを描画し、1920×1080のCanvas画素を比較 | 既定／Slit+Mirror／analytic Noise（fbm）／Stack pass Noise（Perlin）／Legacy Noise（Ridged fBm） | 既定 4px、Slit+Mirror 161px、analytic Noise 22pxが最大1/255の差。Stack pass Noise（Perlin）は完全一致。Legacy Noiseは表示サイズのスクリーンショットで365,304px中323pxが最大1/255の差 |
| Generator variant準備後にanalytic描画へ切り替わる | 停止中のPreviewでNoise（AE Fractal）を有効化し、`useProgram`の呼び出しを記録 | 代替描画（Stack pass）の後、`generator:7`の準備完了イベントで再描画され、新しいProgramで描画された | pass |
| variantの選択とNoiseの分岐ガード | unit | `src/lib/webglExportPrograms.test.ts`、`src/lib/webglShaderSources.test.ts` | pass |
| 破棄時に全variantを解放する | unit | `src/lib/webgl.lifecycle.test.ts` | pass |

### コンパイル時間（fxc、1回ごとの実測。±30%程度ばらつく）

| Program | 変更前 | 変更後 |
| --- | --- | --- |
| bootstrap（`gradient`） | 5.0〜9.3秒 | 1.3〜1.7秒 |
| `generator` | 98〜127秒 | variant 4〜10秒（Noiseなしのシーンではコンパイル不要） |
| `stackCore` | 5.4〜9.2秒 | 1.8〜2.7秒 |
| `noiseStack` | 44秒 | 0.05〜1.8秒 |
| `noiseDiffuseStack` | 未完了（計測中に打ち切り） | 0.1秒 |
| 全warmup完了 | 137秒以上 | 18.6秒（本番ビルド） |

### メモリ（Chromium、本番ビルド、起動後に待機）

| 項目 | 変更前 | 変更後 |
| --- | --- | --- |
| GPUプロセス private（起動後安定時） | 222MB（コンパイル継続中） | 175MB |
| GPUプロセス private（ピーク） | 346〜391MB | 348〜353MB |
| JSヒープ（GC後） | — | 25MBで増加なし（GC前は最大約100MBまで一時的に増える） |
| WebGLのTexture（1920×1080、5 Effect有効） | — | 約25MB + 描画バッファ16MB |

ピークのメモリは同程度で、変更による大きな削減は確認できなかった。削減できたのは、巨大Shaderのコンパイル中にGPUプロセスが高負荷・高メモリの状態が続く時間（数分→数十秒）である。

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pending |
| Shader compile | `npm run check:render` | pass |

## Release Gate

- Tauri（WebView2）の本番ビルドで、起動からスプラッシュ終了、Effect Stackの各行の有効化までの待ち時間と、タスクマネージャーでの`msedgewebview2.exe`のメモリを確認する。未確認。
- 低性能CPUのWindowsで、Perlinなど重いNoise種別のGenerator variantが30秒のwatchdog内にコンパイルされるか確認する。未確認。

## Observation

- Legacy pipelineの汎用`postprocess` Programは約4.5〜8分のままである（本Changeの対象外）。
- macOS（ANGLE Metal）での差は未計測。

## Commands

- `npm run docs:check`
- `npm run change:check`
