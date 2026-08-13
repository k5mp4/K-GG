---
type: change
id: CHANGE-032
title: Flow Gradient continuous particle field and expanded controls
status: draft
change_kind: F
owners: [maintainer]
created: 2026-08-13
updated: 2026-08-13
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-GRADIENT, CURRENT-VIDEO-EXPORT]
related_changes: [CHANGE-030]
related_adrs: [ADR-0008, ADR-0009, ADR-0010]
related_code: [src/components/FlowGradientPanel.tsx, src/lib/flowSimulation.ts, src/lib/flowGradientRenderer.ts, src/lib/parameterLimits.ts, packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/parameters.ts, src/shaders/flow-splat.vert.glsl, src/shaders/flow-splat.frag.glsl, src/shaders/flow-trail.frag.glsl, src/shaders/flow-gradient.frag.glsl, src/store/gradientStore.ts]
related_tests: [src/lib/flowSimulation.test.ts, src/lib/webglExportPrograms.test.ts, packages/kgg-control/src/parameters.test.ts, manual: MCP browser control and GPU preview comparison]
human_review: required
---

# CHANGE-032 Flow Gradient continuous particle field and expanded controls

> **未完成・継続作業あり**
>
> 本changeは完成版ではありません。今回のpushではUI-CONT-002（Flow Opacity、Particle Opacity、Particle Size）の限定実装と検証結果だけを保持します。目的としている連続的な粒子移流、Stretch 16、Curl／Ribbonレンジ変更、最終的なリボン描画品質は未達であり、追加実装と再検証が必要です。受け入れ条件が残るため、`status: draft`のままactiveに保持します。

## 背景・問題

CHANGE-030では、3Dエミッタから球面方向へ放射した粒子を、粒子ごとの位相と寿命を使ってCurl Noise場へ配置し、投影後のDensityへ蓄積している。現在のMCP測定値は、Seed 42、Particle Count 100000、Curl Scale 2.5、Curl Strength 1、Speed 0.6、Ribbon Width 8px、Stretch 8、Density 1、Trail 85%、Contrast 1.2、Loop 5秒である。Stretchを最大にした確認では改善後の画面全体へ広がるが、粒子が寿命位相で再生成されるモデルは、ユーザーが求める「一度生成された粒子が力場に沿って動き続ける」Flow Gradientとは異なる。

また、現行UIのレンジはPhase Aの検証用に広く設定されており、Curl Scale、Ribbon Width、Stretchの操作単位が、求める有機的なカールとリボン幅の調整には粗い。これはCHANGE-030で承認されたUI-021およびFLOW-002/FLOW-012の解釈を変更するため、同changeへ黙って混ぜず、本候補として分離する。

## 変更理由

- 粒子の寿命・再spawnによる見かけの放射ではなく、固定粒子群が3D Curl力場を連続的に移流することで、布やリボンのような重なりを作る。
- 画面全体を覆う密度場を、Curl Scale、Curl Strength、Ribbon Width、Stretchの微細な調整で制御できるようにする。
- 粒子数を増やしたときも、合成結果を意図した濃度へ保てるよう、Flow全体の不透明度、単一粒子の不透明度、投影サイズを独立して調整できるようにする。
- 既存のGradient Rampを引き続きDensityの色割り当てに使用し、後からRampを変更したときFlowにも同じ色変化が反映される契約を保つ。

## ゴール・成功条件

- 粒子は初期生成後、通常の再生中に寿命満了や個別の再spawnで消滅・再生成せず、3D Curl力場に従って連続移流する。
- 再生、停止・再開、Seek、Exportの開始時は、Seedと論理時刻から決定的に同じ初期粒子群と移流結果を再構成できる。
- Stretchの最大値16で、既存の画面全体投影基準を維持しながら、流線の占有範囲がキャンバスの大部分へ届く。
- UIと共通normalizerの範囲・刻みを次へ変更する。
  - Curl Scale: 0.01–3.00、0.01刻み
  - Curl Strength: 0–2.00、0.01刻み
  - Ribbon Width: 1–5px、0.01px刻み
  - Stretch: 0–16、0.01刻み
- FlowのDensityは現在のGradient Rampを参照し、Rampの変更がFlowの低・中密度域と高密度ハイライトへ観測可能に反映される。
- Flow Opacityは最終合成の不透明度、Particle Opacityは単一splatのDensity寄与、Particle Sizeは投影後のRibbon長・幅へ反映する。各値は保存・復元され、粒子数を変えても個別に調整できる。

## 追加する粒子合成コントロール

| Control | Range | Step | Default | 適用箇所 |
| --- | --- | --- | --- | --- |
| Flow Opacity | 0–1 | 0.01 | 1.00 | Compositeの最終alphaとpremultiplied RGB |
| Particle Opacity | 0–1 | 0.01 | 0.82 | 各splatのDensity加算前 |
| Particle Size | 0.25–2.00 | 0.01 | 1.00 | 投影後のRibbon長・断面幅 |

Densityは粒子重なりをFieldへ変換する既存の集約量として残し、Flow OpacityとParticle Opacityを同じ意味の値として二重に扱わない。Particle Sizeを上げても単純な丸い点へ変形せず、速度方向のRibbon形状を維持する。

## 対象

- Flowの粒子ライフサイクル、3D Curl移流、固定ステップ、reset/prewarm、Preview/Seek/Exportの決定性。
- Curl Scale、Curl Strength、Ribbon Width、StretchのparameterLimits、UI、保存・復元・旧値の正規化。
- 画面全体投影と、Stretch変更時のDensity占有範囲およびRibbon幅の調整。
- 既存Gradient RampをFlowへ割り当てる表示・描画契約と再現テスト。

## 対象外

- Flow専用のLoop Duration、別の時計、Animation Loop契約の変更。
- Directional Diffusion、物理ベースの体積レンダリング、CPU側粒子近傍探索、3D Ribbonメッシュ化。
- 既存Particles、Main Stack、Prism、Glass、Seamlessの描画順・保存契約の変更。
- Tauri/Rust、FFmpeg、外部ファイル形式、MCPの新しいnative権限。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack): Flowの移流ライフサイクルとDensity生成要件。
- [UI Controls](../../../specs/current/ui-controls): UI-021 Flow controlsの範囲・刻み。
- [Gradient System](../../../specs/current/gradient-system): Flow DensityへのRamp割り当て。
- [Video Export](../../../specs/current/video-export): 固定粒子群のreset/prewarmとExport parity。

## 関連ADR

- ADR-0008のThumbnail独立コンテキストとFlow reset/prewarm境界を維持する。
- ADR-0009のparameterLimitsと共通normalizerを使用する。
- ADR-0010のGradient Rampテクスチャ経路を再利用する。

## 主なリスク

- 長時間再生で固定ステップの蓄積誤差が増え、PreviewとExportの結果がずれる。
- 粒子を再spawnしないことで画面外へ流出し、画面占有率が低下する。
- Ribbon Widthを1–5pxへ狭めることで、低解像度Density FBO上の細線が消える。
- 旧プリセットのRibbon Width 8pxなどを新範囲へ移行する際、見た目が変わる。

## 未決定事項

- 旧プリセットの範囲外値を上限へクランプするか、既定値へ戻すか。
- 永続シミュレーションのチェックポイント間隔と、Seek/Export時のprewarm上限。
- Stretch 16で必要な粒子数・Density補正の既定値。
- Flow Opacity、Particle Opacity、Particle Sizeの既定値、低解像度FBOでの最小サイズ、およびParticle Count変更時の推奨組み合わせ。

## Review gate

本change全体は、粒子寿命モデル、旧プリセット移行、Stretch 16時の性能と描画密度を人間が確認するまで承認済みとは扱わない。`status: approved`、`human_review: completed`、レビュー済み`delta.md`が揃った後に、FLOW-CONT-001〜004とUI-CONT-001を実装する。ただし、2026-08-13のユーザー指示により、追加の合成調整だけを定義するUI-CONT-002（Flow Opacity、Particle Opacity、Particle Size）は今回の実装対象として扱う。粒子ライフサイクル、既存レンジ、Stretch 16、Ribbon Width 1..5pxの変更は引き続きレビュー待ちとする。
