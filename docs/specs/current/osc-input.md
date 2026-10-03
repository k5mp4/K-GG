---
type: current
id: CURRENT-OSC-INPUT
title: OSC入力（Controller）
status: current
owners: [maintainer]
created: 2026-10-03
updated: 2026-10-04
requirement_ids: [OSC-001, OSC-002, OSC-003, OSC-004]
related_adrs: [ADR-20261003-osc-gamepad-input]
related_changes: []
related_code: [src-tauri/src/osc_input.rs, src/lib/gcInput.ts, src/lib/controllerSettings.ts, src/features/native/useGcInput.ts, src/features/native/controllerReceiver.ts, src/features/native/useControllerActions.ts, src/components/ControllerPanel.tsx, src/components/SandboxPanel.tsx, src/components/PresetPanel.tsx]
related_tests: [src/lib/gcInput.test.ts]
---

# OSC入力（Controller）

## 目的

外部ツール（kg_GCcontroller）がGameCubeコントローラーの入力をOSCへ変換して送り、K-GGを手元のコントローラーで操作できるようにします。受信設定と入力の割り当てはSANDBOXの`Controller`で編集します。

## 現在の要件

### OSC-001 受信

デスクトップ版（Tauri）は、Controllerを有効にした時だけ`127.0.0.1`の指定UDPポート（既定9000、1024〜65535）でOSCメッセージ（単体とbundle）を受信します。既定は無効で、無効の間はポートを開きません。有効/無効とポートはControllerの切替で即時に反映され、設定はこのPCのアプリ設定として保存します（Presetには保存しません）。Web版では受信せず、Controllerは「デスクトップ版のみ」と表示します。

ポートを使用できない場合でもアプリは通常どおり動作し、Controllerの状態に理由を表示します。型タグを持たないメッセージ、数値以外の引数だけのメッセージ、非有限の値、不正なbundleは無視します。ネットワーク上の他の機器からは受信しません。

### OSC-002 Controllerパネル

SANDBOXのEdit Layerに`Controller`があり、見出しのスイッチで受信を切り替えます。状態は、停止中・待機中（ポート表示）・受信中（接続中のコントローラー番号）・エラーを表示します。ポート、Presetを選ぶスティック、ボタンの割り当て、パラメータの割り当て、時間スクラブを編集できます。マッピングは既定値へ戻せます。保存値が壊れていたり未知の値を含む場合は、その項目だけ既定へ戻します。

### OSC-003 入力の割り当て

kg_GCcontrollerの`/gc/{ポート番号}/...`アドレスを使用します。どのポートのコントローラーでも操作できます。

既定の割り当ては次のとおりです。ボタンは押した瞬間に1回だけ動作し、押し続けても繰り返しません。接続時にすでに押されているボタンは動作しません。割り当ては「なし」にもできます。

| 入力 | 操作 |
| --- | --- |
| 左スティック | Presetライブラリの候補を動かす |
| Z | 候補のPresetを読み込む |
| A | 再生/一時停止 |
| Y | 再生位置を先頭へ戻す |
| 十字キー左/右 | 前/次のフォルダー（ライブラリのルートを先頭に、階層の表示順） |
| B | ライブラリのルートへ戻る |
| Start | Spout出力のON/OFF |
| Lトリガー | Noise Amountを最小〜最大で動かす |
| Rトリガー | Glass Refractionを最小〜最大で動かす |
| Cスティック左右 | 再生位置の時間スクラブ |

### OSC-004 Preset選択とパラメータ

- スティック: 縦横のうち大きく倒した軸の方向へ候補を1つ進めます。列数は画面幅に応じた実際の並びに従い（リスト表示は1列）、端では止まり折り返しません。倒したままにすると約400ms後から約160msごとに繰り返します。
- 候補は白い枠で示し、画面下に名前を約2秒表示します。操作を始める時の候補は、読み込み済みのPresetの位置、なければ先頭です。候補を動かしていない状態の決定は何もしません。候補の対象はPresetタブで開いているフォルダーのPresetで、パネルが閉じていても操作できます。フォルダーを切り替えると候補は解除されます。
- パラメータの割り当ては、軸の値（スティックは-1〜1、トリガーは0〜1）をパラメータの最小〜最大へ線形に割り当てます。割り当て先はNoise Amount/Scale/Speed、Diffuse Grain、Glass Refractionで、同じ軸を複数の対象へ、最大8件まで割り当てられます。接続直後に届く各軸の初期値は基準にするだけで、パラメータは変わりません。
- 時間スクラブは、倒した量の2乗に比例して再生位置を動かします。ループ再生が有効なら端で折り返します。最大に倒した時の速さは0.05〜2 loop/sで調整できます。

## 他領域との関係

- Presetの読み込みは[Preset System](./preset-system)のPresetカードの読込と同じ処理です。
- 受信方式の判断は[ADR-20261003-osc-gamepad-input](../../adr/20261003-osc-gamepad-input)を参照します。
- Spout出力は[リアルタイム映像出力](./realtime-output)の切替と同じ処理です。

## 変更履歴

なし。

## 未確認・今後の現行仕様化

- 実機のGameCubeコントローラーとkg_GCcontrollerを接続した動作は未確認です。
- 受信できるのはループバックのみで、別PCからのOSC受信には対応しません。
- 割り当て先として選べるパラメータは上記5種に限ります。
