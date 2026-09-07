---
id: ADR-0013
title: Mesh Gradationを構造化グリッドデータとして保持する
status: accepted
date: 2026-07-26
deciders: [maintainer]
related_specs: [SPEC-040]
supersedes: []
updated: 2026-09-07
---

# ADR-0013: Mesh Gradationを構造化グリッドデータとして保持する

## コンテキスト

Mesh Gradationは4つのコーナーと8つのBezier制御点を必要とする。既存の`gradient.anchors`は2点または4点の標準gradient向けであり、そこへ制御点を混在させるとpreset、keyframe、shader uniformの対応が曖昧になる。

## 決定

`gradient.mesh`はN×Mの頂点グリッドとして構造化データを保持する。グリッドの各頂点はUV座標を持ち、セル間で共有される各エッジが2つの三次Bezier制御点を持つ。

- `rows`/`columns`は頂点グリッドの寸法（2..8）。2×2は従来の単一Coonsパッチと等価。
- `points`はrow-majorの頂点UV座標配列。
- `edgeHandles.horizontal[row][col]` / `vertical[row][col]`は共有エッジの制御点。
- `colorMode` は色ソースを表す（`'ramp'` | `'direct'`）。
  - **ランプ対応（既定）**: 共有グラデーションランプをグリッド縦位置 v（下→上）で連続サンプルして色場を導出する。頂点色だけでなくセル内部も同じ論理v座標で評価するため、2×2でもランプ途中のstopがメッシュへ反映される。ランプ編集がメッシュ全体へ追従する。旧 `colorPositions`（コーナーごとのランプ位置）は持たない。
  - **直接色**: 各頂点が `pointColors`（直接Hex）を持ち、点ごとに独立して編集する。
- 旧形式フィールド `corners`/`handles` は後方互換のため維持し、グリッド外縁から常に再導出して同期する。旧 `colorPositions` は廃止し、ランプ対応モードのv軸投影で表示する。

セル境界は共有エッジによりC0連続が構造的に保証される。描画は各セルを前方向テッセレーションしたCoons PatchとしてCPUで評価し、既存の256pxテクスチャ経路（`u_gradientType==6`）でサンプリングする。

## 理由

- 既存gradientとの後方互換を保ちながら、キャンバス内部も含む編集点と、曲線境界を持つ2次元色場の編集を可能にする。
- shader uniform、UI編集、preset正規化、アニメーション評価で同じ構造を共有できる。
- 単一セルのCoons Patch評価はN×Mグリッドの特殊ケース（2×2）として自然に包含される。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存`anchors`へ全グリッド点を追加する | 不採用 | 型の意味と既存gradientとの互換性を壊す |
| グリッドを直線セルのみにする | 不採用 | 内部エッジを曲げる編集要求と既存Coonsの整合を欠く |
| セルごとに独立した非共有ハンドル | 不採用 | セル境界の連続性が壊れる |
| 複数セルを別データ構造で持つ | 不採用 | 単一パッチをN×Mの特殊ケースとして扱う方が移行・正規化が単純 |

## 結果

既存presetは`mesh`なしで読み込める。旧単一Coonsデータ（`corners`/`handles`/`colorPositions`のみ）は2×2グリッドへ正規化され、従来と同一の見た目を保つ。旧`mesh.corner.*`キーフレームは2×2グリッドの該当コーナー頂点として評価される。複数セルの自動C1連続性保証や、自己交差パッチの完全な逆写像は引き続き対象外とする。
