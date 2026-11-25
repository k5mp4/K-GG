---
type: change
id: CHANGE-20261125-effect-stack-layers-column
title: Effect Stackの常設Layersカラム化
status: review
change_kind: F
owners: [maintainer]
created: 2026-11-25
updated: 2026-11-25
current_specs: [CURRENT-UI-CONTROLS, CURRENT-WORKSPACE-LAYOUT]
related_adrs: [ADR-20261125-workspace-layers-column, ADR-20261003-responsive-workspace-layout]
related_code: [src/features/workspace/workspaceLayout.ts, src/features/workspace/CanvasWorkspace.tsx, src/features/workspace/useWorkspaceController.ts, src/components/EffectStackWorkspace.tsx, src/components/EffectStackPanelView.tsx, src/components/PostprocessStackPanel.tsx, src/components/PropertyModulesSettingsPanel.tsx, src/store/documentModel.ts, src/i18n/messages.ts, src/App.tsx]
related_tests: [src/features/workspace/workspaceLayout.test.ts, src/components/PostprocessStackPanel.test.tsx, tests/e2e/workspace-layout.spec.ts, tests/e2e/licenses.spec.ts]
human_review: required
---

# Effect Stackの常設Layersカラム化

## 背景・問題

Effect Stack（幅200px）とColor HistogramはPreviewの上に重ねて表示されている。2026-11-25のImpeccable critique（Design Health 22/40）で次を確認した。

- 1440×900でEffect StackがPreview Canvasの23.1%（高さの94%、左端約1/4）を覆い、効果をONにした結果を確認できない。Canvasラベル「GPU描画」も83%隠れる。
- 表示形態がPreview寸法で非単調に切り替わる。1440×900でもTimelineを開くとdrawerへ移ってStackが消え、1100×800では非表示、900×700では再びCanvasへ重なる。ウインドウを広げるとStackが消える。
- drawerはCanvasの91%を覆い、レイヤーを選ぶと閉じるため、結果を見ながらレイヤーを渡り歩けない。
- 位置交換ボタン（⇄）は重畳そのものへの対症療法になっている。

主な利用者はTauri版をFHD外部ディスプレイと1440幅ノートPCで使う。Stackの別ウインドウ化は使われておらず、Histogramは常時表示の必要がない。

## 変更理由

このツールの主作業は「Stackでレイヤーを選ぶ→プロパティを詰める→Previewで結果を見る」の往復であり、操作パネルが結果を隠し、レイヤー一覧の所在がウインドウ寸法とTimelineで変わる現状は、その往復を壊している。レイヤー一覧を常に同じ場所に置き、Previewへ何も重ねない構成へ移す。

## ゴール・成功条件

- 幅1000px以上のWorkspaceで、Effect StackはPreviewと重ならない常設のLayersカラムとして表示され、Timelineの開閉で表示方法が変わらない。
- 1440×900（左288px・右320px）でPreview幅616px、1920幅で1000px以上を確保する（Stackに覆われていなかった従来の実効幅約640pxと同程度）。
- 15レイヤーが1440×900でスクロールなしに表示される。
- Histogramは既定で表示されず、設定でONにした場合はPreviewを覆わない位置に表示される。
- 表示変更は選択中のモジュール、編集値、描画状態、Undo履歴、Preset形式へ影響しない。

## 対象

- [Delta](./delta.md)に示すUI-009、LAYOUT-002、LAYOUT-003、LAYOUT-004の変更。
- Layersカラムの手動折りたたみ（アイコンレール）と、幅不足時の自動レール化。
- 「レイヤー・ヒストグラム」drawer、位置交換ボタンの廃止。
- Histogramの既定値をOFFにし、設定からONにする入口を設ける。
- layout policy／resolverの単体テスト、Workspace E2Eの更新。

## 対象外

- TOPバーのDiffuse／Noise／Slit／Postprocessタブ廃止と「編集中: レイヤー名」表示、PostprocessのEdit Layer廃止（UI-010）。後続Changeで扱う（Issue化が必要）。
- レイヤー名の表記統一（GLASS／ガラス）、`OFF`の二重表示、`Stack V2`表記、`ANIMATION`ラベルの重複、文字サイズ・コントラスト・キーボード並べ替え。後続Changeで扱う（Issue化が必要）。
- Effect Stackの行操作（選択、ON／OFF、Altソロ、ドラッグ並べ替え、ランダム化）の挙動。
- Effect Stackのnative別ウインドウの機能（存続し、切り離し中のカラム挙動だけ変える）。
- VJレイアウト（[VJ Performance](../../../specs/current/vj-performance.md)）。
- 描画、Preset形式、保存・出力。

## 影響を受ける現行仕様

- [UI Controls](../../../specs/current/ui-controls.md)（UI-009）
- [Workspace Layout](../../../specs/current/workspace-layout.md)（LAYOUT-002〜004）

## 関連ADR

- [ADR-20261125-workspace-layers-column](../../../adr/20261125-workspace-layers-column.md)（本Changeで提案）
- [ADR-20261003-responsive-workspace-layout](../../../adr/20261003-responsive-workspace-layout.md)（policy／resolver分離を継承）

## 主なリスク

- 1000〜1300px幅でPreviewが狭くなる。自動レール化とLAYOUT-003の縮小順で緩和する。
- Histogram既定OFFで、HistogramをPreviewの確認に使っていた利用者が表示を失う。設定でONにでき、MCPの`histogram` control groupは従来どおり読み書きできる。
- 既存E2E（drawer前提）の書換えが必要。
- ロールバックはlayout policyとWorkspace compositionの差し戻しで済み、保存データの移行はない。

## 決定事項（実装時に確定）

- Layersカラム幅は216px。`Distort Chroma`を含む全レイヤー名が省略されない幅をE2Eで検証する。
- アイコンレールの略号は2文字（DF、NS、SL、ST、DS、MR、KL、VR、GL、GT、DM、3D、TX、DC、IC）。全名はツールチップとアクセシブルネームで提供する。
- Histogramの有効化は設定パネルの「カラーヒストグラム」スイッチ。HistogramのON／OFFは従来どおりPresetへ保存せず、起動時は既定のOFFから始まる。
- レールへの折りたたみの希望はアプリ実行中だけ保持する。

## 未決定事項

なし。
