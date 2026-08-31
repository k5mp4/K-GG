---
type: current
id: CURRENT-VIDEO-EXPORT
title: 動画・連番フレーム出力
status: current
owners: [maintainer]
created: 2026-07-31
updated: 2026-08-31
requirement_ids: [EXPORT-001, EXPORT-002, EXPORT-003, EXPORT-004, EXPORT-005, EXPORT-006, EXPORT-007, EXPORT-008, EXPORT-021]
related_adrs: [ADR-0004, ADR-0005]
related_changes: [CHANGE-011, CHANGE-024, CHANGE-025, CHANGE-030, CHANGE-037, CHANGE-038]
related_code: [src/adapters/browser/videoExportService.ts, src/adapters/tauri/videoExportService.ts, src/adapters/types.ts, src/lib/renderBridge.ts, src/lib/renderSceneAtTime.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/videoExportFrames.ts, src/lib/tileRender.ts, src/lib/webgl.ts, src/lib/coneViewRenderer.ts, src/lib/coneSeam.ts, src/components/GradientCanvas.tsx, src/components/ClothCanvas.tsx, src/components/ConeCanvas.tsx, src/components/ExportPanel.tsx]
related_tests: [src/lib/renderBridge.test.ts, src/lib/effectPipeline.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/glass.test.ts, src/lib/videoExportFrames.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/coneViewRenderer.test.ts, src/lib/webglPerformance.test.ts]
---

# 動画・連番フレーム出力

## 目的

Previewで評価されるシーンを、指定したFPS・duration・speed・easingに従って、連番PNG ZIPまたはTauri版のMOV／MP4へ一貫したフレーム列として出力する。

## 現在の要件

### EXPORT-001 フレーム時刻

動画出力の各フレームは`frameIndex`と`totalFrames`から決まる`normalizedTime`を使用する。フレーム生成は実時間、処理時間、Previewの再生位置、`performance.now()`に依存せず、同じ入力設定と同じframeIndexから同じ時刻を評価する。

### EXPORT-002 共通フレーム生成

PNG ZIP、MOV、MP4は、同じEffect Pipeline、scene evaluation、time remap、render-and-capture規則でフレームを生成する。保存、ZIP追加、一時ファイル、FFmpeg encodeだけを出力形式ごとの処理として分離する。

### EXPORT-003 export sessionの排他

書き出し中は共有CanvasとEffect Stack中間FBOの描画所有者をexport sessionとする。AnimationLoop、static render、seek、Preview更新、shader準備完了による再描画は出力フレームへ混入しない。書き出し終了後は、開始前のPreview再生状態を復元する。

### EXPORT-004 renderとcaptureの原子性

一つの出力フレームは、固定されたrender planで指定時刻を一度だけ描画し、そのrender sequenceがcapture対象であることを確認してからCanvasまたは出力targetをcaptureする。render後からcaptureまでに別の描画を許可しない。

### EXPORT-005 GLASS系とタイル出力

Glass（GLASS V2）を含む出力では、sourceとdestinationのFBO／textureを衝突させず、隣接サンプルに必要なtile paddingを確保する。full-frame pathとtiled pathは、同じ時刻と設定で同じ出力規則を使用する。

### EXPORT-006 cancellationと失敗

AbortSignalによるcancellation、shader program準備失敗、CanvasまたはGPU同期失敗では、途中のフレーム列を成功出力として扱わない。失敗またはcancel後はexport sessionを解除し、Preview状態と通常描画を復元する。

3D出力の補助Rendererは、失敗時のdisposeを冪等に扱い、WebGL context loss中は失われたGPUオブジェクトを再利用しない。contextが復元した場合は次のフレームでGeometryとTextureを再生成する。

### EXPORT-007 Preview表示面のフレームキャプチャ

2Dモードの動画・連番フレーム出力は従来のGradientCanvasを使用します。3Dモードでは、export sessionで生成した処理済み2Dフレームを選択中のClothまたはConeのCanvasTextureへ反映し、マッピング後の3D Preview Canvasをキャプチャします。Preview RAFによる上書きや、元の2D Canvasだけの出力を許可しません。

### EXPORT-008 Cone表示面のフレームキャプチャ

Coneモードではexport sessionのnormalizedTimeをFlow Mappingへ使用します。Direct ProjectionではV offsetを固定します。各フレームの処理済み2D Canvasを生成・GPU完了した後にCone Rendererを同期描画し、そのCone Canvasを静止画、連番PNG、MOV、MP4のキャプチャ対象にします。入力Canvasの寸法が変わった場合は既存GPU Textureを再利用せず再確保します。ConeのSeam ModeとGradient ReapplyのRGB補正を含む設定はPreviewと同じRenderer分岐へ渡し、出力形式ごとに別の合成やalphaブレンドを行いません。

### EXPORT-021 Flow Gradientの論理フレーム

Flow Gradientを有効にした出力は、Seed、正規化時刻、設定、Render Session、固定3D投影を共通入力として評価します。Export開始時はFlowの履歴をリセットし、必要な事前評価を行ってから対象フレームを描画します。同じ論理フレームを複数タイルで描画してもTrailをタイル数だけ進めず、Preview、Thumbnail、静止画、連番、動画で同じフレーム規則を使用します。Loop有効時は終端フレームを重複せず位相0へ戻り、Flow無効時の既存出力経路は変えません。

## 他領域との関係

- Effect Stackは、出力へ渡す有効レイヤー順序とGlass（GLASS V2）の描画計画を定義する。
- Animationは、固定されたnormalizedTimeからscene evaluationへ渡す時間依存値を定義する。
- ADR-0004とADR-0005は、中間画像をping-pong FBOで処理する描画方式を定義する。

## 変更履歴

- [CHANGE-011 GLASS／GLASS V2書き出し決定性修正](../../changes/archive/CHANGE-011-deterministic-glass-export/proposal)
- [SPEC-005 動画出力表示名とファイル名](../SPEC-005-video-export-naming)
- [SPEC-023 動画書き出しUXとMP4品質](../SPEC-023-video-export-ux-and-mp4-quality)
- [SPEC-024 動画書き出しFFmpeg待機の応答性](../SPEC-024-video-export-encode-responsiveness)

## 未確認・今後の現行仕様化

GPUごとの完全なRGBA一致、MOV／MP4のデコード後フレーム一致、高解像度tile pathの実機差は、変更仕様のvalidationで環境と結果を記録する。
