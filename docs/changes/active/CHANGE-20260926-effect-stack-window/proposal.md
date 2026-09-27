---
type: change
id: CHANGE-20260926-effect-stack-window
title: Effect Stackのネイティブ別ウインドウ化
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-26
updated: 2026-09-26
current_specs: [CURRENT-UI-CONTROLS]
related_adrs: [ADR-20260926-native-secondary-windows]
related_code: [src/components/PostprocessStackPanel.tsx, src/components/EffectStackPanelView.tsx, src/components/EffectStackWorkspace.tsx, src/features/effectStack/effectStackController.ts, src/features/effectStack/effectStackView.ts, src/features/effectStack/effectStackIntents.ts, src/features/effectStack/useEffectStackWindowHost.ts, src/features/effectStack/EffectStackWindowApp.tsx, src/adapters/tauri/toolWindows.ts, src/main.tsx, src/WindowRoot.tsx, src/i18n/messages.ts, src-tauri/src/tool_windows.rs, src-tauri/capabilities/tool-windows.json]
related_tests: [src/features/effectStack/effectStack.test.ts, src/adapters/tauri/toolWindows.test.ts, src/components/PostprocessStackPanel.test.tsx]
human_review: required
---

# Effect Stackのネイティブ別ウインドウ化

Request source: Direct request（2026-09-26、UI改善の一環。`Stack V2`表示の位置に別ウインドウボタンを置く）

## 背景・問題

Effect Stackはキャンバス上にフローティング表示され、キャンバスの一部を覆う。CHANGE-015ではWebView2上で別ウインドウが極小・未ロードになったため別ウインドウ化を廃止したが、CHANGE-20260926-gradient-ramp-editor-windowでブラウザー引数を一致させる方式により別ウインドウを正常に生成できることを実機で確認した。

## 変更理由

キャンバスを覆わずにEffect Stackを操作できるようにするため。

## ゴール・成功条件

- Tauri版でEffect Stackヘッダーの別ウインドウボタンを押すと、Effect Stackが別のネイティブウインドウで開き、ワークスペース上のパネルは隠れる。
- 別ウインドウの操作がインラインと同じ結果になり、キャンバスとプロパティモジュールへ反映される。
- ウインドウを閉じるとインラインパネルが戻る。

## 対象

- UI-009の改訂。
- Effect Stackパネルの表示（View）と操作（Controller）の分離。操作ロジックはメインウインドウのcontrollerへ移し、インライン・別ウインドウで共有する。
- 別ウインドウはメインが生成するシリアライズ可能なview状態を受け取り、操作をintentとしてメインへ送る。
- Tauriのツールウインドウ生成を`open_tool_window`へ一般化し、Gradient Ramp editorと共有する。

## 対象外

- Color Histogramの別ウインドウ化。
- Effect Stackウインドウの位置・サイズの保存。
- ブラウザー版での別ウインドウ化。
- レイヤーのプロパティ編集を別ウインドウに表示すること（プロパティはメインのプロパティモジュールで編集する）。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls.md)（UI-009）

## 関連ADR

- [ADR-20260926-native-secondary-windows](../../../adr/20260926-native-secondary-windows.md)

## 受け入れ条件

- AC-001: Tauri版でヘッダーの別ウインドウボタン（旧`Stack V2`表示の位置）からEffect Stackウインドウが開き、インラインパネルが隠れてColor Histogramが先頭位置へ移る。ブラウザー版はボタンを表示せず`Stack V2`を表示する。
- AC-002: 別ウインドウで選択、ON／OFF、ソロ、ドラッグ並べ替え、ランダム化を行うと、インラインと同じ結果がメインへ反映され、状態表示がウインドウへ戻る。
- AC-003: ウインドウを閉じるとインラインパネルが戻り、メインを閉じるとウインドウも閉じる。
- AC-004: intentは種類・レイヤー・値を検証し、想定外のpayloadを実行しない。
- AC-006: 別ウインドウの高さ・幅を小さくしても、ヘッダーのボタンと各行のトグルを操作できる（行はスクロール、名前は省略表示）。
- AC-007: 分類ラベルを表示せず、インラインパネルの幅を200pxにする。
- AC-005: インラインパネルの既存動作（ランダム化の行アニメーション、ソロ、ドラッグ、状態表示）が変わらない。

## 主なリスク

- パネルのcontroller分離で、インライン表示の既存動作が変わる可能性がある（AC-005）。
- 別ウインドウでのドラッグ確定からメインの順序反映までの間、行の位置を保持する。反映されない場合は1秒で解除する。

## 未決定事項

- なし。
