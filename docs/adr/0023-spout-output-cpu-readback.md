---
id: ADR-0023
title: Spout出力をCPU readback・WebView2共有メモリ・静的リンクしたSpoutDXで実装する
status: accepted
date: 2026-09-25
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0023: Spout出力をCPU readback・WebView2共有メモリ・静的リンクしたSpoutDXで実装する

## コンテキスト

K-GG Desktop（Windows）の最終描画を、TouchDesigner、Resolume、OBSなどのSpout Receiverへリアルタイムに送りたい。描画はWebView2内のWebGL2 canvasで行われ、RendererのGPU textureをTauri/Rustから直接参照する公開APIはない。Spout2はWindows専用のC++ SDKである。

利用者がSpout SDKを別途導入せずに使えること、Windows CIで再現可能にビルドできること、Windows以外の`cargo check`とWeb版を壊さないことが求められる。Spout失敗によってPreview描画を止めてはならない。

## 決定

1. **経路**: 処理済みPreview canvasの既定framebufferを、WebGL2の`readPixels`（PIXEL_PACK_BUFFER）と`fenceSync`で非同期にreadbackする。
2. **フレームの受け渡し**: Rustが解像度ごとにWebView2 SharedBuffer（`ICoreWebView2Environment12::CreateSharedBuffer`）を3つ作り、`PostSharedBufferToScript`でページへ渡す。Rendererは`getBufferSubData`で共有メモリへ直接書き込み、IPCでは`generation`・`slot`・`sequence`だけを送る。フレームのbyte列はIPCを通らない。SharedBufferを使えないWebView2 Runtimeでは、RGBAをTauri 2のraw IPC body（`InvokeBody::Raw`、幅・高さはheader）で送る。JSON、`number[]`、base64は使わない。
3. **ネイティブ境界**: Rustは薄いC ABI（`kgg_spout_create` / `kgg_spout_send_rgba` / `kgg_spout_release`）だけを呼ぶ。C++ラッパーがWebGLの行順（下から上）とRGBAを、上から下のBGRAへ再利用バッファ上で変換し、`SpoutDX::SendImage`へ渡す。Sender形式はSpoutの既定で最も互換性の高い`DXGI_FORMAT_B8G8R8A8_UNORM`とする。
4. **Spout2の取り込み**: 上流`SpoutDX`の静的ライブラリ構成と同じ7ソースとヘッダーだけを、内容を変えずに`vendor/spout2/`へ置く。`build.rs`がWindows MSVC targetの場合だけ`cc` crateでビルドし、アプリ本体へ静的リンクする。それ以外のtargetではRustのunsupported backendを使う。
5. **Backpressure**: Rendererは待たない。readbackは1件まで、送信は共有メモリ経路で2件まで（raw IPC経路は1件）in-flightにし、送信待ちは最新の1フレームだけ保持する（latest frame wins）。native側はsequenceが古い送信を捨て、フレームの順序を保つ。FPS上限はPreview FPSとは独立に30/60 fpsから選ぶ。
6. **Lifecycle**: SenderはOFF、Sender名変更、component unmount、pagehide、前回ページの残存検出、送信の致命的失敗、Tauri `RunEvent::Exit`で解放する。
7. **拡張点**: フロントエンドの`RealtimeOutputBackend`（start / sendFrame / stop）とRustの`SpoutBackend` / `SpoutSenderHandle`をtransportの境界にする。将来のGPU共有方式は、この境界の下で`SendTexture` backendと別のframe sourceを追加して導入する。

## 理由

- WebView2内部のD3D11 textureを取得する公式手段はない。CPU readbackは、今のRenderer・WebView2構成で実装と検証ができる唯一の安定した経路である。
- PBO＋fenceによる非同期readbackは、同期`readPixels`で生じるGPU stallをPreview描画から切り離す。
- raw IPC bodyはJSON化を避けられるが、WebView2ではcustom protocolのrequest bodyがstream経由で読まれる。実測では1080p（8MB）1フレームに約4秒、640×360でも約170msかかり、リアルタイム出力に使えなかった（CHANGE-056 validation）。SharedBufferなら転送コピーがなくなり、1080p/60fpsを維持できた。
- 共有メモリへの書込みと送信通知を分けたので、IPCの往復遅延（Preview描画中で約20ms）を2件の並行送信で吸収できる。
- 変換を再利用バッファ上で行うC++は、Rustのdev profileに左右されず`/O2`で動く。IPC bodyのアラインメントに依存しない。
- 上流ソースを静的リンクすれば、DLLの同梱・探索・バージョン不整合がない。vendorは約0.5MBで、SDK全体（Examples、Binaries、PDF）を取り込まない。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| WebGL/WebView2 texture → D3D11 shared texture → `SendTexture` | WebView2から描画textureを取り出す公開APIがなく、今回のRequestでも対象外。上記の拡張点で将来検討する |
| Spout2をgit submoduleにする | CI・配布ビルドでsubmodule取得が必須になり、SDK全体を取得する。必要ファイルと上流commitはvendor READMEで固定できる |
| 上流CMakeで静的ライブラリを作り`.lib`をcommitする | バイナリがレビューできず、MSVC/CRTの組み合わせに縛られる |
| SpoutDX DLLを同梱して動的に読み込む | installer・resource・DLL探索の管理が増え、利用者環境の別版DLLと衝突しうる |
| raw IPC bodyだけで送る | WebView2上で1080p 1フレームに約4秒かかる。SharedBufferを使えないRuntime向けのfallbackとしてだけ残す |
| Rust側のloopback HTTP/WebSocket serverへ送る | CSPの`connect-src`とローカルポートの公開範囲が広がる。それでも8MB/frameのコピーは残る |
| 同期`readPixels`のみ | 実装は単純だが、送信のたびにPreview描画スレッドがGPU完了を待つ |
| RGBAのまま`DXGI_FORMAT_R8G8B8A8_UNORM` Senderにする | 変換は減るが、Spoutの既定・DirectX 9系ReceiverとのBGRA互換性を優先する |

## 結果

### 利点

- 利用者はSpout SDKを導入せずに、Windows Desktop版だけで使える。
- Spoutの失敗はSpout出力の停止とエラー表示に閉じ、Preview描画は継続する。
- 実DirectX 11での往復テストで、向き・チャンネル順・リサイズ・名前衝突・解放を検証できる。

### 欠点・コスト

- 1080pでは1フレームあたり約8MBのGPU→CPU（readback、main threadで約4ms）とCPU→GPU（`SendImage`、約3ms）のコピーが残る。4K/60fpsでは帯域が大きい。
- WebView2 SharedBufferのCOM APIを直接使うため、`webview2-com` / `windows-core`に依存する。バージョンはTauriのwry runtimeと揃える。
- readbackはcanvasの既定framebufferを読むため、Cloth/Coneの3D表示canvasは送らない。
- 上流Spout2の更新時は、vendor READMEの手順でファイル・commit・ライセンス一覧を更新する必要がある。

## 再検討条件

- WebView2またはTauriが、WebGL textureをD3D11 shared textureとして共有する手段を提供した場合。
- 実測で1080p/60fpsや4Kの要求に対して、readbackかIPCがPreview FPSを継続的に落とすと確認された場合。
- Spout2のライセンスまたは`SendImage` APIが変わった場合。
