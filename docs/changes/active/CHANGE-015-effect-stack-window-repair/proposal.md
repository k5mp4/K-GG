---
type: change
id: CHANGE-015
title: Effect Stack別ウィンドウの復旧
status: approved
change_kind: B
owners: [maintainer]
created: 2026-08-02
updated: 2026-08-02
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: []
related_code: [src/components/PostprocessStackPanel.tsx, src/components/DetachedEffectStackApp.tsx, src/lib/effectStackWindow.ts, src/main.tsx, src-tauri/capabilities/default.json, src-tauri/capabilities/effect-stack.json, src-tauri/tauri.conf.json]
related_tests: [src/lib/effectStackWindow.test.ts, src/components/PostprocessStackPanel.test.tsx]
human_review: completed
---

# CHANGE-015 Effect Stack別ウィンドウの復旧

実装と自動検証は完了している。現在の検証環境では別ウィンドウが制御対象として公開されないため、ポップアップ／Tauri実機の受け入れ確認完了までactiveに保持する。

## 背景・問題

Effect Stackを別ウィンドウへ切り離す操作が、ブラウザーの別ドキュメントで正しく表示・操作できないことがあります。現在のブラウザー用ポップアップは独立したReact rootへパネルだけを描画しており、パネルが利用するLanguageProviderやTweeqのViewportを共有していません。そのため、別ウィンドウで`useLanguage`を呼ぶコンポーネントが実行時エラーになり、空白または操作不能になる可能性があります。

Tauriの別ウィンドウ作成も、作成・失敗イベントが届かない場合に一定時間後の処理を成功として扱うため、実際には作成できていないのに開いた状態としてUIが残る可能性があります。

## 変更理由

別ウィンドウを通常表示と同じコンテキストで描画し、作成失敗を失敗として扱うことで、ブラウザーとTauriの両方で切り離し操作を再現可能かつ復旧可能にします。既存のインライン表示、別ウィンドウからの選択・有効状態変更、閉じた後の再オープンを壊さないことを目的とします。

## ゴール・成功条件

- ブラウザーのDocument Picture-in-Pictureまたは通常ポップアップでEffect Stackが空白にならず、表示言語・Tweeqコントロール・選択・トグルが動作する。
- ブラウザーの別ドキュメント用React rootが、通常のアプリと同じLanguageProviderおよびTweeq Viewportの下でパネルを描画する。
- Tauriの別ウィンドウ作成イベントまたはエラーを正しく待機し、作成失敗・タイムアウト時はインライン表示へ戻る。
- 別ウィンドウを閉じるとホスト側の開閉状態が解除され、再度開く操作ができる。
- 別ウィンドウでのレイヤー選択・有効状態変更がホスト側へ反映され、ホスト側の変更も別ウィンドウへ反映される。
- 通常のインラインEffect Stack、別ウィンドウ以外のTauri起動、描画・保存形式は変更しない。

## 対象

- ブラウザーの外部Document/Picture-in-PiP rootのProvider構成。
- Tauri WebviewWindowの作成・失敗・タイムアウト・close/reopenライフサイクル。
- 別ウィンドウとホスト間の既存store購読・再描画の検証。
- 原因を再現できる単体テストと、ブラウザー・Tauriの手動確認項目。

## 対象外

- Effect Stackのランダム順序、Altクリックのソロレイヤー（CHANGE-014）。
- Effect Stackのデータモデル、描画パイプライン、Preset保存形式の変更。
- 複数の同時別ウィンドウ、別プロセス間の新しい同期プロトコル。
- Tauriの権限を必要以上に拡張すること、Window以外の権限変更。

## 影響を受ける現行仕様

- [CURRENT-EFFECT-STACK](../../../specs/current/effect-stack)
- [CURRENT-UI-CONTROLS](../../../specs/current/ui-controls)
- Legacy [SPEC-017 Effect Stack workspace layout](../../../specs/SPEC-017-effect-stack-workspace-layout)

## 関連ADR

- ADR-0005の主スタック／固定段の境界を維持し、別ウィンドウ固有のProviderとライフサイクルだけを修正する。既存ADRと実装が矛盾する場合は実装前に報告する。

## 主なリスク

- ブラウザーがポップアップをブロックした場合、別ウィンドウは開けないためインライン表示を維持し、ユーザーが再試行できる状態にする。
- Tauriのイベント名や権限設定を誤ると起動環境だけで失敗するため、作成・失敗・closeをテスト可能な境界へ分離する。
- Providerを二重化することでテーマや言語状態が初期化される可能性があるため、別ドキュメントではホストと同じ初期言語を使い、Effect Stackのstore状態を一次情報として扱う。

## 実装決定・未確認事項

- Tauri作成イベントの待機タイムアウトは3秒とし、イベント未着時は失敗としてインライン表示へ戻す。
- Document Picture-in-Pictureのcloseイベント購読は既存の`pagehide`／`unload`経路を維持する。実機でのポップアップclose/reopen確認は未実施としてvalidationに記録する。
