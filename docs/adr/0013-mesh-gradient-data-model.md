---
id: ADR-0013
title: Mesh Gradationを単一Coons Patchの構造化データとして保持する
status: accepted
date: 2026-07-26
deciders: [maintainer]
related_specs: [SPEC-040]
supersedes: []
---

# ADR-0013: Mesh Gradationを単一Coons Patchの構造化データとして保持する

## コンテキスト

Mesh Gradationは4つのコーナーと8つのBezier制御点を必要とする。既存の`gradient.anchors`は2点または4点の標準gradient向けであり、そこへ制御点を混在させるとpreset、keyframe、shader uniformの対応が曖昧になる。

## 決定

`gradient.mesh`に2×2の将来拡張用行列サイズ、4コーナー、辺ごとの2制御点、4つのRamp位置、補間方式を保持する。保存形式の辺方向はUIとpresetで固定し、Coons Patch評価時に必要な辺だけ逆方向へ読む。MVPは単一パッチに限定するが、将来の複数セル追加で`mesh`配下を拡張できる形を維持する。

Meshのコーナーkeyframeは`mesh.corner.*`として既存の時刻評価へ追加し、ハンドルと色位置は静的値として扱う。

## 理由

- 既存gradientとの後方互換を保ちながら、形状と色の対応を明示できる。
- shader uniform、UI編集、preset正規化、将来の複数セル拡張で同じ構造を共有できる。
- `fourcolor`の逆距離加重を再利用せず、Coons Patchのパラメータ空間を一次情報にできる。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存`anchors`へ12点を追加する | 不採用 | 型の意味と既存gradientとの互換性を壊す |
| 4色のradial gradientを合成する | 不採用 | 曲線境界とCoons Patchの座標を表現できない |
| 複数セルを先に実装する | 不採用 | MVPのコストと逆写像の複雑性を不要に増やす |

## 結果

既存presetは`mesh`なしで読み込める。Meshの無効時は新しいuniformを描画へ使用せず、既存gradientの結果を維持する。将来NxMへ拡張するときは、`rows`／`columns`を有効化し、セル境界の連続性と逆写像方針を別仕様で決める。
