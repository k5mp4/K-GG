---
id: SPEC-031
title: アニメーションプレビューとタイムライン操作の改善
status: implemented
owners: [maintainer]
created: 2026-07-25
updated: 2026-07-25
depends_on: [SPEC-021]
related_adrs: [ADR-0001, ADR-0006]
related_code: [src/components/GradientCanvas.tsx, src/components/TimelineBar.tsx, src/components/SliderField.tsx, src/lib/animation.ts, src/lib/timelineClock.ts]
related_tests: [src/lib/animation.test.ts, src/lib/timelineClock.test.ts]
human_review: completed
---

# SPEC-031: アニメーションプレビューとタイムライン操作の改善

## 背景・問題

アニメーション有効化直後の自動再生により、キーフレーム用スライダーの操作中に時刻が進み、意図しない連続キーフレームが作成される。また、現在時刻で評価された値をパネル上で確認しにくい。

## ゴール・成功条件

- アニメーション有効化後は停止状態で待機し、再生ボタンまたはSpaceキーで明示的に再生できる。
- タイムライン左側の個別`Animation` ON/OFFボタンは置かず、中央の再生ボタンまたはSpaceキーで初回再生を開始する。
- キーフレームの現在値を、対象スライダーとタイムラインのトラック行で確認できる。
- DurationとSpeedをTweeqの数値ドラッグ入力で調整できる。
- FPSを24/30/60から選択できる。

## スコープ

- `AnimationLoop`の初期停止起動と、再生中だった場合の状態維持。
- タイムライン時計の購読通知と、キー補間値のライブ表示。
- TimelineBarのDuration/Speed入力、FPS入力、既存の再生・シーク操作。

## 方針

初回のアニメーションループは停止状態で生成し、現在時刻0のフレームを描画する。設定変更によるループ再生成では、直前に再生中だった場合だけ再生状態を引き継ぐ。キーが有効な`SliderField`はタイムライン時計の現在値で補間して表示値と入力位置へ反映する。

## エラー・境界条件

- 空のキーフレーム、Static、Autoではライブ補間値を表示しない。
- Spaceキーはテキスト入力中には再生操作へ割り当てない。
- エクスポート中の内部停止・再開は既存のエクスポート仕様を維持する。

## 受け入れ条件

- AC-001: アニメーションと対象エフェクトを有効化した直後、プレビューが停止し現在時刻が自動で進まない。
- AC-002: 停止中にキー用スライダーを操作しても時刻が固定され、連続キーフレームが作成されない。
- AC-003: 再生ボタンまたはSpaceキーで再生・一時停止・再開を切り替えられる。
- AC-004: Animationパネルを開いた直後は停止状態で、中央の再生ボタンまたはSpaceキーを押した時だけ初回再生が始まる。
- AC-005: キーフレーム補間中の現在値が対象スライダーとタイムライン行へ反映される。
- AC-006: 既存のシーク、エクスポート、テスト、lint、ビルドに回帰がない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-004 | AnimationLoopユニットテスト、ブラウザ手動確認 | `src/lib/animation.test.ts`, TimelineBar |
| AC-005 | 自動検証 | `npm test`, `npm run lint`, `npm run build`, `npm run docs:check`, `npm run docs:build` |

## 移行・互換性

プリセット、キーフレーム、エクスポート形式は変更しない。

## 未決定事項

なし。
