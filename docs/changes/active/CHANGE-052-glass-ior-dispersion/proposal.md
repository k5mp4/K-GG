---
type: change
id: CHANGE-052
title: Glass Organic／RippleとGlassTile Faceted・屈折率・色分散サンプル数
status: draft
change_kind: F
owners: [maintainer]
created: 2026-09-24
updated: 2026-09-25
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0005, ADR-0009, ADR-0010, ADR-0012, ADR-0017]
related_code: [src/types/distortion.ts, packages/kgg-control/src/parameterLimits.ts, packages/kgg-control/src/parameters.ts, src/lib/glass.ts, src/lib/glassTile.ts, src/lib/postprocessAnimation.ts, src/store/documentModel.ts, src/store/documentActions.ts, src/lib/webgl.ts, src/shaders/postprocess/uniforms.glsl, src/shaders/postprocess/glass-field.glsl, src/shaders/postprocess/glass-optics.glsl, src/shaders/postprocess/glass-compact.glsl, src/shaders/postprocess/glass-tile.glsl, src/components/PostprocessPanel.tsx, src/i18n/uiLabels.ts, src/i18n/messages.ts]
related_tests: [src/lib/glass.test.ts, src/lib/glassTile.test.ts, src/lib/glassTileShader.test.ts, src/store/gradientStore.glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/postprocessAnimation.test.ts, src/lib/webglShaderSources.test.ts, src/components/PostprocessPanel.test.tsx, packages/kgg-control/src/parameters.test.ts]
human_review: required
---

# CHANGE-052 Glass Organic／RippleとGlassTile Faceted・屈折率・色分散サンプル数

## 背景・問題

Request sourceは利用者からの直接依頼です。K-GGのGlassは2D画像やGradientを入力として光学的に変形するグラフィック効果です。現行のIORはシェーダー内で約1.5に固定され、屈折率を使った色分散とFresnel反射を素材ごとに調整できません。専用shaderはRGBの3アンカー、full fallbackは5波長アンカーを使い、既存の各経路で色収差サンプル密度を調整する設定もありません。

添付資料は、Glassを表面・屈折率・分散・仕上げを組み合わせる2Dエフェクトとして整理する参考にします。FlutedはSlitのWaveと表現上の役割が重なるという利用者の判断を受け、本変更から外します。

## 変更理由

GlassのSurface Typeを有機的にアニメーションするOrganic／Rippleへ整理し、静的な連続三角面FacetedをGlassTileのPatternとして追加します。RippleはAnimationループ内で途切れず巡回し、速度をループあたりの整数周期数で調整できます。各帯の中央が山なりに盛り上がるレンズ断面を採用します。Facetedは共有頂点の高さを面内で線形補間し、タイル境界やベベルを持たずに面ごとに法線が変わります。GLASS V2の屈折率は調整可能にして屈折・色分散・Fresnel応答へ反映します。Chromatic Stepsは各shader経路の隣接アンカー間の分割数とし、既定値1では既存のサンプル計算を維持します。

## ゴール・成功条件

- IORを`1.0..2.5`、step`0.01`、既定値`1.5`として保存・正規化する。旧Presetで欠落する場合は1.5を使う。
- IORをCauchy分散、GLASS V2のSnell refraction、Fresnel反射へ連動させ、IOR 1.5では既存の既定応答を維持する。
- Glass Surface Typeとして有機的にアニメーションするOrganic、Rippleを選択できる。Rippleは周波数・深度・ループ速度で屈折法線を制御できる。
- GlassTile Patternに静的なFacetedを追加し、Facet Density／Depth、Rotation、Seedで連続する三角面を調整できる。タイル用Triangle patternのベベルやドームとは異なる。
- RippleのAnimation SpeedをAnimationループあたり`1..8`周期の整数で設定でき、各Ripple帯の中心が盛り上がるレンズ状断面を使う。
- Rippleの高さ場は各帯中央が滑らかに盛り上がるレンズ断面を持ち、Animationループあたり`1..8`周期の整数速度を保存・正規化する。終端の高さ場は先頭と一致する。
- Chromatic Stepsを1..3の整数分割数として保存・正規化し、既定値1では各既存shader経路のアンカーと計算を維持する。2..3では経路ごとの隣接色分散アンカー間を補間して追加サンプリングする。
- Preview、thumbnail、静止画、連番、動画、タイル出力で同じ正規化IORと色分散サンプル数を使い、fallback時の最大変位をsample paddingへ反映する。
- Browser／Tauri保存境界、Effect Stack構造、GlassTileの独立性、Image Gradient保護を維持する。

## 対象

GLASS V2のOrganic／Ripple表面、Rippleのレンズ形状とループ速度、GlassTile PatternとしてのFaceted連続平面メッシュ、IOR、色収差サンプル数、共通パラメータ正規化、Glass／GlassTile UI、Preview／Export向けGLSLと関連Current Specを対象にします。

## 対象外

- Fluted surface（SlitのWaveと役割が重なるため除外）、独立したHex／GridタイルSurfaceなど他の表面形状。
- 実体積を持つ3D Glass、厚み依存吸収、薄膜Iridescence、Caustics、物理ベース照明。
- Frosted／Colored／Holographicなどの追加Finishや個別Effect、Presetパック。
- 既存GlassTile Patternの挙動変更、Agent APIのGlass全体公開。
- commit、push、Pull Request、GitHub Issueなどの外部操作。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- [ADR-0005](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0009](../../../adr/0009-unified-parameter-limits)
- [ADR-0010](../../../adr/0010-image-gradient-color-field-rendering)
- [ADR-0012](../../../adr/0012-typed-localization-and-icon-semantics)
- [ADR-0017](../../../adr/0017-analytic-gradient-prefix)

## 主なリスク

- IORが高いほどfallbackの最大source offsetとtile paddingが増えるため、IOR上限とpadding計算を共通parameter limitsへ揃えます。
- Chromatic Stepsを増やすほどGLASS V2のsource texture参照が増えます。各経路の最大参照数が13になる上限を設けます。
- Surface fieldが2つのGlass shader経路で異なるとPreview／fallback parityを損ねるため、双方の実装とsource parityを検証します。
- Ripple速度をAnimationループあたりの整数周期数にすることで、終端でRipple位相を先頭へ一致させます。Animation全体のSpeed設定とは別の制御です。
- GPUの見た目とタイル接合部は自動shader検査のみでは確定できず、Browser/GPU Observationとして記録します。

## 将来のGlass構成への位置付け

本変更はGlassの「Organic／Ripple surface → gradient/normal → refraction/dispersion → transmission tint/roughness → highlight/Fresnel → Mix」と、GlassTileの「pattern height/normal → refraction/dispersion → Mix」を維持します。FacetedはGlassTile既存のPattern選択、描画program、屈折合成を使う静的形状です。厚み・吸収、薄膜干渉、Causticsなどは別の光学モデル・描画コスト・検証条件を持つため、本Changeでは実装しません。Chromatic Stepsは既存のGlass屈折色分散を細分化するもので、薄膜Iridescenceを意味しません。

## 未決定事項

- 実装範囲とPreset互換性に未決定事項はありません。Browser/GPUでの目視確認はMerge Gateの自動検証と分けてObservationへ記録します。
- 外部Issueは作成していません。単一の直接依頼として追跡でき、外部操作も依頼されていないためです。
