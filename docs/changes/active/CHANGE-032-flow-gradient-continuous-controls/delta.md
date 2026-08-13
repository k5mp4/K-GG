---
id: CHANGE-032
status: draft
---

# Delta

CHANGE-030で承認されたFlow Gradient Phase Aへ、粒子ライフサイクルと操作範囲の変更を追加する候補である。承認前はcurrent specへ統合しない。

## ADDED Requirements

### FLOW-CONT-001 persistent particle advection

FlowはSeedから一度生成した決定的な3D粒子群を通常再生中に保持し、粒子ごとの寿命満了、周期的なspawn phase、個別の再spawnを使わず、3D Curl力場に対する固定ステップ移流で位置を更新する。画面外へ出た粒子の扱いは、粒子を消滅・再生成するのではなく、力場と境界処理の設計で定義する。

### FLOW-CONT-002 deterministic session reconstruction

再生開始、Restart、Seek、Preview再開、Thumbnail、静止画、連番、動画Exportでは、render session単位で固定粒子群と移流ステップをreset/prewarmする。同じSeed、設定、論理時刻、入力解像度、描画順から同じDensity、Trail、Ramp色を再現し、通常再生の粒子寿命を導入しない。

### FLOW-CONT-003 full-frame stretch response

Stretch 0–16は全画面投影基準を共有し、最大値付近で流線が画面中央の局所領域だけに収束せず、キャンバスの大部分へ連続したDensity Fieldを形成する。低密度の外周は透明度を保ち、単色背景や粒状スプライトへ戻らない。

### UI-CONT-001 fine Flow controls

Flow Gradientの共通parameterLimitsとUIを次の範囲へ変更する。

| Control | Range | Step |
| --- | --- | --- |
| Curl Scale | 0.01–3.00 | 0.01 |
| Curl Strength | 0–2.00 | 0.01 |
| Ribbon Width | 1–5px | 0.01px |
| Stretch | 0–16 | 0.01 |

Speed、Density、Trail、Contrast、Seed、Particle Count、既存Animation Loopの契約は変更しない。

### FLOW-CONT-004 assigned Ramp visibility

Flow Compositeは現在のGradient RampをDensityの色割り当てとして参照し、低・中密度域ではRamp色を保持する。高密度の重なりだけが単色パーティクル応答を白へ飽和させる。Ramp変更はPreviewとExportの両方へ同じテクスチャ入力で反映する。

### UI-CONT-002 particle compositing controls

Flow Gradientは次の3つの合成操作を追加する。`Flow Opacity`（0–1、0.01刻み、既定1.00）は最終Compositeの不透明度、`Particle Opacity`（0–1、0.01刻み、既定0.82）は各粒子splatのDensity寄与、`Particle Size`（0.25–2.00、0.01刻み、既定1.00）は投影後Ribbonの長さと断面幅を制御する。Particle Countを増減しても、これらはDensity（重なりの集約量）とは独立に調整できる。

## MODIFIED Requirements

### FLOW-002 deterministic velocity-oriented density

変更前は粒子ごとの`age`、`pathSample`、周期phaseを使って3Dエミッタからの移流位置を評価する。変更後は、初期球面方向から生成した固定粒子群をrender sessionへ保持し、時間経過はCurl速度場による位置更新だけへ使う。3D投影、速度方向splat、GPU Density加算、Gradient Ramp mapping、Tileの全画面基準は維持する。

### FLOW-012 playback loop continuity

既存AnimationのLoopとDurationは維持する。ただしLoop境界で粒子を寿命リセット・再spawnするのではなく、Loopの論理位相に対応する決定的なsession再構成またはprewarmを行い、通常再生中の粒子群の連続性と、再生を再開したときの再現性を両立する。

### UI-021 Flow controls

Curl Scale、Ribbon Width、Stretchの範囲・刻みをUI-CONT-001へ変更する。Curl Strengthは0–2、0.01刻みのまま維持する。UI-CONT-002のFlow Opacity、Particle Opacity、Particle Sizeを同じ共通normalizerとPreset保存経路へ追加する。

## REMOVED Requirements

なし。既存のGradient Ramp、GPU Density、3D透視投影、Temporal Trailの要件は保持する。
