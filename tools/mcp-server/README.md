# kgg-mcp

K-GGのローカル開発用MCPサーバーです。現在は公開npmへのpublishを行わず、リポジトリ内のtarballで検証します。

## ローカル起動

```powershell
$tokenBytes = [byte[]]::new(32)
[System.Security.Cryptography.RandomNumberGenerator]::Fill($tokenBytes)
$env:KGG_MCP_TOKEN = [Convert]::ToHexString($tokenBytes).ToLowerInvariant()
npm run mcp
```

K-GGの開発サーバー側には、同じセッションtokenを `VITE_KGG_MCP_TOKEN` として渡し、`VITE_KGG_MCP_BRIDGE_URL=http://127.0.0.1:7341` を設定します。tokenがない場合、WebViewはBridgeへ接続しません。

## Codex

```text
codex mcp add kgg-mcp --env KGG_MCP_TOKEN=<session-token> -- npx --no-install kgg-mcp
```

## Claude Code

```text
claude mcp add --transport stdio --env KGG_MCP_TOKEN=<session-token> kgg-mcp -- npx --no-install kgg-mcp
```

`npx --no-install kgg-mcp` は、対象プロジェクトでtarballをインストール済みの場合にのみ動作します。公開npmから取得する運用は別changeで扱います。

## Semantic UI controls

接続後は `kgg_list_controls` で、Gradient、Noise、Diffuse、Image Gradient、Slit Scan、Stretch、Animation、Normal Map、Cloth、Cone、Seamless、Flow、Radon、Iridescence、Manual Distort、Postprocess、Effect Pipeline、Matcap、Histogram、Keyframe、UIの操作groupと、安全境界付きoperationを確認できます。

`kgg_execute_control` は `set_gradient_stops`、`set_mesh_corner`、`set_keyframe`、`set_animation_transport`、`set_ui_state`、Preset/Palette操作など、一覧にあるsemantic operationだけを実行します。DOM座標、任意コード、任意path、shell、network操作は提供しません。Preset package exportや削除には、callerの`confirm: true`だけでなく、アプリ側の人間承認と接続済みadapterが必要です。
