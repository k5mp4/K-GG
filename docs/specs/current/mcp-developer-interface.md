---
type: current
id: CURRENT-MCP-DEVELOPER-INTERFACE
title: MCP Developer Interface
status: current
owners: [maintainer]
created: 2026-08-13
updated: 2026-08-13
requirement_ids: [MCP-001, MCP-002, MCP-003, MCP-004, MCP-005, MCP-006, MCP-007, MCP-008, MCP-009, MCP-010, MCP-011, MCP-012]
related_adrs: [ADR-0009, ADR-0015, ADR-0016]
related_changes: [CHANGE-029, CHANGE-031]
related_code: [packages/kgg-control/src, src/lib/kggControlRuntime.ts, src/lib/kggRuntimeBridgeClient.ts, src/lib/kggRuntimeBridgeConfig.ts, src/lib/shaderDiagnostics.ts, src/hooks/useWebGL.ts, src/hooks/useViewportControl.ts, src/components/GradientCanvas.tsx, src/App.tsx, tools/dev-local-env.mjs, tools/tauri-dev.mjs, tools/mcp-server]
related_tests: [packages/kgg-control/src/controls.test.ts, packages/kgg-control/src/parameters.test.ts, packages/kgg-control/src/scenarios.test.ts, src/lib/kggControlRuntime.test.ts, src/lib/kggRuntimeBridgeConfig.test.ts, tools/dev-local-env.test.mjs, tools/mcp-server/verify-tarball.mjs]
---

# MCP Developer Interface

## 目的

実行中のK-GGを、Coding Agentから安全に観測・再現・変更・検証する。MCP protocolの処理とK-GGの状態変更を分離し、同じControl APIをMCP、将来のCLI、開発者向けテストから利用できるようにする。

## 現在の要件

### MCP-001 Control API境界

MCP ServerはReact、Zustand、Tauri、WebGL contextを直接importしない。K-GG WebView側のControl Runtimeが既存Store setter、Effect Stack normalizer、Preview Canvas、WebGL diagnosticsへ接続する。

### MCP-002 Parameter Registry

Agentが変更できるpathは、`packages/kgg-control/src/parameters.ts`に登録されたpathだけである。Registryはtype、range、step、angle unit、enum、targetを返し、Control RuntimeとMCP schemaの双方が入力を再検証する。未登録path、型違い、非有限値は拒否する。範囲値は既存Store setterのnormalizerを通る。

### MCP-003 Runtime Bridge

MCP ServerとK-GG WebViewは別processで動くため、MCP Serverはloopback HTTP Runtime Bridgeを提供する。hostは`127.0.0.1`、`localhost`、`::1`だけ、既定portは`7341`、認証は開発セッションごとに明示された`KGG_MCP_TOKEN`と`VITE_KGG_MCP_TOKEN`の一致である。WebViewの登録にはserver発行session idを使い、稼働中clientの上書き登録、未許可Origin、上限超過要求を拒否する。要求には期限があり、応答は`RuntimeResult` schemaとサイズを検証する。未接続、timeout、malformed inputは通常のK-GG描画を停止させず、構造化エラーを返す。

### MCP-004 State / Effect

`kgg_get_state`、`kgg_get_gradient_state`、`kgg_get_parameter`、`kgg_list_parameters`、`kgg_list_effects`で状態を読み取る。`kgg_set_parameter`、`kgg_set_gradient_colors`、`kgg_enable_effect`、`kgg_reorder_effect`、`kgg_reset_effect`で登録済みparameter、Gradient color stops、Effect Stackだけを変更する。`kgg_set_gradient_colors`は`#RRGGBB`形式の2〜16色を受け取り、ストップを0〜1へ均等配置する。

### MCP-012 Semantic Control Registry

`kgg_list_controls`は、Gradient、Noise、Diffuse、Image Gradient、Slit Scan、Stretch、Animation、Normal Map、Cloth、Cone、Seamless、Flow、Radon、Iridescence、Manual Distort、Postprocess、Effect Pipeline、Matcap、Histogram、Keyframe、UIのgroupと、allowlist済みoperation id、入力schema、`scenarioSafe`、`requiresApproval`、`requiresNativeCapability`を返す。`kgg_get_control_state`はgroupのcanonical stateを読み取り、`kgg_execute_control`はRegistryに存在するoperationだけを実行する。

Gradient/Opacity Stop、Anchor、Mesh corner/handle/color position、Animation transport、Keyframe、Canvas/View、Preset/Paletteはsemantic inputで操作する。`set_group`は既知groupの既知top-level fieldだけをpartial patchし、`keyframeTracks`は専用operationに限定する。入力はJSONのみで、reserved object key、非有限値、payload上限を拒否する。

### MCP-005 Visual / Snapshot

`kgg_capture_preview`は現在のCanvasをPNGまたはWebPのMCP image contentとして返す。MCP経路のCanvasは一辺4096以下、総ピクセル数とencoded outputに上限を持つ。SnapshotはCanvas/WebGL resourceではなく、復元に必要なserializable stateだけを保持し、`kgg_capture_snapshot`と`kgg_restore_snapshot`で扱う。

### MCP-006 Diagnostics

`kgg_get_render_diagnostics`は要求時だけGPU caps、WebGL limits、lazy program、Profiler snapshot、uniform名、render passを取得する。`kgg_get_shader_errors`はshader compile/link errorを有限ring bufferから返す。Developer向けのrender pass、WebGL state、uniform、performanceは専用read-only Toolでも取得できる。

### MCP-007 Safe Scenario

`kgg_dev_run_scenario`は、parameter変更、Effect操作、Snapshot操作、`scenarioSafe`なSemantic Control、最大5秒のwaitだけを最大32 commandまで順番に実行する。合計waitは20秒以下に制限し、未知command、余分なfield、JSONでない値を実行前に拒否する。既定では失敗時に開始時点へrollbackする。Preset削除、Preset package export、Palette削除など、approvalまたはnative capabilityが必要な操作はScenarioへ含めない。任意のJavaScript、TypeScript、GLSL、shell、file、network、OS commandは実行しない。

### MCP-008 Transport / Security

stdioが既定transportであり、stdoutはMCP JSON-RPC専用、診断ログはstderr専用である。`--http`を指定した場合だけ、公式SDKのStreamable HTTPをloopbackへ追加できる。MCP ServerとRuntime BridgeのtokenはHost設定の環境変数から渡し、ソース、Preset、ログへ書き込まない。token未設定時はBridgeを起動せず、本番buildやremote URLの明示設定でもBridgeを有効化しない。破壊的operationはMCP callerの`confirm`だけを承認とみなさず、K-GGアプリ側のapproval callbackを要求する。

### MCP-009 Host Integration

CodexとClaude Codeは同じ`kgg-mcp` Tool setをstdioで起動する。read-only Toolにはread-only annotation、mutation Toolにはmutation annotationを付け、approval境界はHost側の設定とMCP Tool metadataの両方で確認できる。

### MCP-010 kgg-mcp package

`tools/mcp-server/package.json`のpackage nameとbin nameは`kgg-mcp`である。Node.js 20以上のESM packageとして、build済みdist、README、runtime dependenciesだけをtarballへ含める。公開npmへのpublishは現行仕様の対象外である。

### MCP-011 Pre-public verification

`npm run mcp:verify`はMCP Serverをbuildし、`npm pack`でtarballを作り、clean fixtureへinstallし、`npx --no-install kgg-mcp --help`とstdio initialize/tool discoveryを確認する。既存Toolに加えてSemantic Controlの3 Toolを含む23個のToolをadvertiseすることを確認する。検証用Runtime Bridgeは空きloopback portを使い、既存開発セッションと競合しない。公開レジストリ、scope、publish token、release automationは別changeで決める。

## Host設定

tarballをHostが実行するprojectへinstallしたうえで、次の形で登録する。

```text
codex mcp add kgg-mcp --env KGG_MCP_TOKEN=... -- npx --no-install kgg-mcp
claude mcp add --transport stdio --env KGG_MCP_TOKEN=... kgg-mcp -- npx --no-install kgg-mcp
```

ブラウザー版のK-GG開発サーバーは、開発セッションごとに生成した同じtokenと`VITE_KGG_MCP_BRIDGE_URL=http://127.0.0.1:7341`を環境変数へ設定して起動する。Tauri開発版は`npm run tauri:dev`が明示設定されたloopback bridge URL、token、Tauri識別フラグをViteへ渡す。tokenがない場合はBridgeを有効化しない。`KGG_MCP_DISABLE=1`で明示的に無効化できる。

## 境界と互換性

MCP接続がない場合、K-GGは従来のPreview、Preset、Animation、Exportを通常どおり利用できる。MCPは本番デスクトップ配布へ自動追加せず、開発者が明示的に起動する。内部Storeの追加フィールドはControl Snapshotの明示的serializable field listへ追加しない限りAgentへ公開しない。Preset package exportは接続済みrepositoryの明示callback、アプリ側の人間承認、`confirm: true`を要求し、任意path・File import・画像/動画の直接保存・FFmpeg/Tauri dialog操作は未実装Capabilityとして成功扱いしない。
