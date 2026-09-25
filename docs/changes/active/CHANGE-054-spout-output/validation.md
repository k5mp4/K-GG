---
title: Spout出力の検証
---

# Spout出力の検証

## Merge Gate

作業環境: Windows 11 Home 10.0.26200、NVIDIA GeForce RTX 3060 Ti、MSVC toolchain、Node 22。

| コマンド | 結果 |
| --- | --- |
| `npm run lint` | pass（0 errors。既存の警告42件はすべて変更対象外のファイル。新規・変更ファイルは警告0件） |
| `npm test` | pass（199 files / 1118 tests。Spout関連の新規テストは26件） |
| `npm run build` | pass（licenses:check、typecheck、vite build。既存のchunk size警告あり） |
| `npm run check:native` | pass（Rust 49 passed / 2 ignored、`cargo check` pass） |
| `npm run change:check` / `npm run docs:check` | pass |
| `cargo build --release`＋起動 | pass（SharedBuffer経路を含むrelease exeが起動し、CDP経由でSpoutのON/OFF・送信を操作できた） |

## Native integration（Windows実機・自動）

実DirectX 11とSpout2を使うテストは、GPUのないCI runnerでは失敗しうるため`#[ignore]`にしている。次のコマンドで明示的に実行する。

```sh
cargo test --manifest-path src-tauri/Cargo.toml spout2 -- --ignored --nocapture --test-threads=1
```

`spout2_sender_round_trip_keeps_orientation_and_channel_order`（pass）は、登録されたSenderの共有DX11 textureを、Receiverと同じく`OpenSharedResource`で開いて読み、次を確認した。

- Senderが登録され、形式は`DXGI_FORMAT_B8G8R8A8_UNORM`（87）。
- WebGL順（下から上）のRGBA 2×2が、上から下のBGRAとして格納される。上下反転とR/B入れ替えは起きない。アルファ値（128）も保持される。
- 2×2から4×3への解像度変更が、同じSender名のまま反映される。
- 同名Senderがある場合、Spoutが別名（`_1`）で登録する。
- `stop`後はSenderが一覧から消える。

## 性能の観測（Observation）

### コマ落ちの原因（Tauri実アプリで計測）

利用者から「Spout出力はできるがコマ落ちして見える」と報告があった。Tauri実アプリのWebView2へCDPで接続し（計測用ビルドだけに`--remote-debugging-port`を付けた）、区間ごとに時間を測った。

| 区間 | 結果 |
| --- | --- |
| raw IPC body 1×1 | 14〜60 ms |
| raw IPC body 640×360（0.9MB） | 169 ms |
| raw IPC body 1280×720（3.7MB） | 0.6〜2.0 s |
| raw IPC body 1920×1080（8.3MB） | 3.8〜5.1 s |
| 小さいIPCの往復（Preview描画中） | p50 19.5 ms |

原因はreadbackでもネイティブ送信でもなく、WebView2上のTauri IPCのrequest body転送だった。1080pは実効約0.25 fpsだった。

### 対策後（WebView2 SharedBuffer、1920×1080、同じ計測方法）

| 目標 | 実測送信fps | 破棄 | 読み取り（平滑化） | 転送（平滑化） | Preview rAF（OFF→ON） |
| --- | --- | --- | --- | --- | --- |
| 60 fps | 58〜61 fps（8秒間で455フレーム） | 17 / 8秒 | 12〜15 ms | 18〜30 ms（2件並行） | 143 → 110 fps |
| 30 fps | 30〜31 fps | 0 | 13〜15 ms | 8〜10 ms | 144 → 144 fps |

- 60 fps送信中も、Previewの描画レートは60 fpsを上回っている（このPCのディスプレイは高リフレッシュレート）。
- 「読み取り」はreadback開始からCPU上に画素が揃うまで、「転送」は送信IPCの往復＋`SendImage`の時間で、どちらも遅延である。スループットは2件の並行送信で確保している。
- ON/OFFの連続切替とFrame Rateの連続切替のあとも、送信は再開した。OFFでnative側のSenderも非アクティブになった。
- Senderの作成（ON時・名前変更時）は、D3D11デバイスの作成に120〜700 msかかる（別インスタンスがGPUを使っている間は数秒かかることがあった）。送信中のコマ落ちには影響しない。

### ネイティブ・ブラウザ単体

| 区間 | 1920×1080 | 条件 |
| --- | --- | --- |
| ネイティブ変換＋`SendImage` | 2.90 ms/frame | `spout2_1080p_native_send_cost`、Rust debug＋C++ `/O2`、120フレーム平均 |
| 同期`readPixels` | 3.69 ms/frame | Playwright Chromium、ANGLE D3D11、clearだけのシーン |
| PBO readPixels発行 | 0.15 ms/frame | 同上 |
| PBO `getBufferSubData` | 4.24 ms/frame | 同上（fence完了後。main threadでのコピー） |

判断材料:

- 1080pのmain threadのコストは、PBO経路の約4.4 ms/frameだけになった。60 fps予算16.7 msの約1/4にあたる。
- 4K出力や、重いEffect Stackで60 fpsを要求する場合は、ADR-0022の再検討条件（GPU共有・`SendTexture`）に進む。

## Release Gate（Windows実機・手動、未実施）

Tauri実アプリのUI操作（CDP経由）と送信統計は上記のとおり確認した。一方、Spout公式Receiver・TouchDesigner・Resolume・OBSでの目視確認はこの作業環境ではできていない。次の項目は**未確認**であり、passとしない。

- [ ] 1080p/30fpsで、Spout Receiver（SpoutReceiverなど）にSender「KAGARIBI Grad」が現れる。
- [ ] 表示がK-GG Previewと一致する（RGBが入れ替わらない、上下反転しない、Effect Stack適用後である）。
- [ ] アニメーション再生で更新される。静止中にパラメータを変えると反映される。
- [ ] Spout OFF、Sender Name変更、アプリ終了で、ReceiverからSenderが消える／切り替わる。
- [ ] Canvas Size変更、Preset変更、gradient mode変更、Effect追加・削除、Spout ON/OFFの繰り返しでクラッシュしない。
- [ ] 1080p/60fpsでのCPU使用率（タスクマネージャー）を、Spout OFF時と比べて記録する（送信fps・破棄数・Preview rAFは上記で計測済み）。
- [ ] 動画書き出し中は送信が止まり、書き出し後に再開する。
- [ ] TouchDesigner（Spout In TOP）、Resolume、OBS（Spout2 plugin）で受信できる。

## 既知の制約

- 送信するのは2D Preview canvasである。Cloth/Coneの3D表示は送らない。
- アルファはストレート（非プリマルチプライド）である。プリマルチプライド前提のReceiverでは、半透明部分の見え方が異なる場合がある。
- Sender Nameは印字可能なASCIIに限る（Receiverのコードページで文字化けしないように）。
- SharedBufferを使えない古いWebView2 Runtimeでは、raw IPC body経路になり、1080pでは実用的なフレームレートにならない。
- TauriのIPCがcustom protocolからpostMessageへfallbackした環境では、raw bodyが配列化される。Tauriの既定では発生しない。
