---
type: change
id: CHANGE-030
title: SANDBOX Flow Gradient Phase A
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-13
updated: 2026-09-03
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET, CURRENT-VIDEO-EXPORT, CURRENT-GRADIENT]
related_adrs: [ADR-0004, ADR-0005, ADR-0008, ADR-0009, ADR-0010]
related_code: [src/components/SandboxPanel.tsx, src/components/FlowGradientPanel.tsx, src/lib/renderSceneAtTime.ts, src/lib/sceneEvaluation.ts, src/lib/renderBridge.ts, src/lib/tileRender.ts, src/lib/flowSimulation.ts, src/lib/flowGradientRenderer.ts, src/lib/effectPipeline.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/store/gradientStore.ts, src/types/distortion.ts, src/types/flowGradient.ts, src/lib/parameterLimits.ts, src/shaders/flow-splat.vert.glsl, src/shaders/flow-splat.frag.glsl, src/shaders/flow-trail.frag.glsl, src/shaders/flow-gradient.frag.glsl]
related_tests: [src/lib/animation.test.ts, src/lib/flowSimulation.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/sceneEvaluation.test.ts, src/lib/renderBridge.test.ts, src/lib/presetModel.test.ts, src/lib/effectPipeline.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglShaderSources.test.ts]
human_review: completed
outcome: follow-up
migration: historical
follow_up: "issue-needed: Flowの全出力経路、逆方向Seek、長時間GPUライフサイクルを確認する"
---

# CHANGE-030 SANDBOX Flow Gradient Phase A

## 背景・問題

現在のSANDBOXには、粒子を個別のスプライトとして描画するParticlesモジュールはあるが、粒子の移流を連続した密度場へ変換し、速度方向を持つリボン状の流れとしてGradient Rampに渡すモジュールはない。

そのため、Curl Noiseで動く粒子の軌跡を、近傍接続やCPU側の粒子探索に依存せず、低解像度のGPUバッファへ蓄積するFlow Gradientを追加する。まずは実装可能性と既存描画契約への適合を確認しやすいPhase Aとして、時間方向のTrailだけを採用する。

追加要求として、粒子を画面上の2Dレーンへ直接配置するのではなく、3D空間の共通エミッタ一点から放射する。各粒子を周期的な3D Curl Noise場へ固定ステップで移流し、深度を持つ透視投影後にDensityへ蓄積することで、奥行きの異なる流線が不規則に重なり、布・リボンのような有機的なグラデーションを構成できるようにする。

## 変更理由

- Curl Noise由来の速度方向と粒子の移流を、連続した密度場として扱えるようにする。
- 既存のGradient Rampを色付けに再利用し、色ロジックを新しいFlow専用シェーダーへ重複させない。
- Preview、Thumbnail、静止画、連番、動画で同じ入力から同じフレームを再現できるようにする。
- 既存のMain Stack、Prism、Particles、Glass、Seamless Tilingの契約を維持したままSANDBOXへ追加する。
- 3Dの放射方向、Curl場の積分、透視投影、密度の加算・スクリーン相当の飽和を同じ決定的な評価経路へまとめ、粒状のスプライトではなく連続したFlow Fieldとして表示する。
- 再生時は既存AnimationのLoopとDurationへ同期し、Flowの粒子位相とTrailをループ境界で連続させる。終端フレームを重複出力せず、再生を停止せずに先頭位相へ戻る。

## ゴール・成功条件

次の受け入れ条件を満たした時点でPhase Aの実装完了とする。

- AC-001: SANDBOXでFlow Gradientを選択でき、既存モジュールと同じ固定ステージとして有効化・無効化できる。
- AC-002: Flow Gradientは、Curl Noiseで移流された粒子サンプルを速度方向付きの密度へGPU上で蓄積し、直線の隣接線分やCPU側の近傍探索を使わずに連続したRibbon状の見た目を生成する。
- AC-003: Particle Count、Curl Scale、Curl Strength、Speed、Ribbon Width、Stretch、Densityの変更が、対応する形状または密度の変化として観測できる。
- AC-004: 密度のスカラー値を既存Gradient Rampで色へ変換し、Flow専用の固定色を最終色として使用しない。
- AC-005: Phase AではPing-Pong Temporal Trailだけを実装し、Trailで残像の長さを制御できる。Directional Diffusionは実装・公開しない。
- AC-006: Seed、正規化時刻、設定、描画順が同じなら、Previewと書き出しを含む同じ論理フレームが同じFlow結果になる。
- AC-007: Loopが有効な場合、ループ境界で粒子の位相とTrailの初期状態が不連続にならず、Loop Durationは既存Animation設定を利用する。
- AC-008: Seek、再生再開、設定変更、解像度変更、Thumbnail生成、Export開始時にFlowの履歴が適切にリセットまたは事前ウォームされ、過去の状態が次のセッションへ漏れない。
- AC-009: 連番・動画書き出しでは、1論理フレームにつきFlowの状態を一度だけ進める。同じフレームを複数タイルで描画してもTrailが余分に進まず、終端フレームを重複出力しない。
- AC-010: Flow Gradientを無効にした場合の既存描画結果と、Particles、Prism、Glass、Glass V2、Seamless Tilingの既存経路に回帰がない。
- AC-011: Flow用のFBO、Texture、Program、VAO、Bufferは再利用され、リサイズ・Context Lost/Restored・能力不足時にリークや黒画面を起こさない。FP16の利用可否に応じてRGBA8へ安全にフォールバックする。
- AC-012: 自動テスト、docs:check、docs:build、lint、buildと、受け入れ条件を確認する再現可能な手動確認が完了している。
- AC-013: 粒子は共通の3Dエミッタ原点から決定的な球面方向へ放射され、周期的な3D Curl Noise場を固定ステップで積分する。2Dレーンの配置だけでRibbonを構成してはならない。
- AC-014: 3D位置は固定カメラの透視投影で画面へ変換し、深度に応じて画面上の位置、splatの大きさ、寄与を変化させる。カメラ前方のクリップ、near/far範囲、タイル描画時の投影基準は決定的でなければならない。
- AC-015: 投影後のDensityは粒子ごとの最終スプライト色へ直接変換せず、加算蓄積とスクリーン相当の飽和応答で重なりをスカラー場へ変換する。重なりの多い領域ほど濃くなり、個別粒子の点や短線、平坦な背景Gradientが主表示として残らない滑らかなFlow Fieldを生成する。
- AC-016: 3Dエミッタ、Curl積分、投影、密度合成はPreview、Thumbnail、静止画、連番、動画、Tile Renderで同じ論理フレーム規則を共有し、カメラ投影または深度順の違いによるフレーム差・タイル境界差を生じさせない。
- AC-017: Animationの再生が有効で既存Loopが有効な場合、Flowは既存Durationの`normalizedTime`を`0..1`で周期化して再生し、終端フレームを重複せずに先頭へ戻る。Loop境界で粒子位相、3D Curl場、投影、Trailに視認できるジャンプや停止が発生しない。
- AC-018: 再生開始・再開・Restart・Seek後は、Flowの状態を現在の位相へ決定的にreset/prewarmする。Loop無効時は既存Animationの非ループ挙動へ従い、Flow専用のLoop Durationや別時計は追加しない。

## 対象

- SANDBOXモジュールとしてのFlow GradientのUI、設定、プリセット保存・復元。
- Flow用の決定的なGPUシミュレーション、密度生成、Temporal Trail、Gradient Mapping、合成。
- 3Dエミッタからの放射、3D Curl Noiseの固定ステップ積分、固定カメラによる透視投影、深度に応じたsplat寄与。
- 投影後のDensityを加算蓄積し、スクリーン相当の飽和応答と既存Gradient Rampで有機的なFlow Fieldへ変換する経路。
- 既存の固定ステージ順を維持した上での描画計画への組み込み。
- Preview、Seek、Thumbnail、静止画、連番、動画、Tile Renderにおける状態ライフサイクル。
- Animation再生中の周期位相、Loop境界のTrail再構成、Restart・再開・Seek時のFlow状態同期。
- WebGLリソースの再利用、リサイズ、Context Lost/Restored、RGBA8フォールバック。
- 関連するcurrent spec、テスト、validation記録の同期。

## 対象外

- Directional Diffusion、異方性拡散、速度場に沿った追加の拡散処理。これはPhase B候補とする。
- Flow GradientをMain Stackの自由な並べ替え可能レイヤーにすること。
- 粒子間の最近傍探索、CPU側の全粒子座標スキャン、隣接線分の生成。
- 既存Particlesモジュールの置き換え、設定名の変更、既存プリセットの挙動変更。
- Flow専用のLoop Durationや新しいアニメーション時刻体系の追加。
- Tauri/Rust、FFmpeg、外部ファイル形式、エクスポートAPIの新設。
- FP16を必須にすること。対応環境では利用してよいが、RGBA8フォールバックを必須とする。
- ユーザーがカメラ、エミッタ原点、視野角、near/far、深度ブレンドを個別に編集するUIを追加すること。3D投影の基準は本変更では固定・決定的にする。
- 3DのRibbonメッシュ、CPU側の軌跡保持、粒子間の深度ソート、物理ベースの体積レンダリングを導入すること。Flowは投影後のGPU密度場として描画する。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack): 固定ステージ列へFlow Gradientを追加し、既存Particlesを最終オーバーレイとして維持する。
- [UI Controls](../../../specs/current/ui-controls): SANDBOXのモジュール一覧とFlow固有コントロールを追加する。
- [Preset System](../../../specs/current/preset-system): Flow設定の保存、旧プリセットの正規化、Thumbnail時の初期化を追加する。
- [Video Export](../../../specs/current/video-export): ステートフルなFlowを論理フレーム単位で評価し、PreviewとExportの結果を揃える。
- [Gradient System](../../../specs/current/gradient-system): 既存Gradient RampをFlowのスカラー密度に適用する。

## 関連ADR

- ADR-0004、ADR-0005のMain Stackと固定ステージの境界を維持する。FlowをMain Stackへ移動するためのADR変更は本変更に含めない。
- ADR-0008のThumbnail用独立WebGLコンテキストで、Flowのreset/prewarmを実行する。
- ADR-0009のparameterLimitsと共通normalizerをFlow設定にも適用する。
- ADR-0010のImage Gradient Sourceと形状保持経路を壊さず、Flowは既存のGradient Rampへスカラー値を供給する。

## 主なリスク

- TrailがPreview、Transition、Tile、Exportで複数回進み、結果がフレーム依存になるリスク。
- 低解像度FBOの精度やRGBA8フォールバックにより、細いRibbonや長いTrailが破綻するリスク。
- Context Lost/Restored後にFlowだけが古いTextureやFBOを参照するリスク。
- 既存Particlesとの合成順、ブレンド状態、Gradient Ramp用Textureの状態を汚染するリスク。
- Export開始時のprewarmコストが大きく、初回フレームの待ち時間が増えるリスク。
- 3D Curl積分と透視投影により、奥行きの変化が強すぎると流線が画面外へ消える、または近接粒子が密度飽和するリスク。
- Tile Renderで画面全体基準の投影を維持できないと、タイルごとに粒子位置・深度・splatサイズが変わり、継ぎ目が発生するリスク。
- 再生の終端で保持中のTrailをそのまま先頭へ持ち越すと、位相は周期でも密度履歴だけが不連続になり、ループ境界にフラッシュや濁りが発生するリスク。

## 決定事項

- 表示名はFlow Gradient、内部キーはflowGradientとする。Ribbon Flowは説明上の呼称に留める。
- 描画順は Base → Surface → Main Stack → Prism → Flow Gradient → Particles とし、既存Particlesを最終オーバーレイのままにする。
- Flowの有効フラグはEffect PipelineのflowGradientEnabledを正とし、Flow固有パラメータは独立したFlowGradientConfigへ分離する。
- LoopとLoop Durationは既存Animation設定を参照し、Flow設定に重複フィールドを持たせない。
- 粒子の共通エミッタ原点、球面放射、3D Curl Noise積分、固定カメラ投影は内部の決定的な描画契約とし、新しいユーザー設定として保存しない。
- Densityは投影後の画面空間で加算し、Trailとスクリーン相当の飽和応答で0から1のスカラーへ再構成する。最終色は引き続き既存Gradient Rampから取得し、Flow専用色や元画像RGBの加算を行わない。
- 再生中のFlowは既存Animationの`previewLoop`、`duration`、`fps`、normalized timeを正とする。Loop境界の先頭フレームは、終端フレームを重複出力せず、必要な決定的prewarmを済ませてから表示する。
- Phase AのUIにはDiffusionを設けない。Phase BでDirectional Diffusionを採用する場合は別CHANGEとして再レビューする。

## レビューゲート

3Dエミッタ、透視投影、深度、再生ループを含む追加要求は、同じPhase Aの目的・対象内へ追記し、人間承認を経て実装した。proposal、delta、design、tasksは`status: approved`、`human_review: completed`であり、実装結果と残る未確認事項はvalidationへ記録する。

## Finalization

- Finalized: 2026-09-03
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Flowの全出力経路、逆方向Seek、長時間GPUライフサイクルを確認する
