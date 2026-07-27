# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | structural | `docs/specs/current/` に3領域とindexが存在する | pass |
| AC-002 | structural | `docs/changes/_template/` にproposal/delta/design/tasks/validationが存在する | pass |
| AC-003 | unit | `npm run docs:check` | pass |
| AC-004 | build | `npm run docs:build` | pass |
| AC-005 | link review | 既存 `docs/specs/SPEC-*.md` を移動・削除していない | pass |
| AC-006 | scope review | アプリケーションコード、Preset形式、Shader、Export結果を変更していない | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## Notes

- `npm run lint` はエラー0で完了しました。既存コード由来のwarningが24件残っています。
- `npm run build` は成功しました。既存の大きなchunkに関するwarningがあります。
- `cargo check --manifest-path src-tauri/Cargo.toml` は成功しました。
- `cargo test --manifest-path src-tauri/Cargo.toml` は13件中12件成功し、動画書き出し用一時フォルダの境界テスト1件が、実行環境で一時フォルダを確認できず失敗しました。今回の差分はRust/Tauriコードを変更していないため、アプリ変更の回帰とは扱わず、残存する環境依存事項として記録します。
