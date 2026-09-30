---
type: change
id: CHANGE-20260928-datamosh-pixel-stretch
title: Datamosh Pixel Stretch
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-28
updated: 2026-09-28
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET]
related_adrs: [ADR-20260927-datamosh-feedback-layer]
related_code: [src/types/datamosh.ts, src/shaders/datamosh/pixel-stretch.glsl, src/shaders/datamosh/motion-field.glsl, src/shaders/datamosh/uniforms.glsl, src/shaders/datamosh/main.glsl, src/lib/webglShaderSources.ts, src/lib/webgl.ts, src/components/DatamoshPanel.tsx, src/i18n/messages.ts]
related_tests: [src/types/datamosh.test.ts, src/lib/webglExportPrograms.test.ts, tests/e2e/shaders.spec.ts]
human_review: required
---

# Datamosh Pixel Stretch

Request source: Direct request（「datamosh機能を拡張し、PixelStretchを追加して、キャンバスのピクセルが一定方向に伸びるような描画を行えるようにしたい」「sourceの一種としてpixelStretchを実装して。ピクセルが伸びたらそのまま描画が残るような形にしてほしい」）。

## 背景・問題

Datamoshは前フレームの履歴をmotion fieldに沿ってずらすことで引きずりを作るが、ずれる向きはmotion source（Animation Flow／Procedural／Video Motion）に依存し、Feedbackで現在フレームへ戻っていく。利用者が「一定方向へ画素が伸び、伸びた描画が残る」グリッチを直接作れない。既存の`Stretch`レイヤーは行バンドごとに横方向へ全幅を引き伸ばす別の効果で、方向・起点・蓄積を指定できない。

## 変更理由

データモッシュ表現で多用される、明るい画素が一方向へ伸び続けて画面に焼き付くPixel Stretchを、Datamoshのmotion sourceとして選べるようにする。

## ゴール・成功条件

- Datamoshの`Motion Field` Sourceに`Pixel Stretch`が表示され、選択時にAngle、Length、Threshold、Length Varianceを編集できる。
- 輝度がThreshold以上の画素が、論理フレームごとにStrength分ずつAngleの方向へ伸びる（現在入力の明るい画素からLengthまで）。
- 伸びた画素は入力が変わってもそのまま描画に残り、Refreshで選ばれたブロックだけが作り直される。
- `Curl`を上げると、伸びる向きがcurl noiseの力場に沿って場所ごとに変わり、曲がった筋が起点までつながって渦を巻くように伸びる。`Curl` 0では従来の一定方向の描画から変わらない。
- 他のmotion sourceの描画と、Pixel Stretch設定を持たない既存Presetの見た目は変わらない。

## 対象

- `DatamoshMotionSource`へ`pixelStretch`を追加し、`pixelStretchAngle`、`pixelStretchLength`、`pixelStretchThreshold`、`pixelStretchVariance`、`pixelStretchCurl`、`pixelStretchCurlScale`、`pixelStretchCurlLoops`の正規化・既定値を定義する。
- motion field chunkへ一定方向のfieldを、Pixel Stretch chunkへ伸び・保持の合成を追加する。
- Datamoshパネル（UI-026）のSource選択肢と設定表示、説明文（日英）を追加する。
- Current Spec（CURRENT-EFFECT-STACK、CURRENT-UI-CONTROLS）とアプリ内ヘルプを同期する。

## 対象外

- 既存`Stretch`レイヤーの変更、Datamosh以外のレイヤーへのPixel Stretch追加。
- 他のmotion sourceとPixel Stretchの同時使用、暗い画素を起点にする反転モード、Angleのキャンバス上ハンドル操作。
- MCP／kgg-controlからのDatamoshパラメータ個別操作（現状も未提供）。
- タイル描画での適用（DATAMOSH-001どおりDatamosh自体を適用しない）。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack.md)（DATAMOSH-002のsource一覧、DATAMOSH-006を追加）
- [UI入力コントロール](../../../specs/current/ui-controls.md)（UI-026のSource選択肢）
- [Preset System](../../../specs/current/preset-system.md)（PRESET-018の「motion source、各パラメータ」に含まれるため本文変更なし）

## 関連ADR

- [ADR-20260927-datamosh-feedback-layer](../../../adr/20260927-datamosh-feedback-layer.md)。決定4の「motion sourceを同じ契約で差し替える」に沿ってsourceを追加する。履歴のping-pong、フレームキー、source切替時の初期化は変えないため新しいADRは作らない。Pixel Stretch sourceだけは予測画像とFeedbackの合成（DATAMOSH-003）を伸び・保持の規則へ置き換える点をDATAMOSH-006に明記する。

## 主なリスク

- 性能: Pixel Stretch source選択時、1ステップ後ろの履歴が明るい非起点画素ごとに最大64回のtexture参照を行う。それ以外の画素と他のsourceでは追加の探索をしない。
- 画面の焼き付き: Refresh 0ではThreshold以上の画素が消えないため、明るい入力がアニメーションすると軌跡が蓄積し続ける（要求どおりの挙動）。消したい場合はRefreshを上げるか、sourceを切り替えて履歴を初期化する。
- 性能: `Curl`が0より大きいと、起点探索が1ステップごとに2オクターブのnoise勾配を評価する（最大64回、Curl Loopsが0でなければ勾配は4評価）。`Curl` 0では評価しない。
- 単位: LengthはBlock Sizeと同じく出力pxのため、Previewと書き出しで解像度が異なると相対的な長さが変わる。伸びる速さはフレーム高さ基準で解像度に比例する。

## 未決定事項

- なし（伸び方はストリーク型、実装形態はmotion source、伸びた描画は保持で利用者と合意済み）。
