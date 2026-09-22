# Validation

## Merge Gate

- `npm run typecheck`: 成功。
- `npm run build`: 成功。ViteはTauri APIのstatic/dynamic import混在とmain chunkが500 kBを超える警告を出した。buildとE2E bridge marker確認は完了。
- `npm --prefix connectors/figma run build`: 成功。
- Figma UI scriptの`node --check`（`ui.html`からscriptを抽出）: 成功。
- `npm --prefix connectors/affinity run build`: 成功。
- `cargo fmt --check`: 成功。
- `cargo check`: 成功。
- `npm run docs:check`: 成功。
- `npm run docs:build`: 成功。
- `npm run change:check`: 成功。
- 自動テストは追加・実行していない。

## Release Observation

- Figma DesktopへDevelopment Pluginとして登録し、接続リクエスト、K-GG上での許可、dynamic pageの読込、PNG受信、選択中のK-GG画像の更新、選択対象がないときの新規配置、同じtransfer IDの再配信防止、45秒以内の失敗結果返却を確認する。
- Figma Pluginでの実機確認は未実施。connector buildの成功はアプリ内の接続・受信確認に置き換えない。
- Affinityの実機導入と受信確認は、公式SDKの登録・配布手順および生成物適合の確認後に行う。

## Affinity一時停止の検証

- `npm run typecheck`: 成功。
- `cargo check --manifest-path src-tauri/Cargo.toml`: 成功。
- `npm run docs:check`: 成功。
- `npm run change:check`: 成功。
- Affinity本体での登録・受信確認: 公式の登録仕様確認後に行う。
