---
id: SPEC-035
title: Noise DistortionへのPhasor Lines追加
status: implemented
owners: [maintainer]
created: 2026-07-25
updated: 2026-07-25
depends_on: [SPEC-001, SPEC-013, SPEC-014, SPEC-020, SPEC-029]
related_adrs: [ADR-0005, ADR-0009]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/components/NoiseDistortionPanel.tsx, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/gpuDiagnostics.ts, src/lib/parameterLimits.ts, src/shaders/noise.glsl, src/shaders/gradient.frag.glsl, src/shaders/postprocess/stack.glsl]
related_tests: [src/store/gradientStore.effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts, src/lib/parameterLimits.test.ts]
human_review: completed
---

# SPEC-035: Noise DistortionへのPhasor Lines追加

## 背景・問題

Noise Distortionへ、局所的な方向・周波数・位相を持つ疎な波成分を合成し、連続した線状構造と線に沿ったUV変位を作るNoise Typeが必要である。輝度テクスチャや単一正弦波を追加するのではなく、Legacy GeneratorとUnified Effect Stack V2のNoise専用パスで同じ2Dベクトル場を評価する。

## ゴール・成功条件

- Noise Typeに`phasor`を追加し、UI表示名を`Phasor Lines`とする。既存Noiseの整数番号は変更せず末尾へ追加する。
- 3×3近傍の決定論的カーネルを複素ベクトルとして合成し、安定化した位相勾配から法線/接線を混合したUV変位を生成する。
- Directional、Radial、Swirlの方向モード、Frequency、Bandwidth、Direction Spread、Sharpness、Warp Strength、Tangent Mix、Kernel Densityを制御できる。
- Amount 0またはWarp Strength 0では恒等変換になり、同一Seed・時刻・設定では決定論的な有限値を返す。
- 既存のEvolution、Speed、Pause、Loop、グローバルタイル座標、OctavesとGPU tier最適化を共有する。
- 旧保存データ、プリセット、Reset、Undo/Redo、JSON入出力を壊さず、不足値を既定値で補完する。

## スコープ

### 対象

- `NoiseDistortionConfig`、Store既定値・タイプ別既定値・保存値の正規化、Noise UI、共有parameter limits、GPU tier最適化。
- Noise Type整数マッピング、Legacy Generator/V2 Noise専用Stackのuniform送信とshader source parity。
- `noise.glsl`の3×3セル評価、複素Phasor場、位相・振幅・解析勾配、アンチエイリアス線マスク、方向モード、UV変位。
- 決定論、境界値、uniform重複、Bootstrap/Lazy compile、タイル座標の契約テスト。

### 対象外

- 独立Canvas、追加FBO、CPUでの毎フレームNoise画像生成、外部テクスチャ、Three.js/WebGPU。
- 既存Noiseの番号・描画結果・アニメーション方式の変更、独立タイマー、既存UI全体の再設計。

## 方針

セル座標とSeedから各カーネルの位置、方向、周波数、位相を決定し、現在セルと8近傍だけを固定上限で評価する。局所ガウス重みを複素数`vec2(real, imaginary)`へ掛けて合成し、合成複素場とその空間微分から`atan2`相当の位相勾配を求める。振幅が小さい場合は勾配・方向を安全なゼロへ退避する。位相勾配を線の法線、90度回転を接線として混合し、`cos(phase * harmonics)`由来の解像度ベースの解析的アンチエイリアスラインマスクで局所変位を作る。

Directionalは基本角度とSpread、Radialは画面中心からの放射方向、Swirlはその接線方向をカーネル方向に使う。Kernel Densityは評価重みと有効カーネル数を制限し、Octavesはセルサイズ、内部周波数、位相、振幅を変えながら高周波を減衰させる。`u_fullResolution`とグローバルUVを使い、タイルローカルなSeed/位相を生成しない。

時間は既存の`u_time`、`u_noiseEvolution`、`u_noiseSpeed`、`loopPhase`/`loopBlendWeight`を使い、カーネル位置を固定して位相・方向をゆっくり変化させる。LegacyとV2は同じ`noiseDisplace`経路を共有する。

## エラー・境界条件

- 欠損値、非有限値、負のScale、0に近い振幅・勾配、Sharpness/周波数の過大値はStore、CPU uniform境界、GLSLで有限範囲へ正規化する。
- Direction Modeが未知の場合はDirectionalへフォールバックする。Radial/Swirlの中心近傍では安全な方向を使う。
- 動的ループ上限は3×3近傍、最大4オクターブ、最大9カーネルへ固定する。低性能GPUではOctaves、Kernel Density、Spreadを一時的に制限する。
- 線マスクと変位は最大値を設け、単一方向への平行移動や位相ラップ境界の破裂を避ける。
- 共通`noise.glsl`のPhasor補助関数は後段で宣言されるnoise uniformへ直接依存せず、Octavesを引数で受け取ることでLegacy/V2の生成順に依存しない。

## 受け入れ条件

- AC-001: Noise Type一覧に`Phasor Lines`が表示され、内部値が`phasor`である。
- AC-002: Phasor選択時に専用UIと共通UIが表示され、設定値が保存・Reset・Undo/Redo・旧データ補完で復元される。
- AC-003: Type番号、uniform、Phasor関数がTypeScript、Legacy Generator、V2 Noise Stackで一致し、Bootstrap/Glass/Prismの不要なcompile契約を壊さず、V2 Noise Stackで後段uniformの未宣言参照を発生させない。
- AC-004: 3×3決定論的カーネルの複素合成と位相勾配から、単純な正弦波・fBm・Voronoi・Curlとは異なる連続線と局所的なUV変位が生成される。
- AC-005: Direction、Direction Spread、Frequency、Bandwidth、Sharpness、Warp Strength、Tangent Mix、Kernel Density、Octaves、Seedが変位へ反映される。Amount 0/Warp Strength 0は恒等である。
- AC-006: Evolution、Speed、Pause、Loop終端、通常プレビューと高解像度タイルで空間/時間の連続性を維持する。
- AC-007: `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build`が成功する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-005 | Store/UI、既定値、制限、旧データ補完のunit test | `gradientStore.effectPipeline.test.ts`, `parameterLimits.test.ts` |
| AC-003, AC-004, AC-006 | shader source契約、Legacy/V2 parity、Bootstrap/Lazy compile契約、実WebGLプレビュー | `webglShaderSources.test.ts`, `effectShaderParity.test.ts` |
| AC-007 | docs、unit、lint、build | npm検証コマンド |

## 移行・互換性

保存形式へNoise TypeとPhasor固有値を追加する。旧プリセットに固有値がない場合はStore既定値を使用し、既存Noise Typeの番号・既存shader分岐・Noiseを含まない軽量shaderは変更しない。

## 未決定事項

なし。
