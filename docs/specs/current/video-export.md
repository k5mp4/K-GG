---
type: current
id: CURRENT-VIDEO-EXPORT
title: 動画・連番フレーム出力
status: current
owners: [maintainer]
created: 2026-07-31
updated: 2026-09-25
requirement_ids: [EXPORT-001, EXPORT-002, EXPORT-003, EXPORT-004, EXPORT-005, EXPORT-006, EXPORT-007, EXPORT-008, EXPORT-009, EXPORT-010, EXPORT-011, EXPORT-012, EXPORT-013, EXPORT-021]
related_adrs: [ADR-0004, ADR-0005, ADR-0018, ADR-0021]
related_changes: [CHANGE-011, CHANGE-024, CHANGE-025, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-037, CHANGE-038, CHANGE-048, CHANGE-051, CHANGE-052, CHANGE-054]
related_code: [src/adapters/browser/videoExportService.ts, src/adapters/tauri/videoExportService.ts, src/adapters/browser/exportService.ts, src/adapters/tauri/exportService.ts, src/adapters/tauri/afterEffectsService.ts, src/adapters/types.ts, src/lib/export.ts, src/lib/exportSlits.ts, src/lib/exportVideo.ts, src/lib/videoExportFormats.ts, src/lib/aftereffectsExport.ts, src/lib/aeStatusController.ts, src/lib/videoExportLifecycle.ts, src/lib/renderBridge.ts, src/lib/renderSceneAtTime.ts, src/lib/flowGradientRenderer.ts, src/lib/flowSimulation.ts, src/lib/videoExportFrames.ts, src/lib/tileRender.ts, src/lib/webgl.ts, src/lib/clothGradientRenderer.ts, src/lib/coneSeam.ts, src/components/GradientCanvas.tsx, src/components/ClothCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ExportPanel.tsx, src-tauri/src/lib.rs, tools/ffmpeg-native-smoke.mjs, tools/verify-macos-signing.sh, tools/tauri-build-macos-verified.sh]
related_tests: [src/lib/videoExportFormats.test.ts, tests/e2e/export.spec.ts, src/lib/renderBridge.test.ts, src/lib/effectPipeline.test.ts, src/lib/renderFrame.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts, src/lib/glass.test.ts, src/lib/videoExportFrames.test.ts, src/lib/coneView.test.ts, src/lib/coneSeam.test.ts, src/lib/coneViewRenderer.test.ts, src/lib/webglPerformance.test.ts, src/lib/aftereffectsExport.test.ts, src/lib/aeStatusController.test.ts, src/lib/videoExportLifecycle.test.ts, src/adapters/tauri/exportService.test.ts, src/adapters/tauri/videoExportService.native-artifact.test.ts, src/adapters/tauri/exportService.native-artifact.test.ts, src/adapters/tauri/afterEffectsService.native-artifact.test.ts]
---

# 動画・連番フレーム出力

## 目的

Previewで評価されるシーンを、指定したFPS・duration・speed・easingに従って、連番PNG ZIPまたはTauri版のMOV／MP4／WebM／GIFへ一貫したフレーム列として出力する。

## 現在の要件

### EXPORT-001 フレーム時刻

動画出力の各フレームは`frameIndex`と`totalFrames`から決まる`normalizedTime`を使用する。フレーム生成は実時間、処理時間、Previewの再生位置、`performance.now()`に依存せず、同じ入力設定と同じframeIndexから同じ時刻を評価する。

### EXPORT-002 共通フレーム生成

PNG ZIP、MOV、MP4、WebM、GIFは、同じEffect Pipeline、scene evaluation、time remap、render-and-capture規則でフレームを生成する。保存、ZIP追加、一時ファイル、FFmpeg encodeだけを出力形式ごとの処理として分離する。

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

通常の出力はexport sessionの時刻を`renderSceneAtTime`へ渡し、Previewと同じEffect Stack render planで生成します。Coneレイヤーが有効な場合はMain Stack内の順序位置でshader passを行い、その出力と後続レイヤーを含むメインGradient Canvasをキャプチャします。Cloth表示モードでは既存Cloth Rendererを使います。独立Cone Canvasや別Rendererの同期キャプチャ経路は持ちません。

### EXPORT-008 Cone stack passのフレーム処理

`effectPipeline.effectStack`にあるConeレイヤーは通常の順序で各フレームを処理します。export sessionのnormalizedTimeをFlow Mappingへ渡し、Direct ProjectionではV offsetを固定します。Cone shader passは直前のstack textureを読み取り、結果をping-pong destinationへ書き込むため、後続レイヤーもこのCone表示を入力にできます。静止画、連番PNG、MOV、MP4、WebM、GIFの各フレームでPreviewと同じCone mapping、Seam Mode、Gradient Reapply RGB補正、alpha保持を使い、Cone固有のCanvasや出力形式別合成を挟みません。

### EXPORT-009 Tauri動画成果物の保存・解放

Tauri版のMOV・MP4・WebM・GIFは、FFmpegが生成した最終動画をWebViewの`Blob`へ読み戻さず、K-GG一時領域のネイティブ動画成果物として扱います。利用者が選択した保存先へはネイティブファイルコピーで保存し、After Effects送信時は同じ成果物パスを検証済みのTauri/Rust連携境界へ渡します。After Effectsへ送信できる形式はMOV・MP4だけで、WebM・GIFは保存のみ行います。

Tauri版MP4は標準互換のH.264（`libx264`）／`yuv420p`で生成し、動画系サービスで解釈されるBT.709の色メタデータ、video range、正方画素（SAR `1:1`）を付与します。YUV 4:2:0で表現できない奇数寸法は、右端・下端を1px以内でpaddingして偶数寸法にします。既存連携との互換性のため、保存ファイル名に含まれる`_h264rgb`は維持しますが、実際のRGBエンコードを意味しません。

保存キャンセル、失敗、書き出しcancel、画面のunmountでは未保持の成果物を解放します。最後に保存した成果物は、次の動画へ置換されるか画面がunmountされるまで保持し、After Effects送信中の場合は送信完了後に解放します。一時領域の削除に一時的な失敗があった場合は、上限付きで再試行します。

After Effectsへの自動送信は書き出し完了とPreview復帰を待たせません。複数のAE操作は直列化し、古い操作結果またはタイマーが新しい送信中状態を上書きしないよう、最新操作だけを表示状態へ反映します。自動送信が実行中1件と待機中1件に達した場合は、待機する大容量成果物が無制限に増えないよう、新しいMOV・MP4書き出しを送信完了まで無効にします。

Rustで保存先を正規化し、Tauri filesystem scopeに含まれることをコピー前に確認する。許可されていない保存先へは書き込まない。既存のリンク・一時成果物・拡張子検証も維持し、一時成果物と保存先の拡張子が一致しない保存を拒否する。

### EXPORT-010 デスクトップ版プラットフォーム

Tauriデスクトップ版の動画出力はWindows x64とmacOS arm64/Intelで提供する。WindowsはNSISと既存のTauri updaterを使用する。macOSはAd-hoc署名した`.app`を含むDMGを試験配布し、公証・自動更新は提供しない。CIは生成した`.app`とDMG内の`.app`を検証する。Browser版のPNG連番ZIPと静止画出力はこの区分に依存しない。

### EXPORT-011 外部FFmpegの検出

Windows x64はアプリローカルデータの`ffmpeg/ffmpeg.exe`を優先し、利用できない場合はPATHとWindows環境変数Pathを探索する。macOSはPATH上の`ffmpeg`と`ffprobe`を探索する。どちらもRust側でFFmpegの起動、バージョン、`qtrle`、`libx264`を検証し、K-GGはFFmpegを同梱・ダウンロード・PATH変更しない。macOSの`ffprobe`はアプリの検出警告とCI/Release Gateの生成物検証に使用する。

### EXPORT-012 書き出し形式の選択

静止画と動画の書き出し形式はTweeqの`InputDrum`で選択し、単一の保存／書き出しボタンで選択形式を出力する。静止画はPNG／JPG／WebP（JPG・WebPの品質は0.92）を選択できる。動画は検出したFFmpegで利用可能なネイティブ形式とPNG連番（ZIP）を選択肢とし、FFmpeg未検出時とBrowser版ではMOV／MP4を無効な書き出しボタンとともに表示する。Browser版の既定値はPNG連番（ZIP）、Tauri版の既定値はMOVとする。MP4とWebMでは品質プリセット（High／Balanced／Small）を選択できる。

保存ファイル名はMOVが`{stem}.mov`、MP4が`{stem}_h264rgb.mp4`、WebMが`{stem}.webm`、GIFが`{stem}.gif`、PNG連番が`{stem}_frames.zip`とする。

### EXPORT-013 FFmpeg動画形式の登録

Tauri版のネイティブ動画形式は、Rustの形式登録表（`NativeVideoFormat`）で形式ID、必要エンコーダー、一時出力ファイル名、FFmpeg引数を定義し、単一の`encode_native_video` commandで生成する。フロントエンドは同じ形式IDの表示名、保存ファイル名、品質選択とAfter Effects送信の可否を登録表（`src/lib/videoExportFormats.ts`）で定義する。

| 形式 | エンコーダー | 出力 |
| --- | --- | --- |
| MOV | `qtrle` | `rgb24`のロスレスQuickTime Animation |
| MP4 | `libx264` | EXPORT-009のH.264／`yuv420p`／BT.709 |
| WebM | `libvpx-vp9` | CRF（High 24／Balanced 31／Small 38）、`-b:v 0`、`yuv420p`、BT.709メタデータ、奇数寸法は右端・下端を1px以内でpadding |
| GIF | `gif` | 全フレームから生成した256色パレット（`palettegen`／`paletteuse`）、無限ループ、最大ファイルサイズに合わせた縮小 |

FFmpegの利用可否は従来どおり`qtrle`と`libx264`で判定し、FFmpeg状態は検出したエンコーダーから利用可能な形式を`videoFormats`として返す。WebMとGIFは該当エンコーダーを持つFFmpegでだけ選択肢に表示し、Rust側でも利用できない形式のencode要求を拒否する。GIFの1フレームの表示時間は1/100秒単位のため、60fpsの出力は多くのビューアーで約50fpsとして再生される。

GIFは最大ファイルサイズ（MB、1MB = 1,000,000 bytes、既定15MB、1〜1000MB）を指定でき、書き出し結果がこの値以上の場合は解像度を縮小（面積比の平方根×0.92）して再エンコードする。最大6回試行しても収まらない場合、または5%まで縮小しても収まらない場合はエラーとする。Rust側でも範囲を検証する。

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
- [CHANGE-054 書き出し形式のInputDrum化とFFmpeg動画形式の追加](../../changes/active/CHANGE-054-export-format-select/proposal)

## 未確認・今後の現行仕様化

GPUごとの完全なRGBA一致、MOV／MP4／WebM／GIFのデコード後フレーム一致、高解像度tile pathの実機差は、変更仕様のvalidationで環境と結果を記録する。
