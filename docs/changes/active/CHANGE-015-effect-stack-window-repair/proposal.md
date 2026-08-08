---
type: change
id: CHANGE-015
title: Effect Stack別ウィンドウの廃止
status: approved
change_kind: B
owners: [maintainer]
created: 2026-08-02
updated: 2026-08-08
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: []
related_code: [src/components/PostprocessStackPanel.tsx, src/components/GradientRamp.tsx, src/main.tsx, src/i18n/messages.ts, src-tauri/capabilities/default.json]
related_tests: ['manual: inline Effect Stack checks', 'manual: Tauri inline-only check']
human_review: completed
---

# CHANGE-015 Effect Stack別ウィンドウの廃止

実機検証により、TauriのWebView2環境ではネイティブ`WebviewWindow`が16×16の極小ウィンドウになりWebviewがページをロードしないこと、Document Picture-in-Pictureおよび`window.open`ポップアップもユーザー操作で失敗することを確認した。ブラウザーでも別ウィンドウ化は利便性に対して維持コストが高いため、別ウィンドウ化そのものを廃止し、Effect Stackは常にワークスペース内のインライン表示のみで提供する方針へ変更する。実装と自動検証は完了し、実機受け入れ確認までactiveに保持する。

## 背景・問題

Effect Stackを別ウィンドウへ切り離す操作が、ブラウザーの別ドキュメントで正しく表示・操作できないことがあります。現在のブラウザー用ポップアップは独立したReact rootへパネルだけを描画しており、パネルが利用するLanguageProviderやTweeqのViewportを共有していません。そのため、別ウィンドウで`useLanguage`を呼ぶコンポーネントが実行時エラーになり、空白または操作不能になる可能性があります。

Tauriの別ウィンドウ作成も、作成・失敗イベントが届かない場合に一定時間後の処理を成功として扱うため、実際には作成できていないのに開いた状態としてUIが残る可能性があります。実機確認では、TauriのWebView2環境で別ウィンドウ（`WebviewWindow`）が16×16ピクセルの極小サイズで作成され、Webviewがページをロードしない問題が再現した。`documentPictureInPicture.requestWindow()`もユーザー操作で`NotAllowedError`またはIPC失敗になり、`window.open`フォールバックも`null`を返した。

## 変更理由

Tauriではネイティブ別ウィンドウ・Document Picture-in-Picture・ポップアップのいずれも安定動作しないため、別ウィンドウ化を廃止し、Effect Stackを常にインライン表示で提供する。ブラウザーとTauriのどちらでも同じインラインUIを使うことで、開閉状態の不整合やプラットフォーム差分を残さないことを目的とする。

## ゴール・成功条件

- Effect Stackはワークスペース内のインライン表示のみで提供する。
- 別ウィンドウ操作（Document Picture-in-Picture、ポップアップ、TauriネイティブWebviewWindow）のボタンやUIを表示しない。
- 通常のインラインEffect Stack、ランダム順序・ソロレイヤー・ドラッグ並べ替え、選択・有効状態変更は既存動作を維持する。
- 描画・保存形式、Preset互換性は変更しない。

## 対象

- ブラウザーのDocument/Picture-in-PiP、通常ポップアップの別ウィンドウrootを削除する。
- TauriネイティブWebviewWindowの別ウィンドウ経路（`DetachedEffectStackApp.tsx`、`effectStackWindow.ts`、`effect-stack.json`capability、`main.tsx`分岐）を削除する。
- 別ウィンドウ操作ボタンと関連i18nメッセージ、UI用語辞書の記述を削除する。
- 原因を再現できる単体テストと、ブラウザー・Tauriの手動確認項目。

## 対象外

- Effect Stackのランダム順序、Altクリックのソロレイヤー（CHANGE-014）。
- Effect Stackのデータモデル、描画パイプライン、Preset保存形式の変更。
- 複数の同時別ウィンドウ、別プロセス間の新しい同期プロトコル。
- 別ウィンドウ化の再導入。ブラウザー・Tauriのどちらでも別ウィンドウ表示は提供しない。
- Tauriの権限を必要以上に拡張すること、Window以外の権限変更。

## 影響を受ける現行仕様

- [CURRENT-EFFECT-STACK](../../../specs/current/effect-stack)
- [CURRENT-UI-CONTROLS](../../../specs/current/ui-controls)
- Legacy [SPEC-017 Effect Stack workspace layout](../../../specs/SPEC-017-effect-stack-workspace-layout)

## 関連ADR

- ADR-0005の主スタック／固定段の境界を維持する。別ウィンドウ固有のProviderとライフサイクルは削除するため、ADR-0005との矛盾はない。既存ADRと実装が矛盾する場合は実装前に報告する。

## 主なリスク

- 別ウィンドウ化の削除により、複数モニターでEffect Stackを開いていた利用者の作業形態が変わる。インライン表示のみになるため、既存のワークスペース配置で代替できることを利用者向け文書に示す。
- 削除漏れのコードやメッセージキーが残ると、未使用コードや型の不整合が生じるため、型チェック・lint・docs checkで検証する。

## 実装決定・未確認事項

- TauriのWebView2環境では、`WebviewWindow`（16×16極小・Webview未ロード）、`documentPictureInPicture`（`NotAllowedError`／IPC失敗）、`window.open`（null）のいずれも動作しないことを実機で確認した。別ウィンドウ化そのものを廃止する。
- 別ウィンドウ操作ボタン、関連i18nメッセージ（`common.detach`、`stack.detach`、`stack.restore`、`gradient.pipUnsupported`）、UI用語辞書の記述を削除する。
- 実機でのインライン表示・ランダム順序・ソロレイヤー・ドラッグ並べ替えの受け入れ確認は、validationに未確認事項として記録する。
