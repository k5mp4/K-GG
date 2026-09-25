---
title: 書き出し形式選択とFFmpeg動画形式の検証
---

# 書き出し形式選択とFFmpeg動画形式の検証

## Merge Gate

- `npm run check:fast`（docs check/build、unit/component 626件、lint 0 error、frontend build）: pass。
- `cargo test`（`src-tauri`）: pass（36件）。形式登録表、GIF／WebM引数、エンコーダー検出、GIF／WebM保存と拡張子不一致の拒否を含む。Linux作業環境では既存のLinux専用フォント探索コードのコンパイルエラー（`main`でも同様、対象外）を一時的に回避して実行した。
- `tests/e2e/export.spec.ts`（Save PNG、PNG ZIP）: pass。
- Linux上のFFmpeg 6系で、登録したGIF／WebMのFFmpeg引数を連番PNG（偶数・奇数寸法）へ実行し、`ffprobe`で`gif`／`vp9`、フレーム数、WebMの`yuv420p`／`bt709`を確認した。

## Release Gate（Tauri実機未確認）

- Windows x64とmacOSのTauri版で、MOV／MP4／WebM／GIFの書き出し・保存ダイアログ・保存先フォルダー保存を確認する。
- `libvpx-vp9`を含まないFFmpegでWebMが選択肢に出ないことを確認する。
- GIF／WebM選択時にAfter Effects自動送信が行われず、MOV／MP4の自動送信・手動送信が従来どおり動作することを確認する。
- 大きな解像度・長尺でのGIFのファイルサイズとエンコード時間を記録する（Observation）。

この作業環境ではTauriデスクトップアプリ・After Effectsを実行できないため、上記をローカルpassとは扱わない。
