---
id: SPEC-010
title: Bezier Axisの廃止
status: implemented
owners: [maintainer]
created: 2026-07-10
updated: 2026-07-10
depends_on: [SPEC-000]
related_adrs: [ADR-0001]
related_code: [src/App.tsx, src/store/gradientStore.ts, src/lib/webgl.ts, src/shaders/gradient.frag.glsl]
related_tests: [src/lib/imageGradient.test.ts, src/lib/sceneEvaluation.glass.test.ts]
human_review: completed
---

# SPEC-010: Bezier Axisの廃止

## 背景・問題

Bezier Distortion（Bezier Axis）は利用されておらず、UI、SDF生成、描画状態、プリセットを複雑にしている。

## ゴール・成功条件

- Bezier Axisに固有のUI、状態、描画処理、保存を削除する。
- 旧プリセット内のBezier Axis設定を無視し、他の設定を維持して読込む。
- Gradient TypeのBezierとタイムラインのBezier補間を維持する。

## スコープ

### 対象

- Bezier Distortionパネル、BezierAxisEditor、SDF更新、WebGLテクスチャ・uniform
- Bezier Axis依存のIridescence設定
- Bezier Axisの履歴、アニメーション、プリセット、組込みプリセット、利用者文書

### 対象外

- Gradient TypeのBezier、グラデーションアンカー編集
- キーフレームのBezier補間

## 方針

Bezier Axis専用の型、Zustand状態、描画入力、SDF生成、シェーダー分岐を削除する。Gradient TypeのBezierは既存の制御点を維持し、境界処理はclamp固定とする。プリセット読込では旧フィールドを参照せず、以後の保存と組込みプリセットからは削除する。

## エラー・境界条件

- 旧プリセットの未知フィールド`bezierAxis`はエラーにせず無視する。
- Gradient TypeのBezierを使う既存プリセットは、他のGradient設定を維持して読込む。

## 受け入れ条件

- AC-001: Bezier Distortionとキャンバス上のBezier Axis編集UIが表示されない。
- AC-002: Bezier Axisの型、状態、SDF、WebGL uniform、シェーダー参照が残らない。
- AC-003: 旧プリセットを読込み、Bezier Axisだけを無視して他設定を維持する。
- AC-004: Gradient TypeのBezierとキーフレームBezier補間は引き続き利用できる。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-004 | manual | Gradient UI、Timeline |
| AC-002 | 検索 / build | `rg bezierAxis`、`npm run build` |
| AC-003 | manual | 旧プリセットJSONの読込 |

## 移行・互換性

保存済みの`bezierAxis`は無視する。プリセット形式のバージョン更新は行わない。

## 未決定事項

なし。
