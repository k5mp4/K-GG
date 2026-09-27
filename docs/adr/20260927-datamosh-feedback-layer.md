---
id: ADR-20260927-datamosh-feedback-layer
title: Datamoshを時間フィードバックのEffect Stackレイヤーとして扱う
status: proposed
date: 2026-09-27
deciders: [owner]
related_specs: []
supersedes: []
---

# ADR-20260927-datamosh-feedback-layer: Datamoshを時間フィードバックのEffect Stackレイヤーとして扱う

## コンテキスト

`Video Motion`はEffect Stackのレイヤーとして、前フレームを動画のmotion fieldで移流するMotion Feedbackを提供していた。今回、プロシージャルなmotion fieldとマクロブロック単位の破損で動画コーデックの破綻を再現するDatamoshを追加し、Video MotionをDatamoshのmotion sourceとして統合する要求があった。

前フレームの自分の出力を入力に使う効果には、他のレイヤーにない問題がある。

- 同じ論理フレームを再描画（停止中のパラメータ編集、lazy compile完了、Preview再評価、順序遷移ブレンド）すると、素朴な実装では履歴が余分に進む。
- 履歴を1枚のtextureへ描画後コピーすると、毎フレームのフルサイズコピーが必要になる。
- タイル書き出しでは全体フレームの履歴を持てない。

当初はSANDBOXの固定段（Main Stackの後）として実装したが、利用者の要望で他の効果と同じく並べ替え可能なEffect Stackレイヤーとして扱うことになった。

## 決定

1. DatamoshはEffect Stackの通常レイヤー（`EffectStackKind`の`datamosh`）とし、drag、randomize、solo、選択、永続化、render planの対象にする。有効状態と順序は`effectPipeline.effectStack`、設定は`datamosh`へ保存する。旧`videoMotion`レイヤーは正規化時に同じ位置の`datamosh`レイヤーへ写像する。
2. 履歴はDatamosh専用のping-pong target 2枚で持ち、片方を前フレーム（読み取り）、もう片方を今フレームの出力（書き込み）とする。レイヤーの出力は書き込み側textureをそのまま後段の入力にし、コピーしない。
3. 履歴は論理フレームが変わったときだけ進める。フレームキーはtimeline正規化時刻、shader時刻、video source時は動画field更新回数から作る。同じキーの再描画は同じ履歴から再評価する（冪等）。解像度、render session、motion source、動画のreset versionが変わったら履歴を初期化し、初回は現在フレームを出力する（I-frame）。
4. motion fieldは`vec2 datamoshMotionField(vec2 uv)`を返す独立したGLSL chunkとし、プロシージャル（curl noise）と動画motion fieldを同じ契約で差し替える。
5. タイル描画ではDatamoshレイヤーを適用しない。

## 理由

- Effect Stackのレイヤーにすると、Noiseの前後など任意の位置で履歴を掛けられ、旧Video Motionの配置もそのまま引き継げる。利用者は他の効果と同じ操作で並べ替え・ソロができる。
- フレームキーによる冪等化で、停止中の編集、lazy compile、順序遷移ブレンドの再描画が見た目を進めない。Flow GradientのFLOW-006と同じ考え方になる。
- ping-pongは履歴コピーを省き、Freeze（履歴を固定したまま参照する）も入れ替えを止めるだけで表現できる。
- motion field chunkを分けることで、codec motion vectorや高品質optical flowへの置換がfeedback合成を変えずに行える。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| SANDBOXの固定段（Main Stackの後）にする | 並べ替えの影響を受けず説明しやすいが、利用者が他の効果と同じ位置操作を求めた。旧Video Motionの配置も失われる。 |
| Video MotionをEffect Stackに残し、Datamoshを別に置く | 同種の時間フィードバックが2か所に分かれ、履歴の扱いと保存形式が二重になる。 |
| 履歴を1枚にし、描画後にコピーする（旧Video Motion方式） | 毎フレームのフルサイズコピーが必要で、再描画時の冪等性も持てない。 |
| motion fieldを低解像度textureへ先に描くpre-pass | 拡張性は高いがプログラムとtargetが増える。解析的勾配のnoiseで画素ごとの評価を十分軽くできたため、将来の最適化として残す。 |

## 結果

### 利点

- 旧Presetの`videoMotion`レイヤーは同じ位置・有効状態の`datamosh`レイヤーになり、設定は`Video Motion` source・`Ramp Lock`・ブロックと破損なしのDatamoshへ移行できる。
- motion sourceを追加しても保存形式・描画順・UIの入口は変わらない。

### 欠点・コスト

- ランダム化・ソロ・並べ替えで入力が変わると、履歴は新しい入力へ徐々に置き換わるまで前の見た目を引きずる。
- MCPの`EffectKind`は`videoMotion`の代わりに`datamosh`を受け付ける。外部scenarioの`videoMotion`指定は無効になる。
- 履歴用のフルサイズtargetが2枚増える（Datamosh有効時のみ確保）。

## 再検討条件

- 時間フィードバック効果が複数になり、履歴の共有や段同士の順序が問題になった場合。
- タイル書き出しで時間フィードバックを再現する必要が出た場合。
