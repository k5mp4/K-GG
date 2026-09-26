---
type: change
id: CHANGE-20260926-gradient-ramp-editor-window
title: Gradient Ramp editorのネイティブ別ウインドウ化
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-26
updated: 2026-09-26
current_specs: [CURRENT-UI-CONTROLS]
related_adrs: [ADR-20260926-native-secondary-windows]
related_code: [src/components/GradientRamp.tsx, src/adapters/tauri/gradientRampEditorWindow.ts, src/features/gradientRampEditor/GradientRampEditorWindowApp.tsx, src/features/gradientRampEditor/useGradientRampEditorHost.ts, src/features/workspace/useWorkspaceController.ts, src/main.tsx, src-tauri/src/tool_windows.rs, src-tauri/src/lib.rs, src-tauri/capabilities/tool-windows.json, src/adapters/tauri/toolWindows.ts]
related_tests: [src/adapters/tauri/toolWindows.test.ts]
human_review: required
---

# Gradient Ramp editorのネイティブ別ウインドウ化

Request source: Direct request（2026-09-26、UI改善の一環）

## 背景・問題

Gradient Rampの`Open Gradient Ramp editor`は、元々K-GGとは別のウインドウで操作することを想定していた。現在はワークスペース上のフローティングパネルとして開くため、キャンバスの一部を覆い、結果を見ながらの編集がしにくい。

CHANGE-015ではEffect Stackの別ウインドウ化がWebView2で失敗し（16×16の極小ウインドウ、Webview未ロード）、別ウインドウ化そのものを廃止した。

## 変更理由

キャンバスを覆わずにRampを編集できるようにするため。また、CHANGE-015の失敗はメインウインドウと別ウインドウでWebView2のブラウザー引数が一致していなかったことが原因である可能性が高く、引数を一致させれば別ウインドウを安定して作れる見込みがある。

## ゴール・成功条件

- Tauri版で`Open Gradient Ramp editor`を押すと、別のネイティブウインドウにエディタが開く。
- エディタでの編集がメインのキャンバスへ即時に反映され、メイン側の変更・Undo／Redoもエディタへ反映される。
- ブラウザー版と、ネイティブウインドウの作成に失敗した場合は、従来のフローティングエディタを使える。

## 対象

- UI-029の追加と、UI-009からGradient Ramp editorを切り離す記述変更。
- Rustのウインドウ作成コマンド、エディタ専用capability、ウインドウ間の状態同期。

## 対象外

- Effect Stackなどほかのパネルの別ウインドウ化。
- Preset形式、描画結果、書き出しの変更。
- エディタウインドウの位置・サイズの保存。
- ブラウザー版での別ウインドウ化。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls.md)（UI-009、UI-029）

## 関連ADR

- [ADR-20260926-native-secondary-windows](../../../adr/20260926-native-secondary-windows.md)

## 受け入れ条件

- AC-001: Tauri版でボタンを押すと、正常なサイズでエディタが描画された別ウインドウが開く。2回目の操作では既存ウインドウを前面へ出す。
- AC-002: エディタとメインの間でgradient、キーフレーム、選択ストップ、選択アンカー、現在時刻が同期し、受信した変更を送り返さない。
- AC-003: エディタのUndo／Redo（ボタン・ショートカット）はメインの履歴を操作する。
- AC-004: メインを閉じるとエディタも閉じ、エディタを閉じるとメインは同期送信を止める。
- AC-005: ブラウザー版と作成失敗時は従来のフローティングエディタを表示する。

## 主なリスク

- 原因の仮説が外れた場合、実機で極小ウインドウが再現する。その場合もAC-005のフォールバックは動くが、作成は成功扱いになるため空のウインドウが残る可能性がある。
- 再生中は現在時刻の変更がフレームごとにエディタへ送られる。

## 未決定事項

- なし（Tauri実機確認の結果によって方式を見直す）。
