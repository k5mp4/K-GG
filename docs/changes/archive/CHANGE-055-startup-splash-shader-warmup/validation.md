# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit | `src/lib/webglCompilePolicy.test.ts` | pass |
| AC-002 | unit | `src/lib/shaderWarmup.test.ts` | pass |
| AC-003 | unit / manual | `src/lib/shaderWarmup.test.ts`、Effect Stack行ホバー後の有効化 | unit pass / manual pending |
| AC-004 | manual | Chromium（SwiftShader）でJavaScript無効時の静的ポスターと、React起動後の引き継ぎをDOM記録で確認。黒い背景とアプリバージョンの表示に変更した後、Edge（Productionビルド）でJavaScript無効時と有効時のスクリーンショットを確認し、`K-GG`、中央の進捗バー、`v1.1.0`が表示され、引き継ぎの前後で位置が変わらないことを確認した。引き継いだポスターが進捗バーを覆っていた問題を修正した。Tauriは未確認 | browser pass / Tauri pending |
| AC-005 | unit / manual | `src/features/splash/splash.test.ts`、Chromium（SwiftShader）で`showing → exiting → fading`の遷移を確認。Edge（Productionビルド）でrequestAnimationFrameごとに記録し、準備未完了（10%）で閉じる場合もexitingで進捗バーが約0.2秒で100%まで伸び、約0.2秒保持してからフェードすることを確認 | pass |
| AC-006 | unit | `src/features/splash/splash.test.ts` | pass |
| AC-007 | manual / e2e | `VITE_KGG_E2E=1`のDevelopment起動で、オーバーレイが出ずポスターが除去されることを確認。`npm run check:e2e`は未実行 | manual pass / e2e pending |
| AC-008 | unit / manual | `src/features/splash/splash.test.ts`（候補の順序、コーデックによる除外、reduced motion）。Playwrightの同梱ChromiumとMicrosoft Edge（WebView2と同じエンジン）で、生成したAV1／H.264のMP4、アニメーションAVIF、GIF、PNGを使い、AV1優先の選択、壊れたファイルからGIFへのフォールバック、全候補失敗時のreject、reduced motionでの静止画・先頭フレーム停止、`finishOnExit`での再生完了、`dispose`での要素除去を確認。`brand.ts`を一時的に切り替えてアプリ起動でも表示と終了を確認。Tauri（WebView2／WKWebView／WebKitGTK）は未確認 デモ動画（H.264 High@5.0、1920×1080、5秒、29.6MB）でもProductionビルドとEdgeで表示を確認した。コールドスタート3回はいずれも0.3〜0.4秒で最初のフレームを表示し、サーバー起動直後の1回目だけ1.5秒の上限を超えて静的ポスターを表示した。既定の演出は静的ポスターのままとした | unit pass / browser pass / Tauri pending |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pass（lint警告は既存のみ） |
| Render checks | `npm run check:render` | pass |

## Release Gate

- 実GPU（Windows WebView2／ANGLE、macOS WKWebView）で、起動後にEffect Stackの各行を初めて有効にしたときの待ち時間が短縮していることを確認する。
- Tauri起動でスプラッシュが表示され、最大4秒以内に閉じることを確認する。
- ブランド用の画像・動画を採用する場合は、インストーラー容量の増加（例: デモ動画で約30MB）を許容できるか判断する。
- 同梱した画像・動画について、Windows（WebView2）、macOS（WKWebView）、Linux（WebKitGTK）でどの候補が表示されるか、および起動時間とインストーラー容量への影響を確認する。

## Observation

- SwiftShaderはKHR並列Shaderコンパイルを提供しないため、この環境ではbackground warmupが設計どおりスキップされることだけを確認した。warmupの実効果は実GPUで確認する。

- 低スペックGPUで事前準備中のフレーム落ちやメモリ増加がないか。
- PlaywrightからGUI付きで起動したEdge（Productionビルド、RTX 3060 Ti、新規プロファイル）では、WebGL初期化に約10秒、現在のシーンのcritical Shader 1件に約85秒かかった。スプラッシュは最大表示時間の4秒で閉じる（進捗バーは閉じる直前に100%まで伸ばす）。2回目の起動ではページがクラッシュした。Shaderキャッシュのない初回起動に特有かどうか、Tauri（WebView2）での再現を確認する。
- `prefers-reduced-motion`有効時の表示。

## Commands

- `npm run change:check`
- `npm run check:merge`
- `npm run check:render`
