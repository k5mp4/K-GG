# Validation

## Merge Gate

- `cargo test --manifest-path src-tauri/Cargo.toml`: 34件成功。追加した`design_app_bridge::tests`（Origin許可、要求ごとの新しいID、許可済み要求の置換拒否とtoken取得）を含む。Linux上でのみ発生する既存の`font_directories`のコンパイルエラーを一時的に回避して実行し、回避はコミットしていない。
- `cargo fmt --check --manifest-path src-tauri/Cargo.toml`: 成功。
- `npm run check:fast`: 成功。unit/component 112ファイル・611件成功、lint 0 errors（既存warning 21件）、frontend build、docs check/build成功。
- `npm run build:figma-connector`: 成功。
- Figma UI scriptの`node --check`（`ui.html`からscriptを抽出）: 成功。
- `npm run change:check`: 成功。

## Release Gate / Observation

- Figma Desktopでの実機確認は未実施。Figma Plugin UIのOriginが`null`で送られること、確認コードの表示、接続許可、PNG受信を確認する。
- Windows / macOSのリリースビルドで、本番CSPに追加した`http://localhost:43127`への送信が通ることを確認する。
