# Design

## 採用する実装方針

Control APIをMCP Adapterから切り離し、次の三層に分ける。

```text
packages/kgg-control  (純粋な型・schema・Registry・許可command)
        ▲                         ▲
        │                         │
K-GG Runtime Control       MCP Adapter / Runtime RPC Client
        │                         │
        └──── loopback local RPC ┘
```

K-GG WebView側のRuntime ControlだけがZustandとRendererを知る。MCP ServerはControl APIのremote clientとして振る舞い、ZustandやDOM/WebGL objectをimportしない。

公式SDKは、現在のTypeScript SDK v2系の`@modelcontextprotocol/server`を使う。stdioは`serveStdio(factory)`、HTTPは`createMcpHandler(factory)`とNode adapterを使い、独自MCP protocol実装は作らない。MCP Tool handlerはZod schemaで入力を検証し、Control APIの再検証も必ず通す。

## Codex / Claude Code接続契約

`kgg-mcp`をMCP Server名、NPM package名、CLI command名の共通候補とする。NPMレジストリ上の名前が利用できることを公開前に確認し、利用できない場合だけスコープ付き代替名を別途レビューする。Hostごとのprotocol実装は作らず、stdio MCP Serverを共通の起動契約にする。

Codexでは、CLIの`codex mcp add kgg-mcp --env KGG_MCP_TOKEN=... -- npx --no-install kgg-mcp`または`[mcp_servers.kgg-mcp]`のstdio設定を利用する。Claude Codeでは、`claude mcp add --transport stdio --env KGG_MCP_TOKEN=... kgg-mcp -- npx --no-install kgg-mcp`またはproject `.mcp.json`を利用する。実際のhost設定例は、tarballをfixtureへインストールした後の作業ディレクトリから起動できる形で文書化する。

MCP Serverの初期化情報には、`kgg-mcp`のversionとControl API protocol version、Runtime Bridgeが必要であることを含める。接続中Runtimeのrenderer readinessは`kgg_get_state`で返す。`instructions`は、K-GGのObserve/Modify用途、read/mutationの扱い、任意コード・file・network操作がないことを短く自己完結して説明する。Tool名はhostに依存せず`kgg_` prefixを維持し、mutation Toolにはread-onlyでないことが分かるannotationを付ける。

Codex/Claude CodeはTool approvalのUI・設定をそれぞれ持つため、MCP側はmutationを隠したりhostごとに別Toolを返したりしない。手動確認では、Codexはwrite相当Toolをpromptする設定、Claude Codeは`/mcp`から接続状態とTool一覧を確認する。stdioのstdoutはJSON-RPC専用、診断ログはstderr専用とする。

## 公開前NPMパッケージ

NPM実装は、`tools/mcp-server/package.json`をパッケージ境界とし、`name: "kgg-mcp"`、`bin.kgg-mcp`、ESMのbuilt distribution、README、LICENSEを含める設計にする。K-GG本体のReact/Tauri/WebGLをNPM packageへ同梱せず、packageはMCP protocol adapterとRuntime Bridge clientだけを持つ。

公開前の検証経路は次の順序とする。

1. `tools/mcp-server`をbuildし、`npm pack`でtarballを作る。
2. 一時fixtureへtarballを`npm install --save-dev`する。
3. fixtureの作業ディレクトリから`npx --no-install kgg-mcp`を起動する。
4. CodexとClaude Codeのstdio設定からTool discovery、read、mutation approval、切断を確認する。
5. MCP Inspectorと既存のintegration testを実行する。

この段階では`npm publish`を実行しない。公開NPMでの名前、scope、version tag、provenance、release automationは、動作確認後の別changeまたは明示的な依頼で決める。公開前のhost設定にtokenを直書きせず、Codex/Claude Codeが提供する環境変数経由でRuntime Bridge tokenを渡す。

## データモデル

- `ParameterDefinition`: `path`、`type`、`min`、`max`、`step`、`integer`、`enum`、`writable`、Control APIのstate mapping。
- `Gradient color mutation`: `#RRGGBB`形式の2〜16色を検証し、既存Gradient color stopsを指定順の均等配置へ置き換える。任意のStore pathや任意コードは受け付けない。
- `RuntimeState`: serializableなStore state、`currentTime`、Canvas metadata。action関数、DOM、WebGL resource、画像sourceは含めない。
- `Snapshot`: random ID、作成時刻、RuntimeState。保持数を有限にし、restoreは既存Store setterとnormalizerを通す。
- `Scenario`: 最大step数を持つdiscriminated union。各stepは許可済みactionとtyped payloadだけを持つ。
- `RuntimeRpc`: request id、許可method、params、result/error。未知method、malformed JSON、巨大payload、timeoutを拒否する。
- `HostHandshake`: server name `kgg-mcp`、package version、Control API protocol version、capabilitiesを初期化情報で返し、`rendererReady`は`kgg_get_state`で返す。

## 状態管理

Parameter Registryの範囲情報を既存`src/lib/parameterLimits.ts`から共有層へ移し、UI/Store/Control API/MCPが同じ定義を参照する。Control APIのsetParameterは範囲外を暗黙にclampせず、Registry検証エラーとして返す。Store側の既存normalizerは最後の境界防御として維持する。

SnapshotとRuntime Bridge sessionは永続化しない。Bridge pollingは、ブラウザーでは`VITE_KGG_MCP_BRIDGE_URL`と開発セッションtokenが設定されたDevelopment起動時、Tauriでは`npm run tauri:dev`へ明示設定したloopback tokenを渡した場合だけ有効にする。token未設定時、MCP未接続時にrender loopへBridge pollingを追加しない。`KGG_MCP_DISABLE=1`は明示的な無効化として扱う。

## Runtime Bridge / transport

MCP Serverは、既定のstdio MCP transportに加え、localhostのRuntime RPC endpointを起動する。CodexとClaude CodeはMCP側のstdioだけを起動し、K-GG WebViewは同じCLIが提供するRuntime RPCへ接続する。HTTP modeでは同じloopback serverの`/mcp`をStreamable HTTP、`/runtime/*`をRuntime RPCへルーティングする。Runtime RPCはブラウザから接続しやすいHTTP pollingを使い、WebSocket依存を増やさない。

- bind address: loopback host（`127.0.0.1`、`localhost`、`::1`）だけを許可し、既定は`127.0.0.1`。
- Runtime: `/runtime/register`、`/runtime/poll`、`/runtime/respond`。
- token: serverの`KGG_MCP_TOKEN`とWebViewの`VITE_KGG_MCP_TOKEN`を、開発セッションごとに生成した値で一致させる。欠落時はRuntime接続を確立しない。固定tokenをsource/docsへ置かない。
- session: `/runtime/register`はserver発行session idを返し、poll/respond/unregisterをそのsessionへbindする。稼働中clientの無条件上書き登録を拒否し、lease expiry時に保留要求を失敗させる。
- Origin: 明示的な開発originとTauri WebView originだけを許可し、`*`を使わない。Origin headerがある場合は許可外OriginをHTTPで拒否する。
- resource: pending/queue数、request/response payload、request deadlineを制限し、期限切れキューを破棄する。
- MCP HTTP: Bearer token、Host/Origin validation、`--http`明示起動を要求。
- stdout: stdio protocol専用。application/bridge/MCP logsはstderrへ出す。

## Diagnostics / preview

既存`WebGLPerformanceProfiler`のsnapshotを性能・render pass・resourceの一次情報として再利用する。`WebGLContext`にはCanvas、Profiler、GPU caps、FBO size、program/uniform mapが既にあるため、Control APIの要求時adapterが必要な値だけを読む。`gl.getError`、framebuffer status、state、uniformはTool call時だけ取得する。

`createProgramAsync`のcompile/link失敗は、console出力を残したまま、有限ring bufferへ構造化記録する。context lost/restoredはWebGL stateの要求時取得で確認する。

Previewは既存`kgg-preview-canvas`の`toDataURL('image/png')`からbase64を取り出して返し、MCP Toolでは`image` contentとして返す。raw RGBAをRPC/MCPへ渡さない。

## 変更対象の主要ファイル

コード:

- `packages/kgg-control/src/types.ts`
- `packages/kgg-control/src/parameters.ts`
- `packages/kgg-control/src/scenarios.ts`
- `packages/kgg-control/src/index.ts`
- `src/lib/kggControlRuntime.ts`
- `src/lib/kggRuntimeBridgeClient.ts`
- `src/lib/shaderDiagnostics.ts`
- `src/lib/webgl.ts`
- `src/hooks/useWebGL.ts`
- `tools/mcp-server/src/runtimeBridge.ts`
- `tools/mcp-server/src/mcpServer.ts`
- `tools/mcp-server/src/cli.ts`
- `package.json`, `package-lock.json`, `tsconfig.mcp.json`

テスト:

- `packages/kgg-control/src/*.test.ts`
- `src/lib/kggControlRuntime.test.ts`
- `tools/mcp-server/src/runtimeBridge.test.ts`
- `tools/mcp-server/src/*.test.ts`

文書:

- `docs/specs/current/mcp-developer-interface.md`
- `docs/specs/current/index.md`
- `docs/development/mcp.md`
- `docs/adr/0016-mcp-control-api-and-local-distribution.md`
- `docs/adr/index.md`

## 代替案とトレードオフ

| 案 | 判断 |
| --- | --- |
| MCP ServerからZustandを直接importする | 別processの実行中Storeへ到達せず、テストとRuntimeの境界も壊すため不採用 |
| Tauri Rust IPCを外部MCPの主経路にする | Browser/ViteとTauriで経路が分かれ、MCP processからWindowを安全に特定する追加設計が必要なため初期案では不採用 |
| WebSocketだけでBridgeを作る | browser接続は自然だが、server側の追加WebSocket依存とsession管理が増えるため初期案ではHTTP pollingを採用 |
| 毎frame全state/Uniform/diagnosticsを保存する | 通常性能とメモリへ影響するため不採用。要求時取得とProfilerの既存低頻度snapshotを再利用する |
| 独自MCP protocol実装 | protocol互換性・schema・transportの保守負債になるため不採用 |

## 移行方法

既存のBrowser/Tauri起動、Preset保存、Renderer、Exportは変更しない。MCP ServerはCodex/Claude Codeから追加scriptとして明示起動する。Runtime Bridgeの環境変数がない場合、WebView側のpolling clientは生成せず、MCP依存をProductionへ持ち込まない。承認後の実装依頼を受け、package manifest、公式SDK依存、Control API、Bridge、tarball fixtureをこの設計に従ってコード化した。

## ロールバック方法

MCP Server、shared Control API、Runtime Bridge登録、diagnostics registry、依存追加、文書を同じchangeから削除する。既存のStore action、Profiler、Rendererの既存経路だけを残せる構成にする。
