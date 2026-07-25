---
id: SPEC-032
title: アニメーション入力範囲とキーフレーム編集・Loopミラー改善
status: implemented
owners: [maintainer]
created: 2026-07-25
updated: 2026-07-25
depends_on: [SPEC-031]
related_adrs: [ADR-0001, ADR-0006]
related_code: [src/components/TimelineBar.tsx, src/components/SliderField.tsx, src/components/AnimationPropertyControls.tsx, src/lib/loopKeyframes.ts, src/lib/sceneEvaluation.ts, src/store/gradientStore.ts]
related_tests: [src/lib/loopKeyframes.test.ts, src/store/gradientStore.animation.test.ts]
human_review: completed
---

# SPEC-032: アニメーション入力範囲とキーフレーム編集・Loopミラー改善

## 背景・問題

DurationとSpeedの調整範囲が広く、Tweeqのドラッグ入力を細かく操作しにくい。また、キーフレームのライブ表示値と編集対象が混在し、AmountやScaleなどで直前に変更した値を再編集できない場合がある。フレーム目盛りがなく、インジケーターとキーの位置関係も判断しにくい。

## ゴール・成功条件

- Durationは1〜10秒、Speedは1〜5の範囲でTweeq入力を操作できる。
- FPSは視認性を優先した標準`select`で24/30/60を選択できる。
- キー用SliderFieldは現在時刻の評価値を表示し、編集時には正しい元キーを更新または追加できる。
- タイムラインに薄いフレーム罫線・目盛り・フレーム番号を表示する。
- Loop ON時はキーフレーム編集範囲を0〜50%に制限し、後半は前半を時間反転して評価・表示する。

## 方針

編集対象の時刻と表示用の評価時刻を分離する。Loop ON時の編集時刻は0.5を上限にクランプし、評価時刻が0.5を超える場合は`1 - time`へ反転して前半キーを補間する。ストア境界でも同じ制約を保証する。

## エラー・境界条件

- Durationは1〜10秒、Speedは1〜5へクランプする。
- Loop ON時に後半をシークして編集した場合は、編集対象を半周期終端へ制限する。
- フレーム罫線はDuration×FPSに応じて密度を調整する。

## 受け入れ条件

- AC-001: Durationを1〜10秒、Speedを1〜5の範囲でTweeqドラッグ入力できる。
- AC-002: FPSが標準selectで24/30/60から選択できる。
- AC-003: 同じ時刻のキー用SliderFieldを連続して変更しても直前のキーが更新される。
- AC-004: タイムラインにフレーム罫線・主要目盛り・フレーム番号が表示される。
- AC-005: Loop ON時に前半へ追加したキーが後半へ反転表示され、再生評価も反転する。
- AC-006: Loop ON時に50%より後ろへキーを追加・移動できない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-006 | ストア境界・ミラー評価テスト、ブラウザ手動確認 | `src/store/gradientStore.ts`, `src/lib/loopKeyframes.test.ts`, TimelineBar |

## 移行・互換性

キーフレームの保存形式は変更しない。Loop OFFでは保存済みキーを従来どおり使用する。

## 未決定事項

なし。
