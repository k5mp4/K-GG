# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | Tauri manual / browser manual | `npm run tauri:dev`、ブラウザー版 | browser pass: 別ウインドウボタンは表示されず`Stack V2`を表示（DOM確認）／ Tauri pass: 利用者確認（2026-09-26） |
| AC-002 | unit / Tauri manual | `src/features/effectStack/effectStack.test.ts`（view・intent往復） | unit pass / browser pass: インラインでON／OFF、選択、ランダム化（行の開始位置オフセット→完了、ボタンの無効化と復帰）、マウスでのドラッグ並べ替えを確認。rAFが止まった状態でもランダム化が完了する |
| AC-003 | Tauri manual | ウインドウとメインを閉じる | pass: 利用者確認（2026-09-26） |
| AC-004 | unit | `src/features/effectStack/effectStack.test.ts`、`src-tauri/src/tool_windows.rs`（未知のウインドウ名を拒否） | pass |
| AC-006 | component / browser | `src/components/PostprocessStackPanel.test.tsx`（window variantのスクロール構造）、ブラウザーでwindow variantを200×300・幅180／200pxで描画 | pass: ヘッダー固定のまま行が縦スクロールし最後の行のトグルまで表示。幅180pxでもボタン・トグルは表示範囲内（名前は省略）、200pxでは省略なし |
| AC-006a | browser（実ページ構成の再現） | 本文の`index.css`とwindow variantを220×300のiframeで描画 | pass: 修正前は`body`の`min-width: 320px`でページ幅が320pxになり、右端のヘッダーボタンとトグル（x≈307–312px）がウインドウ外に出て消えていた（利用者報告と一致）。`html[data-tool-window]`で最小幅を外した後はすべて幅218px内に表示。Tauri実機でも利用者確認で解消（2026-09-26） |
| AC-007 | component / browser | `src/components/PostprocessStackPanel.test.tsx`、ブラウザーのインラインパネル | pass: 分類ラベルなし、幅200pxでタイトル・レイヤー名・状態の省略なし、Histogramは216pxの位置 |
| AC-005 | component / browser manual | `src/components/PostprocessStackPanel.test.tsx`、ブラウザー版で操作 | unit pass / browser pass: インラインでON／OFF、選択、ランダム化（行の開始位置オフセット→完了、ボタンの無効化と復帰）、マウスでのドラッグ並べ替えを確認。rAFが止まった状態でもランダム化が完了する |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:fast` | pass: Vitest 116ファイル／627テスト、ESLint 0エラー、build。その後の小修正（WindowRoot分離、ランダム化の完了タイマー）は型チェック・lint・関連テスト46件で再確認 |
| Native | `npm run check:native` | pass: cargo test 59 passed／2 ignored（tool_windowsの2件を含む）、警告なし |

## Release Gate

- Windows（WebView2）とmacOSで、Effect Stackウインドウの生成・操作・閉じる動作。

## Observation

- 再生中・重いエフェクト構成で、別ウインドウ操作からキャンバス反映までの遅延。

## Commands

- `npm run docs:check`
- `npm run change:check`
