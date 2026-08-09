---
type: current
id: CURRENT-VIDEO-EXPORT
title: 動画・連番フレーム出力
status: current
owners: [maintainer]
created: 2026-07-31
updated: 2026-08-09
requirement_ids: [EXPORT-001, EXPORT-002, EXPORT-003, EXPORT-004, EXPORT-005, EXPORT-006, EXPORT-007]
related_adrs: [ADR-0004, ADR-0005]
related_changes: [CHANGE-011, CHANGE-024]
related_code: [src/adapters/browser/videoExportService.ts, src/adapters/tauri/videoExportService.ts, src/adapters/types.ts, src/lib/renderBridge.ts, src/lib/videoExportFrames.ts, src/lib/tileRender.ts, src/lib/webgl.ts, src/components/GradientCanvas.tsx, src/components/ClothCanvas.tsx, src/components/ExportPanel.tsx]
related_tests: [src/lib/renderBridge.test.ts, src/lib/effectPipeline.test.ts, src/lib/glass.test.ts, src/lib/videoExportFrames.test.ts]
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

### EXPORT-007 Preview表示面のフレームキャプチャ

2Dモードの動画・連番フレーム出力は従来のGradientCanvasを使用します。3Dモードでは、export sessionで生成した処理済み2DフレームをClothのCanvasTextureへ反映し、マッピング後の3D Preview Canvasをキャプチャします。Preview RAFによる上書きや、元の2D Canvasだけの出力を許可しません。

## 他領域との関係

- Effect Stackは、出力へ渡す有効レイヤー順序とGlass（GLASS V2）の描画計画を定義する。
- Animationは、固定されたnormalizedTimeからscene evaluationへ渡す時間依存値を定義する。
- ADR-0004とADR-0005は、中間画像をping-pong FBOで処理する描画方式を定義する。

## 変更履歴

- [CHANGE-011 GLASS／GLASS V2書き出し決定性修正](../../changes/active/CHANGE-011-deterministic-glass-export/proposal)
- [SPEC-005 動画出力表示名とファイル名](../SPEC-005-video-export-naming)
- [SPEC-023 動画書き出しUXとMP4品質](../SPEC-023-video-export-ux-and-mp4-quality)
- [SPEC-024 動画書き出しFFmpeg待機の応答性](../SPEC-024-video-export-encode-responsiveness)

## 未確認・今後の現行仕様化

GPUごとの完全なRGBA一致、MOV／MP4のデコード後フレーム一致、高解像度tile pathの実機差は、変更仕様のvalidationで環境と結果を記録する。
