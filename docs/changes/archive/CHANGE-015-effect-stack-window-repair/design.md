# Design

## 採用する実装方針

別ウィンドウ化（Document Picture-in-Picture、ポップアップ、Tauriネイティブ`WebviewWindow`）を廃止し、Effect Stackを常にワークスペース内のインライン表示のみで提供する。

Tauriのデスクトップアプリでは、実機検証でネイティブ`WebviewWindow`・Document Picture-in-Picture・ポップアップのいずれもWebView2環境で安定動作しないことを確認した。ブラウザーでも、別ウィンドウ化は利便性に対してProvider管理・close/reopen・開閉状態同期などの維持コストが高い。このため、別ウィンドウ化そのものを廃止し、ブラウザーとTauriで同じインラインUIを使う。

## データモデル

変更しない。選択中レイヤー、主スタックの順序、有効状態、Glass設定は既存のgradient storeとEffect Pipelineを一次情報とする。

## 状態管理

別ウィンドウ・別rootの状態管理は持たない。`pipWindow`、`pipMount`、`pipRootRef`、`pipWindowRef`、`externalWindowCleanupRef`、`togglePiP`を削除し、インライン表示のパネルだけをレンダリングする。Tauriイベント同期（`setupHost`、`setupDetached`）も削除する。

## UI構成

`PostprocessStackPanel`はヘッダーにシャッフルとヒストグラム交換ボタンのみを表示し、別ウィンドウ操作ボタン（↗）を表示しない。`GradientRamp`も別ウィンドウ操作ボタンを表示しない。フローティングエディタは`document.body`へのReactポータルで描画する（PiPウィンドウへのポータルを削除）。

## 描画・外部プロセス・Tauri側の変更

Tauriのcapabilityは不要になった`effect-stack.json`を削除する。`default.json`は既存の権限を維持する。`core:webview:allow-create-webview-window`などの別ウィンドウ作成権限は追加せず、既存のままとする。

## 変更対象の主要ファイル

コード:

- `src/components/PostprocessStackPanel.tsx`
- `src/components/GradientRamp.tsx`
- `src/main.tsx`
- `src/i18n/messages.ts`
- 削除: `src/components/DetachedEffectStackApp.tsx`
- 削除: `src/lib/effectStackWindow.ts`
- 削除: `src-tauri/capabilities/effect-stack.json`

テスト:

- 削除: `src/lib/effectStackWindow.test.ts`

文書:

- `docs/specs/current/ui-controls.md`（UI-009）
- `docs/development/ui-terminology.md`
- `docs/changes/archive/CHANGE-015-effect-stack-window-repair/*`

## 代替案とトレードオフ

- Tauriネイティブ`WebviewWindow`を継続する案は、実機で16×16極小ウィンドウとWebview未ロードが再現し、`visible`・`center`・`url`形式・事前定義を試しても解決しなかったため採用しない。
- TauriでDocument Picture-in-Pictureやポップアップへフォールバックする案は、ユーザー操作でも`NotAllowedError`／IPC失敗／`null`になり動作しなかったため採用しない。
- ブラウザーでのPiP／ポップアップを維持する案は、プラットフォーム差分とProvider・開閉状態の維持コストが高いため、別ウィンドウ化を一貫して廃止する方針を採用する。

## 移行方法

別ウィンドウ操作ボタンと関連i18nメッセージを削除し、インライン表示のみにする。変更後はブラウザー・Tauriの両方でインラインEffect Stackが表示され、別ウィンドウUIが存在しないことを確認する。

## ロールバック方法

削除した別ウィンドウ操作ボタンとPiP／ポップアップ処理を戻せば、以前の別ウィンドウ経路へ戻せる。storeやPresetの形式を変更しないため、データ移行は不要。
