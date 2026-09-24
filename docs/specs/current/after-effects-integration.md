---
type: current
id: CURRENT-AFTER-EFFECTS-INTEGRATION
title: After Effects連携
status: current
owners: [maintainer]
created: 2026-08-30
updated: 2026-09-24
requirement_ids: [AE-001, AE-002, AE-003, AE-004, AE-005, AE-006, AE-007]
related_adrs: [ADR-0018]
related_changes: [CHANGE-038, CHANGE-052]
related_code: [src/lib/aftereffectsExport.ts, src/lib/afterEffectsVideoDestination.ts, src/lib/aeStatusController.ts, src/lib/videoExportLifecycle.ts, src/lib/exportVideo.ts, src/components/ExportPanel.tsx, src/adapters/types.ts, src/adapters/browser/exportService.ts, src/adapters/tauri/afterEffectsService.ts, src/adapters/tauri/exportService.ts, src/lib/export.ts, src-tauri/src/after_effects.rs, src-tauri/src/lib.rs, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json]
related_tests: [src/lib/aeStatusController.test.ts, src/lib/afterEffectsVideoDestination.test.ts, src/lib/videoExportLifecycle.test.ts, src/adapters/tauri/afterEffectsService.native-artifact.test.ts, src/adapters/tauri/exportService.native-artifact.test.ts, src/adapters/tauri/exportService.test.ts]
---

# After Effects連携

## 目的

K-GGで作成した画像・動画をAfter Effectsへ渡し、必要に応じてAfter Effectsのレイヤー情報をK-GGで利用できるようにする。

## 現在の要件

### AE-001 画像のAfter Effects送信

Web版のAfter Effects連携は、利用者が起動した`KGG_AE_Bridge`へ現在のCanvas画像を送信し、After Effectsのコンポジションへ読み込む。

### AE-002 動画のAfter Effects送信

Web版のAfter Effects連携は、直前に書き出したMOVまたはMP4を`KGG_AE_Bridge`へ送信し、After Effectsのコンポジションへ読み込む。Tauri版は同じ成果物をネイティブ連携経路からAfter Effectsへ渡す。

動画の保存成功を確認してからAfter Effects送信を開始する。Tauri版で「Exportしたファイルをそのまま使う」を選択した場合は、通常Exportで確定したファイルを再コピーせずにAfter Effectsへ渡す。After Effectsの完了待ち中も、K-GGの動画書き出し状態、Previewのアニメーション、タイムライン操作は送信待ちの影響を受けない。複数の送信が重なった場合は、最新の送信結果だけをAEステータスへ反映する。

Tauri版のAfter Effects操作は、`requestId`と操作種別が一致する完了JSONを結果の正本とする。`AfterFX.exe -r`のランチャーが先に正常終了しても操作完了とはみなさず、完了JSONを上限時間まで待つ。ランチャーの非ゼロ終了、完了JSONの検証失敗、上限時間超過は失敗として扱う。

### AE-003 送信ファイル保存先

動画自動送信の既定値は通常Exportで保存したファイルの直接利用とし、同じファイルをAE送信用に再生成しない。利用者が「AE送信用フォルダーへコピーする」を選択した場合は指定された保存先を優先し、未指定または利用できない場合はAfter Effectsプロジェクトの場所または一時フォルダへ送信ファイルを保存する。画像送信とBrowser版Bridgeは、従来どおりそれぞれのAE送信先を使う。

保存ダイアログがキャンセルされた場合は保存成功とみなさず、動画の成功表示とAfter Effects送信を行わない。

### AE-004 After Effectsレイヤー読み込み

現在のK-GGはAfter Effectsのコンポジション、選択レイヤー、レイヤー属性を読み込まない。

### AE-005 After Effects素材・レンダー結果の読み込み

現在のK-GGはAfter EffectsのFootage素材またはレイヤーのレンダー結果を連携対象として読み込まない。

### AE-006 After Effects設定の変換

現在のK-GGはAfter EffectsのKagaribiエフェクト設定をK-GGの編集状態へ変換しない。

### AE-007 プラットフォーム境界

TauriのAfter Effects自動操作はWindows x64で利用する。macOS版ではAfter Effects連携を利用不可として表示し、After Effects自動操作の代替経路や対応を約束しない。Browser版のBridge契約は既存の開発用途として維持する。

## 他領域との関係

- [動画・連番フレーム出力](./video-export)で生成したMOV・MP4を送信対象とする。
- [UI入力コントロール](./ui-controls)のExport Panelから連携操作を開始する。
- K-GGのPreset・Effect Stackの状態はAfter Effectsのレイヤー構造と同一視しない。

## 変更履歴

- [CHANGE-038 K-GG単独After Effects連携と段階的レイヤー取込](../../changes/archive/CHANGE-038-after-effects-native-integration/proposal)

## 未確認・今後の現行仕様化

- After Effectsの実機を使ったWindows x64での送受信確認はCHANGE-038のvalidationへ記録する。
- macOSのAfter Effects自動操作は対象外であり、別Requestが承認されるまで実装しない。
