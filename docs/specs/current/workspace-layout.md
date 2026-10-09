---
type: current
id: CURRENT-WORKSPACE-LAYOUT
title: ワークスペースと小画面レイアウト
status: current
owners: [maintainer]
created: 2026-10-03
updated: 2026-10-09
requirement_ids: [LAYOUT-001, LAYOUT-002, LAYOUT-003, LAYOUT-004, LAYOUT-005]
related_adrs: [ADR-20261003-responsive-workspace-layout]
related_changes: []
related_code: [src/App.tsx, src/components/DockPanel.tsx, src/components/EffectStackWorkspace.tsx, src/components/TimelineBar.tsx, src/features/workspace/workspaceLayout.ts, src/features/workspace/useWorkspaceLayout.ts, src/features/workspace/useWorkspaceController.ts, src/features/workspace/WorkspaceTopBar.tsx, src/features/workspace/CanvasWorkspace.tsx, src/features/workspace/TimelineWorkspace.tsx, src-tauri/tauri.conf.json]
related_tests: [src/features/workspace/workspaceLayout.test.ts, tests/e2e/workspace-layout.spec.ts]
---

# ワークスペースと小画面レイアウト

## 目的

小さいウインドウでPreviewと編集操作を利用でき、サイズを変えても作業を継続できる。

## 現在の要件

### LAYOUT-001 サイズの範囲

通常エディターのTauriメインウインドウの最小サイズ設定は640×480論理pxとする。ブラウザーでは幅320pxからページ全体の横スクロールを発生させず、モジュール一覧やTimeline内部で必要なスクロールを提供する。設定で選ぶ[VJレイアウト](./vj-performance)は別の操作領域と最小高さを使う。

### LAYOUT-002 パネルの表示

Workspace root幅1000px以上では左右をdock表示し、未満ではPreviewの上に開閉式overlayを表示する。overlayでは左右どちらかだけ開き、上部モジュールのclick、設定ボタンから操作できる。overlayのモジュール切替はclickで行う。Close、背景click、Escapeで閉じられる。開いたパネルのCloseへfocusを移し、閉じたbodyと非選択モジュールはinertにする。サイズ切替で内容を再マウントしない。

### LAYOUT-003 表示領域の確保

dockの最低幅は各240px、Preview最低幅は360pxとする。希望幅が収まらないときは最低幅を超える部分だけを比例縮小する。Timeline高さは希望値を180px以上、root高さの45%以下へ収める。640×480でTimelineを開いてもPreview高さ200px以上を確保する。Timelineの設定とトラックは横スクロールで操作できる。

### LAYOUT-004 Preview内のツール

利用可能なPreviewが幅640px未満または高さ560px未満の場合、Effect StackとHistogramは「レイヤー・ヒストグラム」から開閉するスクロール領域へ表示する。すべてのレイヤーとHistogramへ到達できる。ツール上のホイール・タッチ入力をPreview操作として扱わない。開閉式のツール内では並べ替えのドラッグ中に表示を保ち、レイヤー名のclickでツールを閉じてプロパティを開く。余裕がある場合は既存のinline配置と位置交換を使い、高さに収まらない行を縦スクロールする。Effect Stackのnative別ウインドウは[UI Controls](./ui-controls.md)のUI-009に従う。

### LAYOUT-005 状態と境界

画面を縮めた際の実表示幅・高さを希望値と分離し、広げた際に希望値へ戻す。表示変更は選択中のモジュール、編集値、描画状態、Undo履歴へ影響しない。表示方法の判断は共通policyとresolver、実寸観測は専用hook、開閉と表示は共通panelで行う。Presetや保存アダプターはlayoutを所有しない。

## 未確認事項

Tauri／WebView2実機での最小サイズとOS表示倍率、実タッチ端末の入力・スクロールはRelease Gate／Observation。自動ブラウザー検証の結果はChangeのvalidationへ記録する。
