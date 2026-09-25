# Spout2 (vendored subset)

K-GG DesktopのWindows版は、Spout Sender（Spout出力）に[Spout2](https://github.com/leadedge/Spout2)の`SpoutDX`を使います。ここにはSpoutDXの静的リンクに必要な上流ソースだけを、上流のフォルダー構造・ファイル内容・copyright/license headerを変更せずに置いています。

- Upstream: https://github.com/leadedge/Spout2
- Commit: `c2bcc12147711d12ace7d5f08e869d774d840f8a`（2026-07-19）
- Spout SDK version: 2.007.017
- License: BSD 2-Clause（[`LICENSE`](./LICENSE)、[`SPOUTSDK/licence.txt`](./SPOUTSDK/licence.txt)）

## 含めるファイル

上流`SPOUTSDK/SpoutDirectX/SpoutDX/CMakeLists.txt`の`SpoutDX_SOURCES` / `SpoutDX_HEADERS`と同じ組み合わせです。

```text
SPOUTSDK/SpoutDirectX/SpoutDX/SpoutDX.cpp
SPOUTSDK/SpoutDirectX/SpoutDX/SpoutDX.h
SPOUTSDK/SpoutGL/SpoutCommon.h
SPOUTSDK/SpoutGL/SpoutCopy.cpp
SPOUTSDK/SpoutGL/SpoutCopy.h
SPOUTSDK/SpoutGL/SpoutDirectX.cpp
SPOUTSDK/SpoutGL/SpoutDirectX.h
SPOUTSDK/SpoutGL/SpoutFrameCount.cpp
SPOUTSDK/SpoutGL/SpoutFrameCount.h
SPOUTSDK/SpoutGL/SpoutSenderNames.cpp
SPOUTSDK/SpoutGL/SpoutSenderNames.h
SPOUTSDK/SpoutGL/SpoutSharedMemory.cpp
SPOUTSDK/SpoutGL/SpoutSharedMemory.h
SPOUTSDK/SpoutGL/SpoutUtils.cpp
SPOUTSDK/SpoutGL/SpoutUtils.h
```

Examples、Binaries、SpoutGL（OpenGL）本体、SpoutLibraryは含めません。

## ビルド

`src-tauri/build.rs`がWindows MSVC targetの場合だけ、`cc` crateでこれらのソースとK-GGのC ABIラッパー（`src-tauri/native/spout/`）を静的ライブラリとしてビルドし、アプリ本体へリンクします。利用者が別途Spout SDKやDLLを導入する必要はありません。Windows以外のtargetではコンパイルされません。

## 更新手順

1. 上流の新しいcommitから上記ファイルだけを同じ相対パスへコピーする。ファイル内容を編集しない。
2. このREADMEのcommitとSDK versionを更新する。
3. `npm run licenses:generate`を実行し、Help > Third-party licensesのSpout2 entryを更新する。
4. `npm run check:native`とWindows実機でのSpout Receiver確認（[CURRENT-REALTIME-OUTPUT](../../docs/specs/current/realtime-output.md)）を行う。
