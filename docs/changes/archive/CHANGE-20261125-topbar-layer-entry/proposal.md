---
type: change
id: CHANGE-20261125-topbar-layer-entry
title: TOPバーのモジュールタブ廃止とEffect Stackへの入口一本化
status: archived
change_kind: F
owners: [maintainer]
created: 2026-11-25
updated: 2026-11-28
current_specs: [CURRENT-UI-CONTROLS, CURRENT-WORKSPACE-LAYOUT, CURRENT-EFFECT-STACK]
related_adrs: [ADR-20261125-workspace-layers-column]
related_code: [src/features/workspace/tabs.ts, src/features/workspace/WorkspaceTopBar.tsx, src/features/workspace/useWorkspaceController.ts, src/components/PostprocessPanel.tsx, src/App.tsx, src/i18n/messages.ts]
related_tests: [src/features/workspace/tabs.test.ts, src/components/PostprocessPanel.test.tsx, tests/e2e/workspace-layout.spec.ts]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: Tauriアプリ上でTOPバー（編集中/SANDBOX/EXPORT/PRESET）とEffect Stack入口の目視確認（PR #133はbrowser E2Eのみ）"
---

# TOPバーのモジュールタブ廃止とEffect Stackへの入口一本化

Issue: #125（前提: #124 Layersカラム化）

## 背景・問題

効果を開く入口が2系統あり、経路と階層が揃っていない。

- `Diffuse`、`Noise`、`Slit`は、TOPバーのタブとEffect Stackの行の両方にある。
- 残り12レイヤーは、`Postprocess`タブ内の`Edit Layer`ドロップダウンにある。
- そのため、Effect Stackで`Glass`を選ぶとTOPバーが`Postprocess`へ切り替わる。

`Diffuse`、`Noise`、`Slit`のタブは前身アプリの名残で、区別する意味はない（オーナー確認済み）。2026-11-25のImpeccable critiqueでP1として指摘された。

## 変更理由

#124でEffect Stackを常設のLayersカラムにしたので、レイヤーの入口をEffect Stackへ一本化し、TOPバーは現在地の表示とモードの切替だけにする。

## ゴール・成功条件

- TOPバーにレイヤーごとのタブがなく、「編集中: レイヤー名」、`SANDBOX`、`Export`、`Preset`だけが並ぶ。
- 「編集中」項目から、選択中レイヤーのプロパティへ戻れる。
- Postprocess系レイヤーのプロパティに`Edit Layer`がなく、見出しにレイヤー名とそのレイヤーのON／OFFが出る。
- `Export`と`Preset`に「オフ」副ラベルが出ない。
- MCPなどからのプロパティモジュール指定（`leftTab`の値）は従来どおり動く。

## 対象

- [Delta](./delta.md)のUI-010、LAYOUT-002、EFFECT-012の変更。
- TOPバー、Postprocessプロパティの見出し、i18n、単体テスト、E2E。

## 対象外

- 用語統一とアクセシビリティ（#126）。
- SANDBOX内の機能構成と`Edit Layer`選択要素。
- Preset形式、描画、出力、`postprocess.enabled`の保存値と派生ロジック。
- プロパティモジュールの内部ID（`LeftTab`）。

## 影響を受ける現行仕様

- [UI Controls](../../../specs/current/ui-controls.md)（UI-010）
- [Workspace Layout](../../../specs/current/workspace-layout.md)（LAYOUT-002）
- [Effect Stack](../../../specs/current/effect-stack.md)（EFFECT-012の文言）

## 関連ADR

- [ADR-20261125-workspace-layers-column](../../../adr/20261125-workspace-layers-column.md)

## 主なリスク

- Postprocess全体のON／OFF（一括バイパス）をUIから廃止する（オーナー判断）。各レイヤーのON／OFFとAltクリックのソロは残る。`postprocess.enabled`は従来どおり、レイヤーのON／OFFから派生する。
  - 全体OFFのまま保存されたPresetを読み込むと、レイヤーをどれか一つ切り替えるまでポスト系は描画されない。この挙動は従来と同じ。
  - MCPの`postprocess`制御からは、従来どおり変更できる。
- 「編集中」がTOPバーの左端に固定されるため、狭い幅ではモードのタブが横スクロールになる場合がある。

## 決定事項

- 「編集中」をclickすると、選択中レイヤーのプロパティへ戻る（左パネルが閉じていれば開く）。
- Diffuseは他のレイヤーと同列に扱い、TOPバーで特別扱いしない。
- `LeftTab`の値は変えず、MCPの後方互換を保つ。

## 未決定事項

なし。

## Finalization

- Finalized: 2026-11-28
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Tauriアプリ上でTOPバー（編集中/SANDBOX/EXPORT/PRESET）とEffect Stack入口の目視確認（PR #133はbrowser E2Eのみ）
