---
type: change
id: CHANGE-054
title: 書き出し形式のCustomSelect化とFFmpeg動画形式の追加
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
current_specs: [CURRENT-VIDEO-EXPORT]
related_adrs: []
human_review: required
---

# 書き出し形式のCustomSelect化とFFmpeg動画形式の追加

Request source: Direct request。画像・動画の書き出し形式を形式ごとのボタンではなく`CustomSelect`で選び、選択した拡張子で書き出す。動画はFFmpegの引数を登録するだけで形式を追加できる構造にし、GIFなどを追加する。

## 変更理由

静止画はPNG／JPG／WebP、動画はMOV／MP4／PNG連番ZIPをそれぞれ別ボタンで提供しており、形式を増やすたびにUI・ハンドラー・Tauri commandを複製する必要があった。形式の定義をRust（FFmpeg引数・エンコーダー）とフロントエンド（表示名・ファイル名・AE互換）の登録表へ集約し、共通のexport経路から選択形式を渡す。

## 変更内容と受け入れ条件

- 静止画は`CustomSelect`でPNG／JPG／WebPを選び、1つの保存ボタンで選択形式を保存する。JPG／WebPの品質は従来どおり0.92。
- 動画は`CustomSelect`でMOV／MP4／WebM／GIF／PNG連番（ZIP）を選び、1つの書き出しボタンで選択形式を出力する。MP4とWebMでは品質プリセットを`CustomSelect`で選べる。
- Tauriは単一の`encode_native_video` commandで形式IDを受け取り、Rustの`NativeVideoFormat`登録表からFFmpeg引数・出力ファイル名・必要エンコーダーを決定する。
- GIFはFFmpeg標準の`gif`エンコーダーで、全フレームから生成した256色パレット（`palettegen`／`paletteuse`）を使い、無限ループで出力する。
- WebMは`libvpx-vp9`、YUV 4:2:0、BT.709メタデータで出力する。
- FFmpeg状態は検出したエンコーダーから利用可能な形式（`videoFormats`）を返し、UIは利用可能な形式だけを選択肢に出す。FFmpegの利用可否判定に必要なエンコーダーは従来どおり`qtrle`と`libx264`だけとする。
- ネイティブ成果物の保存はMOV／MP4／GIF／WebMを許可し、一時成果物と保存先の拡張子一致を検証する。After Effects送信はMOV／MP4だけを許可する。
- MOV・MP4の保存ファイル名（`{stem}.mov`、`{stem}_h264rgb.mp4`）とFFmpeg引数は変更しない。

## 対象外

AVIF・TIFFなど静止画形式の追加、アルファ付きWebM／GIF、GIFのfps上限やディザー設定のUI、After EffectsへのGIF／WebM送信、PNG連番ZIPの生成方式変更は対象外とする。

## 互換性

Tauri commandの`encode_qtrle_mov`と`encode_h264_rgb_mp4`は`encode_native_video`へ統合する。フロントエンドとRustは同じリポジトリで配布されるため外部互換は不要。`videoFormats`を返さない状態でも、フロントエンドはMOV／MP4を利用可能とみなす。

検証と未確認事項は[validation](./validation.md)に記録する。
