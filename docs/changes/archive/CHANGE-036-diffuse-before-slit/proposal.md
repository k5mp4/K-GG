---
type: change
id: CHANGE-036
title: Diffuse直後のSlitでDiffuseが反映されない不具合修正
status: archived
change_kind: B
owners: [maintainer]
created: 2026-08-30
updated: 2026-08-30
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: [ADR-0004, ADR-0005, ADR-0017]
related_code: [src/lib/effectPipeline.ts, src/lib/webgl.ts, src/shaders/postprocess/main.glsl]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts]
human_review: completed
---

# CHANGE-036 Diffuse直後のSlitでDiffuseが反映されない不具合修正

## 背景・問題

Effect Stack V2で`Diffuse`を`Slit`の前へ移動すると、Block／SmoothのDiffuseがSlitの延長領域へ反映されない。Render Planが先頭のDiffuseをAnalytic PrefixとしてGenerator側で消費し、Main Stackから除外する一方、Slitの出力座標でDiffuseを評価する既存経路はMain Stack上の隣接レイヤーを必要とするためである。

## 変更理由

Effect Stackの保存順序と描画結果を一致させ、既存仕様が定める`Diffuse → Slit`の出力座標評価を復元するためである。Slitのループ時計やDiffuseのアルゴリズム自体は変更しない。

## ゴール・成功条件

- `Diffuse → Slit`の順序でDiffuseがSlitの延長領域にも反映される。
- DiffuseはSlitの出力座標側で一度だけ評価され、GeneratorとTexture Stackで二重適用されない。
- `Diffuse → Glass`などSlitを直後に持たない解析prefixの最適化は維持する。
- 既存のSlit Motionループ、DiffuseのUI・保存値・各モードを変更しない。

## 受け入れ条件

- AC-001: V2 Render Planは、解析可能なDiffuseの直後に有効なSlitがある場合、DiffuseをAnalytic Prefixとして消費せず、Texture Stackの`core`経路を選択する。
- AC-002: `Diffuse → Slit`では既存の`diffuseAfterSlit`経路が有効になり、Slitの出力座標へDiffuseを一度だけ適用する。Slitの延長領域にもDiffuseのセル表現が現れる契約を維持する。
- AC-003: `Diffuse → Glass`、`Noise → Diffuse → Glass`、SlitがDiffuseの直後にない順序では、従来のAnalytic Prefix境界と消費レイヤーを変更しない。
- AC-004: 回帰テスト、DocsDD検査、Lint、Buildが成功し、既存の未コミットWebGL変更とSlit duration loopを上書きしない。

## 対象

- V2 Render PlanのAnalytic Prefix境界判定。
- 既存のTexture StackにあるDiffuse遅延評価とSlit出力座標評価の回帰テスト。
- CURRENT-EFFECT-STACKへの`Diffuse → Slit`順序契約の明記。

## 対象外

- Slitのduration、ループ、速度、shader形状、UI、保存形式の変更。
- DiffuseのBlock／Smooth／Dither／Halftone／ASCII／Stippleアルゴリズムの変更。
- Analytic Prefix全体の再設計、複数prefix、任意のshader融合。
- Diffuse直後がSlitではない順序の性能最適化変更。
- GPU間の画素完全一致やブラウザ実機の性能保証。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)

## 関連ADR

- [ADR-0004 Postprocess Stackをping-pong FBOで描画する](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2を段階別ping-pong FBOで描画する](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0017 V2の解析的Gradient Prefixを最初のtexture境界で固定する](../../../adr/0017-analytic-gradient-prefix)

## 主なリスク

- Prefixを無効化する条件が広すぎると、不要なFBOパスが増えたり、他の順序の最適化が失われる。
- Diffuseの遅延評価とSlitのサンプリング座標を誤って二重適用すると、セルサイズや明るさが変わる。
- Main Stackの隣接判定とRender Planの有効レイヤー順がずれると、無効レイヤーを挟んだ順序で再発する。

## 未決定事項

なし。ユーザー確認により、既存の`Diffuse → Slit`契約を維持する最小修正方針を承認済み。
