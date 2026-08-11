# Delta

## MODIFIED Requirements

### EFFECT-002 Effect Stackの配置と操作

Effect Stackは常にワークスペース内のインライン表示のみで提供する。別ウィンドウ化（Document Picture-in-Picture、ポップアップ、TauriネイティブWebviewWindow）は行わない。既存のEffect Pipeline状態はインライン表示のまま共有し、レイヤー選択と有効状態変更を反映する。

### UI-009 Effect Stackの表示形態

Effect Stackは常にインライン表示のみで提供する。別ウィンドウ操作（Document Picture-in-Picture、ポップアップ、TauriネイティブWebviewWindow）のボタンやUIを表示しない。TauriのWebView2環境で別ウィンドウ化が安定動作しないため、ブラウザー・Tauriのどちらでもインライン表示に統一する。

## ADDED Requirements

### WINDOW-001 別ウィンドウ化の廃止

ブラウザー・Tauriの両方で、Effect Stackの別ウィンドウ化（Document Picture-in-Picture、ポップアップ、Tauriネイティブ`WebviewWindow`）を廃止する。別ウィンドウ操作ボタン、関連i18nメッセージ（`common.detach`、`stack.detach`、`stack.restore`、`gradient.pipUnsupported`）、UI用語辞書の記述を削除する。`DetachedEffectStackApp.tsx`、`src/lib/effectStackWindow.ts`、`effect-stack.json`capability、`main.tsx`の別ウィンドウ分岐を削除し、`PostprocessStackPanel`と`GradientRamp`からPiP／ポップアップ処理を除去する。

## REMOVED Requirements

### TauriネイティブWebviewWindowの別ウィンドウ生成

Tauriの`WebviewWindow`による別ウィンドウ生成・表示・状態同期の経路を削除した。実機検証で、`WebviewWindow`が16×16ピクセルの極小ウィンドウになりWebviewがページをロードしない問題が再現したため、この経路を廃止する。関連する`DetachedEffectStackApp.tsx`、`src/lib/effectStackWindow.ts`、`effect-stack.json`capabilityを削除し、`main.tsx`の別ウィンドウ分岐を撤去する。

### ブラウザーの別ウィンドウroot（PiP・ポップアップ）

ブラウザーのDocument Picture-in-Pictureおよび通常ポップアップによる別ウィンドウrootを削除した。`PostprocessStackPanel`と`GradientRamp`からPiP・ポップアップ処理（`documentPictureInPicture.requestWindow`、`window.open`、別ドキュメントへのReactポータル）を除去し、インライン表示のみに統一する。
