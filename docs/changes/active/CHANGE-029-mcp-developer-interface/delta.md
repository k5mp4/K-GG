# Delta

## ADDED Requirements

### MCP-001 Control API境界

K-GGはMCP protocolへ依存しないControl APIを持ち、State、Gradient、Parameter Registry、Effect Stack、Snapshot、Scenarioを型付き操作として提供する。MCP ServerからZustand内部構造を直接変更してはならない。

### MCP-002 Parameter Registry

AI操作可能なparameterは一つのRegistryで定義し、path、type、range、step、enumまたはwritableを返す。Control APIとMCP Toolは同じRegistryで検証し、未登録path、型違い、非有限値、範囲外値を拒否する。

### MCP-003 Optional Runtime Bridge

別processのMCP Serverと実行中K-GGを、loopback限定・token認証・許可method検証付きのlocal RPCで接続する。Bridge未接続またはMCP Server停止時もK-GG通常動作を継続する。常時state serializationや常時diagnostics収集は行わない。

### MCP-004 State / Effect Tool

MCPは`kgg_get_state`、`kgg_get_parameter`、`kgg_list_parameters`、`kgg_list_effects`、`kgg_enable_effect`、`kgg_set_parameter`、`kgg_set_gradient_colors`、`kgg_reorder_effect`、`kgg_reset_effect`を提供する。`kgg_set_gradient_colors`は2〜16個の`#RRGGBB`色を均等配置し、Gradient color stopsを置き換える。

### MCP-005 Visual / Safety Tool

MCPは`kgg_capture_preview`、`kgg_capture_snapshot`、`kgg_restore_snapshot`を提供する。Previewはraw RGBAではなくPNG/WebPのimage contentとmetadataを返す。SnapshotはCanvas/WebGL resourceではなく、復元に必要なserializable K-GG stateだけを保持する。

### MCP-006 Diagnostics Tool

MCPは`kgg_get_render_diagnostics`、`kgg_get_shader_errors`、`kgg_dev_get_render_passes`、`kgg_dev_get_webgl_state`、`kgg_dev_get_uniforms`、`kgg_dev_get_performance`を提供する。WebGL state、Uniform、resource、shader error、performanceは要求時だけ取得し、Shader errorは有限ring bufferで保持する。

### MCP-007 Reproducible Scenario

MCPは`kgg_dev_run_scenario`を提供し、`setParameter`、`enableEffect`、`reorderEffect`、`resetEffect`、Snapshot操作などの許可済みcommandだけを順番に実行する。任意command interpreterやshell/file/network operationへ拡張してはならない。

### MCP-008 Transport / Security

stdioをlocal process-spawn用途の既定transportとし、stdoutをMCP protocol専用、ログをstderrへ分離する。Streamable HTTPは明示起動時のみ`127.0.0.1`へbindし、Host/OriginとBearer tokenを検証する。`0.0.0.0` bind、任意コード実行、任意ファイル操作、任意network requestを提供しない。

### MCP-009 Integration / Documentation

MCP ClientからRuntime Bridge、K-GGまでのget/set往復integration testと、Tool discovery/schema/invalid input/disconnect/capture/diagnosticsの検証を持つ。開発者向け起動・Tool・Scenario・Security・Inspector・Troubleshooting文書を追加する。

### MCP-010 Codex / Claude Code Host Integration

`kgg-mcp`はCodexとClaude Codeが起動できるstdio MCP Serverとして提供する。Codexの`config.toml`または`codex mcp add`、Claude Codeの`claude mcp add --transport stdio`またはproject `.mcp.json`から、同一のTool discovery、read/mutation annotation、approval境界を利用できる。Host固有のMCP protocol実装やTool名分岐を作らない。

### MCP-011 Pre-public NPM Distribution

NPMパッケージ名とCLI entrypointは、利用可能であることを確認できる限り`kgg-mcp`とする。公開前は`npm pack`で作成したtarballをクリーンなfixtureへインストールし、`npx --no-install kgg-mcp`をCodexとClaude Codeから起動して、Runtime Bridgeへの接続とTool呼び出しを検証する。公開NPMへの`npm publish`、公開用NPM組織・認証・リリース運用はこのchangeの対象外とする。

## MODIFIED Requirements

なし。既存のEffect Stack、Preview、Preset、Export、WebGL Performanceの利用者向け契約は変更しない。Codex/Claude Codeの接続は追加の利用経路であり、既存のK-GG通常起動を変更しない。

## REMOVED Requirements

なし。
