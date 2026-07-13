---
id: SPEC-012
title: Unified Effect Stack V2
status: implemented
owners: [maintainer]
created: 2026-07-10
updated: 2026-07-13
depends_on: [SPEC-001, SPEC-003, SPEC-009, SPEC-011]
related_adrs: [ADR-0005]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/lib/effectPipeline.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/components/PostprocessStackPanel.tsx, src/components/PostprocessPanel.tsx, src/components/PresetPanel.tsx]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts, src/store/gradientStore.effectPipeline.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/lib/glass.test.ts, src/lib/postprocessAnimation.test.ts]
human_review: completed
---

# SPEC-012: Unified Effect Stack V2

## 背景・問題

SPEC-011のPostprocess Stackは画像系6種類だけを順序化しており、Diffuse、Noise、Slit、Stretch、手描きDistortは別経路で描画される。このため、素材処理と画像変形を任意の順序で組み合わせられない。

## ゴール・成功条件

- Noise、Slit、Stretch、Distort、Mirror、Kaleidoscope、Voronoi、Glass、Diffuseを各1つ、任意順で描画でき、Diffuseは既定で最後尾に配置される。
- Surface (Normal/Matcap)、Prism、Particlesは主スタック外の固定順で描画できる。
- 新規プリセットはV2、旧プリセットはLegacy v1の順序を維持して読込める。
- Radon/Iridescenceを製品から削除し、旧プリセットでは無効化して安全に読込める。

## スコープ

### 対象

- V2エフェクトパイプラインの状態、プリセット形式、正規化、UI、WebGL描画、タイル出力
- 9種類の順序可変スタック、カテゴリ表示、選択中効果の詳細編集
- Normal/Matcap、Prism、Particlesの固定順と時間アニメーション判定
- Radon/Iridescenceの状態、UI、描画、アニメーション、保存からの削除

### 対象外

- 同種エフェクトの複数インスタンス
- Prism、Particles、Normal、Matcapの主スタック内での順序変更
- 旧プリセットで有効なRadon/Iridescenceの見た目維持

## 方針

`EffectPipelineConfig`を永続状態へ追加する。`version`は`legacy-v1`または`stack-v2`、`effectStack`は9種類の順序可変レイヤーの一意なレコード、`selectedKind`は詳細編集対象、Prism/Particlesは個別の有効状態を持つ。Diffuseは既定順で最後尾に置く。V2の有効状態はレイヤーだけを一次情報とし、既存詳細設定の重複した`enabled`はLegacy互換専用とする。

V2はベース画像を生成した後、主スタックの各層を入力textureから出力textureへ順に描画する。PrismとParticlesは主スタック外の固定段として描画し、Diffuseは主スタック内の指定位置で一度だけ適用する。既定順ではDiffuseが最後尾となる。Glassは主スタックに含み、`glassNoiseInfluence`は主スタックのNoiseの有効状態・位置に依存しないGlass専用入力として残す。NormalはDiffuseの有効状態に依存しない。

新規V2の並べ替え可能な既定順は`Noise -> Slit -> Stretch -> Distort -> Mirror -> Kaleidoscope -> Voronoi -> Glass`、初期有効効果は固定最終段のDiffuseだけとする。V2のDiffuseは既存`DiffuseConfig`とDiffuseパネルのアルゴリズムを唯一の設定・描画源とし、旧Postprocess Diffuseは使わない。規則的な格子が目立たないよう、Diffuseの乱数場は決定的かつタイル連続な低周波ワープを加える。Distortは既存の生成側`ManualDistortConfig`を使う。

V2のNoiseとSlitは、Legacyのgradientシェーダーと同じ座標変換アルゴリズム、各モード、シード、アニメーション、pixel perfect、Slit個別幅補正をtexture-to-textureパスへ移植する。簡略化したV2専用Noise/Slit計算は使用しない。スタック順序がNoiseとSlitの前後関係を決めるため、V2では`noiseAfterSlit`を描画順序の代替には使わない。

Noise、Slit、Distort、Mirror、Kaleidoscope、Voronoi、固定Diffuse、最終copyは軽量stack coreシェーダーで描画し、巨大な統合シェーダーへ依存しない。Distortは変位map sampling、KaleidoscopeはUV変換、Voronoiはセル生成とRamp samplingだけをcoreへ含め、GlassやPrismの関数を参照しない。

GlassとPrismは互いに独立した遅延コンパイルprogramへ分割し、有効になった種類だけをコンパイルする。全Postprocess関数を含む統合シェーダーはV2では使用しない。遅延コンパイル中または失敗時は直前の有効なフレームを維持し、GPU初期化完了後に対象効果を適用する。コンパイル要求、完了、失敗にはprogram名、ソース長、所要時間、並列コンパイル可否を診断ログとして残す。

タイル出力のガターは、Surface、主スタック、Prismの有効効果が参照する最大距離を安全側に合算して決める。V2では画像グラデーションを含むベース出力全体へ主スタックを適用する。

## エラー・境界条件

- V2スタックが欠落、重複、未知kindを含む場合は、既定順の9レイヤーへ正規化する。
- V1プリセットは`legacy-v1`として読込み、Radon/Iridescenceの値だけを無視する。
- V2プリセットのRadon/Iridescenceや旧専用フィールドは無視し、以後の保存には含めない。
- 有効な順序可変レイヤーが0件でもSurface、Prism、Diffuse、Particlesは各自の有効状態に従って描画する。
- Diffuseだけが有効で中間段がない場合は、統合シェーダーやFBOの準備を待たず、同じDiffuse設定で直接描画する。
- Main Stackの初回有効化時は、軽量stack coreシェーダーの準備中もDiffuseを含むベース表示を維持する。
- 各遅延programのコンパイル中または失敗時は、未完成programで描画せず直前の有効な表示を維持する。
- WebGL context loss、shader compile/link失敗、FBO不完全を診断ログで区別できる。
- NormalとPrismが無効なMain Stackはcore FBO 3枚だけを確保し、不要な全FBOを一括確保しない。

## 受け入れ条件

- AC-001: 9種類を1本のEffect Stackで表示して任意順へドラッグでき、Diffuseは既定で有効・最後尾に配置される。
- AC-002: V2では各レイヤーのON/OFFだけが主スタックへの適用を決める。
- AC-003: V2は`Base -> Surface -> Main Stack -> Prism -> Particles`で描画し、DiffuseはMain Stackの指定位置で適用する。
- AC-004: Normal/MatcapはDiffuseのON/OFFに関係なくSurface段で動作する。
- AC-005: 新規プリセットはV2の順序、ON/OFF、選択中レイヤー、Prism/Particles状態を保存・再読込できる。
- AC-006: 旧プリセットはLegacy順で読込め、Radon/Iridescenceだけを無効化する。
- AC-007: Glassを含む任意順のV2スタックはタイル出力で必要なガターを確保する。
- AC-008: Radon/IridescenceのUI、状態、描画、アニメーション、保存対象が残らない。
- AC-009: V2のNoiseとSlitは、同じ設定と入力に対してLegacyと同じ座標変換結果になる。
- AC-010: V2のDiffuseはDiffuseパネル設定だけを使い、規則的な格子を目立たせず、Main Stackの指定位置に1回だけ適用される。
- AC-011: 初期Diffuse-only状態とMain Stack初回有効化時は、軽量stack coreシェーダーの準備中も表示を維持してGPU初期化後に白画面へ遷移せず、Noise、Slit、Distort、Mirror、Kaleidoscope、Voronoi、Diffuse、copyだけではGlass/Prism programを要求せず、NormalとPrismが無効ならcore FBOだけを確保する。
- AC-012: GlassとPrismは別々のprogramとして必要時だけコンパイルされ、一方の有効化が他方のコンパイルを要求しない。
- AC-013: shader compile/link失敗、WebGL context loss、FBO不完全をログから識別でき、失敗時も白画面へ遷移せず直前の有効な表示を維持する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-005, AC-006 | 正規化・プリセット互換テスト | `effectPipeline.test.ts`, `gradientStore.effectPipeline.test.ts` |
| AC-003, AC-004 | 描画順序の手動確認 | WebGLプレビュー、書き出し |
| AC-007 | ガター計算テストとタイル書き出し | `glass.test.ts`、手動確認 |
| AC-008 | 検索、プリセット読込、ビルド | UI、型、シェーダー |
| AC-009 | シェーダー互換テストとLegacy/V2の同一設定比較 | `effectShaderParity.test.ts`、Noise各type、Slit各mode、pixel perfect、個別幅補正、アニメーション |
| AC-010 | 固定順・設定源・Dither互換テストと描画比較 | `effectPipeline.test.ts`、`gradientStore.effectPipeline.test.ts`、`effectShaderParity.test.ts`、Diffuse各mode、Prism併用、タイル書き出し |
| AC-011 | 直接描画・FBO allocation mode・core/Glass/Prism program境界のテストと、GPU初期化後の表示確認 | `effectPipeline.test.ts`、`effectShaderParity.test.ts`、WebGLプレビューの手動確認 |
| AC-012 | program要求分類テスト、Glass/Prism個別コンパイル、実WebGL描画 | `effectPipeline.test.ts`、WebGLプレビュー |
| AC-013 | compile/link/FBO/context lossの診断テスト、失敗注入時の表示維持確認 | WebGLテスト、WebGLプレビュー |

## 既知の制約

- 各エフェクトを初めて有効にしたときは、対応するGLSL programの遅延コンパイルにより反映まで短い待ち時間が発生する。待機中は直前の有効なフレームを維持し、フリーズや白画面へ遷移しないことを優先する。コンパイル時間の短縮と事前準備方法は後続課題として扱う。

## 移行・互換性

`effectPipeline`を持たないプリセットはLegacy v1として扱う。Radon/Iridescenceが含まれる場合は読込時に無効化し、利用者へ見た目の差分を通知する。新規保存はV2形式を使い、削除済みフィールドを保存しない。

## 未決定事項

なし。
