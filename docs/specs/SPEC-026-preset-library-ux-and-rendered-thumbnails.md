---
id: SPEC-026
title: プリセットライブラリの操作性と描画サムネイル
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-22
depends_on: [SPEC-025]
related_adrs: [ADR-0008]
related_code: [src/App.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessStackPanel.tsx, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/components/PresetPreview.tsx, src/components/PresetPanel.tsx, src/adapters/types.ts, src/adapters/browser/presetRepository.ts, src/adapters/tauri/presetRepository.ts, docs/index.md]
related_tests: [src/lib/presetLibrary.test.ts, src/lib/presetThumbnail.test.ts, npm test, npm run lint, npm run build, npm run docs:check, npm run docs:build]
human_review: completed
---

# SPEC-026: プリセットライブラリの操作性と描画サムネイル

## 背景

プリセットの一覧でグラデーションだけを表示すると、Effect Stackを含む最終的な見た目を判断しにくい。また、フォルダ階層を持つライブラリでは、作成済みプリセットを後から整理できる導線と、狭いパネルでも階層と一覧を把握できるレイアウトが必要になる。

## 仕様

- 内蔵プリセットの読み込み中にEffect Stackの選択状態が変化しても、左パネルは`PresetLibrary`を表示したままにする。
- プリセット保存時、現在の設定を低解像度の独立した描画コンテキストで静止画化し、PNGデータURLをサムネイルとして保存する。描画できない場合はサムネイルなしで保存し、既存の軽量2Dプレビューへフォールバックする。
- 保存済みプリセットはドラッグアンドドロップまたはフォルダ選択で、ルートを含む任意のフォルダへ移動できる。内蔵プリセットは移動できない。
- フォルダ階層はプリセット一覧の上に1列で配置し、ライブラリ一覧はその下に配置する。
- 保存、書き出し、読み込み操作はスクロールしても見失わない固定フッターに配置する。
- プリセットライブラリの利用者向け操作ラベルは、`JSON`と`ZIP`などの固有名詞を除き日本語で表示する。
- 画面上部のタブ見出しは既存の英語名`Export`と`Preset`を維持し、パネル内部の説明・操作ラベルは日本語で表示する。

## 受け入れ条件

1. 内蔵プリセットを5件以上読み込んでも、左パネルの表示が`PresetLibrary`から`postprocess`へ切り替わらない。
2. 新規保存したプリセットのカードに、グラデーションだけでなく有効なエフェクトスタックを反映したPNGサムネイルが表示される。GPU描画が使えない環境では軽量2D表示になる。
3. プリセットカードをフォルダツリーまたはフォルダカードへドロップすると、対象フォルダへ移動し、再読み込み後も移動先が保持される。
4. フォルダ階層が上段、プリセット一覧が下段の1列構成で表示される。
5. 保存・書き出し・読み込みの操作領域が一覧のスクロール位置によらず表示される。
6. プリセット画面の保存・移動・書き出し・読み込みに関する英語ラベルが日本語化され、`JSON`と`ZIP`はそのまま表示される。画面上部のタブ見出しは`Export`と`Preset`で表示される。

## スコープ外

- サムネイルへ外部画像やノイズテクスチャを永続化すること。
- OS上の実フォルダとの同期。
- 内蔵プリセットの内容を書き換えること。
