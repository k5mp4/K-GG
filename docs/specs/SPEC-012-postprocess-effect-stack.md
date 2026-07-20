---
id: SPEC-012
title: Postprocess Effect Stack
status: implemented
owners: [maintainer]
created: 2026-07-08
updated: 2026-07-08
depends_on: [SPEC-001, SPEC-003]
related_adrs: [ADR-0004]
related_code: [src/types/distortion.ts, src/lib/postprocessStack.ts, src/store/gradientStore.ts, src/lib/postprocessAnimation.ts, src/lib/glass.ts, src/lib/webgl.ts, src/components/PostprocessStackPanel.tsx, src/components/PostprocessPanel.tsx, src/App.tsx, src/hooks/useWebGL.ts, docs/index.md, src/docs/help.md]
related_tests: [src/lib/postprocessStack.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/glass.test.ts]
human_review: completed
---

# SPEC-012: Postprocess Effect Stack

## 背景・問題

現在のPostprocessは1つのEffect Modeだけを適用するため、Mirror、Glass、Prismなどを
組み合わせたり、描画順序をAfter Effectsのエフェクトコントロールのように入れ替えたり
できない。DiffuseとNoiseも順序変更の候補ではあるが、現状はベースグラデーション生成時の
UV処理として実装されており、Postprocessの画像パスとは責務が異なる。

## ゴール・成功条件

- Distort、Mirror、Kaleidoscope、Prism、Voronoi、Glassを各1つまで同時に有効化できる。
- キャンバス左上のオーバーレイでPostprocessレイヤーをドラッグして順序変更できる。
- 左サイドバーのPostprocessタブで、選択中レイヤーの詳細設定を編集できる。
- 旧プリセットは従来の単一Postprocessモードとして読み込める。
- Glassのタイル出力余白、PrismのGlow、Postprocess時間アニメーション判定がスタック順序で破綻しない。

## スコープ

### 対象

- Postprocess用Effect Stackデータモデル、既定値、正規化、プリセット互換
- Postprocess画像系エフェクトの順序付き複数パス描画
- キャンバス左上の順序変更オーバーレイ
- Postprocess詳細設定の選択中レイヤー連動
- スタックに対応した時間アニメーション判定とタイル余白計算

### 対象外

- 同じPostprocess種類の複数インスタンス化
- Diffuse、Noise、Slit、Stretch、Normal、Matcapの順序変更
- Particlesの自由順序化
- 新しいPostprocess種類の追加

## 方針

`PostprocessConfig`へ`effectStack`を追加し、各レイヤーは`kind`と`enabled`だけを持つ。
各Postprocess種類の詳細パラメータは既存フィールドを共有する。`effectMode`は後方互換と
詳細編集対象の選択値として残す。

描画は有効なスタックを先頭から順に処理し、WebGLのping-pong FBOで前段出力を次段入力へ
渡す。Prismは既存のGlow合成を保つため、scratch FBOとBlur FBOを使って最終出力先へ合成する。
Particlesは初回ではスタックに含めず、既存どおり最終オーバーレイとして描画する。

Post Diffuseは各レイヤーごとではなく、画像系Postprocessスタックの最終出力に1回だけ適用する。
Glassがスタック内で有効な場合は、既存のGlassサンプル距離をタイル余白として使う。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 同種エフェクトを複数インスタンス化する | 不採用 | インスタンス別設定、キーフレーム、プリセット形式の変更が大きくv1の範囲を超える |
| Diffuse/Noiseも同じスタックに含める | 不採用 | ベースUV処理と画像Postprocessの意味差を先に整理する必要がある |
| Particlesも自由順序に含める | 不採用 | 粒子をFBOへ描いて後段処理へ渡す追加設計が必要になる |
| Postprocess画像系だけをping-pong FBOで積む | 採用 | 既存パラメータとUIを保ちながら複数種類の順序変更を実現できる |

## エラー・境界条件

- `effectStack`が欠落、重複、未知kindを含む場合は既定順へ正規化し、各kindを1つだけ保持する。
- 旧プリセットは旧`effectMode`に対応する1レイヤーだけを有効化する。
- `postprocess.enabled`がfalseの場合、スタック内のenabledに関係なくPostprocess画像系とParticlesを描画しない。
- 有効レイヤーが0件の場合、Postprocess画像系パスを実行しない。
- Glassが無効、Mix 0、またはスタック外の場合はGlass由来のタイル余白を追加しない。

## 受け入れ条件

- AC-001: キャンバス左上のEffect Stackパネルで6種類のPostprocessレイヤーを表示し、ドラッグで順序を変更できる。
- AC-002: 各レイヤーのON/OFFを切り替えられ、ONのレイヤーだけがスタック順に描画される。
- AC-003: 行選択により左Postprocessタブの詳細編集対象が切り替わる。
- AC-004: 旧プリセットを読み込むと旧`effectMode`の1レイヤーだけが有効になり、従来の見た目を維持する。
- AC-005: 新プリセットはスタック順序、レイヤー有効状態、選択中レイヤーを保存・再読込できる。
- AC-006: Prismを含む複数スタックでGlow合成が黒画面や未定義読み書きを起こさない。
- AC-007: Glassを含むタイル出力で必要なガターを確保する。
- AC-008: Postprocess時間アニメーション判定が有効スタックに基づく。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-003 | 手動プレビュー、UI操作 | `PostprocessStackPanel.tsx`, `App.tsx` |
| AC-004, AC-005 | 正規化・プリセット互換ユニットテスト | `gradientStore.postprocessStack.test.ts` |
| AC-002, AC-008 | スタックユーティリティ、アニメーション判定テスト | `postprocessStack.test.ts`, `postprocessAnimation.test.ts` |
| AC-006 | 手動プレビュー、Webビルド | `webgl.ts` |
| AC-007 | 余白計算ユニットテスト、代表的なタイル書き出し | `glass.test.ts`, 手動確認 |
| 全体 | 自動検証 | `npm run docs:check`, `npm run docs:build`, `npm test`, `npm run lint`, `npm run build` |

## 移行・互換性

`effectStack`を持たないプリセットは読込時に補完される。既存の`postprocess.effectMode`と
各詳細パラメータは保持し、保存後は新しい`effectStack`も含まれる。Particlesは初回では
従来と同じ最終オーバーレイとして残す。

SPEC-012以降のV2では、Diffuse、Noise、Slit、StretchもUnified Effect Stackへ移行した。
この仕様書の「対象外」はSPEC-011のLegacy v1経路に対して適用し、V2の順序と描画契約は
SPEC-012およびSPEC-014を一次情報とする。

## 未決定事項

なし。
