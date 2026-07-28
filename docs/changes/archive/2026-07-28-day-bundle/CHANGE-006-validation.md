# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | browser interaction | SHOW PREVIEWSのColor Mode／Interpグリッド | pass |
| AC-002 | browser interaction | SHOW PREVIEWS無効時のCustomSelect | pass |
| AC-003 | browser DOM / visual | 補間方式候補名と保存値 | pass |
| AC-004 | browser interaction | Color Palette Generatorの配色ルール一覧 | pass |
| AC-005 | browser screenshot / DOM | GradientRampのストップ編集と候補展開順序 | pass |
| AC-006 | typecheck / unit / build | Gradient、Preset、配色計算の既存テスト | partial |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Results

- TypeScript Compiler APIによる`tsconfig.app.json`の型検査: diagnostics 0。
- ブラウザー確認: SHOW PREVIEWS有効時はColor Mode／Interp／配色ルールの実色グリッドを表示し、HSV・トライアドをグリッドボタンから適用できた。有効時に`aria-expanded`付きの通常トリガーは表示されなかった。
- ブラウザー確認: SHOW PREVIEWS無効時はプレビューグリッドが消え、HSV・Nearを通常セレクトトリガーから確認できた。
- ブラウザー確認: 補間候補は`Near`等の英語名で表示された。配色ルールは8候補を実色チップ付きで表示し、各候補のチップ数は2〜6だった。
- ブラウザー確認: ストップ編集キャンバスのDOM位置はカラーモードラベルより前で、候補展開後も順序が維持された。
- `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build`: 実行環境で`npm`および`node`がPATHに存在せず、未実行。CIまたはNode.js/npmが利用可能な環境で再実行が必要。

## Browser manual

SHOW PREVIEWSのグリッドだけでColor Mode／Interpを適用できること、無効時のセレクト操作が維持されること、配色ルールの実色プレビュー一覧、ストップ編集の位置安定性を確認済み。npm系コマンドはNode.js/npm不在のため未確認。
