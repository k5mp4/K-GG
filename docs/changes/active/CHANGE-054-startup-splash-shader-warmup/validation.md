# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit | `src/lib/webglCompilePolicy.test.ts` | pass |
| AC-002 | unit | `src/lib/shaderWarmup.test.ts` | pass |
| AC-003 | unit / manual | `src/lib/shaderWarmup.test.ts`、Effect Stack行ホバー後の有効化 | unit pass / manual pending |
| AC-004 | manual | Chromium（SwiftShader）でJavaScript無効時の静的ポスターと、React起動後の引き継ぎをDOM記録で確認。Tauriは未確認 | browser pass / Tauri pending |
| AC-005 | unit / manual | `src/features/splash/splash.test.ts`、Chromium（SwiftShader）で`showing → exiting → fading`の遷移を確認 | pass |
| AC-006 | unit | `src/features/splash/splash.test.ts` | pass |
| AC-007 | manual / e2e | `VITE_KGG_E2E=1`のDevelopment起動で、オーバーレイが出ずポスターが除去されることを確認。`npm run check:e2e`は未実行 | manual pass / e2e pending |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pass（lint警告は既存のみ） |
| Render checks | `npm run check:render` | pass |

## Release Gate

- 実GPU（Windows WebView2／ANGLE、macOS WKWebView）で、起動後にEffect Stackの各行を初めて有効にしたときの待ち時間が短縮していることを確認する。
- Tauri起動でスプラッシュが表示され、最大4秒以内に閉じることを確認する。

## Observation

- SwiftShaderはKHR並列Shaderコンパイルを提供しないため、この環境ではbackground warmupが設計どおりスキップされることだけを確認した。warmupの実効果は実GPUで確認する。

- 低スペックGPUで事前準備中のフレーム落ちやメモリ増加がないか。
- `prefers-reduced-motion`有効時の表示。

## Commands

- `npm run change:check`
- `npm run check:merge`
- `npm run check:render`
