# Tasks

- [x] 現行Effect Stack仕様、Legacy SPEC-017、別ウィンドウ実装、Tauri capabilityを確認する
- [x] ブラウザー別rootのProvider不足とTauri別ウィンドウの不安定さを原因候補として整理する
- [x] `proposal.md`、`delta.md`、`design.md`をレビュー・承認する
- [x] Tauri実機で別ウィンドウ（`WebviewWindow`16×16・Webview未ロード、PiP失敗、ポップアップnull）を再現確認する
- [x] 別ウィンドウ化を廃止し、Effect Stackを常にインライン表示のみで提供する方針へ変更する
- [x] Tauriネイティブ別ウィンドウ経路（`DetachedEffectStackApp.tsx`、`effectStackWindow.ts`、`effect-stack.json`、`main.tsx`分岐）を削除する
- [x] `PostprocessStackPanel`と`GradientRamp`からPiP／ポップアップ処理（`togglePiP`、`pipWindow`状態、`documentPictureInPicture`、`window.open`）を削除する
- [x] 未使用のi18nメッセージキーとUI用語辞書の記述を削除する
- [x] `validation.md`へ受け入れ条件ごとの結果と未確認事項を記録する
- [x] current spec、利用者向け文書、active/archive indexを同期する
- [x] 実機でのインラインEffect Stackの受け入れ確認（ランダム順序・ソロレイヤー・ドラッグ並べ替え）
- [x] 変更仕様をArchiveへ移動する
