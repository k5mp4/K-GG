---
type: current
id: CURRENT-PRESET
title: Preset System
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-08-03
requirement_ids: [PRESET-001, PRESET-002, PRESET-003, PRESET-004, PRESET-005, PRESET-006, PRESET-007, PRESET-008, PRESET-009, PRESET-011]
related_adrs: [ADR-0007, ADR-0008]
related_changes: [CHANGE-001, CHANGE-012, CHANGE-013, CHANGE-018]
related_code: [src/lib/presetModel.ts, src/lib/presetLibrary.ts, src/lib/presets.ts, src/lib/presetPreview.ts, src/lib/presetThumbnail.ts, src/lib/glass.ts, src/lib/postprocessStack.ts, src/store/gradientStore.ts, src/components/PresetPanel.tsx, src/components/PresetPreview.tsx, src/adapters/types.ts, src/adapters/browser/presetRepository.ts, src/adapters/tauri/presetRepository.ts, src-tauri/src/lib.rs]
related_tests: [src/lib/presetLibrary.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/presetPreview.test.ts, src/lib/presetThumbnail.test.ts, src/lib/glass.test.ts, src/lib/postprocessStack.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.postprocessStack.test.ts]
---

# Preset System

## 目的

Preset Systemは、Gradient、Effect Stack、アニメーションなどの編集状態を名前付きで保存し、一覧から再利用・整理・交換できるようにします。保存先の違いをUIへ持ち込まず、Web版とTauri版で同じ文書モデルと正規化規則を使用します。

## 現在の要件

### PRESET-001 保存する状態

Presetの `state` には、Gradient、Noise Distortion、Diffuse、Image Gradientの設定、Slit Scan、Stretch、Animation、Normal Map、Radon、Iridescence、手描きDistort、Postprocess、Effect Pipeline、Matcap、キーフレームトラック、ユーザーカラーパレット、解像度などの編集状態を含められます。

選択中のUI状態や互換用の任意フィールドが含まれることはありますが、Presetの読込時は描画に必要な状態を正規化してからストアへ適用します。手描きDistortはPostprocess設定を正規値とし、旧Presetの`manualDistort`だけに残る値は読込時にPostprocessへ移行します。新規保存では旧`manualDistort.enabled`をLegacy generatorの独立入力として有効化しません。

### PRESET-002 保存しない外部入力

Image Gradient Sourceの元画像、Image Overlay/Maskなどの外部画像オブジェクトやファイルパスはPortableなPresetへ保存しません。読込後に外部入力が存在しない場合は、該当設定を保ったまま安全なフォールバックを表示します。

### PRESET-003 Preset文書と互換性

単一Presetは `id`、`name`、`createdAt`、`state` を必須とし、仮想フォルダの `folderId`、同階層の `order`、任意のPNG `thumbnail` を持ちます。旧Presetでは任意フィールドが欠落していても読み込める範囲で既定値を補完します。

フォルダを含むライブラリは `format: kgg-preset-library`、`version: 2`、`folders`、`presets` を持ちます。旧来の単純なPreset配列もライブラリのルートへ正規化できます。既存の識別値と保存済み状態を壊す自動変換は行いません。

### PRESET-004 仮想フォルダ

フォルダはOS上の実フォルダではなく、ID、名前、親ID、表示順、作成時刻を持つ仮想階層です。ルートの親IDは `null` です。空名、パス区切り文字、制御文字、長すぎる名前、重複名、存在しない親、循環階層は拒否します。

Presetは作成後に別フォルダへ移動できます。フォルダ削除時は子フォルダとPresetを親側へ付け替えます。

### PRESET-005 利用者操作

現在提供される操作は、Presetの新規保存・読込・削除・フォルダ移動、フォルダの作成・名前変更・移動・削除、Preset/フォルダ/ライブラリの書出し・読込みです。既存Presetを同じIDへ上書きする専用の更新操作は現在のRepository契約にありません。同名保存は新しいPresetとして扱われます。

内蔵Presetはアプリへ同梱された読み取り専用の初期データです。利用者が保存したPresetとは削除・移動の扱いが異なります。

### PRESET-006 Thumbnail

保存時に、可能なら低解像度のEffect Stack描画結果をPNGデータURLとして1枚保存します。保存済みThumbnailは一覧表示で再利用し、一覧表示のたびに各PresetをWebGLで描画しません。描画できない場合、旧Preset、内蔵Preset、外部画像を必要とするPresetは軽量な2Dプレビューへフォールバックします。

Thumbnailは任意フィールドで、交換用JSON/ZIPへ含められます。過大なデータや不正な形式は読込み時に拒否します。

### PRESET-007 Web版とTauri版

Web版はブラウザの `localStorage` を保存先とし、単一PresetはJSON、フォルダ/ライブラリはZIPまたはJSONのダウンロードとして交換します。Tauri版はアプリデータ領域を保存先とし、OSの保存ダイアログとファイルAPIを使います。

文書モデル、正規化、検証、ZIP展開、インポート時のID再採番と追加マージは共通です。保存先と権限エラーの表現だけが実行環境に依存します。

### PRESET-008 破損データと安全性

Presetやライブラリは読込時に構造、ID、親子関係、循環、名前、サイズ上限を検証します。破損データを現在のライブラリへ部分適用せず、エラーとして扱います。Web版で読込に失敗した場合は空ライブラリへフォールバックし、Tauri版でも保存済みデータを壊さずにエラーを通知します。

### PRESET-009 GLASS V2色設定の互換保存

PresetはGLASS V2のChromatic Hue、Chromatic Saturation、Transmission Tint、Highlight TintをPostprocess設定として保存・復元します。これらを持たない旧Presetは、変更前外観と同一になる`0°`、`100%`、`#FFFFFF`、`#FFFFFF`を補完します。無効なHEX、非有限値、範囲外の数値は、描画前に安全な既定値または上限へ正規化します。

### PRESET-011 Postprocess Glassの互換正規化

旧PresetのPostprocess設定にある`effectMode: glass`およびstackの`kind: glass`は、読込時に`glassV2`へ写像します。`glass`と`glassV2`が重複する場合は最初の位置を維持し、有効状態を論理和で統合します。正規化後のPostprocess設定と新規保存値には旧`glass`を残しません。

## 他領域との関係

- Gradient Systemは `state.gradient`、Image Gradient設定、Meshの正規化を定義します。
- Effect Stackは `state.effectPipeline` を有効状態・順序の一次情報として使用します。
- Animationは `state.animation` と `state.keyframeTracks` に保存され、Preset読込後も同じ時刻評価へ渡されます。

## 変更履歴

- [SPEC-025 Preset Libraryとフォルダ](../SPEC-025-preset-library-and-folders)
- [SPEC-026 操作性と描画Thumbnail](../SPEC-026-preset-library-ux-and-rendered-thumbnails)
- [SPEC-031〜033 アニメーションと出力時刻](../index#legacy-change-specifications)
- [SPEC-040 Mesh Gradation](../SPEC-040-mesh-gradation)
- [CHANGE-012 GLASS V2色調整コントロール](../../changes/archive/CHANGE-012-glass-v2-color-controls/proposal)

Legacy SPECは保存形式が変化した経緯を追うために残します。現行の保存契約・環境差・未実装の更新操作はこの文書を確認してください。

## 未確認・今後の現行仕様化

保存先の容量上限、ブラウザのlocalStorage quota超過時の利用者向け表示、異なるGPUで生成されたThumbnailの再現性は、現行仕様として数値保証していません。Presetの専用更新操作が必要になった場合は、ID・履歴・Thumbnail更新の意味を含む別変更として定義します。
