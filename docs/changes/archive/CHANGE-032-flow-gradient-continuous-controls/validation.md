---
id: CHANGE-032
status: draft
---

# CHANGE-032 検証記録

> **未完成**：この検証記録は限定実装の確認結果です。目的のFlow Gradient描画品質にはまだ到達していません。未実施の受け入れ条件を残したまま、CHANGE-032はactive／draftとして継続します。

## 現在の状態

本change全体は、CHANGE-030の承認済み範囲から外れる粒子ライフサイクル変更とUIレンジ変更をレビューへ出すための候補である。2026-08-13のユーザー指示により、追加の合成調整を定義するUI-CONT-002だけを限定実装した。粒子ライフサイクル、既存レンジ、Stretch 16、Ribbon Width 1..5pxの変更は未実装であり、引き続きレビュー待ちである。

## MCPベースライン

2026-08-13にローカルPreviewをMCPブラウザーで取得した値：

- Seed 42
- Particle Count 100000
- Curl Scale 2.5
- Curl Strength 1.00
- Speed 0.60
- Ribbon Width 8px
- Stretch 8.00
- Density 1.00
- Trail 0.85（UI表示85%）
- Contrast 1.20
- Loop ON、Duration 5.00秒

Flow canvasはCSS上で624×351px、Flow設定パネルは幅219pxで、既存の2列グリッドを1列へ変更後は高さ840pxの縦長レイアウトになった。Ramp変更確認では、変更前の白優勢出力に対し、Ramp色を低・中密度域で可視化できることを確認した。この確認はCHANGE-030の承認済み修正として記録し、本changeのFLOW-CONT-004を先取り実装したことを意味しない。

## 受け入れ条件

| ID | 状態 | 備考 |
| --- | --- | --- |
| FLOW-CONT-001 | 未実施 | 人間レビューと実装承認待ち |
| FLOW-CONT-002 | 未実施 | 人間レビューと実装承認待ち |
| FLOW-CONT-003 | 未実施 | Stretch 16の仕様承認待ち |
| UI-CONT-001 | 未実施 | 共通parameterLimits変更の承認待ち |
| FLOW-CONT-004 | 未実施 | Ramp可視化のCHANGE-030修正とは別に、continuous modelとの統合確認が必要 |
| UI-CONT-002 | pass | Flow Opacity、Particle Opacity、Particle Sizeを保存・正規化・共通parameter registry・UI・WebGLへ追加。focused test 19件で範囲、Preset roundtrip、uniform経路を確認済み。motherアプリの手動確認は下記へ追記予定 |

## UI-CONT-002 実装前後のテスト

実装前に次のfocused testを実行し、未実装の設定フィールド、Preset値、shader uniform、MCP parameter定義が不足して6件失敗することを確認した。

```text
npm test -- src/lib/flowSimulation.test.ts src/lib/flowGradientPreset.test.ts src/lib/webglExportPrograms.test.ts packages/kgg-control/src/parameters.test.ts --run
→ 4 files, 6 failed, 13 passed（実装前の期待されたred）
```

実装後に同じfocused testを再実行し、4 files・19 testsがpassした。Flow Opacityは最終合成、Particle OpacityはDensity加算、Particle Sizeは速度方向Ribbonの投影サイズへ接続され、旧Presetの欠落値は既定値へ正規化される。

## motherアプリ手動確認

2026-08-13、ローカルmotherアプリをMCPブラウザーから確認した。SANDBOXのEdit LayerでFlow Gradientを選択し、FlowをONにしたうえで、負荷を抑えるためParticle Countを一時的に10,000へ設定した。

- Flow GradientパネルにParticle Opacity（35%）、Particle Size（1.5x）、Flow Opacity（40%）が表示され、入力値が保持された。
- Flow Opacityを0%と40%で切り替えたとき、Flowキャンバス領域のキャプチャ合計値が `3,368,704` と `3,344,977` で変化した。
- Particle Sizeを0.5xと1.5xで切り替えたとき、Flowキャンバス領域のキャプチャ合計値が `3,534,919` と `3,570,005` で変化した。
- 操作中のブラウザーコンソールにerror／warnはなかった。
- 確認終了時にParticle Countを100,000、Particle Opacityを82%、Particle Sizeを1x、Flow Opacityを100%、FlowをOFFへ戻した。

これは3操作がUIから描画経路へ到達することの確認であり、未承認の粒子ライフサイクル変更、Stretch 16、Ribbon Width 1..5pxのGPU受け入れ確認ではない。

## 全体検証（2026-08-13）

| コマンド | 結果 |
| --- | --- |
| `npm test -- --run` | pass — 69 files / 386 tests |
| `npm run lint` | pass — 0 errors / 21 warnings。警告は既存コードのHook依存、`any`、Fast Refreshなどで、今回のFlow変更ファイルには新規エラーなし |
| `npm run build` | pass — `tsc -b` とVite build。既存のTauri dynamic importおよびchunk size warningあり |
| `npm run docs:check` | pass — 41 legacy specs / 7 current specs / 22 changes / 16 ADRs |
| `npm run docs:build` | pass |
| `git diff --check` | pass |

CHANGE-032全体は`draft`のままであり、上記はUI-CONT-002限定実装の検証結果である。粒子ライフサイクル変更、Curl Scale／Ribbon Width／Stretchの新レンジ、Stretch 16のGPU密度確認、Ribbon Width 1..5pxの受け入れ確認は未実施である。

## 未確認事項

- 旧プリセットのRibbon Width 8pxを1–5pxへ移行する具体的な方針。
- 長時間再生、逆方向Seek、複数タイルExportでの固定粒子群の決定性。
- Stretch 16、Ribbon Width 1px、Particle Count 500000のGPU負荷と密度補正。
- 粒子数を増やした場合のFlow Opacity／Particle Opacity／Particle Sizeの推奨値と、低解像度FBOでの最小Particle Size。
