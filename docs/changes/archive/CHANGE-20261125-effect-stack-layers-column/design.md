# Design

## 採用する実装方針

[ADR-20261003-responsive-workspace-layout](../../../adr/20261003-responsive-workspace-layout.md)のpolicy／resolver分離を維持し、Layersカラムをresolverが返す表示方法の一つとして追加する。Stack行の部品（`EffectStackPanelView`）は変更せず、配置するcompositionだけを差し替える。

## 状態管理

- `WorkspaceLayoutPreferences`に`layersCollapsed: boolean`（利用者の希望値）を追加する。
- `resolveWorkspaceLayout`は`layers: 'column' | 'rail' | 'hidden' | 'segment'`と`layersWidth`を返す。
  - `hidden`: native別ウインドウ表示中。
  - `segment`: overlay表示（root幅1000px未満）。左overlay内の切替で表示する。
  - `rail`: 希望値が折りたたみ、またはPreview最低幅を確保できない場合。
- `ToolPresentation`（`inline`／`drawer`）と`inlineToolsMinWidth`／`inlineToolsMinHeight`は廃止する。
- 位置交換の`kgg.effect-stack-workspace.order`（sessionStorage）は読まなくなる。残存値は無害なので移行処理は行わない。
- Histogramは`STORE_DEFAULTS.histogram.enabled`を`false`へ変更する。Presetには含まれないため既存Presetへの影響はない。

## UI構成

```text
≥1000px  [Layers 180 | rail 48] [Properties 288] [Preview] [Right 320 (+Histogram section)]
<1000px  [Preview全幅] + 左overlay（Layers／Properties切替）+ 右overlay
```

- Layersカラムのヘッダー: タイトル、順序ランダム化、折りたたみ、（Tauri）別ウインドウ。
- レール: 行の高さはカラムと揃え、略号＋有効ドット＋選択枠。ツールチップと`aria-label`に全レイヤー名。
- Histogramセクション: 右パネル末尾の折りたたみセクション。設定でONの場合だけ描画する。

## 描画・外部プロセス・Tauri側の変更

- Rust側の変更なし。native別ウインドウ（`useEffectStackWindowHost`）の境界は現行どおり。
- Histogram無効時は`ColorHistogram`をマウントせず、Canvas読み戻しを発生させない（[WebGL Performance](../../../specs/current/webgl-performance.md)の同期点を回避）。

## 変更対象の主要ファイル

コード:

- `src/features/workspace/workspaceLayout.ts`（policy／resolver）
- `src/features/workspace/useWorkspaceController.ts`（希望値の保持）
- `src/features/workspace/CanvasWorkspace.tsx`、`src/App.tsx`（composition）
- `src/components/EffectStackWorkspace.tsx`（Preview内配置・位置交換・drawerの撤去、カラム／レール化）
- `src/components/ColorHistogram.tsx`の配置先（右パネル）
- `src/store/documentModel.ts`（Histogram既定値）
- 設定の入口（暫定: `src/components/PropertyModulesSettingsPanel.tsx`）

テスト:

- `src/features/workspace/workspaceLayout.test.ts`（1440×900、1920×1080、1100×800、900×700、Timeline開閉、別ウインドウ）
- `tests/e2e/workspace-layout.spec.ts`（drawer前提の検証をカラム／レール／segmentへ置換）

## 代替案とトレードオフ

[ADR-20261125-workspace-layers-column](../../../adr/20261125-workspace-layers-column.md)を参照。

## 移行方法

保存データの移行なし。sessionStorageの位置交換値は無視する。

## ロールバック方法

本Changeのコミットを差し戻す。Histogram既定値の差し戻しだけで従来の表示既定へ戻せる。
