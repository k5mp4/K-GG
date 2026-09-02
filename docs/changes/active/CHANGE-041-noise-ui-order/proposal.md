---
type: change
id: CHANGE-041
title: Noise UI共通プロパティとタイプ順序
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-31
updated: 2026-08-31
current_specs: [CURRENT-UI-CONTROLS]
related_adrs: [ADR-0011, ADR-0012]
related_code: [src/components/NoiseDistortionPanel.tsx, src/lib/noiseSeed.ts]
related_tests: [src/components/NoiseDistortionPanel.test.tsx, 'manual: Noise panel common control order and type order browser check']
human_review: completed
---

# CHANGE-041 Noise UI共通プロパティとタイプ順序

## 背景・問題

Noiseパネルでは、`Amount`と`Scale`がNoise Type固有設定の後ろにあり、頻繁に調整する基本プロパティへ到達するまでに種類ごとの設定を読み飛ばす必要がある。また、Noise Typeは`Simplex`から始まるため、利用頻度と性質の近さをUI上の順序から読み取りにくい。

## 変更理由

Noiseの基本調整を種類に依存しない同じ位置へ置き、パネルを開いた直後に変位量・密度・乱数種を調整できるようにする。Type一覧は、利用頻度が高く高品質な流れ場を作れるCurl系を先頭に置き、その後をアルゴリズムの近いファミリーごとにまとめる。

## ゴール・成功条件

- NoiseパネルのType選択後に、`Amount`、`Scale`、`Seed`をこの順で表示する。
- Type一覧を次の順序で表示する。
  `Fast Curl` → `Curl (Legacy)` → `Simplex` → `fBm` → `Aura Ridges` → `Fractal Drift` → `Domain Warp` → `Seamless` → `Voronoi` → `Caustics` → `Phasor Lines`
- Type-specific設定は共通プロパティの後ろにまとまり、既存の表示条件、入力範囲、保存値、描画結果を維持する。

## 対象

- `NoiseDistortionPanel`の共通プロパティ表示順。
- Noise Type選択肢の表示順。
- Typeごとの専用プロパティを、次のファミリー順で一覧化すること。
  - Flow: Fast Curl、Curl (Legacy)
  - Base / Fractal: Simplex、fBm、Aura Ridges、Fractal Drift
  - Warp / Periodic: Domain Warp、Seamless
  - Structured Field: Voronoi、Caustics、Phasor Lines
- 共通プロパティとType-specific設定の順序を、通常表示、狭いパネル幅、Preset読込後でも確認すること。
- `Seed`のShuffle操作と既存のCurl系／通常Noise系の保存キーを維持すること。

## 対象外

- Noise Typeの追加、削除、名称変更、内部保存値の変更。
- `Amount`、`Scale`、`Seed`の値域、刻み、既定値、描画上の意味の変更。
- Type-specificプロパティの追加、削除、名称変更、並び替え。
- Noiseの描画アルゴリズム、Effect Stackの順序、Preset JSON、Undo/Redo、Animationの変更。
- Noise以外のパネルのレイアウト変更。

## 影響を受ける現行仕様

- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0011](../../../adr/0011-tweeq-vendor-source-and-api)
- [ADR-0012](../../../adr/0012-typed-localization-and-icon-semantics)

## 主なリスク

- Typeの並び順変更により、既存ユーザーの選択位置に関する視覚的な慣れが変わる。ただし保存値と選択結果は変えない。
- 共通プロパティを前方へ移動した際に、特定Typeの専用設定が重複表示される可能性があるため、全Typeの表示条件を確認する。
- 狭いパネル幅では共通プロパティの連続表示により縦方向のスクロール量が増える可能性がある。

## 未決定事項

- なし。上記のType順序は今回のレビュー対象とする提案順序である。
