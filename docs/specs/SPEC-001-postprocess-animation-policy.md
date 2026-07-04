---
id: SPEC-001
title: Postprocess時間アニメーション判定の一元化
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-04
depends_on: []
related_adrs: [ADR-0001]
related_code: [src/store/gradientStore.ts, src/lib/sceneEvaluation.ts]
related_tests: [src/lib/postprocessAnimation.test.ts, src/lib/sceneEvaluation.glass.test.ts]
human_review: completed
---

# SPEC-001: Postprocess時間アニメーション判定の一元化

## 背景・問題

Postprocessエフェクトが`postprocess.__time`による時間アニメーションを必要とする条件が、`gradientStore.ts`と`sceneEvaluation.ts`の合計5か所に重複している。

現在の条件は次のとおりである。

- Postprocessが有効で、モードがPrismまたはParticlesである。
- Postprocessが有効で、モードがGlassかつ`glassMotion > 0`である。

この条件は、自動トラックの作成、トラックの有効性判定、再生ループの要否、シーン評価で個別に使われる。今後モードを追加・変更した際、一部だけを更新すると、タイムライン表示、プレビュー再生、エクスポートの間で動作が一致しなくなる。

## ゴール・成功条件

- Postprocessの時間アニメーション可否を1つの純粋関数で判断する。
- ストアとシーン評価が同じ判定関数を使用する。
- 現在のPrism、Particles、Glassの挙動を変更しない。
- 判定対象となる全モードと無効状態をテーブルテストで固定する。

## スコープ

### 対象

- Postprocess時間アニメーション判定関数の追加
- `gradientStore.ts`内の重複判定2か所の置き換え
- `sceneEvaluation.ts`内の重複判定3か所の置き換え
- 判定関数のユニットテスト
- 既存Glassシーン評価テストによる回帰確認

### 対象外

- エフェクトの見た目、速度、ループ方式の変更
- UI、タイムライン、プリセット形式の変更
- `GradientRamp.tsx`、`webgl.ts`、`PostprocessPanel.tsx`、`App.tsx`の分割
- Postprocess以外のアニメーション判定の再設計
- 新しいエフェクトモードの追加

巨大ファイルの責務分割は、現在進行中のGlass関連変更が安定した後に、対象ごとの独立した仕様として扱う。

## 方針

`src/lib/postprocessAnimation.ts`に、`PostprocessConfig`を受け取って真偽値を返す`isPostprocessTimeAnimationActive`を追加する。

判定は現在の実装と同じ意味を維持する。

```text
postprocess.enabled &&
(
  effectMode is prism or particles ||
  effectMode is glass and glassMotion > 0
)
```

関数は状態変更、副作用、ストア参照を持たない。`types`はデータ構造の定義に留め、動作ポリシーは`lib`に配置する。

`gradientStore.ts`と`sceneEvaluation.ts`は、この関数を呼び出す。アニメーション全体の有効状態など、呼び出し元固有の条件は引き続き呼び出し元で判断する。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 現在の重複を維持する | 不採用 | モード追加時に更新漏れが発生しやすい |
| `gradientStore.ts`から関数をexportする | 不採用 | シーン評価がZustandストア実装へ依存する |
| `animationRegistry.ts`へ判定を置く | 不採用 | Registryはプロパティ定義を扱い、エフェクト設定値による動的判定とは責務が異なる |
| 独立した純粋関数へ分離する | 採用 | 依存方向が単純で、全分岐を直接テストできる |

## エラー・境界条件

- `enabled: false`では、モードや`glassMotion`に関係なく`false`を返す。
- Glassの`glassMotion`が`0`、負数、`NaN`の場合は、現在の比較演算と同じく`false`を返す。
- Distort、Mirror、Kaleidoscope、Voronoiでは`false`を返す。
- 未知のモードを実行時に受け取った場合も、明示的に許可したモード以外は`false`とする。

## 受け入れ条件

- AC-001: Postprocessが無効な場合、全エフェクトモードで時間アニメーション無効と判定される。
- AC-002: 有効なPrismとParticlesは時間アニメーション有効と判定される。
- AC-003: 有効なGlassは`glassMotion > 0`の場合のみ時間アニメーション有効と判定される。
- AC-004: Distort、Mirror、Kaleidoscope、Voronoiは時間アニメーション無効と判定される。
- AC-005: ストアとシーン評価に同じ条件式の複製が残らず、共通関数を使用する。
- AC-006: 既存のテスト、lint、ビルドが成功し、利用者から観測できる動作が変わらない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-004 | 全モードのテーブルユニットテスト | `src/lib/postprocessAnimation.test.ts` |
| AC-003, AC-006 | 既存Glass回帰テスト | `src/lib/sceneEvaluation.glass.test.ts` |
| AC-005 | コードレビューと重複条件検索 | `gradientStore.ts`, `sceneEvaluation.ts` |
| AC-006 | 自動検証 | `npm test`, `npm run lint`, `npm run build` |

## 移行・互換性

データ形式、プリセット、公開インターフェースの変更はない。既存の条件式を名前付き関数へ移すだけであり、移行処理は不要である。

## 未決定事項

なし。
