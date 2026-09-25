# Delta

## MODIFIED Requirements

### EFFECT-009 Glassの色調整

Glassは、既存の表面形状、屈折、波長依存分散を維持したまま、色収差成分のHueとSaturation、透過光のTint、ハイライトのTintを個別に調整できます。Chromatic Aberrationは`0..80px`、Chromatic Stepsは`1..3`の整数、Hueは`-180°..180°`、Saturationは`0..200%`、Tintは`#RRGGBB`で保持します。Chromatic Stepsの既定値1では専用GLASS V2の3アンカー経路とfull fallbackの5アンカー経路それぞれの既存出力を維持します。2..3では各経路の隣接アンカー間を線形補間し、分割数に応じてスペクトルサンプルを追加します。値が大きいほど色分散を細かく再構成します。最大参照数は専用経路で7、full fallbackで13です。既定値より色収差サンプルを増やすと描画負荷が上がります。Hue／Saturationは色収差残差だけへ作用し、Tintは透過光とハイライトへ独立して作用します。

## ADDED Requirements

### EFFECT-030 Glassの屈折率

Glassは屈折率`glassIor`を`1.0..2.5`、step`0.01`、既定値`1.5`で保持します。旧Presetで値が欠落した場合も`1.5`へ補完します。IORはCauchy型の波長分散計算における基準屈折率となり、Chromatic Aberrationは分散幅を指定します。IOR 1.0では屈折率差がなくなるため屈折と屈折由来の色分散を止めます。

GLASS V2専用経路は波長別IORからSnellの法則によるサンプル方向を求め、基準IORからFresnel F0を導きます。IOR 1.5では既存の屈折方向とエッジ応答を維持します。フルshader fallbackは安定した画面空間勾配変位へ`clamp((IOR - 1) / 0.5, 0, 3)`を乗じ、Chromatic Aberrationによる追加offsetも同率で調整します。tileのsample paddingは最大IOR時の変位を予約します。いずれも体積厚みや環境反射を持たない2D近似です。

Glassは既存のOrganic surface、専用GLASS V2 program、Effect Stack順序、GlassTile分離、Image Gradient形状保護を維持します。Chromatic Stepsは共有parameter limitsと既存のPreset／Document normalizerを通し、1..3の値をPreview／Exportの各経路で共有します。Steps 1は各経路の既存サンプル式を維持し、Steps 2..3は既存の隣接波長アンカー間に補間サンプルを追加します。

### EFFECT-031 GlassのOrganic／Ripple表面

GlassのSurface TypeはOrganic、Rippleを選択できます。Glass Surfaceは有機的にアニメーションする形状を対象にします。Rippleは画面中心を基準とする同心円の高さ場を用い、各帯の中央が滑らかに盛り上がるレンズ断面を形成します。既存の有限差分法線をIOR屈折、色分散、Roughness、Fresnelへ入力します。Frequencyは`0.5..18`、step`0.1`、既定値`6`、Depthは`0..1`、step`0.01`、既定値`0.35`です。Animation SpeedはAnimationループ1周あたりのRipple周期数を`1..8`の整数で指定し、既定値`1`です。整数周期によりループの両端で高さ場の位相が一致します。

RippleはOrganic用Motion値に依存せずAnimationループで周期運動します。Noise Distortion Influenceは両Surfaceで共通です。専用Glass V2とfull shader fallbackは同じSurface選択とRipple高さ場を使います。

### EFFECT-027 GlassTileのFaceted pattern

GlassTile Patternへ静的なFacetedを追加します。Facet Densityは`1..16`、step`0.1`、既定値`5`、Facet Depthは`0..1`、step`0.01`、既定値`0.48`です。RotationとSeedはGlassTileの既存入力を共有します。共有頂点のseededな高さを三角面内で線形補間するため、面内は平面で高さは隣接面間に連続し、稜線で法線だけが変わります。タイル境界、面の段差、ベベル、ドームは生成しません。GlassTile Triangle Patternはセルごとのベベルとドームを維持し、Facetedとは異なる形状です。既存GlassTile専用shaderはグローバル座標を使い、Tile exportでも連続面を保ちます。

## MODIFIED UI Requirements

### UI-028 GlassのSurface Type、IOR、Chromatic Steps

Surface groupにOrganic／RippleのSurface Type選択を表示します。RippleではFrequency（0.5..18、step 0.1、既定6）、Depth（0..1、step 0.01、既定0.35）、Animation Speed（Animationループ1周あたり1..8周期、step 1、既定1）を表示します。説明文はRippleのレンズ断面とループ連続性を示します。GlassTile PatternのFacetedではFacet Density（1..16、step 0.1、既定5）、Facet Depth（0..1、step 0.01、既定0.48）、Rotationを表示し、Seedは全Pattern共通のPattern group controlとして表示します。説明文は共有頂点の平面三角面と、セルドーム／ベベル／タイル境界を使わないことを示します。Optics groupにIOR（1.0..2.5、step 0.01、既定1.5）を表示し、基準屈折率が屈折・波長分散・Fresnel反射へ影響する2D screen-space近似であることを説明します。Chromatic Aberration近くにChromatic Steps（1..3、既定1）を表示し、1は各経路の既存出力を維持し、2..3は色分散アンカー間へ補間サンプルを追加することを説明します。新しいラベルと説明は英語／日本語に対応します。

## REMOVED Requirements

なし。
