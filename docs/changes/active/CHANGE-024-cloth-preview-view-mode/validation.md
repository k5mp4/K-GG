# Validation

| AC | 検証方法 | 結果 |
| --- | --- | --- |
| AC-001 | `SandboxPanel`から`ClothGradientPanel`へのprops配線、既定値、モードUI配置を静的確認 | wiring review pass; latest TypeScript/Vite rerun blocked by missing Node runtime; browser manual pending |
| AC-002 | `GradientCanvas`のCloth Base抑制、`ClothGradientRenderer.renderMappedTexture`のCanvasTexture入力、既存全テスト | code path pass; browser manual pending |
| AC-003 | Renderer失敗経路とCanvas維持のコード確認 | automated pass; browser manual pending |
| AC-004 | Preset保存経路が表示モードを保持せず、2Dモードは既存Canvas、3DモードはPreview Cloth Canvasを出力対象にする配線を静的確認 | code path pass; browser/manual export pending |
| AC-005 | `VideoExportFrameRenderer`、`renderAndCaptureExportFrame`の合成経路、3Dフレームキャプチャテストを確認 | code path and test added; runtime rerun blocked by missing Node runtime |

## Commands

- `git fetch origin` — passed
- `git pull --ff-only origin main` — passed; `main`を`4907e60`から`3a993c1`へ同期
- `tsc -p tsconfig.app.json --noEmit` — passed
- `vitest run tests/clothGradient.test.ts src/lib/clothView.test.ts` — 2 files / 11 tests passed
- `vitest run` — 54 files / 291 tests passed
- `eslint.js .` — 0 errors, 21 existing warnings
- `vite.js build` — passed; 368 modules transformed; existing chunk-size／Tauri dynamic import warning remains
- `git diff --check` — passed
- `git diff --check` — passed again after moving the view switch into the Cloth Gradient property module
- `git diff --check` — passed again after switching Cloth preview to direct CanvasTexture mapping
- `node_modules/.bin/tsc.cmd -p tsconfig.app.json --noEmit` — blocked by the current shell: `node` is not available on PATH
- `node_modules/.bin/vitest run src/lib/videoExportFrames.test.ts` — blocked by the current shell: `node` is not available on PATH
- `deno check --node-modules-dir src/lib/videoExportFrames.test.ts` — blocked while resolving npm packages because registry access is denied; no alternate TypeScript runtime was available
- `npm run docs:check` — blocked by the current shell: `npm` is not available on PATH

## 未確認事項

- Browser接続がWebView attach timeoutになったため、実ブラウザーでのCanvas／Cloth切替、実GPU上のクロス見た目、Renderer失敗時の実機フォールバックは未確認。
- 3DモードのPNG／JPG／WebP、連番PNG ZIP、MOV／MP4の実ファイル出力と、動画各フレームのGPU上の見た目はNode／ブラウザー実行環境が復旧するまで未確認。
- `npm`ラッパーではなく、同じNode実行環境からCLIを直接実行した。
