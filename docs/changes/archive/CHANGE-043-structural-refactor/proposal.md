---
type: change
id: CHANGE-043
title: K-GG構造リファクタリング
status: archived
change_kind: A
owners: [maintainer]
created: 2026-09-03
updated: 2026-09-04
current_specs: []
related_adrs: [ADR-0001, ADR-0014, ADR-0019]
related_code: [src/App.tsx, src/store/gradientStore.ts, src/lib/presetModel.ts, src/lib/sceneEvaluation.ts, src/lib/effectPipeline.ts, src/lib/renderBridge.ts, src/lib/webgl.ts, src/lib/kggControlRuntime.ts, src/adapters/types.ts, docs/development/architecture.md]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/renderBridge.test.ts, src/lib/videoExportFrames.test.ts, src/lib/kggControlRuntime.test.ts]
human_review: completed
outcome: merged
---

# CHANGE-043 K-GG構造リファクタリング

## 背景・問題

`App.tsx`、Zustand Store、WebGL renderer、MCP runtimeに、UI orchestration、永続状態、描画条件、platform side effectが集中している。Preview・Thumbnail・Exportの経路も同じ描画契約を参照している一方、入口ごとに条件を再構築する箇所が残っており、変更影響範囲を静的に把握しにくい。

## 変更理由

機能追加とAI駆動開発で変更範囲を安全に限定できるよう、既存の利用者向け契約を固定したまま責務境界を導入する。分割はファイルサイズではなく、Document/UI、Scene Evaluation/Render Plan/Renderer、Application/Platformの境界に基づいて行う。

## ゴール・成功条件

- UIのレイアウト、操作、文言、描画結果を変更しない。
- Presetの保存形式・既存Preset互換性、静止画・動画・連番・Tile Export、After Effects、MCPの外部契約を変更しない。
- Application/Feature → Domain/State → Rendering/Services → Platform Adaptersの依存方向を明示する。
- Store Snapshotを永続境界として保ちながら、内部状態のDocument/UI責務をコード上で識別できる。
- Scene Evaluationと既存のEffect Pipeline/RenderPlanの境界を強化し、Preview/Thumbnail/Exportが同じ条件決定を再利用できる。
- Resource lifecycle、MCP ingress guard、Tauri再検証、性能観測の既存契約を保つ。

## 対象

U1〜U10の段階的な内部リファクタリング、characterization coverage、代表Goldenの基盤、App/Store/Rendering/Output/Adapter/Feature境界、architecture documentationを対象とする。

## 対象外

- 利用者向け仕様、UIデザイン、Shaderのアルゴリズム・精度・実行順、Preset JSON形式の変更。
- MCP tool名・wire JSON・認証・approval・loopback/queue/lease/deadlineの変更。
- After Effects JSX/DTO、FFmpeg、Tauri commandの外部契約変更。
- 新しい機能、性能閾値の厳格化、Playwright/GPU/FFmpeg実機基盤の大規模導入。

## 影響を受ける現行仕様

現行仕様の観測可能な要件は変更しないため、Current Specの要件IDは変更しない。検証対象として [Gradient System](../../../specs/current/gradient-system)、[Effect Stack](../../../specs/current/effect-stack)、[Preset System](../../../specs/current/preset-system)、[動画・連番フレーム出力](../../../specs/current/video-export)、[MCP Developer Interface](../../../specs/current/mcp-developer-interface)、[After Effects連携](../../../specs/current/after-effects-integration)を参照する。

## 関連ADR

- [ADR-0001 リポジトリ内文書を開発の一次情報とする](../../../adr/0001-documentation-source-of-truth)
- [ADR-0014 承認済み変更パッケージをコミット単位の基本にする](../../../adr/0014-commit-centered-change-workflow)
- [ADR-0019 Request-first開発ライフサイクルとValidation Gate分離](../../../adr/0019-request-first-development-lifecycle)

## 主なリスク

Rendererの入力順、Store setterの暗黙の同期、historyの保存対象、MCPのapproval前後、Preview/Exportのresource所有権を誤って変更すると外部から観測できる差分になる。各境界は既存の関数・テストを移設してから参照を切り替え、段階ごとにfocused testと全体検証を実行する。

## 未決定事項

なし。セッションで合意した判断は、代表Goldenを必須とすること、既存Effect Pipeline/Scene Evaluation/Render Bridgeを段階的に拡張すること、明確な責務境界がある機能だけを移動すること。

## Finalization

- Finalized: 2026-09-04
- Outcome: `merged`
- Mode: normal implementation finalization.
