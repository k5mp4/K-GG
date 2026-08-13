# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / integration | `packages/kgg-control`、Runtime Control、MCP client round trip | partial: Control/Runtime unit pass; real WebView round trip未確認 |
| AC-002 | unit / MCP schema | Registry、scenario、tool invalid input tests | pass: Registry/Scenario unit、Gradient color validation、MCP schema buildを確認 |
| AC-003 | unit / integration / Tauri smoke | Runtime Bridge connection/auth/session/Origin/queue/result tests、Tauri WebView接続 | partial: bearer、Origin拒否、second-client takeover拒否、malformed result、queue上限、lease/timeout実装とunit pass; 実Tauri WebViewの再接続・timeout/disconnectは未確認 |
| AC-004 | unit / integration | Snapshot/Scenario tests | pass: snapshot restoreとrollback scenario unit pass |
| AC-005 | MCP Inspector / integration | Tool discovery、annotations、tool calls | partial: stdio discovery/annotation pass; Inspector未導入。MCP color Tool callは実WebViewでpass |
| AC-006 | unit / manual | Preview、Renderer diagnostics、Shader/Uniform/Performance tools | partial: adapter/unit実装済み; WebGL実画面で未確認 |
| AC-007 | unit / manual | stdio、loopback HTTP、Host/Origin/Bearer/token checks | partial: stdio、HTTP initialize、loopback host制限、Bearer、許可外Origin拒否、session id unit pass; Host/Origin実環境とHTTP Host smoke未確認 |
| AC-008 | integration | `get_state → set_parameter → get_state` | partial: Runtime unit pass; ブラウザー実WebViewとTauri実WebViewで`kgg_get_gradient_state → kgg_set_gradient_colors → kgg_get_gradient_state`をpass |
| AC-009 | docs / existing verification | `docs/development/mcp.md`、npm/Rust checks | pass: docs check/build、npm test、npm lint、npm build、npm audit high pass。build/lintの既存chunk-size・dynamic-import warningは残るがerrorではない |
| AC-010 | manual / integration | Codex stdio設定、Claude Code stdio設定、Tool discovery、mutation approval、disconnect | partial: Codex CLIのglobal登録・stdio Tool discovery pass; Desktop UI/Claude Code/approval/disconnect未確認 |
| AC-011 | package smoke / manual | `npm pack`、clean fixture install、`npx --no-install kgg-mcp`、MCP Inspector | partial: package-local prepackを含むclean dist生成、LICENSE、tarball/npx/stdio discovery、23 tools、annotation、固定token不在をpass; Inspector未導入 |

## Commands

- `npm run docs:check` — pass (2026-08-13: 41 legacy specs、7 current specs、20 changes、16 ADRs)
- `npm run docs:build` — pass (2026-08-13: VitePress build)
- `npm run mcp:build` — pass (2026-08-13: Gradient color Tool追加後)
- `npm test -- --run tools/dev-local-env.test.mjs src/lib/kggRuntimeBridgeConfig.test.ts` — pass (2026-08-13: Tauri bridge環境注入・解決条件6 tests)
- `npm test -- --run packages/kgg-control/src src/lib/kggControlRuntime.test.ts src/lib/kggRuntimeBridgeConfig.test.ts tools/dev-local-env.test.mjs tools/mcp-server/src` — pass (2026-08-13: 7 files / 28 tests; group input、approval、preview、scenario、bridge securityを含む)
- `npm test -- --run` — pass (2026-08-13: 67 files / 373 tests; MCP専用コミット単体)
- `npm run lint` — pass with 21 pre-existing warnings, 0 errors (2026-08-13)
- `npm audit --omit=dev --audit-level=high` — pass (2026-08-13: 0 vulnerabilities; root production dependency audit)
- `npm run build` — pass (2026-08-13: Vite build; existing chunk-size/Tauri dynamic-import warningsあり)
- `cargo test --manifest-path src-tauri/Cargo.toml` — not run (Rust変更なし)
- `cargo check --manifest-path src-tauri/Cargo.toml` — not run (Rust変更なし)
- `npx @modelcontextprotocol/inspector ...` — not run (Inspector未導入)
- `npm run mcp:verify` — pass (2026-08-13: distなしからpackage prepack/build、LICENSE付きtarball、clean fixture、npx --no-install、stdio initialize、23 Tool discovery、read/mutation annotation、固定token不在)
- `npm install --save-dev <local-kgg-mcp-tarball>` — pass as part of `npm run mcp:verify`
- `npx --no-install kgg-mcp` — pass as part of fixture smoke
- HTTP smoke (`kgg-mcp --http`, loopback initialize with Bearer) — pass (2026-08-13)
- `codex mcp add kgg-mcp --env ... -- npx --no-install kgg-mcp` — pass (2026-08-13: global `~/.codex/config.toml`へ登録、K-GG cwd指定)
- `codex mcp list` — pass (2026-08-13: kgg-mcp enabled、stdio initialize/tools/list 19 tools; current session registrationは再起動後に20 toolsへ反映)
- MCP color operation — pass (2026-08-13: `kgg_set_gradient_colors`で`#0066FF`/`#00C853`を実WebViewへ適用し、直後のgradient stateで確認)
- Tauri MCP color operation — pass (2026-08-13: `npm run tauri:dev`起動後のTauri WebViewへ`#0066FF`/`#00C853`を適用し、Runtime responseで確認)
- Codex Desktop `/mcp` — pending (設定反映のためDesktop再起動が必要)
- `claude mcp list` / Claude Code `/mcp` — pending

## 実装結果

- Codex/Claude Codeのstdio接続方針、`kgg-mcp`命名、公開前tarball検証を文書へ反映した。
- `packages/kgg-control`、WebView Control Runtime、polling Bridge、shader error ring、公式SDK v2のstdio/HTTP server、`kgg-mcp` package manifest、tarball fixtureを実装した。
- 公開NPMへの`npm publish`は実行していない。公開前に名前、scope、認証、release運用を別changeで確認する。

## 未確認事項

- MCP Inspectorの実行環境、Preview image content、Codex/Claude Codeのmutation approvalは未確認。
- Runtime Bridgeの実Tauri WebView再接続・timeout/disconnect、MCP Inspector、Claude Code、公開NPMレジストリ・publish運用は未確認・未実施である。
- `kgg-mcp`のNPMレジストリ上の名前空き状況は公開前に確認する。今回`npm publish`は実行していない。
