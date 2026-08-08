# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | source review | `src/components/PostprocessStackPanel.tsx`、`src/components/GradientRamp.tsx` | pass: 別ウィンドウ操作ボタンとPiP／ポップアップ処理を削除し、インライン表示のみに統一 |
| AC-002 | source review | `src/components/PostprocessStackPanel.tsx`、`src/components/GradientRamp.tsx` | pass: `togglePiP`、`pipWindow`状態、`documentPictureInPicture`、`window.open`関連コードを削除 |
| AC-003 | source review / Tauri実機 | `src-tauri/capabilities/default.json`、`src/main.tsx` | pass: `DetachedEffectStackApp.tsx`、`effectStackWindow.ts`、`effect-stack.json`capability、`main.tsx`分岐を削除。Tauriで別ウィンドウUIが表示されないことを実機確認 |
| AC-004 | source review / regression | `src/i18n/messages.ts`、`docs/development/ui-terminology.md` | pass: 未使用のi18nメッセージキー（`common.detach`、`stack.detach`、`stack.restore`、`gradient.pipUnsupported`）とUI用語辞書の記述を削除 |
| AC-005 | regression | 全Vitest、TypeScript、Vite build、ESLint、docs check、cargo | pass |

## 判定

別ウィンドウ化（Document Picture-in-Picture、ポップアップ、Tauriネイティブ`WebviewWindow`）を廃止し、Effect Stackを常にインライン表示のみで提供する方針へ変更した。TauriのWebView2環境で別ウィンドウ化が安定動作しないことを実機で確認したため、関連コード・i18nメッセージ・capabilityを削除した。実機のインライン表示受け入れ確認までactiveに保持する。

## Commands

- `node.exe node_modules/typescript/bin/tsc -b --pretty false`
- `node.exe node_modules/vitest/vitest.mjs run`
- `node.exe node_modules/eslint/bin/eslint.js .`
- `node.exe node_modules/vite/bin/vite.js build`
- `node.exe tools/check-docs.mjs`
- `node.exe node_modules/vitepress/bin/vitepress.js build docs`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`

実行結果: TypeScript型チェック成功、Vitest 53ファイル／289テスト成功、ESLint 0エラー・警告のみ、Vite build成功、docs check成功、`cargo check`／`cargo test`成功。

## 確認済み範囲

- Effect Stackのインライン表示、ランダム順序変更、ソロレイヤー、ドラッグ並べ替えは既存動作を維持。
- Tauri実機で別ウィンドウ操作ボタンが表示されないことを確認。
- TauriのWebView2環境で`WebviewWindow`が16×16極小になる問題を実機で再現確認（`width`/`height`指定・事前定義・`visible`設定の組み合わせをすべて試行）。
- TauriのWebView2環境で`documentPictureInPicture.requestWindow()`と`window.open`が失敗することを実機で再現確認。

## 未確認事項

- 実機でのインラインEffect Stackの受け入れ確認（ランダム順序・ソロレイヤー・ドラッグ並べ替えの目視）は未実施。
