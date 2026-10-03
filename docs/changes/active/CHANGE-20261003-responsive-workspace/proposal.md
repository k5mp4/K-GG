---
type: change
id: CHANGE-20261003-responsive-workspace
title: 小画面に対応する拡張可能なワークスペース
status: review
change_kind: F
owners: [maintainer]
created: 2026-10-03
updated: 2026-10-03
current_specs: [CURRENT-UI-CONTROLS, CURRENT-WORKSPACE-LAYOUT]
related_adrs: [ADR-20261003-responsive-workspace-layout]
related_code: [src/App.tsx, src/components/DockPanel.tsx, src/features/workspace/workspaceLayout.ts, src/features/workspace/useWorkspaceLayout.ts, src/features/workspace/useWorkspaceController.ts, src/components/EffectStackWorkspace.tsx, src-tauri/tauri.conf.json]
related_tests: [src/features/workspace/workspaceLayout.test.ts, tests/e2e/workspace-layout.spec.ts]
human_review: required
---

# 小画面に対応する拡張可能なワークスペース

## 背景・変更理由

Request source: Direct request。利用者は、小さい画面で操作でき、今後用途に合わせて配置を変更しやすい構造を求めた。追加確認でデスクトップ640×480を目安とすることを確認した。

最小サイズ1024×720と幅768px以上で両サイドバーを並べる処理により、小画面ではPreviewと編集領域が共存できない。Effect Stack／Histogramも狭幅では入口ごと非表示だった。

## 対象・受け入れ条件

- AC-001: Tauriメインの最小サイズ設定を640×480へ変更する。ブラウザーでは幅320pxまでページ横幅をはみ出さない。
- AC-002: 幅1000px未満では左右パネルを一つずつ開閉し、Close／Escapeで閉じられる。非表示パネルと非選択モジュールをキーボード操作の対象にしない。
- AC-003: パネル幅の変更時もPreviewに360px以上を残す。高さ480pxでTimelineを開いてもPreview高さ200px以上を残す。
- AC-004: 狭いPreviewでEffect StackとHistogramに開閉式の入口を提供し、すべての行をスクロールで操作できる。Timelineの設定とトラックは必要に応じて横スクロールする。
- AC-005: サイズ変更でエディターとCanvasを再マウントせず、選択・値・希望パネル幅・希望Timeline高さを保持する。
- AC-006: サイズ判断を純粋関数、観測をhook、表示と開閉を共通panelに分離する。

## 対象外

自由配置とレイアウトプリセット、Preset形式、描画結果、Export形式、native別ウインドウの同期方式、全体の意匠変更。

## 仕様同期

[Workspace Layout](../../../specs/current/workspace-layout.md)を追加し、[UI Controls](../../../specs/current/ui-controls.md)のUI-009へ小画面での表示経路を反映する。

## 主なリスク・未確認事項

Tauri／WebView2実機での640×480のリサイズ、OS表示倍率、実タッチ端末はRelease Gate／Observationへ記録する。追加指示でcommit・push・ドラフトPR作成を行う。Issue作成は依頼対象外。差分の人間レビュー後にhuman_reviewを更新しfinalizeする。
