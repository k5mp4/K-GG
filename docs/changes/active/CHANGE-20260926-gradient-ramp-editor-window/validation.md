# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | Tauri manual | `npm run tauri:dev`でボタンを押す | pass: Windows実機で正常なサイズのウインドウが生成された（2026-09-26、利用者確認）。2回目の前面化は未確認 |
| AC-002 | unit / Tauri manual | `src/adapters/tauri/gradientRampEditorWindow.test.ts`、両ウインドウで相互に編集 | unit pass / manual pass: 初回実装は反映に大きな遅れ（イベント滞留）→ ACK流量制御を追加し、利用者確認で解消（2026-09-26） |
| AC-003 | Tauri manual | エディタでUndo／Redoボタンと Ctrl+Z／Ctrl+Y | pass: 利用者確認（2026-09-26） |
| AC-004 | Tauri manual | メイン終了時にエディタが残らないこと | pending |
| AC-005 | browser manual / source review | `src/components/GradientRamp.tsx`の`openEditor` | pass: ブラウザー版（Vite dev）でボタンからフローティングエディタが開き、Close操作が表示され、コンソールエラーなし（DOM確認） |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:fast` | pass: docs check/build、Vitest 115ファイル／620テスト、ESLint 0エラー（既存警告21件）、Vite build |
| Native | `npm run check:native` | pass: cargo test 57 passed／2 ignored、cargo check 警告なし |

## Release Gate

- Windows（WebView2）の実機で、エディタウインドウが正常なサイズで描画されること（CHANGE-015で再現した16×16の極小ウインドウが出ないこと）。
- macOSで同じ操作が動くこと。

## Observation

- 再生中にエディタを開いたままにしたときのメインのフレームレート。
- 両ウインドウで同じストップを同時に操作したときの挙動。

## Commands

- `npm run docs:check`
- `npm run change:check`
