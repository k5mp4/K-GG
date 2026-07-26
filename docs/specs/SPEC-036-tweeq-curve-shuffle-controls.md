---
id: SPEC-036
title: Tweeqカーブ・シャッフル入力への統一
status: implemented
owners: [maintainer]
created: 2026-07-26
updated: 2026-07-26
depends_on: [SPEC-021, SPEC-027]
related_adrs: [ADR-0006, ADR-0011]
related_code: [vendor/tweeq/, tools/update-tweeq-vendor.ps1, tools/tweeq-vendor/, src/components/BezierEasingEditor.tsx, src/components/DiffuseCurveEditor.tsx, src/components/GradientRamp.tsx, src/lib/diffuseCurve.ts, src/lib/linkedCubicBezier.ts, src/lib/presetModel.ts, src/lib/webgl.ts]
related_tests: [tests/tweeqVendor.test.ts, src/lib/diffuseCurve.test.ts, src/lib/linkedCubicBezier.test.ts, src/lib/presetModel.diffuse.test.ts, 'manual: Japanese/English desktop and mobile curve/shuffle controls']
human_review: completed
---

# SPEC-036: Tweeqカーブ・シャッフル入力への統一

## 背景・問題

Loop TimingとDiffuseは別々のカーブ編集UIを持ち、SeedとGradient Rampのランダム化も独自のDiceボタンを使っている。操作感、アクセシビリティ、保守対象を揃えるため、既存の`vendor/tweeq`を拡張してTweeq React実装へ統一する。

## ゴール・成功条件

- Loop TimingとAdaptive Luminanceを`InputCubicBezier`で編集できる。
- 対象のDice操作を`InputShuffle`へ置き換え、従来の値域とGradient Rampの復元契約を維持する。
- npmレジストリへ依存せず、固定したTweeq上流ソースからvendor成果物を再生成できる。

## 方針

`arcatdmz/tweeq`のコミット`75542380032f3429b737cea3840d719cdbc5f7f8`を入力とし、K-GG専用エントリから`InputNumber`、`InputAngle`、`InputColor`、`Viewport`、`CubicBezierValue`、`InputCubicBezier`、`InputCubicBezierPicker`、`InputShuffle`、`fromNumber`、`fromEnum`、`fromString`を公開する。React以外の実行時依存は成果物へ内包する。上流の式評価は有限数・不活性文字列の解析へ制限し、アイコンは外部サービスへ接続しないローカルSVGとする。

Loop TimingはEnable、Beat Sync、プリセット、P1/P2表示と既存キーフレーム形式を維持する。リンクモードは変更されたハンドルを判定し、対称または一致制約を適用する純粋関数として実装する。

Diffuseの保存契約は`luminanceBezier: [x1,y1,x2,y2]`とし、既定値を`[1/3,1/3,2/3,2/3]`とする。旧`luminanceCurve`は読込専用とし、正規化後の旧補間を65点サンプリングし、`x1=1/3`、`x2=2/3`固定の最小二乗法で`y1/y2`を求める。新規保存では旧フィールドを除く。ヒストグラムは読取専用で残し、同じBezier評価結果を重ねる。

Gradient Rampは通常クリックで色順を保った位置シャッフル、Shift+クリックで独立ランダム化し、最初の操作直前の状態へ復元できる。数値Seedは既存の整数・連続値範囲を維持する。

## エラー・境界条件

- 非有限または範囲外のBezier値は有限な`[0,1]`へ正規化する。
- 旧カーブの点数不足や退化した連立方程式では恒等Bezierへフォールバックする。
- disabled状態のカーブとShuffleは値を変更しない。
- vendor更新時に固定コミットまたはtracked/staged状態が一致しなければ生成を中止する。
- vendor成果物に許可以外の外部依存、動的コード実行、外部アイコン通信が含まれる場合は生成を中止する。

## 受け入れ条件

- AC-001: vendorの公開APIと固定コミット、ライセンス、再生成手順が記録され、アプリ依存は`file:vendor/tweeq`のままである。
- AC-002: Loop Timingのドラッグ、確定、disabled、プリセット、Beat Sync、リンクモードが従来の保存形式を維持する。
- AC-003: 旧Diffuseカーブ変換が決定的、有限、範囲内で、恒等カーブを恒等Bezierへ変換する。
- AC-004: DiffuseのUIプレビュー、LUT、WebGL描画が同じBezier評価を使い、旧プリセットを新形式で保存・再読込できる。
- AC-005: 対象SeedのShuffleが従来の値域を守る。
- AC-006: Gradient Rampの通常操作、Shift操作、最初の操作前への復元が維持される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001 | build / security review | `vendor/tweeq`, 更新スクリプト |
| AC-002 | unit / component / manual | Loop Timing、リンク制約 |
| AC-003, AC-004 | unit / preset round-trip / manual | Diffuse、LUT、WebGL preview |
| AC-005, AC-006 | unit / manual | Seed panels、Gradient Ramp |

## 移行・互換性

旧`luminanceCurve`は読込時だけ変換する。既存のLoop Timingキーフレーム、Seed範囲、Gradient Ramp編集結果、Beat Syncは変更しない。

## 未決定事項

なし。
