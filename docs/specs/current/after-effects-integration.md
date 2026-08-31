---
type: current
id: CURRENT-AFTER-EFFECTS-INTEGRATION
title: After Effects連携
status: current
owners: [maintainer]
created: 2026-08-30
updated: 2026-08-30
requirement_ids: [AE-001, AE-002, AE-003, AE-004, AE-005, AE-006]
related_adrs: [ADR-0018]
related_changes: [CHANGE-038]
related_code: [src/lib/aftereffectsExport.ts, src/components/ExportPanel.tsx, src-tauri/src/lib.rs, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json]
related_tests: []
---

# After Effects連携

## 目的

K-GGで作成した画像・動画をAfter Effectsへ渡し、必要に応じてAfter Effectsのレイヤー情報をK-GGで利用できるようにする。

## 現在の要件

### AE-001 画像のAfter Effects送信

Web版のAfter Effects連携は、利用者が起動した`KGG_AE_Bridge`へ現在のCanvas画像を送信し、After Effectsのコンポジションへ読み込む。

### AE-002 動画のAfter Effects送信

Web版のAfter Effects連携は、直前に書き出したMOVまたはMP4を`KGG_AE_Bridge`へ送信し、After Effectsのコンポジションへ読み込む。

### AE-003 送信ファイル保存先

Bridgeは指定された保存先を優先し、未指定または利用できない場合はAfter Effectsプロジェクトの場所または一時フォルダへ送信ファイルを保存する。

### AE-004 After Effectsレイヤー読み込み

現在のK-GGはAfter Effectsのコンポジション、選択レイヤー、レイヤー属性を読み込まない。

### AE-005 After Effects素材・レンダー結果の読み込み

現在のK-GGはAfter EffectsのFootage素材またはレイヤーのレンダー結果を連携対象として読み込まない。

### AE-006 After Effects設定の変換

現在のK-GGはAfter EffectsのKagaribiエフェクト設定をK-GGの編集状態へ変換しない。

## 他領域との関係

- [動画・連番フレーム出力](./video-export)で生成したMOV・MP4を送信対象とする。
- [UI入力コントロール](./ui-controls)のExport Panelから連携操作を開始する。
- K-GGのPreset・Effect Stackの状態はAfter Effectsのレイヤー構造と同一視しない。

## 変更履歴

- [CHANGE-038 K-GG単独After Effects連携と段階的レイヤー取込](../../changes/active/CHANGE-038-after-effects-native-integration/proposal)

## 未確認・今後の現行仕様化

- After Effectsの実機を使ったWindows x64での送受信確認はCHANGE-038のvalidationへ記録する。
- macOSのAfter Effects自動操作は、対象Tauri配布ターゲットを確認した後に現行仕様化する。
