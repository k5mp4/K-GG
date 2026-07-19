---
id: SPEC-003
title: Organic Glass Postprocessエフェクト
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-16
depends_on: [SPEC-001]
related_adrs: [ADR-0001]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/components/PostprocessPanel.tsx, src/components/PresetPanel.tsx, src/lib/glass.ts, src/lib/sceneEvaluation.ts, src/lib/renderBridge.ts, src/lib/tileRender.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/shaders/postprocess/]
related_tests: [src/lib/glass.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/tileRender.test.ts, src/store/gradientStore.glass.test.ts]
human_review: completed
---

# SPEC-003: Organic Glass Postprocessエフェクト

## 背景・問題

既存Postprocessには幾何変換、Prism、Voronoi、Particlesがあるが、入力画像を
有機的な凹凸面で屈折させる表現がない。高解像度タイル出力で周辺画素を参照する
エフェクトを追加する場合、タイル境界を越えるサンプルが欠けると継ぎ目が発生する。

## ゴール・成功条件

- PostprocessのEffect ModeとしてGlassを選択できる。
- 表面形状、屈折、色収差、粗さ、ハイライト、合成率、時間変化を調整できる。
- Noise Distortionの模様をGlass表面へ連続的にブレンドできる。
- プレビュー、プリセット再読込、タイルエクスポートで同じ見た目を維持する。

## スコープ

### 対象

- Glassの設定型、既定値、UI、シェーダー、GPU別Complexity上限
- Glass固有表面とNoise Distortion表面の補間
- EvolutionとMotionによるループ可能な時間変化
- 旧プリセットへの既定値補完とGlassプリセットの再読込
- 屈折サンプル範囲に応じたタイル描画ガター

### 対象外

- 新しい描画バックエンド
- Glass以外のPostprocessの見た目変更
- プリセットファイル形式のバージョン更新

## 方針

Glass設定は既存`PostprocessConfig`へ追加し、読込時に
`normalizePostprocessConfig`で欠損値を補完する。シェーダーは表面高さから安定した
法線を求め、屈折、色収差、粗さ、ハイライトを合成する。Noise Distortionとの補間は
端点で変化率が0になる補間を使用し、100%付近の操作で屈折方向が跳ねることを防ぐ。

周辺画素を参照するタイル出力は、屈折・色収差・粗さの最大サンプル距離をガターとして
描画し、コア領域だけを出力へ合成する。Motionが0より大きい場合だけ共有時間トラックを
有効にし、停止したGlassで不要な再描画を行わない。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| Canvas 2DでGlassを後処理する | 不採用 | プレビューと高解像度出力の性能、一貫性を維持しにくい |
| タイル境界のUVをクランプする | 不採用 | 屈折サンプルが境界で途切れ、継ぎ目が残る |
| WebGL Postprocessへ統合する | 採用 | 既存の時刻評価、GPU最適化、出力経路を共有できる |

## エラー・境界条件

- 無効状態、Glass以外、Mix 0ではタイルガターを追加しない。
- 読込値はレンダラー上限へクランプし、`NaN`は安全な最小値へ正規化する。
- 旧プリセットにGlass項目がなくても既定値を補完し、従来モードを維持する。
- Motion 0以下では時間アニメーションを無効とする。

## 受け入れ条件

- AC-001: Glassを選択し、Surface、Optics、Motionの設定を操作できる。
- AC-002: Noise Distortion 0%と100%が正確な端点になり、端点付近も連続変化する。
- AC-003: Motionが0より大きい場合だけ時間アニメーションが有効になる。
- AC-004: 旧プリセットを読み込め、Glass設定を保存・再読込できる。
- AC-005: タイル出力が必要なガターを計算し、コア領域を正しい座標へ合成する。
- AC-006: GPU性能Tierに応じてGlass Complexityを上限以内へ制限する。
- AC-007: テスト、lint、Webビルドが成功する。
- AC-008: Refraction既定値付近でも表面勾配を一律に過小化せず、屈折量の変更が画面へ視認可能に反映される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-006 | ビルドと手動プレビュー | `PostprocessPanel.tsx`, WebGLプレビュー |
| AC-002 | 補間ユニットテスト | `src/lib/glass.test.ts` |
| AC-003 | シーン評価テスト | `src/lib/sceneEvaluation.glass.test.ts` |
| AC-004 | プリセット互換テスト | `src/store/gradientStore.glass.test.ts` |
| AC-005 | ガター計算テストと代表的なエクスポート | `src/lib/tileRender.test.ts` |
| AC-007 | 自動検証 | `npm test`, `npm run lint`, `npm run build` |
| AC-008 | シェーダー契約テストと手動プレビュー | `src/lib/effectShaderParity.test.ts`, WebGLプレビュー |

## 移行・互換性

既存Postprocessプリセットは読込時にGlass既定値を補完する。既存のモード選択と
変位マップは維持され、利用者による移行操作は不要である。

## 未決定事項

なし。
