# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | browser interaction | Color Mode／InterpとHarmonyのプレビュー切替 | pass |
| AC-002 | browser DOM / visual | 基準色・配色ルールの1列2段レイアウト | pass |
| AC-003 | browser DOM / interaction | VariableのTweeq InputNumberと値域 | pass |
| AC-004 | browser interaction | 日本語／英語のHarmonyルール名 | pass |
| AC-005 | typecheck / unit / build | 保存値・既存計算・既存テスト | partial |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Results

- TypeScript Compiler APIによる`tsconfig.app.json`の型検査: diagnostics 0。
- ESLint APIによる`src`検査: errors 0、warnings 24。警告は既存警告として残っています。
- ブラウザー確認: Color Mode／Interpだけを表示した状態はプレビューグループ2、Harmonyだけを表示した状態はプレビューグループ1、両方を表示した状態は3となり、切替ボタンは独立して動作しました。
- ブラウザー確認: 基準色と配色ルールは左端が揃い、基準色が上、配色ルールが下の1列2段で表示されました。
- ブラウザー確認: Variable領域は`data-tq-input-number`を1つ含み、native `input[type="range"]`は0でした。値は0.000、値域はコード上で-1〜1、step 0.001に設定しています。
- ブラウザー確認: 英語UIでHarmony ruleと8種類の英語ルール名、日本語UIで配色ルールと既存の日本語名を確認しました。
- `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build`: 実行環境で`npm`および`node`がPATHに存在せず、未実行。CIまたはNode.js/npmが利用可能な環境で再実行が必要です。

## Browser manual

承認後に、Color Mode／Interpだけ、Harmonyだけ、両方、どちらも非表示の4状態を確認します。基準色と配色ルールのDOM順・幅、Variableの`data-tq-input-number`、英語UIでの8ルール名と日本語UIでの既存名を確認します。
