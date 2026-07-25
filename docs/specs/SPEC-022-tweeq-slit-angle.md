---
id: SPEC-022
title: Slit AngleへのTweeq InputAngle導入
status: implemented
owners: [maintainer]
created: 2026-07-15
updated: 2026-07-21
depends_on: [SPEC-021]
related_adrs: [ADR-0006, ADR-0009]
related_code: [vendor/tweeq/index.es.js, vendor/tweeq/index.cjs, vendor/tweeq/index.d.ts, vendor/tweeq/style.css, src/App.css, src/components/SliderField.tsx, src/components/SlitScanPanel.tsx, src/lib/tweeqAngle.ts]
related_tests: [src/lib/tweeqAngle.test.ts, src/lib/parameterLimits.test.ts, 'manual: all Slit angle-mode controls']
human_review: completed
---

# SPEC-022: Slit AngleへのTweeq InputAngle導入

## 背景・問題

Slitの線形モードにある`Angle`は現在、他の数値パラメータと同じ横方向の数値フィールドで調整している。方向を扱う値であることが操作から分かりにくく、回転量を視覚的に微調整する操作モデルが不足している。

## ゴール・成功条件

- Slitの線形モードの`Angle`をTweeqの`InputAngle`で調整できる。
- 回転ダイヤルと度数の直接入力を同じUIで利用できる。
- K-GGの既存のZustand更新、キーフレーム更新、デフォルトリセット、プリセット形式を維持する。

## スコープ

### 対象

- Tweeq React入口から`InputAngle`とその型を公開する。
- `SliderField`に既存のラベル、アニメーション操作、リセット、キーフレーム経路を維持した角度コントロールモードを追加する。
- Slit線形モードの`Angle`だけを角度コントロールへ切り替える。
- 既存のTweeqテーマを`InputAngle`のダイヤルと数値部分にも適用する。

### 対象外

- SlitのAngle以外の数値フィールドの操作変更。
- Polygonの`Rotation / Twist`、Waveの`Direction`、Circularの`Twist`の操作変更。
- 角度値の保存形式、描画計算、角度の単位の変更。

## 方針

- `InputAngle`は固定済みTweeqコミットから生成したvendor配布物へ追加し、上流のvendor CSS本体は変更しない。
- 既存`SliderField`の`onChange`境界を利用し、`InputAngle`から通知された有限値だけを既存のSlit状態更新へ渡す。
- `trackId="slitScan.angle"`、デフォルト値、現在時刻のキーフレーム処理は既存経路を共有する。
- `InputAngle`の`InputNumber`部分には度数表示を使い、回転ダイヤルは15度スナップを補助操作として利用する。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `InputAngle`を`SliderField`の角度モードとして利用する | 採用 | 既存のラベル、リセット、アニメーション、キーフレーム契約を一箇所で維持できる。 |
| SlitScanPanel内で`InputAngle`と更新処理を直接実装する | 不採用 | キーフレームとリセット経路が重複し、他の角度入力へ再利用しにくい。 |
| 現行`SliderField`を継続する | 不採用 | 方向値に特化した回転操作を提供できない。 |

## エラー・境界条件

- 非有限値が通知された場合はSlit状態、キーフレーム、プレビューを変更しない。
- 角度の単位は既存どおり度数とし、描画・プリセット・キーフレームの数値形式を変更しない。
- 線形モード以外では既存の`SliderField`を表示する。
- Tweeqのスタイルが利用できない場合でも、数値更新経路と状態契約は維持する。

## 回帰条件

- 角度入力値はダイヤル操作・クリック・直接入力のいずれでも1回転へ正規化し、`-360°`などの負の多回転値を表示しない。
- Tweeqの画面座標系とK-GGのキャンバス角度系の差を入力アダプターで吸収し、ダイヤルの回転方向とSlitの描画方向を一致させる。
- 回転ダイヤルは数値入力の右側に配置し、通常時・クリック後ともに白い外周枠を表示しない。
- 線形モードの`Offset Angle`にも`Angle`と同じ回転ダイヤル、正規化、キーフレーム更新経路を適用する。

## 受け入れ条件

- AC-001: Slitを線形モードにすると、`Angle`に回転ダイヤルと度数入力を備えた`InputAngle`が表示される。
- AC-002: 回転ダイヤル、直接入力、キーボード操作で変更した値が`slitScan.angle`へ反映され、キャンバスのSlit方向が更新される。
- AC-003: `slitScan.angle`がKeysモードのとき、InputAngleの変更が既存の時刻のキー更新またはキー追加経路を通る。
- AC-004: Angleのリセットで既存のモード別デフォルト値へ戻り、プリセットJSONと描画計算の形式は変わらない。
- AC-005: Polygon、Wave、CircularのRotation、Direction、Twist相当フィールドも意味が角度の場合は`InputAngle`で表示し、強度を意味する`Twist`は数値入力のまま維持する。
- AC-006: K-GGのテーマ変数がInputAngleのダイヤル、度数入力、フォーカス状態に適用される。
- AC-007: Angleの回転ダイヤルはK-GGの共通`button`スタイルに影響されず、度数入力と同じ行内で正円として表示される。
- AC-008: Tweeqの数値フィールドをドラッグしている間、値とハンドルが更新され、操作中の点線スケールオーバーレイが表示される。TweeqのバンドルまたはCSSが読み込まれない場合は受け入れ不可とする。
- AC-009: AngleおよびOffset Angleの入力値は`[0, 360)`へ正規化され、負の多回転値を表示しない。
- AC-010: AngleおよびOffset AngleのダイヤルはK-GGのキャンバス角度と同じ回転方向で操作でき、数値入力はダイヤルの左側に表示される。
- AC-011: AngleおよびOffset Angleのダイヤルに白い外周枠やクリック後の白いフォーカス輪郭を表示しない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | TypeScriptビルド、ブラウザ手動操作 | `src/components/SlitScanPanel.tsx`, `src/components/SliderField.tsx` |
| AC-003, AC-004 | 既存キーフレーム・プリセットテスト、手動リセット確認 | `src/components/SliderField.tsx`, `src/store/gradientStore.ts` |
| AC-005 | Slit各モードの表示確認 | `src/components/SlitScanPanel.tsx` |
| AC-006 | CSSビルド、ブラウザ手動確認 | `src/App.css`, `vendor/tweeq/style.css` |
| AC-007 | ブラウザ手動確認、レイアウト計測 | `src/App.css` |
| AC-008 | ブラウザ手動操作、コンソールエラー確認 | `src/components/SliderField.tsx`, `vendor/tweeq/index.es.js`, `vendor/tweeq/style.css` |
| AC-009, AC-010 | `tweeqAngle`ユニットテスト、ブラウザ手動操作 | `src/lib/tweeqAngle.ts`, `src/components/SliderField.tsx` |
| AC-011 | CSSビルド、ブラウザ手動確認 | `src/App.css` |

## 移行・互換性

SlitScanConfig、キーフレーム、プリセットJSON、WebGL描画計算、書き出し形式は変更しない。UI操作だけが線形モードのAngleに限って変わる。

## 未決定事項

- 人間による仕様承認済み。
