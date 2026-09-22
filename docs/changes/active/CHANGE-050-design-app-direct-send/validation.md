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

## Figma Connector同梱の検証

- `npm run build:desktop`: 成功。K-GG本体とFigma Connectorの型確認・ビルドが完了。
- `npm run lint`: 成功。既存のFigma node名の制御文字サニタイズに必要なルール例外を明記した。既存warningは21件。
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`: 成功。
- `cargo check --manifest-path src-tauri/Cargo.toml`: 成功。
- `npm run docs:check`: 成功。
- `npm run change:check`: 成功。
- `git diff --check`: 成功。
- デバッグ用NSISパッケージ生成: 成功。`npx tauri build --debug --bundles nsis --target x86_64-pc-windows-msvc --config <一時的なupdater無効化設定> --ci`を実行し、`KAGARIBI Grad_1.1.0_x64-setup.exe`を生成した。Tauriのリソースステージング先に`connectors/figma/manifest.json`、`connectors/figma/dist/main.js`、`connectors/figma/src/ui.html`が配置されることを確認。
- ViteはTauri APIのstatic/dynamic import混在とmain chunkサイズに関する既存警告を出したが、ビルドは成功。
- Figma Desktopでのmanifest登録、Connector起動、実際の画像受信は未確認。Release Observationで確認する。
- この変更ではテストを追加・実行していない。
