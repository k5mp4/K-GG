---
id: ADR-0016
title: MCPをControl APIとloopback Runtime Bridgeへ分離し、公開前tarballで配布する
status: accepted
date: 2026-08-13
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0016: MCPをControl APIとloopback Runtime Bridgeへ分離し、公開前tarballで配布する

## コンテキスト

MCP ServerはCodexやClaude Codeとは別processで動き、K-GGのZustand StoreやWebGL contextを直接参照できない。StoreをServerへimportすると実行中UIではなく別processの状態を操作する。また、MCPを公開npmへ先に出すと、package名、認証、配布範囲、破壊的操作の境界が未検証のまま固定される。

## 決定

1. `packages/kgg-control`にprotocol-independentな型、Parameter Registry、Scenario validationを置く。
2. K-GG WebView側のControl Runtimeだけが既存Store setter、Effect Stack normalizer、Canvas、WebGL profilerを参照する。
3. MCP ServerとWebViewの間は、tokenで認証した`127.0.0.1` Runtime Bridgeを使う。stdio MCPを既定とし、Streamable HTTPは明示的な`--http`で追加する。
4. MCP protocolは公式TypeScript SDK v2を使い、独自JSON-RPC/MCP実装を作らない。
5. `kgg-mcp`は当面repository内のnpm tarballとclean fixtureで検証する。公開npmへのpublishは別changeで、名前の空き、scope、認証、release automationを確認してから行う。

## 理由

- process境界を明示することで、実行中Runtimeへ到達する経路とStoreの責務を分離できる。
- Registryと既存setterを同じControl Runtimeで使うことで、Agent入力でもUIと同じnormalizationとEffect Stackの整合性を維持できる。
- loopbackとtokenを組み合わせることで、Host integrationを保ちながらLAN公開を既定にしない。
- tarball fixtureなら、公開前にbin解決、依存、stdio protocol、Tool discoveryを再現できる。

## 代替案

| 案 | 不採用理由 |
| --- | --- |
| MCP ServerからZustand Storeを直接importする | 別processのStoreであり、実行中WebViewを操作できない |
| WebSocketだけでRuntimeを接続する | 追加常駐接続とOrigin/切断管理が必要で、初期のloopback要求へ過剰 |
| 先に公開npmへpublishする | package境界、名前、認証、Host起動を検証する前に公開契約を固定する |
| 任意コード実行Toolを提供する | Coding Agentからの誤操作・任意ファイル/OS操作の範囲を広げる |

## 再検討条件

複数UI Runtime、リモート開発環境、WebView外からのHTTP利用、公開npm release、OAuth認証、またはWebGPU移行が必要になった場合は、Bridge認証、session管理、package配布、diagnostics境界を再検討する。
