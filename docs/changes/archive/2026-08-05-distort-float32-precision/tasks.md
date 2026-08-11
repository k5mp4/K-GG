# タスク一覧: CHANGE-020-distort-float32-precision

- [x] `src/lib/webgl.ts` の `initWebGL` における `manualDistortTexture` の初期化処理を `RGBA32F` / `FLOAT` へ変更
- [x] `src/lib/webgl.ts` の `uploadManualDistortMap` におけるデータ配列を `Float32Array` へ変更し、`gl.FLOAT` で転送
- [x] ビルド、テスト、`npm run docs:check` の検証実行と `validation.md` の記録
