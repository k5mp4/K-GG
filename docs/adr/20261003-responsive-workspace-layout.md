---
id: ADR-20261003-responsive-workspace-layout
title: ワークスペースの表示判断とパネル内容を分離する
status: proposed
date: 2026-10-03
deciders: [owner]
related_specs: []
supersedes: []
---

# ADR-20261003-responsive-workspace-layout: ワークスペースの表示判断とパネル内容を分離する

## コンテキスト

最小サイズ1024×720と各部品の768px判定により、サイドバーを広げるとPreviewが不足し、狭幅でEffect Stackの入口も失われる。今後用途別に配置を変えるため、editorから配置判断を分離する。

## 決定

共通policyと純粋resolverが、実寸と希望サイズから表示方法と有効寸法を返す。専用hookがResizeObserverを所有し、共通DockPanelとWorkspace compositionが結果を消費する。希望寸法と制約後の寸法を分離する。表示変更ではeditorとrendererを再マウントせず、Preset／描画stateへlayoutを加えない。

## 理由

新しい配置の変更場所をpolicyとcompositionに限定できる。寸法の境界はDOMなしで、開閉・focus・scrollはブラウザーで検証できる。小画面での一時的な制約が広い画面の希望サイズを破壊しない。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 各部品へmedia queryだけ追加 | Previewの実面積と状態の判断が分散し、配置変更のたびに同期が必要になる。 |
| 全UIを縮小 | 入力・文字・操作対象も小さくなる。 |
| 自由配置のdock library | 今回の要件を超え、依存、保存、dragの契約が増える。 |

## 結果

部品が表示方法の型を受け取る必要がある。初期policyはdockとoverlayに限定する。native別ウインドウの境界と同期は既存方式を使う。

## 再検討条件

自由配置や用途別レイアウト保存が要求され、policyとcompositionだけでは利用者設定を表現できなくなった場合。

関連する現行仕様は[Workspace Layout](../specs/current/workspace-layout.md)と[UI Controls](../specs/current/ui-controls.md)。
