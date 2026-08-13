---
title: MCP Developer Interface
---

# MCP Developer Interface

K-GGの実行中PreviewをCodexやClaude Codeから観測・変更するための開発者向け手順です。MCPは開発用の追加経路であり、K-GG本体の通常操作やExportを置き換えません。

## 1. K-GGとRuntime Bridgeを起動する

MCP ServerとK-GG WebViewへ、開発セッションごとに生成したtokenを渡します。リポジトリに固定tokenはありません。

```powershell
$tokenBytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($tokenBytes)
$env:KGG_MCP_TOKEN = [Convert]::ToHexString($tokenBytes).ToLowerInvariant()
$env:VITE_KGG_MCP_TOKEN = $env:KGG_MCP_TOKEN
$env:VITE_KGG_MCP_BRIDGE_URL = "http://127.0.0.1:7341"
npm run dev
```

Tauri版は`npm run tauri:dev`を使うと、明示的に設定したtokenとloopback URL、Tauri起動フラグをViteへ渡します。tokenがない場合はBridgeを有効化しません。

```powershell
$env:KGG_MCP_TOKEN = "上の手順で生成したセッションtoken"
npm run tauri:dev
```

MCPを使わずにTauriを起動する場合は、明示的に無効化できます。

```powershell
$env:KGG_MCP_DISABLE = "1"
npm run tauri:dev
Remove-Item Env:KGG_MCP_DISABLE
```

MCP Serverを別のterminalで起動します。

```powershell
$env:KGG_MCP_TOKEN = "上の手順で生成したセッションtoken"
npm run mcp
```

ServerのMCP protocolはstdoutを占有するため、ログはstderrへ出ます。`KGG_MCP_TOKEN`がない場合でもServerは起動しますが、Runtimeへ接続するToolは`runtime_unavailable`を返します。

## 2. 公開前tarballを作る

公開npmへpublishせず、build済みpackageを検証できます。

```powershell
npm run mcp:build
npm pack ./tools/mcp-server
```

clean fixtureのinstall、`npx --no-install kgg-mcp`の解決、stdio initialize、Tool discoveryまでを一括で確認する場合は次を実行します。

```powershell
npm run mcp:verify
```

この検証は一時fixtureを作成して終了時に削除します。公開レジストリへの`npm publish`は実行しません。

## 3. Codex / Claude Codeへ登録する

tarballを、MCP Serverを実行するprojectへinstallしてから登録します。`npx --no-install`は公開レジストリから取得せず、projectのlocal binだけを使います。

```powershell
npm install --save-dev .\kgg-mcp-0.1.0.tgz
codex mcp add kgg-mcp --env KGG_MCP_TOKEN=<session-token> -- npx --no-install kgg-mcp
claude mcp add --transport stdio --env KGG_MCP_TOKEN=<session-token> kgg-mcp -- npx --no-install kgg-mcp
```

接続後はCodexのMCP一覧、またはClaude Codeの`/mcp`で`kgg-mcp`とTool一覧を確認します。read-only Toolを先に実行し、mutation ToolはHostのapprovalを確認してから使用します。

## 4. Tool一覧

Read / observe:

- `kgg_get_state`, `kgg_get_gradient_state`
- `kgg_list_controls`, `kgg_get_control_state`
- `kgg_list_parameters`, `kgg_get_parameter`, `kgg_list_effects`
- `kgg_get_render_diagnostics`, `kgg_get_shader_errors`
- `kgg_dev_get_render_passes`, `kgg_dev_get_webgl_state`, `kgg_dev_get_uniforms`, `kgg_dev_get_performance`
- `kgg_capture_preview`

Modify / verify:

- `kgg_set_parameter`
- `kgg_set_gradient_colors`
- `kgg_execute_control`（`kgg_list_controls`で列挙されるsemantic operationのみ）
- `kgg_enable_effect`, `kgg_reorder_effect`, `kgg_reset_effect`
- `kgg_capture_snapshot`, `kgg_restore_snapshot`
- `kgg_dev_run_scenario`

Parameter pathはRegistryに登録されたものだけです。たとえば`gradient.angle`、`noise.amount`、`diffuse.grain`、`slit.angle`を使えます。`kgg_list_parameters`で現在値とrangeを先に確認してください。

色を変更する場合は`kgg_set_gradient_colors`へ`#RRGGBB`形式の色を2〜16個渡します。色は既存のGradient color stopsを置き換え、指定順に0〜1へ均等配置されます。

UIの操作台帳を調べる場合は、まず`kgg_list_controls`を呼びます。全描画groupの現在field、operation id、input schema、`scenarioSafe`、approval/native capability境界が返ります。例えば次のようにGradient Ramp、Mesh、Flow、Animation、Canvas/Viewを操作できます。

```json
{
  "operationId": "set_gradient_stops",
  "input": {
    "stops": [
      { "position": 0, "color": "#0066FF" },
      { "position": 1, "color": "#00C853" }
    ]
  }
}
```

任意のDOM event、座標、JavaScriptを渡すことはできません。`set_group`も登録済みgroupのtop-level fieldだけをpartial patchし、型・範囲・配列長を検証します。`keyframeTracks`は専用operationで検証されます。Preset/Paletteは接続済みadapterがある場合だけ利用でき、削除やPreset package exportは`confirm: true`に加えてK-GGアプリ側の人間承認ダイアログを必要とします。

## 5. 安全境界

- Runtime Bridgeはloopback host（既定`127.0.0.1:7341`）だけをlistenします。
- Bridgeはtoken、許可Origin、server発行のsession idを確認し、稼働中Renderer clientの上書き登録を拒否します。
- Bridgeの要求・応答・保留数、Runtime payload、Preview Canvasには上限があり、要求期限を過ぎたキュー項目は破棄します。
- BrowserからのBridge requestはtokenと許可Originの両方を確認します。
- MCP Serverは任意のJavaScript/TypeScript/GLSL、shell、file、network、OS操作を提供しません。
- Snapshotはserializable stateだけで、WebGL resourceやCanvas handleを保存しません。
- `kgg_dev_run_scenario`は最大32 command、1回のwaitは最大5秒、合計waitは最大20秒で、既定では失敗時rollbackします。
- Scenarioへ入れられるSemantic operationは`scenarioSafe: true`のものだけです。Preset削除、package export、Palette削除などapproval/native境界を持つ操作は拒否されます。
- tokenをCodex/Claude Codeの設定ファイルへ直書きして共有しないでください。Hostの環境変数機能を使います。

## 6. 任意のStreamable HTTP

stdioを使えないローカル検証だけ、MCP HTTP endpointをloopbackへ追加できます。

```powershell
$env:KGG_MCP_TOKEN = "session-token"
npm run mcp -- --http --http-port 7350
```

HTTP endpointは`127.0.0.1:7350`で、`Authorization: Bearer <KGG_MCP_TOKEN>`を要求します。Host側がStreamable HTTP transportを指定できる場合に使います。公開LAN、reverse proxy、認証なしの外部公開は現行仕様の対象外です。

## Troubleshooting

`runtime_unavailable`の場合は、K-GG WebViewが起動済みか、MCP Serverが7341番ポートで起動しているかを確認します。ブラウザー版では`VITE_KGG_MCP_TOKEN`と`KGG_MCP_TOKEN`の一致、Bridge URLが`http://127.0.0.1:7341`であることも確認します。Tauri版は`npm run tauri:dev`を再起動して起動時環境を反映してください。

`npx --no-install kgg-mcp`が見つからない場合は、MCP Serverのworking directoryに`kgg-mcp-0.1.0.tgz`をinstallし直します。公開npmへアクセスさせるために`--no-install`を外す必要はありません。

stdio起動後にToolが見えない場合は、stdoutへ独自ログを出していないか確認します。`kgg-mcp`の診断ログはstderrへ出るため、MCP protocolの入力・出力へ混ぜないでください。
