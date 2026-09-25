# Spec Delta

## ADDED Requirements

新しいCurrent Spec [CURRENT-REALTIME-OUTPUT](../../../specs/current/realtime-output.md)を追加する。

### RTOUT-001 対応環境

Windows Tauri Desktop版だけで利用できる。それ以外では、利用不可を明示する。

### RTOUT-002 送信する画像

Effect Stack適用後の2D Preview canvasを、drawing buffer sizeのまま、ストレートアルファ・正しい向きとチャンネル順で送る。

### RTOUT-003 操作

Enable、Sender Name（既定`KAGARIBI Grad`、ASCII 1〜200文字、衝突時は`_N`）、Frame Rate（30/60 fps）。

### RTOUT-004 状態表示

Checking / Unavailable / Off / Starting / Ready / Sending / Errorと送信統計を表示する。

### RTOUT-005 更新とフレームレート

アニメーションと静止中の再描画を、選択した上限で送る。

### RTOUT-006 Backpressure

readback・送信は各1件、待ちは最新1フレーム。JSON/base64へ変換しない。

### RTOUT-007 解像度変更と一時的な読み取り不能

解像度変更は同じSenderのまま更新する。context lost・書き出し中は待つ。

### RTOUT-008 解放と失敗時の動作

OFF、名前変更、unmount、unload、再読込後の残存、送信失敗、アプリ終了時に解放する。失敗はSpout出力だけに閉じる。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
