---
type: change
id: CHANGE-045
title: Mesh Gradationのグリッド化・直接編集UI・ベジエ操作修正
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-06
updated: 2026-09-06
current_specs: [CURRENT-GRADIENT]
related_adrs: [ADR-0013]
related_code: [src/types/gradient.ts, src/lib/meshGradientField.ts, src/lib/webgl.ts, src/lib/presetPreview.ts, src/lib/sceneEvaluation.ts, src/lib/animationRegistry.ts, src/store/documentSlice.ts, src/store/documentActions.ts, src/application/commands.ts, src/components/MeshGradientEditor.tsx, src/components/GradientAnchorEditor.tsx, packages/kgg-control/src/controls.ts, src/lib/kggControlRuntime.ts, src/lib/presetModel.ts, src/i18n/messages.ts, src/i18n/uiLabels.ts, src/docs/help.md]
related_tests: [src/types/gradient.test.ts, src/lib/meshGradient.test.ts, src/lib/webglShaderSources.test.ts, src/lib/kggControlRuntime.test.ts]
human_review: required
---

# CHANGE-045 Mesh Gradationのグリッド化・直接編集UI・ベジエ操作修正

## 背景・問題

Mesh Gradationは `rows:2/columns:2` 固定の単一Coonsパッチのみです。外側境界（4コーナー＋8制御ハンドル）はキャンバス上でドラッグできますが、キャンバス**内部**に編集点がなく、単一パッチのbilinear的な内部広がりしか作れません。コーナー色は共有ランプの `colorPositions`（BL/BR/TL/TRのt値）をスライダーで動かすだけのため、内部の色配置を細かく制御できません。

また、GRADATIONタイプの一つである `bezier`（ベジエ）は描画・静的ドラッグは実装済みですが、制御点をキーフレームで動かせず、A/Bアンカーをキーフレームで動かすと制御点が取り残されて毎フレーム曲線が変形します（`sceneEvaluation.ts` の `applyGradientTracks` は `gradientAnchor.*` と `mesh.corner.*` のみoverrideし `bezierControls` を無視）。MCPにも `set_bezier_control` がありません。利用者からは「GRADATION形式のベジエが動作できない」と報告されます。

## 変更理由

- キャンバス外部だけでなく内部も制御点で直接編集できる、Illustratorメッシュに類する自由度の高い2次元色場編集を提供するため。
- メッシュの色を「ランプ対応（ランプ追従）」と「直接色（点ごとのHex）」の2モードでユーザーが選べるようにするため。BL/BR/TL/TRの4コーナーパラメータによる調整は廃止する。
- Animation/MCPの契約の穴（GRAD-005、CHANGE-031のcontrol parity）を埋め、ベジエの操作不能を解消するため。

## ゴール・成功条件

- `gradient.mesh` がN×Mの可変グリッドを保持できる。既存の2×2単一Coonsプリセットは変更なしで同一形状・同一見た目に読み込める（後方互換）。
- キャンバス上でグリッド全点（コーナー・辺上・内部）をドラッグでき、全エッジ（外側・内部）の共有ベジエハンドルを編集できる。
- **色モード切替（Ramp/Direct）** を右サイドバーで行える。Ramp（既定）はランプをグリッド縦方向（下→上）へ投影し、ランプ編集がメッシュ全体へ追従する。Directは点クリック→色スウォッチ→Tweeq ColorPickerで各点のHexを個別編集できる。
- Meshの任意グリッド点の位置、および `bezier` の制御点がキーフレーム対応になる。Directモードでは点色キーフレームも有効。
- kgg-control/MCP にベジエ制御点・グリッド点位置・グリッド寸法・色モード切替・点色の操作が追加され、UIとパリティを取る。
- WebGLフォールバック（2Dプレビュー）時も、グラデーションの制御線・アンカーがキャンバス内で表示・編集できる。
- Preview、thumbnail、静止画、動画、tiled exportで同一の描画結果になる（従来のCPU bake → テクスチャ → `u_gradientType==6` サンプリング経路を維持）。

## 対象

- `MeshGradientConfig` の可変グリッド化（頂点格子 `points`、セル間共有 `edgeHandles`、色モード `colorMode`、直接色 `pointColors`）と正規化・後方互換。旧 `colorPositions` の撤去。
- セルごとのCoons評価のテンソル積グリッドへの一般化。
- キャンバスUI（全点ドラッグ・共有ハンドル・点選択・グリッドサイズ変更・Reset/Straighten）。Directモード時の点色スウォッチ+ColorPicker。
- 右サイドバーのMeshセクションに色モード切替（Ramp/Direct）。
- Animation（`mesh.point.*.{x|y}`、Direct時 `mesh.point.*.{r|g|b}`、`bezierControl.*` のキーフレーム評価と記録UI）。
- 旧 `mesh.corner.*` キーフレームの読込移行。
- preset保存/読込、presetPreview（CPU fallback）、webglテクスチャ経路。
- WebGLフォールバック時の制御線表示修正（フォールバックcanvasのスタッキング分離）。
- kgg-control/MCP操作の整理と文言・help・現行仕様の同期。

## 対象外

- セル境界をまたぐC1連続性の自動保証（接線の明示的な共有ハンドル編集は提供するが、自動平滑化はしない）。
- 自己交差パッチの完全な逆写像（既存の安定したbilinearフォールバックを維持）。
- 実GPUでのテッセレーション品質の計測（Release Gate / Observationとして記録）。
- WebGLフォールバック時（2Dプレビュー）のエフェクトスタックCPU再現（ベースグラデーションのみ表示し「プレビュー／ベースのみ」バッジで明示）。
- 保存形式としての旧 `corners/handles` の即時削除（互換のため維持）。旧 `colorPositions` は廃止。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [UI Controls](../../../specs/current/ui-controls)（記載がある場合）

## 関連ADR

- [ADR-0013 Mesh Gradationを単一Coons Patchの構造化データとして保持する](../../../adr/0013-mesh-gradient-data-model) — N×Mグリッドへ拡張するため、この変更で後継または改訂を検討する。

## 主なリスク

- 後方互換: 旧 `corners/handles/colorPositions` の単一セルデータが、新形式の導出値と常に一致することをテストで担保する。保存時は新形式の単一セル射影を旧フィールドへ再計算して書き出す。
- 描画の非互換: 単一セルで旧実装と新実装の画素結果が一致することをテストで確認する。
- 性能: グリッドを増やしたときのCPUラスタライズ量。8×8セルでも既存の256pxテクスチャ塗りが支配的になる見込みだが実測する。
- キーフレーム移行: 旧 `mesh.corner.*` の読込移行漏れでアニメーションが効かなくなるリスク。移行テストを追加する。

## 未決定事項

- グリッド寸法の上限と既定値（実装時: 2..8の範囲を想定、既定2で旧互換）。
- グリッド寸法変更時の色・ハンドルの再配置方針。
- 旧 `colorPositions` スライダーUIの撤去範囲（新UIへ置換し、旧データ読込互換のみ残す）。
