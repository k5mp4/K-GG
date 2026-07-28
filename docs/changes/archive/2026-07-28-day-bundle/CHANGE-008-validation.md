# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | browser DOM / visual | Harmony見出しとShow／Hide previewsの同一行 | pass |
| AC-002 | browser DOM / visual | 説明文の独立行と狭幅折り返し | pass |
| AC-003 | browser DOM | `Local`表示の削除 | pass |
| AC-004 | browser interaction | Harmony候補、基準色、プレビュー切替の回帰 | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Results

- ブラウザー確認: Harmony見出しとShow／Hide previewsは同じヘッダー行に重なりなく表示され、説明文はその下の独立行に配置されました。右サイドバー幅261pxで説明文は高さ15px・幅235pxとなり、縦長化しませんでした。
- ブラウザー確認: Harmonyセクション内に`Local`文字列が存在しません。
- ブラウザー確認: Harmonyプレビューを有効化し、トライアドを候補グリッドから選択できました。プレビューグループは1つで、既存の配色補助操作を維持しています。
- TypeScript Compiler APIによる`tsconfig.app.json`の型検査: diagnostics 0。
- ESLint APIによる`src`検査: errors 0、warnings 24。警告は既存警告として残っています。
- `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build`: 実行環境で`npm`および`node`がPATHに存在せず、未実行。CIまたはNode.js/npmが利用可能な環境で再実行が必要です。

## Browser manual

右サイドバーを通常幅・狭幅で表示し、Harmony見出しとプレビュー切替が同じ行、説明文が次行にあること、`Local`がないこと、既存操作が維持されることを確認します。
