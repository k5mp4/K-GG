# 検証記録: CHANGE-020-distort-float32-precision

## 検証結果

| ID | 内容 | 確認方法 | ステータス |
| --- | --- | --- | --- |
| AC-001 | WebGLContext の manualDistortTexture の Float32 化 | unit / source review | pass: `src/lib/webgl.ts` で `RGBA32F` と `FLOAT` による初期化とバッファ更新を確認 |
| AC-002 | uploadManualDistortMap での Float32Array 転送と量子化丸め除去 | unit / source review | pass: `Math.round(...) * 255` を削除し `Float32Array` で連続浮動小数点値を直接転送 |
| AC-003 | ビルド・テスト・ドキュメント統合検証 | npm test, npm run docs:check, npm run build | pass: 53テストファイル全パス、docs:checkパス |

## 判定

| 対象 | 結果 |
| --- | --- |
| 全受け入れ条件 | pass |

## 備考

- 実装は当初 `RGBA16F` だったが、承認済み仕様（`RGBA32F`）と一致させるため `RGBA32F` へ修正した（2026-08-05）。
- 浮動小数点テクスチャのリニアフィルタリング（`OES_texture_float_linear`）とFBOアタッチメント（`EXT_color_buffer_float`）の拡張取得は CHANGE-021 で追加されており、`RGBA32F` の利用にも必要。
