# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | source review / browser partial | `src/components/PostprocessStackPanel.tsx`、ブラウザー通常画面 | partial: 通常画面でEffect Stack操作を確認。ポップアップはブラウザーが別タブとして公開せず、別rootの目視確認は未実施 |
| AC-002 | source review | `src/components/PostprocessStackPanel.tsx` | pass: 別rootをLanguageProvider／Tweeq Viewportでラップ |
| AC-003 | unit / source review | `src/lib/effectStackWindow.test.ts`、`src/lib/effectStackWindow.ts`、`src-tauri/capabilities/default.json` | pass: URL維持、ネイティブ作成タイムアウトのreject／cleanup、作成イベント取り逃し時のラベル存在フォールバック、非表示生成後の表示、WebviewWindow作成権限を確認 |
| AC-004 | source review / browser partial | close/reopen cleanup経路 | partial: cleanup経路は確認。ポップアップclose/reopenの目視は未実施 |
| AC-005 | source review / browser partial | Tauri event同期、通常Effect Stack操作 | partial: 既存同期経路は確認。別ウィンドウ相互操作の目視は未実施 |
| AC-006 | regression | 全Vitest、TypeScript、Vite build | pass |

## 判定

コード上の生成待機・権限・cleanup経路は検証済みだが、Tauri実機では別ウィンドウが生成後に正常表示・維持されない。したがって、別ウィンドウ化については未解決の既知問題として扱い、このchange全体は未完了とする。

## Commands

- `node.exe node_modules/typescript/bin/tsc -b --pretty false`
- `node.exe node_modules/vitest/vitest.mjs run`
- `node.exe node_modules/eslint/bin/eslint.js .`
- `node.exe node_modules/vite/bin/vite.js build`
- `node.exe tools/check-docs.mjs`
- `node.exe node_modules/vitepress/bin/vitepress.js build docs`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `node.exe node_modules/@tauri-apps/cli/tauri.js build --debug --no-bundle`

実行結果: TypeScript型チェック成功、Vitest 52ファイル／264テスト成功、ESLint 0エラー・24警告、Vite build成功、VitePress docs build成功、DocDD check成功、`cargo check`／`cargo test`成功（13件）。Tauri debug buildは既存の`src-tauri/target/debug/kagaribi_grad.exe`が起動中で標準出力先をロックしていたため、`CARGO_TARGET_DIR=C:\tmp\kgg-tauri-validation`を指定して実行し、検証用実行ファイルの生成を確認した。

## 確認済み範囲

- Glass V2のみを使用するGlass統合、TransmissionTint／HighlightTintの入力カラー化と上限調整を確認。
- エフェクトスタックのランダム順序変更と、現在位置からのイージング遷移を確認。
- Alt-ClickによるEFFECT-STACKソロ表示、再クリックによる復帰、非表示レイヤーの黄色`STAY`表示を確認。
- Tauri別ウィンドウ化のみ、生成後に表示されない／維持されない問題が残っている。

## 未確認事項

- Tauri別ウィンドウの作成成功、表示維持、相互操作、close/reopenは未解決。別ウィンドウ修正を完了条件にする場合は、追加修正と再検証が必要。
