# Delta

## ADDED Requirements

### UI-029 Gradient Ramp editorの表示形態

Tauri版では`Open Gradient Ramp editor`でメインウィンドウとは別のネイティブウィンドウにエディタを開く。既存ウィンドウがある場合は前面へ出す。エディタはメインウィンドウに従属し、メイン終了時に閉じる。gradient、キーフレーム、選択ストップ、選択アンカー、現在時刻を両ウィンドウで同期し、Undo／Redoはメインウィンドウの履歴を操作する。ブラウザー版とネイティブウィンドウ作成失敗時は従来のフローティングエディタを表示する。Preset形式と描画結果は変更しない。

## MODIFIED Requirements

### UI-009 Effect Stackの表示形態

変更前: Effect Stackの別ウィンドウ化を行わない理由として「TauriのWebView2環境では別ウィンドウ化が安定動作しない」と記載し、Gradient Ramp editorも同じ方針の対象として扱っていた（CHANGE-015）。

変更後: Effect Stackはインライン表示のみという契約は維持する。WebView2で不安定という一般化した理由は削除し、Gradient Ramp editorの表示形態はUI-029で定める。

変更理由: CHANGE-015の失敗はブラウザー引数の不一致が原因の可能性が高く、[ADR-20260926-native-secondary-windows](../../../adr/20260926-native-secondary-windows.md)の方式で別ウィンドウを作成できる見込みがあるため。

## REMOVED Requirements

なし。
