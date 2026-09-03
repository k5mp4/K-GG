# Design

この文書は、CHANGE-026を2026-08-11時点で停止した際の実装記録です。承認済みの要求は`proposal.md`と`delta.md`を正とし、本書に記載する候補実装を最終方式として確定しません。

## 現在の状態

- CHANGE-026はactiveかつ未完了です。AC-002の旧Web版との見た目比較を満たしていません。
- `legacy` / `Stipple` の型、UI、Preset、Direct Generator、Effect Stack V2経路は試行実装されています。
- 現在のEffect Stack V2は、前段をRGBA8 FBOへ描画した後、Stipple変位した座標から入力テクスチャを読む方式です。
- ぼけを減らす候補として、Stippleだけ変位先UVを入力テクセル中心へ固定する処理が入っています。この方式は改善候補であり、旧Web版との同等性は未確認です。
- Image Gradient保護時にGeneratorとEffect StackでStippleを二重適用しない修正は入っています。
- 別機能の実装・修正を優先するため、現在のコードとテストを比較用baselineとして残して停止します。

## 調査で判明した描画方式の差

旧Web版`kagaribi15_grad`は、一つのfragment shader内で座標をStipple変位し、その変位後座標から解析的にGradient値を計算します。色面を先に画像化してから読み直さないため、色境界にbilinear補間由来の中間色が入りません。

K-GGのEffect Stack V2はレイヤー順序を守るため、Baseまたは前段レイヤーの結果をFBO textureへ描画し、後段のDiffuseがそのtextureをサンプリングします。FBO textureは既存契約上LINEAR filterを使うため、fractional UVから読むと色差の大きい境界で隣接色が混ざります。この差が、K-GGのStippleが全体にぼんやり見える主要因と判断しました。

座標解像度スケール、p3 hash、seed、`max(grain, 0.01)`は旧Web版と対応しています。Stack側の`highp`と旧Generator側の`mediump`の差は粒配置の位相を変える可能性がありますが、LINEAR再サンプリングを残したままでは境界のぼけを解消しないため、副因と判断しました。

添付比較ではK-GG側がJPEG、旧Web側がPNGでした。旧PNGを同等のJPEGへ変換しても旧Web側の輪郭は明確にシャープだったため、JPEG圧縮は比較上の交絡ではあるものの主因ではありません。最終判定は同一入力・同一設定・lossless PNG出力で行います。

## 試行した実装

### 1. 旧式hashと小数Grainの移植

Direct GeneratorとEffect Stack V2へ、旧`gradient.frag.glsl`由来のp3 hash、`max(grain, 0.01)`、Stipple用`mediump`ローカル計算を追加しました。これは粒子密度と配置規則を合わせるための基礎実装です。

### 2. Effect Stack V2のforced texture pass

Stippleが唯一の有効レイヤーでもGenerator直結最適化を使わず、直前textureへ作用できるようforced texture passを選択します。これによりEffect Stackのレイヤー順序は維持できますが、旧Web版の解析的Gradient評価とは異なり、ラスタライズ済み色面を再サンプリングします。

### 3. Stipple限定のtexel-center sampling

`src/shaders/postprocess/diffuse.glsl`の`diffuseTexelCenterUv`で、mode 5（Stipple）だけ変位先を入力テクセル中心へ固定しました。`src/shaders/postprocess/main.glsl`の純Diffuse経路とSlit併用経路からこの関数を使います。

狙いは、FBO全体のfilter設定を変えずにStippleだけ隣接色のLINEAR混合を避けることです。既存5モードへの影響を限定できる一方、旧Web版の解析的Gradientと完全一致する方式ではなく、変位先の量子化による段差や粒子形状差が残る可能性があります。ユーザー確認ではStipple実装はまだ完全ではないため、この方式を最終採用とはしません。

### 4. Image Gradient保護時の一度だけ適用

Image Gradient保護時はGeneratorでStippleを有効にせず、Effect Stack側の一回だけにしました。二重変位はScatter過大と軟化を招き、EFFECT-023の「一度だけ」に反するためです。

## 検討した代替案

### FBO texture全体をNEARESTにする

色混合は減りますが、Stipple以外のDiffuse、他レイヤー、FBO利用箇所へ影響し、既存描画をジャギーにするため採用しません。

### Stippleだけpoint sampleする

現在の候補実装です。変更範囲が小さくEffect Stack順序を維持できますが、解析的Gradientと同じ結果にはならないため、画質基準を満たすか比較が必要です。

### 旧Web版と同様にGenerator内で解析的Gradientを評価する

Base Gradientへ直接適用する場合は最も旧版へ近づけられます。ただし任意の前段Effect Stackレイヤー結果は解析式として再評価できず、texture入力を必要とします。Generator-only特例にすると、レイヤー構成によってStippleの方式が変わる問題があります。

### Base-onlyとtexture-inputで方式を分けるhybrid

Base直後は解析的Gradient、それ以外はtexture sampleとする案です。見た目の近さを優先できますが、Diffuseの位置やImage Gradient使用有無によって粒子境界が変わり、Preview／Export間の分岐も増えるため、採用には明示的な仕様決定が必要です。

### 座標計算全体をmediumpへ寄せる

hash格子や粒配置の位相調整には有効ですが、LINEAR texture sampleによる中間色生成そのものは止めないため、単独の解決策にはしません。

## 再開時の判断基準

最終方式は、次の基準を同じ入力と設定で比較して決めます。

1. 1920x1080、同一Gradient/Preset、`Scatter=47px`、`Grain=0.23px`、`Seed=0`、lossless PNGで旧Web版とK-GGを出力する。
2. 色差の大きい硬い2色境界を含むfixtureで、元の2色以外の中間色画素率と境界帯の幅を測る。
3. 添付例相当の多色Gradientで、全体コントラスト、細線の残り方、粒子密度、粒子が境界周辺へ現れる範囲を目視比較する。
4. Seed固定時の再現性とSeed Per Frame時のフレーム変化を確認する。
5. DiffuseのStack位置を前後へ移動し、直前textureへ一度だけ適用されることを確認する。
6. Direct、Preview、Thumbnail、静止画、連番、動画で同じ方式と保存値を使うことを確認する。
7. Block、Smooth、Dither、Halftone、ASCIIとLegacy V1の既存出力が変わらないことを確認する。

最低限、旧Web版より境界帯が有意に広がらず、point sample特有の段差が添付例の観察距離で目立たないことを採用条件とします。基準を満たさない場合は、point sampleの微調整ではなく、解析的評価を使える範囲とtexture-input契約の再設計へ戻ります。

## 変更対象の主要ファイル

コード:

- `src/lib/webgl.ts`: V2のforced texture pass、Image Gradient保護時の一度だけ適用
- `src/shaders/gradient.frag.glsl`: Direct GeneratorのStipple式
- `src/shaders/postprocess/diffuse.glsl`: Stack側Stipple式とtexel-center候補実装
- `src/shaders/postprocess/main.glsl`: texture sample経路
- `src/lib/effectPipeline.ts`, `src/types/distortion.ts`, `src/components/BlockNoisePanel.tsx`: mode、保存値、UI

テスト:

- `src/lib/effectShaderParity.test.ts`: hash、grain下限、texture経路、texel-center候補
- `src/lib/imageGradientProtected.test.ts`: Image Gradient保護時の一度だけ適用
- `src/lib/webglExportPrograms.test.ts`: Exportで必要なprogram構成
- `src/lib/effectPipeline.test.ts`, `src/lib/presetModel.diffuse.test.ts`, `src/store/gradientStore.effectPipeline.test.ts`: 順序と保存

## ロールバック方法

この作業は他の未コミット変更と同じworktreeに重なっています。ファイル単位のcheckoutやresetは他作業を失うため使用しません。戻す場合は、CHANGE-026の関連差分をhunk単位で確認し、Stipple mode、shader mode 5、forced texture pass、texel-center helper、関連テストと文書だけを対にして除去します。
