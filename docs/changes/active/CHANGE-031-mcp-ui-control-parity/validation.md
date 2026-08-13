# Validation

## Status

ドメイン操作、Semantic Control API、Browser UI adapter、Preset/Palette adapterの実装と自動検証は完了。File import、画像/動画の直接保存、FFmpeg/Tauri dialog capability、Browser/Tauriの新規実WebView parityは未完了のため、changeはArchiveせずactiveのままとする。

## 未決定事項

- `kgg_list_controls` + `kgg_get_control_state` + `kgg_execute_control`へ集約し、既存の頻出専用Toolは互換維持することを決定。
- UIのCanvas/View状態、Preset/Palette repository操作はadapter経由で公開し、Help/FeedbackやFile選択などの一時・native境界は直接再生しないことを決定。
- File import、画像/動画の直接保存、FFmpeg/Tauri dialogのapproval callback設計は別実装単位として未決定。

## 検証予定

- 台帳の全操作について、対応Tool/対象外理由/未対応状態を確認する。
- 各Semantic operationの入力境界、normalizer、rollback、read-after-writeをVitestで確認する。
- Browser DevelopmentとTauri Developmentで同じMCP requestを実行し、state/previewを比較する。
- Native capabilityはcancel、invalid path、size limit、timeout、approval拒否を確認する。

## 実行済み検証

- `npm test -- --run` → 67 files / 373 tests passed（MCP専用コミット単体）。set_groupの型・解像度上限、非serializable adapter result、Preview上限、アプリ承認callbackのnegative/positive testを含む。
- `npm run mcp:verify` → package-local prepack/build、LICENSE付きclean fixture install、`npx --no-install kgg-mcp`、stdio initialize、23 Tool discovery passed。検証用Bridgeは空きportを使用する。
- `npm run build` → passed。既存のTauri dynamic import警告とchunk-size警告のみ。
- `npm run lint` → 0 errors / 21 existing warnings。警告は既存UIのHook、Fast Refresh、`any`等で、本changeのエラーではない。
- `npm run docs:check` → passed（41 legacy specs / 7 current specs / 21 changes / 16 ADRs）。
- `npm run docs:build` → passed。
- `npm audit --omit=dev --audit-level=high` → 0 vulnerabilities。
- `cargo test --manifest-path src-tauri/Cargo.toml` → 16 tests passed。
- `cargo check --manifest-path src-tauri/Cargo.toml` → passed。
- `git diff --check` → passed。
- Browser local tab `http://127.0.0.1:5174/`をreloadし、GPU描画表示と主要UI DOMを確認。reload後のconsole errorは0件。

## 未確認事項

- 現在のユーザー管理MCP/Tauriプロセスを停止せずに検証したため、実際の接続済みHostからapprovalダイアログを含む破壊的operationを呼ぶ実WebView smokeは未実施。
- BrowserとTauriを同時に同一Bridgeへ接続すると、single active client制約で409が出る。Browser/Tauri parityは同時接続ではなく、各環境を単独起動して確認する必要がある。
- File import、画像/動画保存、FFmpeg/Tauri dialogのnative capabilityは未実装。
