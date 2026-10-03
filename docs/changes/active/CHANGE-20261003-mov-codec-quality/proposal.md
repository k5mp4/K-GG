---
type: change
id: CHANGE-20261003-mov-codec-quality
title: MOVのコーデックと品質選択
status: review
change_kind: F
owners: [maintainer]
created: 2026-10-03
updated: 2026-10-03
current_specs: [CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0018, ADR-0021]
related_code: [src/components/ExportPanel.tsx, src/lib/videoExportFormats.ts, src/adapters/types.ts, src/adapters/tauri/videoExportService.ts, src-tauri/src/lib.rs, tools/ffmpeg-native-smoke.mjs]
related_tests: [src/lib/videoExportFormats.test.ts, src/adapters/tauri/videoExportService.native-artifact.test.ts, src/components/ExportPanel.mov.test.tsx]
human_review: required
---

# MOVのコーデックと品質選択

## 背景・変更理由

Request source: Direct request。利用者から5秒のMOVが681MBになるとの報告があり、コーデックを指定して品質と容量を調整したいという依頼を受けた。既存実装はロスレスのQuickTime Animation（qtrle／rgb24）に固定されている。元映像の寸法・FPS・生成条件は未確認。

## ゴール・成功条件

- MOVでH.264、ProRes 422、Animationを選択できる。FFmpegにないエンコーダーは表示せず、Rustも拒否する。
- 既定MOVはH.264／Balanced。H.264はCRF 18／22／27、ProResはHQ／422／LTで画質と容量を調整できる。
- Animationの従来ロスレス出力を残し、品質選択を隠す。
- ファイル名、成果物の保存・解放、After Effectsへのパス受渡しとRustのパス検証を維持する。

## 対象・仕様同期

[動画・連番フレーム出力](../../../specs/current/video-export.md)のEXPORT-012／013を更新する。FFmpeg状態のmovCodecs、UI選択、Adapter DTO、Rustの許可リストと引数、境界テスト、実FFmpeg smokeを対象とする。既存ADRのプラットフォーム・連携境界を維持するため新ADRは不要。

## 対象外

透明動画、描画・Presetの変更、MP4／WebMの既定品質変更、MOVのGPU encode、最大容量保証、FFmpegの自動導入、Issue作成。コミット・push・ドラフトPR作成は追加のDirect requestで承認済み。

## リスク・未確認事項

H.264／ProResの圧縮と色サブサンプリングは従来RGBロスレスと結果が異なる。最終容量は入力内容・寸法・FPS次第。元映像の削減率、Tauri実機の操作、After Effects読み込み、macOS実機はRelease Gateで確認する。未確認事項の追跡Issue作成は別途明示依頼が必要。

## 検証

検証結果は[validation.md](./validation.md)に記録する。
