---
type: change
id: CHANGE-029
title: MCP Developer Interface
status: approved
change_kind: A
owners: [maintainer]
created: 2026-08-12
updated: 2026-08-13
current_specs: []
related_adrs: [ADR-0009, ADR-0015]
related_code: [packages/kgg-control/src, src/lib/kggControlRuntime.ts, src/lib/kggRuntimeBridgeClient.ts, src/lib/shaderDiagnostics.ts, src/lib/webgl.ts, src/hooks/useWebGL.ts, tools/mcp-server/package.json, tools/mcp-server/src]
related_tests: [packages/kgg-control/src/*.test.ts, src/lib/kggControlRuntime.test.ts, tools/mcp-server/src/*.test.ts, tools/mcp-server/verify-tarball.mjs]
human_review: completed
---

# CHANGE-029 MCP Developer Interface

## 背景・問題

K-GGにはZustandのState、Effect Stack、既存WebGL Performance Profiler、Preview Canvasがあるが、実行中RuntimeをCoding Agentから型付きに観測・操作する共通入口がない。MCP ServerがStoreを直接importしても別processのため実行中K-GGには到達せず、再現・診断・修正後の再検証を一つのループとして実行できない。

## 変更理由

MCPを単なる操作窓口ではなく、`Observe → Reproduce → Modify → Verify`を支えるDeveloper Interfaceにする。MCP固有のprotocol処理をK-GG Control APIと分離し、将来のCLI、DevTools、テストから同じ型付き操作を利用できるようにする。

## ゴール・成功条件

- 実行中K-GGからState、Gradient color stops、Parameter、Effect Stack、Preview PNG、Renderer/WebGL/Shader diagnosticsを要求時に取得できる。
- 型付き・許可済みのControl APIを介してParameter変更、Effect操作、Snapshot restore、Scenario実行を行える。
- MCP Clientから`get_state → set_parameter → get_state`の往復がRuntime Bridge経由で成立する。
- CodexとClaude Codeから、同じstdio MCP Server `kgg-mcp`を起動してTool discoveryとread/mutation操作を実行できる。
- stdioを既定transportとし、必要時はloopback限定のStreamable HTTPでも同じTool集合を提供する。
- MCP Server未起動・Runtime未接続でも、K-GGの通常描画、Store、Preview、Exportを変更せず利用できる。

## 対象

- MCP非依存のControl API契約、Parameter Registry、Snapshot、Scenario command。
- K-GG WebViewとMCP Serverを接続するloopback Runtime Bridge。
- `kgg-mcp`として起動できるNPM CLI境界、Codex/Claude Codeの接続例、公開前のtarball検証。
- 公式TypeScript MCP SDKによるState、Gradient color、Effect、Visual、Diagnostics、Safety、Developer Tool。
- 要求時のPreview capture、Renderer diagnostics、Shader error ring buffer、Uniform inspection、Performance取得。
- MCP Inspectorを含む再現可能なunit/integration/manual verificationと開発者向け文書。

## 対象外

- 任意JavaScript/TypeScript、GLSL、shell、file、network commandの実行。
- MCPからのPC全体操作、任意ファイル読み書き、K-GG以外のprocess操作。
- WebGL情報の毎frame JSON化、常時PNG capture、常時GPU timer queryの追加。
- 画像認識やBefore/After画像の自動判定。
- MCPを必須依存にするProduction配布、既存Preset保存形式の破壊的変更、Tauri Rust側の新規外部API。
- 公開NPMレジストリへの`npm publish`、NPM組織・認証・公開プロセスの確定、NPMからK-GGデスクトップ本体を配布すること。

## 影響を受ける現行仕様

- 新規の`CURRENT-MCP-DEVELOPER-INTERFACE`を完了時に追加する。
- [Effect Stack](../../../specs/current/effect-stack.md)
- [WebGL Performance](../../../specs/current/webgl-performance.md)
- [Preset System](../../../specs/current/preset-system.md)

## 関連ADR

- [ADR-0009: パラメータ制限を共有レジストリで管理する](../../../adr/0009-unified-parameter-limits.md)
- [ADR-0015: 開発専用WebGL観測層を既存Canvasへ接続する](../../../adr/0015-development-webgl-observability.md)
- Runtime Bridgeのloopback/auth/責務分離を記録するADR-0016を、承認時に追加する。

## 主なリスク

- WebGLContextの再初期化、HMR、React StrictModeで古いRendererを操作するリスク。
- Runtime Bridgeの認証、Host/Origin検証、HTTP bind、RPC timeout/disconnect処理。
- 大きなPNGやdiagnostics応答によるメモリ・応答時間の増加。
- 既存Profiler、Spector.js、webgl-lint、GPU queryの競合。
- Control APIがStore内部構造やMCP protocolへ依存して将来の再利用性を失うリスク。
- CodexとClaude Codeでstdio起動、環境変数、作業ディレクトリ、Tool approvalの扱いが異なるリスク。
- 公開前tarballを`npx`や各ホストから解決できず、ローカル検証と実利用の起動経路がずれるリスク。

## 決定済み方針

- MCPの第一接続先はCodexとClaude Codeとし、両方が扱えるstdioを標準経路にする。
- NPMパッケージ名とCLI表示名は、レジストリ上で利用可能であることを確認できる限り`kgg-mcp`とする。
- 公開NPMへ出す前に、`npm pack`で作成したtarballをクリーンなfixtureへインストールし、Codex/Claude Codeから起動できる状態を完成条件にする。
- 公開前のNPM実装は、ユーザーの明示的な実装依頼を受けたため開始する。`npm publish`は引き続き対象外とする。

## 未決定事項

- Streamable HTTPを常時起動するか、明示的な`--http`起動時だけ起動するか。計画では`--http`時のみとする。
- Runtime Bridgeの既定portと開発起動時の環境変数名。計画ではport `7341`、`KGG_MCP_TOKEN` / `VITE_KGG_MCP_TOKEN`を使用する。
- `kgg-mcp`の未公開期間に使う初期バージョンと、NPMレジストリ上の名前空き状況。名前が利用できない場合のスコープ付き代替名は、公開前に別途レビューする。

## Acceptance criteria

- **AC-001 — Control API**: State、Gradient/Gradient color stops、Parameter Registry、Effect Stackのreadと、validatedなParameter/Gradient/Effekt mutationがMCP非依存APIで成立する。
- **AC-002 — Validation**: 未登録path、型違い、非有限値、範囲外numeric、未許可effect、範囲外index、未知Scenario commandを実行前に拒否する。
- **AC-003 — Runtime Bridge**: loopback・token付きのrequest/response、timeout、malformed input、runtime disconnectedをテストし、未接続時はK-GG通常動作へ影響しない。
- **AC-004 — Snapshot / Scenario**: Snapshot capture/restoreと、許可済みcommandだけを順次実行するScenarioが決定的に動作し、途中失敗位置を返す。
- **AC-005 — MCP Tools**: State、Gradient color、Effect、Visual、Diagnostics、Safety、Developer Toolを公式SDKで発見・呼び出しでき、read/mutationのannotationを付ける。
- **AC-006 — Visual / Diagnostics**: 現在CanvasをPNG/WebPで取得し、Renderer/WebGL/FBO/resources/render passes/shader errors/uniforms/performanceを要求時に構造化して返す。
- **AC-007 — Transport / Security**: stdioのstdoutをprotocol専用にし、HTTPは`127.0.0.1` bind、Host/Origin検証、Bearer token、runtime token、許可method検証を行う。任意command toolを提供しない。
- **AC-008 — Integration**: `MCP Client → Runtime Bridge → K-GG Control API`の`get_state → set_parameter → get_state`往復をテストする。
- **AC-009 — Documentation / Regression**: `docs/development/mcp.md`にArchitecture、Tools、Scenario、Diagnostics、Security、起動、Inspector、Troubleshootingを記載し、既存tests/build/lint/Rust checkを壊さない。
- **AC-010 — Host Integration**: Codexの`config.toml`/`codex mcp add`とClaude Codeのstdio設定から同じ`kgg-mcp`を起動し、Tool discovery、read操作、mutation approval、切断時のエラーを確認できる。
- **AC-011 — Pre-public NPM Package**: `kgg-mcp`のpackage manifestとCLI entrypointを用意し、`npm pack`→クリーンfixtureへのtarball install→`npx --no-install kgg-mcp`→Codex/Claude Code起動確認を再現できる。公開レジストリへのpublishはこのchangeの受け入れ条件に含めない。

## Review gate

このchangeは、`proposal.md` と `delta.md` の内容、Runtime Bridge方式、認証、既定起動方式、Codex/Claude Code接続、公開前NPM検証範囲を人間が確認し、`status: approved` と `human_review: completed` に更新した後に実装する。承認後の明示的な実装依頼を受けたため、Control API、Runtime Bridge、MCP packageを実装した。公開操作は実行しない。
