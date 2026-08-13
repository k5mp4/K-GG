---
type: change
id: CHANGE-031
title: MCP UI Control Parity
status: approved
change_kind: A
owners: [maintainer]
created: 2026-08-13
updated: 2026-08-13
current_specs: [CURRENT-UI-CONTROLS, CURRENT-GRADIENT, CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0016]
related_changes: [CHANGE-029]
related_code: [packages/kgg-control/src, src/lib/kggControlRuntime.ts, tools/mcp-server/src, src/store/gradientStore.ts, src/App.tsx, src/components]
related_tests: [packages/kgg-control/src/*.test.ts, src/lib/kggControlRuntime.test.ts, tools/mcp-server/src/*.test.ts, manual: Tauri and browser MCP control parity]
human_review: completed
---

# CHANGE-031 MCP UI Control Parity

## 背景・問題

CHANGE-029は、State、限定されたParameter Registry、Effect Stack、Snapshot、Preview、DiagnosticsをMCPから扱えるようにした。しかし、UIで編集できる項目の一部しかRegistryへ登録されておらず、Gradient color stopsのようにユーザーが直接操作する基本機能でも、MCPから同じ結果を再現できない期間があった。

## 変更理由

K-GGのユーザー操作とMCP操作の結果を一致させる。Coding AgentがUI内部をクリックするのではなく、UIと同じ正規化・履歴・描画更新経路を通る型付きのSemantic Control APIを利用できるようにする。

## ゴール・成功条件

- 現行UIで編集できるK-GGのドメイン状態を、MCPのCapability一覧から発見できる。
- Gradient、各エフェクト、SANDBOX、Animation/Keyframe、Canvas/View、Preset/Paletteのユーザー操作を、対応するSemantic Toolまたは許可済みCommandで実行できる。
- MCP操作はUI操作と同じStore normalizer、effect stack normalizer、keyframeルール、履歴境界、描画更新を通る。
- ブラウザーDevelopmentとTauri Developmentの両方で、MCP操作後のStateとPreviewが一致する。
- 未対応・依存リソース不足・危険なnative操作は、曖昧に成功させず、Capabilityと構造化エラーで返す。

## 対象

- 全Store setterに対応する型付きParameter/Group Registry。
- Gradient stops、Opacity stops、Anchor、Mesh、Effect Stack、Keyframe、Animation transportのSemantic Control。
- SandboxのCloth、Cone、Flow Gradient、Normal、Prism、Particles、Seamlessの設定操作。
- Canvasサイズ、Preview/View mode、UI表示状態など、永続stateまたは描画結果へ影響する操作。
- Preset/Color Paletteの一覧、適用、保存、削除、入出力を、明示的なCapabilityとして公開する設計。
- Preview imageと、MCP Hostのapproval境界を維持したExport操作。

## 対象外・安全境界

- 任意DOMのクリック、座標指定のマウス・キーボード再生、任意JavaScript/GLSL/shellの実行。
- K-GG外のファイル、ネットワーク、process、OS操作。
- MCPがユーザー確認なしにTauriのnative dialog、FFmpeg、任意保存先を操作すること。
- Store内部型をそのまま公開し、将来の内部リファクタリングを外部契約へ固定すること。

File import、Preset package入出力、画像・動画Exportは、まずCapability/approval設計と失敗時の復旧を確定し、実装単位を分ける。初期実装では、MCPへバイナリを返す操作と、ユーザーが明示した保存先だけを扱える設計を優先する。

## 主なリスク

- Setterの網羅不足により、UIとMCPの挙動が再び乖離する。
- 大きなMesh/Manual Distort map/Keyframe/Presetを一括送信した際のメモリ・応答時間。
- UIの一時状態と永続stateを混同し、再現不能な操作をAPIへ追加する。
- Export、File import、FFmpeg、Tauri dialogの権限境界が、既存の安全境界を拡張する。
- MCP Toolを増やしすぎることで、Codex/Claude CodeのTool discoveryとapprovalが扱いにくくなる。
- 新しいFlow Gradientなど、同時進行中のUI変更でRegistryが古くなる。

## 未決定事項

- Toolを機能別に分割するか、`kgg_list_controls` + discriminated `kgg_execute_control`へ集約するか。
- UI表示状態をMCPから変更可能にする範囲。Canvas/Viewのような描画に影響する状態と、Help/Feedbackなどの一時UIを分けるか。
- Preset/Palette/Exportのファイル操作を、MCP image/resource返却だけにするか、明示的なTauri capability callbackまで許可するか。
- Undo/RedoをMCPの公開操作にするか、各Semantic mutationを1操作単位で履歴へ積むか。
- 現行UIの全項目を一度に公開するか、基盤→ドメイン編集→Preset/Exportの順で段階実装するか。

## Acceptance criteria（レビュー後に確定）

- **UI-CTRL-001 — Capability parity**: 現行UIの操作台帳とMCP Capability一覧に、対応済み・対象外・未対応の理由があり、未登録操作を成功扱いしない。
- **UI-CTRL-002 — Domain mutation**: Gradient、全Store設定、Effect Stack、SANDBOX、Animation/Keyframeを、同じnormalizer/validation経路で変更できる。
- **UI-CTRL-003 — Semantic interactions**: Mesh/Anchor/Stop/Keyframe/Animation transport/Preset/Paletteの操作を、座標クリックではなくSemantic APIで再現できる。
- **UI-CTRL-004 — UI/View state**: 対象に含めたCanvas/View/UI状態をread/writeでき、対象外の一時UIはCapabilityで明示される。
- **UI-CTRL-005 — Native capability safety**: Import/Export/FFmpeg/Tauri dialogは明示的なapproval、入力制限、cancel/error/rollbackを持つ。
- **UI-CTRL-006 — Runtime parity**: Browser/Tauriの実WebViewで、MCP操作後のState、Preview、renderer readinessを確認できる。
- **UI-CTRL-007 — Regression**: `npm run docs:check`、`npm run docs:build`、関連Vitest、lint、build、Tauri checkが通り、未確認事項はvalidationに残る。

## Review gate

このchangeは、全操作の公開範囲、Capability/Tool構成、Undo/Redo境界、Preset/Export/File/Native操作の安全境界を人間が確認するまで実装を開始しない。`status: approved`、`human_review: completed`、レビュー済み`delta.md`が揃った後に実装する。
