---
id: ADR-20261125-workspace-layers-column
title: Effect StackをPreview外の常設Layersカラムへ配置する
status: proposed
date: 2026-11-25
deciders: [owner]
related_specs: []
supersedes: []
---

# ADR-20261125-workspace-layers-column: Effect StackをPreview外の常設Layersカラムへ配置する

## コンテキスト

Effect StackとColor HistogramはPreviewの上に重ねて表示し、Previewが狭い・低い場合は「レイヤー・ヒストグラム」drawerへ切り替えていた。この配置ではStackがPreviewの約1/4を覆って効果の確認を妨げ、Preview寸法（ウインドウ幅、Timelineの開閉）によってStackの所在が非単調に変わる。主な利用者はTauri版をFHDと1440幅で使い、Stackの別ウインドウ化は使っていない。Histogramの常時表示は不要と判断された。

## 決定

- Effect Stackを、左プロパティパネルとPreviewの間に常設する「Layers」カラムとして配置し、Previewの上には編集ツールを重ねない。
- カラムは手動でアイコンレールへ折りたためる。Preview最低幅を守れない場合は、左右パネルの縮小より先にレールへ自動で切り替える。
- Workspace root幅1000px未満では、左overlayパネル内の「Layers／Properties」切替で提供する。
- Color Histogramは既定で表示せず、設定で有効にした場合は右パネルのセクションとして表示する。
- 表示方法の判断は[ADR-20261003-responsive-workspace-layout](./20261003-responsive-workspace-layout.md)のpolicy／resolverへ追加し、Stack行の部品はinline・別ウインドウで共有したままにする。

## 理由

- 「レイヤーを選ぶ→プロパティを詰める→Previewで結果を見る」という主作業で、結果を隠さず、一覧の所在を一定にできる。
- 一覧→詳細→結果の左から右への並びは、レイヤー型の映像ツールで一般的な構成であり、学習コストが低い。
- 1440幅では現状でもStackに覆われないPreview幅は約640pxであり、常設カラム（約180px）後のPreview幅約650pxと実効的に同等になる。
- Histogramを既定で表示しないことで、Preview Canvasの同期読み戻しを既定で避けられる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 現状のPreview上の重畳を維持し、透過度や位置だけ調整 | 確認領域を隠す問題とPreview寸法による表示切替が残る。 |
| 左プロパティパネルの上部へLayersを統合 | 15行（約450px）がプロパティの縦領域を奪い、1440×900でプロパティがほとんど見えなくなる。 |
| Preview下部の横ストリップ | 縦方向の並びが示す適用順の意味が失われ、Timelineと高さを奪い合う。 |
| 右パネルへ統合 | 選択（右）と編集（左）の間で視線が往復する。 |
| 常にアイコンレールのみ | レイヤー名が常時見えず、15種の略号を覚える必要がある。 |

## 結果

### 利点

- Previewが操作パネルに覆われない。
- Timelineの開閉やウインドウ拡大でStackが消えない。
- 位置交換ボタンとdrawerが不要になり、表示方法の分岐が減る。

### 欠点・コスト

- 1000〜1300px幅でPreviewの名目幅が狭くなる（自動レール化で緩和）。
- 既存E2Eの書換えが必要。
- Histogramを常用していた利用者は設定で有効化する手間が生じる。

## 再検討条件

- 主な利用環境が1000〜1300px幅中心になり、レール表示が常態化した場合。
- 自由配置や用途別レイアウト保存が要求された場合（ADR-20261003の再検討条件と合わせて見直す）。
- TOPバーのモジュールタブ廃止（後続Change）で左パネルの構成が変わり、Layersを左パネルへ統合する方が適切になった場合。

関連する現行仕様は[Workspace Layout](../specs/current/workspace-layout.md)と[UI Controls](../specs/current/ui-controls.md)。
