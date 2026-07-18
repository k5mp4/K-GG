---
id: SPEC-018
title: Glass V2光学屈折エフェクト
status: implemented
owners: [maintainer]
created: 2026-07-17
updated: 2026-07-18
depends_on: [SPEC-003, SPEC-012, SPEC-013, SPEC-015]
related_adrs: [ADR-0005]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/lib/postprocessStack.ts, src/lib/glass.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/shaders/postprocess/, src/components/PostprocessPanel.tsx, src/components/PostprocessStackPanel.tsx, src/store/gradientStore.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/postprocessStack.test.ts, src/lib/glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts, src/lib/webglCompilePolicy.test.ts, src/store/gradientStore.glass.test.ts]
human_review: completed
---

# SPEC-018: Glass V2光学屈折エフェクト

## 背景・問題

既存Glassは、リファクタリング後に表面勾配を過度に圧縮したため、既定値付近の
屈折移動量が1px未満になりやすく、効果の反映を視認しにくい。また、既存方式は
リッジ状の高さ場と経験的なRGBオフセットを組み合わせており、滑らかな表面、
波長ごとの屈折、粗い誘電体表面を一つの光学モデルとして説明できない。

## ゴール・成功条件

- 既存Glassの安定性を維持しながら、Refractionの設定値に応じた視認可能な変位を復元する。
- 別レイヤー`Glass V2`として、滑らかな表面法線、RGB別屈折、粗さ、Fresnelハイライトを適用できる。
- プレビュー、プリセット再読込、タイルエクスポートで同じレイヤー順と見た目を維持する。
- GlassとGlass V2を独立にON/OFF、選択、並べ替えできる。
- 専用シェーダーの遅延コンパイル中や失敗時もUIと他のreadyなEffect Stack処理を維持し、キャンバス全体を透明化しない。

## スコープ

### 対象

- 既存Glassの勾配圧縮係数に関する回帰修正
- Glass V2の型、既定スタック、UI、シェーダー分岐、描画パス、ガター計算
- 既存Glassパラメータを共有するGlass V2の光学合成
- 旧プリセットへのGlass V2無効レイヤー補完
- シェーダー契約、パイプライン、プリセット互換、ガターの自動テスト

### 対象外

- 3D形状、深度バッファ、背面形状を使う多重屈折やカースティクス
- スペクトルレンダリング、偏光、吸収係数の波長積分
- GlassとGlass V2に別々のパラメータセットを永続化すること
- WebGPUまたはレイトレーシングへの移行

## 方針

既存Glassは、小さい勾配を一律に8.5%へ縮小していた係数を除き、連続な有理関数で
大きい勾配だけを飽和させる。最終変位は既存どおりRefraction上限以内へ収める。

Glass V2の表面は、PerlinのImproved Noiseに基づくquintic fade
`6t^5 - 15t^4 + 10t^3`を使った勾配ノイズを複数オクターブ合成する。
これにより格子境界まで二階微分が連続する高さ場を作り、中心差分から有限な法線を得る。

光学合成は、正規化した入射ベクトルと表面法線へGLSLの`refract`を適用する。
Chromatic Aberrationを2項のCauchy分散式へ写像し、赤・黄・緑・シアン・青の代表波長ごとに
屈折率と交点方向を求める。5サンプルをRGBへ重み付き合成し、Chromatic Aberrationが0なら
全波長を同じ屈折率へ一致させる。全反射または非有限値では安全な中心サンプルへ戻す。
Roughnessは固定された対称サンプルで透過像を広げ、HighlightはSchlick近似の
Fresnel項と広いspecular lobeで合成する。画面空間の単一層近似であることはUI説明と
利用者向け文書に明記する。

既存Glassも同じCauchy分散と5波長の重み付き合成を使用し、従来の有機的な高さ場と
画面空間変位は維持する。

Glass V2は既存Glassと同じシェーダーモジュール、uniform、パラメータを共有するが、
ドライバーのコンパイル負荷を有界にするため各モード固有の関数だけを含む専用programへ分ける。
別のeffect modeとスタックkindを持ち、両方が必要な場合もprogramを逐次コンパイルする。
Glass系programの完了待ちは他のreadyなV2ステージを止める条件に含めず、対象Glassレイヤーだけを
一時的にスキップする。`KHR_parallel_shader_compile`が完了を通知するまでは同期status参照も
時間切れによる永久失敗化も行わない。
旧プリセットは正規化時に無効なGlass V2レイヤーを追加し、従来の出力を変えない。

## 調査根拠

- [Khronos GLSL `refract`](https://registry.khronos.org/SPIR-V/specs/1.0/GLSL.std.450.html): Snellの法則に対応する屈折ベクトル式と全反射時の0ベクトル
- [Pharrほか『Physically Based Rendering』](https://pbr-book.org/4ed/Reflection_Models/Specular_Reflection_and_Transmission): 誘電体の反射・透過、波長依存屈折率、Fresnel
- [Walterほか（EGSR 2007）](https://doi.org/10.2312/EGWR/EGSR07/195-206): 粗い誘電体表面のmicrofacet transmission
- [Perlin（SIGGRAPH 2002）](https://dl.acm.org/doi/10.1145/566654.566636): 二階補間不連続を除くImproved Noise
- [NVIDIA GPU Gems 2](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-19-generic-refraction-simulation): 画面空間の屈折マップと色収差を用いるリアルタイム近似

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存GlassをV2で置換する | 不採用 | 既存プリセットの見た目と比較手段を失う |
| 深度レイマーチによるscreen-space refraction | 不採用 | 現在の2D入力には背面深度がなく、追加バッファと欠損補間が必要 |
| RGBを同じ方向へ定数オフセットする | 不採用 | 表面法線と屈折率の関係を表現できない |
| 滑らかな高さ場とRGB別`refract`を使う | 採用 | 現行WebGL2の単一パス内で、連続性と光学的意味を両立できる |

## エラー・境界条件

- Mix 0または全光学項0ではGlass/Glass V2専用描画を省略する。
- 非有限値、範囲外値、極小解像度では既存renderer limitsと安全な既定値へ正規化する。
- `refract`が全反射を示す0ベクトルを返した場合は中心サンプルを使う。
- GlassとGlass V2が同時に有効なら、スタック順に二つの独立パスとして適用する。
- タイル描画は両Glassレイヤーの最大サンプル距離を同じガター契約で確保し、同時に有効な場合は各パスの参照距離を加算する。
- `KHR_parallel_shader_compile`が未完了の間はcompile/link statusを同期参照せず、Glass系はLoadingのまま他のreadyなレイヤーを描画する。

## 受け入れ条件

- AC-001: 既存Glassの既定値で、非平坦部の実変位がサブピクセルへ一律縮小されず、Refraction変更が視認できる。
- AC-002: Glass V2をONにすると、quintic補間の滑らかな高さ場に基づく屈折が表示される。
- AC-003: Chromatic Aberrationを増やすとCauchy式から求めた5代表波長の屈折率に基づく色分離が連続的に増え、0では分離しない。既存GlassとGlass V2の両方で成立する。
- AC-004: Roughness、Highlight、Mixが独立に反映され、Mix 0と全光学項0は恒等変換になる。
- AC-005: GlassとGlass V2を独立に選択・並べ替えでき、保存・再読込後も順序と有効状態を維持する。
- AC-006: 旧プリセットには無効なGlass V2を補完し、従来のGlass出力を変更しない。
- AC-007: プレビューとタイル出力で有限なサンプル座標を使い、GlassとGlass V2を同時に有効にした場合は両パスの参照距離を加算したガターを確保する。
- AC-008: docs check/build、テスト、lint、Web buildが成功し、実ブラウザでGlassとGlass V2の反映を確認できる。
- AC-009: GlassまたはGlass V2を有効にした際、遅延コンパイルが長時間化してもUI操作と有限な描画を継続し、同期status参照によるWebViewフリーズ、透明キャンバス、連鎖的な汎用シェーダーコンパイルを起こさない。
- AC-010: GlassまたはGlass V2がLoading/Unavailableでも、Slit、Noise、Distortなど他のreadyなEffect Stackレイヤーを適用したまま描画し、Glassの完了後だけ対象レイヤーを自動的に加える。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-004 | シェーダー契約テスト、実ブラウザ比較 | `effectShaderParity.test.ts`, WebGLプレビュー |
| AC-005, AC-006 | パイプライン・プリセット正規化テスト | `effectPipeline.test.ts`, `postprocessStack.test.ts` |
| AC-007 | ガター計算とシェーダー有限値テスト | `glass.test.ts`, `tileRender.test.ts` |
| AC-008 | 自動検証と手動プレビュー | ローカル検証コマンド、WebGLプレビュー |
| AC-009, AC-010 | 遅延コンパイル制御の契約テスト、長時間コンパイルと他レイヤー併用の実ブラウザ確認 | `webglCompilePolicy.test.ts`, WebGLプレビュー |

## 移行・互換性

既存プリセットの型バージョンは変更しない。正規化時にGlass V2レイヤーを無効で補完するため、
保存済みのレイヤー順と見た目は維持される。Glass V2は既存Glassのパラメータを共有する。

## 未決定事項

なし。
