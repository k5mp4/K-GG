# Delta

## ADDED Requirements

なし。

## MODIFIED Requirements

### UI-009 Effect Stackの表示形態

変更前: Effect Stackは常にワークスペース内のインライン表示のみで提供し、別ウィンドウ化の操作ボタンを表示しない。

変更後: インラインパネルの幅を232pxから200pxへ縮め、行の分類ラベル（Texture／Transform／Structure）を表示しない。Tauri版ではヘッダー右端（ブラウザー版の`Stack V2`表示の位置）に別ウィンドウボタンを表示し、Effect Stackを別のネイティブウィンドウで開ける。開いている間はインラインパネルを隠し、Color Histogramを先頭位置へ移す。別ウィンドウはインラインと同じ操作（選択、ON／OFF、ソロ、ドラッグ並べ替え、ランダム化）と状態表示を提供し、メインウィンドウへ反映する。閉じるとインラインへ戻り、メインを閉じると一緒に閉じる。別ウィンドウ（初期220×490、最小200×120）ではヘッダーを固定し、レイヤー行を縦スクロールで表示する。ドラッグハンドルとトグルは縮めない。ブラウザー版は従来どおりインライン表示のみ。

変更理由: [ADR-20260926-native-secondary-windows](../../../adr/20260926-native-secondary-windows.md)の方式で別ウィンドウを安定して生成できることを実機で確認したため。

## REMOVED Requirements

なし。
