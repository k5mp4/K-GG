# Design

長期判断は[ADR-0022](../../../adr/0022-spout-output-cpu-readback.md)、利用者向けの契約は[CURRENT-REALTIME-OUTPUT](../../../specs/current/realtime-output.md)を参照する。ここには実装の構成だけを記録する。

## 採用する実装方針

```text
GradientCanvas / useWebGL
  renderSceneAtTime() → publishProcessedCanvasFrame()        （既存: 描画直後に同期発火）
        │
        ▼ subscribeProcessedCanvasFrame
SpoutOutputController.markFrameDirty()          src/lib/spoutOutput.ts
  FrameRateLimiter（30/60 fps、rAF jitter 4ms許容）
  capture: WebGLCanvasFrameReader.read()        src/lib/webglFrameReadback.ts
           bind READ_FRAMEBUFFER=null → readPixels→PBO → fenceSync → poll → getBufferSubData
           （getBufferSubDataの書込み先 = WebView2共有メモリのslot）
  send:    RealtimeOutputBackend.sendFrame()    src/adapters/tauri/spoutOutputService.ts
           invoke('send_spout_shared_frame', { generation, slot, sequence })   ← 数十byte
           fallback: invoke('send_spout_output_frame', Uint8Array, { headers })
        │
        ▼
send_spout_shared_frame                          src-tauri/src/spout_shared_frames.rs
  generation/slot検証 → 古いsequenceを破棄 → 共有メモリを直接参照
  → SpoutOutputState.send（Mutex） → SpoutSenderHandle     src-tauri/src/spout_output.rs
        │ C ABI
        ▼
kgg_spout_send_rgba                              src-tauri/native/spout/kgg_spout.cpp
  bottom-up RGBA → top-down BGRA（再利用staging） → spoutDX::SendImage
```

## 状態管理

- `SpoutOutputController`はウィンドウごとに1つ（`getSpoutOutputController`）。UIは`useSyncExternalStore`で購読する。
- start/stopは`lifecycle` Promiseで直列化する。非同期の結果は`generation`で世代管理し、停止後に完了したreadback・送信の結果を捨てる。
- フレームバッファは解像度ごとに`backend.prepareFrameBuffers(width, height, 3)`で用意する。Tauriでは`create_spout_frame_buffers`がWebView2 SharedBufferを3つ作り、`PostSharedBufferToScript`でページへ渡す（`additionalData.kggSpoutFrame`に`generation`・`slot`）。受け取ったArrayBufferをそのままreadbackの書込み先にする。送信は最大2件並行で、readback用の1本が常に空く。SharedBufferを使えない場合はローカルの2本を使い、raw IPCで1件ずつ送る。
- `generation`はJS側で採番する。buffer受信イベントがIPC応答より先に届いてもよいようにするため。解像度変更・停止時には、JSが`chrome.webview.releaseBuffer`で解放し、RustはUIスレッドで`ICoreWebView2SharedBuffer::Close`を呼ぶ。置き換わったgenerationへの送信は、Rust・JSのどちらでも捨てる。
- Rustの`send_spout_shared_frame`は、slotのlockを保持したまま送信する。送信中の共有メモリは閉じられない。
- Sender NameとFrame Rateは`localStorage`（`kgg_spout_sender_name` / `kgg_spout_frame_rate`）に保存する。Enableは保存しない。
- Rust側は`SpoutOutputState(Mutex<SpoutOutputController>)`。同名での`start`は同じSenderを維持し、別名なら旧Senderをdropしてから作る。送信失敗時はSenderをdropする。`RunEvent::Exit`で`shutdown`する。

## UI構成

ExportパネルのDesign App Sendの下に`SpoutOutputPanel`を置く。Enableは既存の`Toggle`、Sender Nameは`InputString`（ドラフトを保持し、confirm/blurで確定）、Frame Rateは`InputRadio`を使う。Web版・非Windowsではunsupportedの文言だけを表示する。

## 描画・外部プロセス・Tauri側の変更

- Rendererのコードは変更しない。既存の`processedCanvasClock`を購読する。
- readbackでは既定framebufferだけを読む。変更したbinding（READ_FRAMEBUFFER、PIXEL_PACK_BUFFER、PACK_ALIGNMENT）は、readPixels直後に元へ戻す。
- context lostではreaderを破棄し、復帰後にcanvasへ登録済みのcontextから作り直す。動画書き出し中（`renderBridge.isExportSessionActive()`）はreadbackしない。
- `build.rs`はWindows MSVC targetでだけ`cc`を使い、`vendor/spout2`の7ソースと`native/spout/*.cpp`を`/O2 /utf-8 /EHsc`でビルドする。d3d11・dxgiなどは`rustc-link-lib`でもリンクする。
- `kgg_spout_probe.cpp`はテスト専用で、共有textureを直接読む。アプリからは参照しないため、リンク時に除去される。

## 変更対象の主要ファイル

コード:

- `src/lib/spoutOutput.ts`、`src/lib/webglFrameReadback.ts`
- `src/features/native/useSpoutOutput.ts`、`src/adapters/tauri/spoutOutputService.ts`
- `src/components/SpoutOutputPanel.tsx`、`src/components/ExportPanel.tsx`、`src/i18n/messages.ts`
- `src-tauri/src/spout_output.rs`、`src-tauri/src/spout_shared_frames.rs`、`src-tauri/src/lib.rs`、`src-tauri/build.rs`、`src-tauri/Cargo.toml`（Windowsのみ`webview2-com` / `windows-core`）
- `src-tauri/native/spout/kgg_spout.{h,cpp}`、`src-tauri/native/spout/kgg_spout_probe.cpp`
- `vendor/spout2/`、`tools/generate-third-party-licenses.py`、`NOTICE`、`.github/workflows/ci.yml`

テスト:

- `src/lib/spoutOutput.test.ts`（FPS limiter、backpressure、drop、有効/無効、名前変更、unsupported、失敗）
- `src/lib/webglFrameReadback.test.ts`（PBO readback、binding復元、context lost）
- `src/adapters/tauri/spoutOutputService.test.ts`（共有メモリslotの受信と参照送信、generation置換時の破棄、SharedBuffer非対応時のraw body fallback）
- `src-tauri/src/spout_shared_frames.rs`のunit test（slot要求の検証、generation・slot・sequenceの判定）
- `src-tauri/src/spout_output.rs`のunit test（lifecycle、不正なsize/length、unsupported、cleanup）と、ignore指定の実DirectX 11往復・1080p計測

## 将来`SendTexture`へ移行する場合の変更箇所

- Frontend: `RgbaFrameSource`の代わりにGPU共有のframe sourceを用意する。送信はフレームの受け渡しではなく「更新通知」になるため、`RealtimeOutputBackend.sendFrame`の引数を一般化する。limiter・lifecycle・UIは再利用する。
- Rust: `SpoutBackend` / `SpoutSenderHandle`に`send_texture`相当を持つbackendを追加する。raw IPCの`send_spout_output_frame`は、CPU readback経路のfallbackとして残す。
- C++: `spoutDX::OpenDirectX11(device)`へWebView2と同じadapterのdeviceを渡し、`SendTexture`を呼ぶ。WebView2側のtexture取得手段が前提条件になる。

## 代替案とトレードオフ

[ADR-0022](../../../adr/0022-spout-output-cpu-readback.md)の代替案を参照。同期`readPixels`はPBO経路のfallbackとしても実装しない。PBO経路は失敗しても次の送信枠で再試行するだけで、Previewには影響しない。

## 移行方法

データ移行はない。Presetと保存形式は変更しない。

## ロールバック方法

`SpoutOutputPanel`のマウントと、`lib.rs`のコマンド登録・`app.manage`を外す。`build.rs`のSpoutビルドを外せば、`vendor/spout2`は参照されなくなる。
