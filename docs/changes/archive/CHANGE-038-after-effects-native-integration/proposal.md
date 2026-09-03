---
type: change
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: archived
change_kind: A
owners: [maintainer]
created: 2026-08-30
updated: 2026-09-03
current_specs: [CURRENT-AFTER-EFFECTS-INTEGRATION, CURRENT-VIDEO-EXPORT, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0018]
related_code: [src/lib/aftereffectsExport.ts, src/lib/aeStatusController.ts, src/lib/videoExportLifecycle.ts, src/components/ExportPanel.tsx, src/adapters/index.ts, src/adapters/types.ts, src/adapters/browser/afterEffectsService.ts, src/adapters/browser/exportService.ts, src/adapters/tauri/afterEffectsService.ts, src/adapters/tauri/exportService.ts, src/adapters/tauri/videoExportService.ts, src/lib/export.ts, src/lib/exportSlits.ts, src/lib/coneViewRenderer.ts, src/lib/clothGradientRenderer.ts, src/lib/webglPerformance.ts, src/lib/webgl.ts, src/lib/gpuDiagnostics.ts, src-tauri/src/lib.rs, src-tauri/src/after_effects.rs, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json]
related_tests: [src/lib/aftereffectsExport.test.ts, src/lib/aeStatusController.test.ts, src/lib/videoExportLifecycle.test.ts, src/adapters/tauri/exportService.test.ts, src/adapters/tauri/videoExportService.native-artifact.test.ts, src/adapters/tauri/exportService.native-artifact.test.ts, src/adapters/tauri/afterEffectsService.native-artifact.test.ts, src/lib/coneViewRenderer.test.ts, src/lib/webglPerformance.test.ts, src/lib/webglShaderSources.test.ts, src/lib/renderBridge.test.ts, src-tauri/src/after_effects.rs]
human_review: completed
outcome: follow-up
migration: historical
follow_up: "issue-needed: After Effects自動送信フリーズを別B changeで修正し、Tauri/AE実機を確認する"
---

# CHANGE-038 K-GG単独After Effects連携と段階的レイヤー取込

## 背景・問題

K-GGのAfter Effects連携は、Web版だけでなくローカルTauri版でも`localhost:7749`の`KGG_AE_Bridge`を別途起動する必要がある。Tauri版はOSのファイルと外部プロセスを扱えるため、連携処理をK-GGに内包できる。

画像・動画送信に続いて、After Effectsのレイヤー情報、素材、レンダー結果、対応可能なKagaribi設定を段階的にK-GGへ取り込みたい。ただし現在のK-GGは単一シーンと固定種別のEffect Stackを扱うため、任意のAEレイヤー構成を完全に編集可能な形へ変換することは対象にしない。

## 変更理由

ローカル版の利用者がBridgeの起動・ポート・プロセス状態を意識せず、K-GGの操作からAfter Effectsへの送信を開始できるようにする。送信経路をTauri側へ統合してから、同じAE接続基盤を使ってレイヤー情報の一方向取り込みを追加する。

## ゴール・成功条件

- Tauri版K-GGからPNG、MOV、MP4を、別途Bridgeを手動起動せずにAfter Effectsへ送信できる。
- Web版の既存Bridge連携は維持する。
- AE未起動、対象コンポジション不在、ファイル保存失敗、JSX失敗を利用者が判別できる。
- 選択したAEコンポジションとレイヤーの読み込み結果を、K-GG側で非対応項目を明示したDTOとして扱える。
- Footage素材またはAEでレンダーした結果を、K-GGの取り込み対象として区別できる。
- KagaribiエフェクトのうちK-GGへ変換できるパラメータだけを、明示的な変換結果として扱える。

## 対象

- P0としてTauri/RustのAfter Effects接続、画像・動画送信、保存先、接続状態、失敗処理を追加する。
- P1として選択コンポジション・選択レイヤーのメタデータを一度に読み込む。
- P2としてFootageの元ファイルまたはレイヤーの一時レンダー結果を取り込む。
- P3として対応可能なKagaribiパラメータをK-GGの設定へ変換する。
- Tauri Adapter、Rust command、固定JSX、作業領域、検証結果、current specを同期する。

## 対象外

- Tauri版でのAfter Effects本体の自動インストール、自動起動、ライセンス管理。
- Web版のBridge廃止、Bridge配布物の削除、Web版の既存連携仕様の変更。
- 任意のAEレイヤーグラフ、マスク、式、テキスト、シェイプ、親子関係、3DカメラをK-GGで完全編集可能にすること。
- K-GGとAEのリアルタイム双方向同期、常時監視、複数インスタンスの同時操作。
- `kagaribi_ae`プラグインへプロジェクト通信機能を追加すること。

## 影響を受ける現行仕様

- [After Effects連携](../../../specs/current/after-effects-integration)
- [動画・連番フレーム出力](../../../specs/current/video-export)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0018 TauriからAfter Effectsへ固定JSXと一時ファイルで接続する](../../../adr/0018-tauri-after-effects-connector)

## 主なリスク

- AfterFXの終了コードだけではJSX内部の失敗を判別できないため、完了JSONまたはエラーマーカーが必要になる。
- JSXへパスを渡す処理にエスケープ漏れがあると、意図しないファイル参照やスクリプト実行につながる。
- 動画データをTauri IPCへ直接渡すとメモリ使用量が増えるため、一時ファイル経由にする。
- AEのアクティブコンポジションが曖昧な場合、誤ったコンポジションへ追加する可能性がある。
- AEの全機能をK-GGの単一シーンモデルへマッピングできないため、非対応項目を編集可能と誤表示しない。
- 実機AEを使う手動スモーク確認を自動テストだけで代替できない。

## 未決定事項

なし。After Effects本体は起動済みであること、P0は現行のWindows x64 Tauri配布を主検証対象とすること、レイヤー情報は一方向のDTOとして段階導入することを承認済みの前提とする。

## Finalization

- Finalized: 2026-09-03
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: After Effects自動送信フリーズを別B changeで修正し、Tauri/AE実機を確認する
