# Design

## 採用する実装方針

既存のOrganic Surfaceを維持し、Surface TypeにRippleを追加します。Rippleはアスペクト補正した画面中心からの距離に基づく周期高さ場で、Frequency／Depthを制御します。各周期を`fract`で帯へ分け、中心値1・境界値0のcosine capにより各帯中央が丸く盛り上がるレンズ断面にします。Animation Speedは`1..8`の整数周期数とし、Animationループ位相へ乗じます。整数周期なのでAnimationループの終端に先頭と同じ高さ場へ戻り、RippleはOrganic用のMotion値に依存せず周期運動します。Glass Surface Typeは有機的にアニメーションするOrganic／Rippleに限定します。

静的なFacetedはGlassTile Patternとして実装し、既存の専用GlassTile描画経路を使います。アスペクト補正した座標を等辺三角格子へ写し、GlassTile Seed由来の高さを格子頂点へ与えます。各セルを対角線で2面に分け、共有頂点の高さを面内で線形補間することで、三角面は平面、隣り合う面では高さが連続しながら法線が変化します。Facet Density／Depthを追加し、Rotation／SeedとRefraction／Dispersion／MixはGlassTileの既存入力を共有します。GlassTile Triangleの独立した丸いドーム／ベベルとは異なり、面に段差やタイル境界を作りません。高密度時はpixel footprint band-limitで面の法線変化を抑えます。

Rippleは既存のNoise Distortion blendを共有し、Glass V2専用shaderとfull fallbackは同じ高さ場を使います。FacetedはGlassTile専用shader内で既存のRefraction／Dispersion／Mix処理に渡します。新しいEffect Stack kindや描画programは追加しません。

GLASS V2のOptics／composition stageへ共有`glassIor` uniformを加えます。IORは両shader経路のCauchy波長モデルへ反映します。専用Glass V2は波長別IORでSnell refraction directionとFresnel responseを計算し、フルshader fallbackは安定した勾配変位へ`clamp((IOR - 1) / 0.5, 0, 3)`を乗じます。IOR 1.5では係数が1となり既存の屈折・分散オフセットを保ちます。Tile paddingはIOR上限でのfallback offsetを予約します。

Chromatic Stepsは既存の各GLASS V2 shader経路が持つ色分散アンカー列の、隣接アンカー間の分割数です。値1では経路固有のoffset、sample、channel weight式をそのまま使い、どちらの経路でも現在の出力を維持します。値2..3では各経路のアンカー列上へ分割位置を挿入してoffsetとRGB寄与を補間します。専用GLASS V2は3アンカー、full fallbackは5アンカーを持つため、同じSteps値で分割密度を揃えながら、現在のfallback固有のCauchy方向と色混合を変更しません。最大値3のときfull fallbackの色収差sample数は13です。全サンプル数は奇数で中央にgreen referenceがあるため、Hue／Saturationとroughness用に追加参照を要しません。Uniformだけを追加し、program variantは増やしません。

## データと互換性

`PostprocessConfig`へIOR、Chromatic Steps、Ripple Speed、GlassTile Facet Density、Facet Depthを追加します。IORは1..2.5、step 0.01、既定値1.5。Stepsは1..3の整数、既定値1です。Ripple Speedは1..8の整数、既定値1、Facet Densityは1..16、step 0.1、既定値5、Facet Depthは0..1、step 0.01、既定値0.48とし、旧Presetでは既定値へ補完します。共有parameter registry、K-GG control parameter catalog、Document/Preset normalizerを更新します。旧PresetにIOR値がない場合は1.5へ補完します。

## UI

GlassのSurface groupにはRippleのAnimation Speedを表示し、ループ1周あたりの周期数と端点の位相一致を英日helpで説明します。Ripple選択中はOrganic用Motionスライダーを隠します。FacetedはGlassTile Patternの選択肢としてFacet Density／Depthを表示し、共有頂点を持つ平面三角面でベベルやドームを持たないことを英日helpで説明します。Optics groupにIORスライダーを置き、英日helpでIORとscreen-space近似の意味を説明します。Chromatic StepsはChromatic Aberrationの近くに保ちます。Glass全体のAgent Control API公開は後続評価します。

## 添付資料から採用・延期する境界

添付資料にあるGlass IORとFresnelを既存Optics段へ取り込み、Flutedを除いた表現候補からRippleとGlassTile PatternのFacetedを実装します。Slit Waveと表現が重なるFluted Surface、追加の独立Hex／Grid tile surfaceは対象外です。Glacias／LiquidGlassのSDF edge／panel thicknessモデルは入力面の違いがあるため移植せず、厚み依存吸収、Frost、薄膜Iridescence、Caustics、Holographic表現は別Requestとします。Chromatic Stepsは薄膜Iridescenceとは別の分散サンプル数です。

## 主要リスクと緩和

- **IORによるtile offset増加:** IOR上限とfallback倍率を共有レジストリへ揃え、sample paddingの上限ケースをテストします。
- **shader経路差:** full fallbackとdedicated GLASS V2の両方へ実装し、helper／source parity testを追加します。
- **Preset変化:** 追加項目なしの旧PresetをIOR 1.5／Steps 1へ正規化し、既定の描画契約を維持するテストを追加します。
- **描画負荷:** Chromatic Stepsを最大3に制限し、値1では既存サンプル経路を維持します。
- **ループ端の位相不一致:** Ripple Speedを整数周期数に制限し、Animationループ終端と先頭で同じRipple位相になるようにします。
- **Facetのエイリアス／座標継続:** 高密度での法線変化にpixel footprint band-limitを適用し、共有頂点の高さ補間とglobal full-resolution座標をshader-source testsおよびBrowser Observationで確認します。

## ロールバック

このChangeとCurrent Spec更新をまとめて戻せば固定IOR 1.5の従来Opticsと既存Glass／GlassTile Pattern構成へ戻ります。旧アプリでIOR／Chromatic Steps／GlassTile Facetedを含む新Presetを再保存すると、旧normalizerが未認識値を破棄する可能性があります。
