---
id: SPEC-034
title: Noise DistortionへのCaustics追加
status: implemented
owners: [maintainer]
created: 2026-07-25
updated: 2026-07-25
depends_on: [SPEC-001, SPEC-013, SPEC-014, SPEC-020, SPEC-029]
related_adrs: [ADR-0005, ADR-0009]
related_code: [docs/index.md, src/types/distortion.ts, src/store/gradientStore.ts, src/components/NoiseDistortionPanel.tsx, src/components/PresetPanel.tsx, src/lib/history.ts, src/lib/presetThumbnail.ts, src/lib/sceneEvaluation.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/gpuDiagnostics.ts, src/lib/parameterLimits.ts, src/shaders/noise.glsl, src/shaders/gradient.frag.glsl, src/shaders/postprocess/stack.glsl, src/shaders/postprocess/noise-main.glsl]
related_tests: [src/store/gradientStore.effectPipeline.test.ts, src/lib/sceneEvaluation.glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts, src/lib/parameterLimits.test.ts]
human_review: completed
---

# SPEC-034: Noise DistortionへのCaustics追加

## 背景・問題

Noise Distortionには複数の手続きノイズがあるが、水面の集光線に似た網目状のUV歪みを選択できない。独立した水面レンダラーや加算光ではなく、既存Noiseと同じ生成パスおよびUnified Effect Stack V2のNoise専用パスへベクトル変位場を追加する。

## ゴール・成功条件

- Noise Typeに`caustics`を追加し、既存Noiseの番号と保存形式を維持する。
- 周期的な複数正弦波の高さ場、その解析勾配・ヘッセ行列、安定化したヤコビアン集光度からUV変位ベクトルを生成する。
- Amount 0では恒等変換になり、Refractionは常に1、同じSeedと時刻では決定論的な結果になる。
- Legacy generatorとV2 noiseStackで同じCausticsアルゴリズムを使い、グローバルタイル座標、既存の時間・ループ処理、Pause/Speed 0を維持する。
- 旧保存データはCaustics固有値を既定値で補完し、Reset、プリセット、Undo/Redoを壊さない。

## スコープ

### 対象

- `NoiseDistortionConfig`、既定値、Noise Type UI、共有parameter limits、GPU tier最適化。
- `causticsDepth`、固定値1の`causticsRefraction`、`causticsSharpness`、`causticsComplexity`、`causticsWaveSpread`、`causticsBoundaryWidth`のuniform送信。
- `noise.glsl`の解析的高さ場・勾配・ヘッセ行列・ヤコビアン変位とLegacy/V2への統合。
- Shader source契約、旧設定補完、有限値・境界値テストおよび手動視覚確認手順。

### 対象外

- 独立Canvas、3D水面、追加FBO、フォトンスプラッティング、加算発光。
- 既存Noise Typeの番号、出力、時間処理、UIデザインの変更。
- 新規依存パッケージや専用品質モード。

## 方針

8成分以下の固定上限ループで、方向・周波数・位相・速度・振幅の異なる正弦波を合成する。整数ベースの波数ベクトルを使い、`octaves`と`causticsComplexity`で評価数とマルチスケール量を制限する。各波の解析微分を同じループで合成し、`J = I + depth * H`の行列式を有限範囲へクランプする。集光度を境界からの距離に相当する場へ変換し、Boundary Widthで境界周辺の広がりを制御する。勾配方向と接線方向を混ぜたベクトルへRefractionとDepthを適用する。最終Amountは既存Noise共通経路で一度だけ乗算する。

Legacy generatorとV2 noiseStackは共有`noise.glsl`を利用する。V2では`globalUv`から座標を作り、追加タイマーや追加リソースは導入しない。既存のloop blendを使って終端のジャンプを抑え、Caustics未選択時にはCPU側で特別な処理を行わない。

## エラー・境界条件

- 欠損したCaustics設定は`STORE_DEFAULTS.noiseDistortion`から補完する。
- Depth、Boundary Width、Sharpness、Wave Spread、Complexityは共有normalizer、GLSL clamp、GPU tier上限で有限範囲にし、Refractionは1に固定する。
- 負のScale、非有限値、極端なヤコビアン、ゼロ長勾配、小さい微分値では有限値の恒等またはゼロ変位へ退避する。
- タイル描画では`u_fullResolution`と`u_tileOffset`から得たグローバルUVだけを使い、タイルごとに位相や微分幅を変更しない。

## 受け入れ条件

- AC-001: Noise Type一覧から`Caustics`を選択でき、内部値は`caustics`である。
- AC-002: Caustics専用UIにDepth、Boundary Width、Sharpness、Complexity、Wave Spreadと既存共通UIが表示され、Refractionは1に固定される。
- AC-003: Legacy generatorとV2 noiseStackにCausticsのuniform、関数、整数番号9が存在し、既存番号は変わらない。
- AC-004: Amountが0のとき変位は恒等、Refractionは常に1、DepthまたはBoundary Widthを増加すると影響範囲が増え、同一Seed・時刻で結果が再現する。
- AC-005: 複数波の解析勾配・ヘッセ行列と安定化ヤコビアンから、単純なVoronoi境界や単一方向スクロールではない網目状変位を生成する。
- AC-006: Pause、Evolution、Speed 0、既存Loop Mode、タイルグローバル座標が既存時間評価と整合する。
- AC-007: 旧プリセット読込、Reset、Undo/Redo、JSON入出力でCaustics項目の欠損が安全に補完される。
- AC-008: 低性能GPUではComplexity/Octaves/Sharpnessを既存方式に沿って一時的に制限し、既存Noiseの最適化結果は変えない。
- AC-009: docs、テスト、lint、typecheck、buildが成功する。実WebGLの網目表示と代表的なタイル出力は手動確認する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-007 | Store/UIのunit test、旧設定補完、手動Reset確認 | `gradientStore.effectPipeline.test.ts`, `NoiseDistortionPanel.tsx` |
| AC-003, AC-005 | Shader source契約、Legacy/V2 parity、GLSL compile | `webglShaderSources.test.ts`, `effectShaderParity.test.ts`, WebGLプレビュー |
| AC-004, AC-008 | パラメータnormalizer、GPU tier制限、境界値テスト | `parameterLimits.test.ts`, `gradientStore.effectPipeline.test.ts` |
| AC-006, AC-009 | 既存検証コマンド、プレビュー、タイル書き出し | `npm run docs:check`, `npm run docs:build`, `npm test`, `npm run lint`, `npm run build` |

## 移行・互換性

保存形式へNoise Typeと6つの数値項目を追加する。旧プリセットに項目がない場合は現在のStoreの既定値を使い、既存Noise Typeの整数番号は変更しない。独立エフェクトや追加リソースは導入しないため、Noiseを含まないBootstrap/軽量shaderの契約は維持する。

## 未決定事項

なし。
