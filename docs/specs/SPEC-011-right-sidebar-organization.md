---
id: SPEC-011
title: 右サイドバーの情報設計とキャンバス解像度プリセット
status: implemented
owners: [maintainer]
created: 2026-07-18
updated: 2026-07-18
depends_on: [SPEC-008, SPEC-009]
related_adrs: []
related_code: [src/App.tsx, src/components/SidebarSection.tsx, src/components/GradientRamp.tsx, src/components/ColorPaletteGenerator.tsx, src/components/ImageGradientSourcePanel.tsx]
related_tests: []
human_review: completed
---

# SPEC-011: 右サイドバーの情報設計とキャンバス解像度プリセット

## 背景・問題

右サイドバーの補助機能が長い一列に並び、最も頻繁に使うキャンバスサイズとGradient Rampへ到達するまでに視線とスクロールが必要になっている。また、ブランド名が旧称のまま残っている。

## ゴール・成功条件

- 右サイドバーのタイトルを `K-GG` に統一する。
- 一般的な用途の解像度をセレクトから選択でき、初期値はFull HD（1920×1080）とする。
- キャンバスサイズとGradient Rampをサイドバー上部の主要操作として扱う。
- OverlayとImage Gradient Sourceを必要時だけ展開できる独立セクションに整理し、Color Palette GeneratorはGradient Rampの配下へまとめる。

## スコープ

### 対象

- サイドバー内タイトルの `K-GG` への変更。
- キャンバス解像度セレクトへの次の4プリセット追加。
  - Full HD: 1920×1080
  - HD: 1280×720
  - 400×400
  - 800×800
- 解像度の下にGradient Rampを配置し、その下に補助セクションを次の順で配置する。
  1. Image Overlay/Mask
  2. Image Gradient Source
- Color Palette GeneratorはGradient Ramp内のグラデーションプリセット領域に属するサブセクションとして提供する。ランプの色を生成・適用する機能であることを、配置の階層で示す。
- Gradient Ramp、Image Overlay/Mask、Image Gradient Sourceを独立した開閉UIとして提供する。Color Palette GeneratorはGradient Ramp内で個別に開閉できる。
- Gradient Rampは初期展開し、Ramp内のColor Palette Generatorと補助セクションは初期折りたたみとする。開閉状態は現在の画面セッション内で保持する。
- 既存のW/H直接入力、アスペクト比ロック、入れ替え操作、各機能の処理・状態・プリセット形式は維持する。

### 対象外

- 新しい解像度プリセットの追加や削除を永続化する設定。
- Gradient Ramp、画像入力、パレット生成、画像グラデーションの処理内容の変更。
- 既存プリセットの保存形式やキャンバス解像度の移行処理。

## 方針

### 情報設計

サイドバー上部をブランドとキャンバスサイズの操作に割り当てる。Gradient Rampは解像度の直下に置き、初期展開して主要編集領域として扱う。Rampの中では、Gradient Ramp本体の編集と、それに色を供給するColor Palette Generatorを同じ視覚的なまとまりにする。Color Palette GeneratorはRamp内のプリセット領域に近い位置へ置き、必要時だけ開けるネストしたディスクロージャーとする。

Rampの外側にあるImage Overlay/MaskとImage Gradient Sourceは、同じ見た目のセクションヘッダーにまとめ、ヘッダーを押すと内容が開閉する独立ディスクロージャーにする。複数セクションを同時に展開できるようにし、ユーザーが比較・併用する操作を妨げない。

### 解像度選択

セレクトの表示ラベルは用途名とピクセルサイズを併記する。選択時は既存の`setCanvasW` / `setCanvasH`とアスペクト比参照値を更新する。手入力やプリセット読込で4プリセット以外のサイズになった場合は、セレクトに「Custom（幅×高さ）」として現在値を表示し、既存の自由入力を失わない。

### アクセシビリティ

各開閉UIはボタンとして実装し、`aria-expanded`と対応する`aria-controls`を持つ。フォーカス表示を維持し、開閉状態を色だけで表現しない。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存のボタン列を4つに増やす | 不採用 | 横幅が狭いサイドバーで主要操作と補助操作の優先順位を表現しにくい。 |
| 1つのアコーディオンだけを開く | 不採用 | Rampと画像ソースなど、併用して調整したい操作を行き来する必要がある。 |
| すべてのセクションを初期展開する | 不採用 | 初期表示の縦長化を解消できず、主要項目が埋もれる。 |
| Color Palette GeneratorをRamp外の独立セクションにする | 不採用 | Rampの色を作る機能なのに、別の編集領域に見えて操作の関係性が弱くなる。 |

## エラー・境界条件

- 初期表示ではFull HD（1920×1080）が選択される。
- 現在のキャンバスサイズがプリセットに一致しない場合、セレクトはCustom表示とし、直接入力値を変更しない。
- 既存のキャンバスサイズの上下限（1〜15000）とアスペクト比ロックの挙動を維持する。
- セクションを閉じても、画像・パレット・画像グラデーション・ランプの状態と描画結果は変更しない。

## 受け入れ条件

- **AC-001**: 右サイドバーのブランドタイトルが`K-GG`として表示され、旧称が表示されない。
- **AC-002**: キャンバスサイズのセレクトにFull HD、HD、400×400、800×800が表示される。
- **AC-003**: 初期表示時にFull HD（1920×1080）が選択され、Full HDを選ぶとキャンバスが1920×1080になる。
- **AC-004**: HD、400×400、800×800を選ぶと、それぞれ1280×720、400×400、800×800へ変更され、アスペクト比参照値も同期する。
- **AC-005**: 解像度の直下にGradient Rampがあり、初期状態で展開されている。
- **AC-006**: Gradient Rampの下にImage Overlay/Mask、Image Gradient Sourceの順で表示され、各セクションを独立して開閉できる。
- **AC-007**: Gradient Ramp内にColor Palette Generatorが配置され、Rampを開いた状態でサブセクションを独立して開閉できる。
- **AC-008**: 初期状態でRamp内のColor Palette Generatorと補助2セクションは折りたたまれ、閉じた状態でも既存の設定値・描画結果は変化しない。
- **AC-009**: カスタム解像度の直接入力、W/H入れ替え、アスペクト比ロック、既存パネルの操作が従来どおり動作する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-008 | manual | 右サイドバーの目視、セレクト操作、各セクションの開閉と描画確認 |
| AC-009 | unit / manual | `npm test`、直接入力・プリセット読込・既存パネル操作 |
| 全体 | automated | `npm run docs:check`, `npm run docs:build`, `npm run lint`, `npm run build` |

## 移行・互換性

キャンバスサイズの既存状態とプリセット形式は変更しない。新しいセレクトは既存の幅・高さ状態を編集するUIであり、保存データのフィールド追加や改名は行わない。開閉状態は永続化しないため、既存プリセットとの互換性に影響しない。

## 未決定事項

なし。
