---
type: current
id: CURRENT-REALTIME-OUTPUT
title: リアルタイム映像出力（Spout）
status: current
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
requirement_ids: [RTOUT-001, RTOUT-002, RTOUT-003, RTOUT-004, RTOUT-005, RTOUT-006, RTOUT-007, RTOUT-008]
related_adrs: [ADR-0022]
related_changes: [CHANGE-054]
related_code: [src/lib/spoutOutput.ts, src/lib/webglFrameReadback.ts, src/features/native/useSpoutOutput.ts, src/adapters/tauri/spoutOutputService.ts, src/components/SpoutOutputPanel.tsx, src-tauri/src/spout_output.rs, src-tauri/src/spout_shared_frames.rs, src-tauri/native/spout, src-tauri/build.rs, vendor/spout2]
related_tests: [src/lib/spoutOutput.test.ts, src/lib/webglFrameReadback.test.ts, src/adapters/tauri/spoutOutputService.test.ts, src-tauri/src/spout_output.rs, src-tauri/src/spout_shared_frames.rs]
---

# リアルタイム映像出力（Spout）

## 目的

K-GG DesktopのWindows版が描画している最終画像を、Spout Senderとして配信する。TouchDesigner、Resolume、OBS（Spout対応プラグイン）などのSpout Receiverで、K-GGの映像をリアルタイムに受け取れるようにする。

## 現在の要件

### RTOUT-001 対応環境

Spout出力はWindowsのTauri Desktop版だけで利用できる。Web版とWindows以外のDesktop版では、Exportパネルの「Spout Output」に「Spout output is available in the Windows desktop app.」（日本語UIでは同義の文言）を表示し、有効化の操作を出さない。Spout出力のために利用者がSpout SDKやDLLを別途導入する必要はない。

### RTOUT-002 送信する画像

送信するのは、Effect Stackなどの処理をすべて適用した後の2D Preview canvasである。これはPNG書き出しの通常パスと同じ画像で、Effect Stackの遷移中は合成後のフレームを送る。Sender解像度は、Preview canvasの実drawing buffer size（例: Canvas Size 1920×1080なら1920×1080）とする。Cloth/Coneの3D表示用canvasは送信しない。

色はcanvasの8bit値のまま送る。アルファはストレート（非プリマルチプライド）で、Receiver側で上下反転やR/B入れ替えは起きない。

### RTOUT-003 操作

Exportパネルの「Spout Output」で次を操作できる。

- **Enable**: 有効にすると、直ちに現在のcanvasを1フレーム送る。以降は描画ごとに送信する。アプリ起動時は常に無効。
- **Sender Name**: 既定は`KAGARIBI Grad`。印字可能なASCII 1〜200文字で、Enterまたはフォーカス移動で確定する。有効中に変更すると、旧Senderを解放してから新しい名前で作り直す。同じ名前のSenderが既にある場合、Spoutは`名前_1`、`名前_2`…として登録し、パネルに登録名を表示する。
- **Frame Rate**: 30 fps（既定）または60 fps。Preview FPSとは独立した送信上限である。

Sender NameとFrame Rateは、このDesktop環境に保存され、次回起動時に復元される。

### RTOUT-004 状態表示

パネルは次の状態を表示する: Checking、Unavailable、Off、Starting、Ready（Senderを作成し、最初の送信を待っている状態）、Sending、Error。送信中は解像度、実測送信fps、送信済みフレーム数、破棄フレーム数、読み取り時間と転送時間（ms、平滑化値）を表示する。Errorでは原因のメッセージを表示し、Enableを無効に戻す。再度Enableにすると再試行する。

### RTOUT-005 更新とフレームレート

アニメーション再生中は、Preview描画ごとに送信する。上限は選択したFrame Rateである。静止中でも、パラメータ変更・Preset読込・Canvas Size変更・Effect追加削除などで再描画されると、その結果を送る。上限により即時に送れない変更は、次の送信枠で最新の画像を送る。

### RTOUT-006 Backpressure

Preview描画はSpout送信を待たない。readbackは最大1件、送信は最大2件だけ同時に進め、送信待ちは最新の1フレームだけ保持する。処理中に届いた古いフレームは破棄し、破棄フレーム数に数える（latest frame wins）。後から完了した古いフレームは送らず、Receiverに届くフレームの順序は描画順を保つ。

フレームはWebView2の共有メモリ経由でネイティブ側へ渡し、IPCでフレームのbyte列を送らない。共有メモリを使えないWebView2 Runtimeでは、フレームをバイナリのIPC本文として送る（送信は1件ずつ。1080pでは実用的なフレームレートにならない）。いずれの経路でも、JSONやbase64へは変換しない。

### RTOUT-007 解像度変更と一時的な読み取り不能

Canvas Sizeの変更は同じSenderのまま解像度を更新する。WebGL context lost、canvas未準備、動画書き出し中はフレームを読まずに待ち、可能になった時点で送信を再開する。これらの状態ではSenderを停止しない。

### RTOUT-008 解放と失敗時の動作

次の場合にSenderを解放し、Receiverの一覧から消す: Enableを無効にしたとき、Sender Nameを変更したとき、Exportパネルがunmountされたとき、ページがunloadされたとき、ページの再読み込み後に前回のSenderが残っていたとき、ネイティブ側の送信が失敗したとき、アプリ終了時。

DirectX 11を利用できない場合を含め、Senderの作成・送信の失敗はSpout出力だけをError状態にする。Preview描画、書き出し、その他の機能は継続する。

## 他領域との関係

- 設計判断は[ADR-0022](../../adr/0022-spout-output-cpu-readback.md)。
- 送信する画像は[Effect Stack](./effect-stack.md)の最終結果で、[動画・連番フレーム出力](./video-export.md)の書き出し中は読み取りを止める。
- Spout2のライセンス表示はHelp > Third-party licensesとNOTICEに含める。

## 変更履歴

- CHANGE-054: Spout Sender出力を追加。

## 未確認・今後の現行仕様化

- TouchDesigner、Resolume、OBSでの受信表示とCPU使用率は、Windows実機のRelease Gateとして記録する（CHANGE-054 validation）。1080p/30fps・60fpsの送信fpsは、Tauri実アプリでの計測を同validationに記録済み。
- Cloth/Cone 3D表示の送信、GPU共有textureによる`SendTexture`送信、Spout Receiver機能、Syphon、NDIは未定義。
