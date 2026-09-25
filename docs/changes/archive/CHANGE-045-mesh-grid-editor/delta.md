# Delta

現行仕様の全文を書き直さず、この変更で追加・変更する要件だけを記載します。

## MODIFIED Requirements

### GRAD-004 Mesh Gradation

**変更前**: Mesh Gradationは単一の2×2 Coons Patch。4コーナー、4辺それぞれの2制御点、4色位置、bilinear補間を `gradient.mesh` に保持する。MVPでは複数セルの編集や複数パッチは提供しない。コーナーはキーフレーム対象、辺制御点と色位置は静的。

**変更後**: Mesh GradationはN×Mセルのグリッドとして編集できる。`gradient.mesh` は頂点格子 `points`（rows×columns、row-major）、セル間で共有する辺ごとの2ベジエ制御点 `edgeHandles`、色モード `colorMode` を保持する。色モードは「ランプ対応」（既定）と「直接色」の2つ。

- **ランプ対応（`colorMode:'ramp'`）**: 全頂点の色は共有グラデーションランプをグリッド縦位置 v（下→上）でサンプルして決まる。ランプ編集がメッシュ全体へ即時追従する。コーナーごとのランプ位置（旧 `colorPositions`）は持たない。
- **直接色（`colorMode:'direct'`）**: 各頂点が直接Hex色 `pointColors` を持ち、点クリック→色スウォッチ→Tweeq ColorPickerで個別編集できる。1点の変更は他点に影響しない。切替時は現在のランプ色（v軸）を初期化する。

既存の2×2（=1セル、4頂点）データは後方互換として `corners` / `handles` から同一形状へ導出される。旧 `colorPositions` は廃止し、ランプ対応モードのv軸投影で表示する。旧形式のコーナーキーフレーム `mesh.corner.*` は新しい頂点位置キーフレーム `mesh.point.*` へ読み替えて評価する。

**変更理由**: キャンバス内部にも編集点を持たせて変形できるようにしつつ、メッシュの色を「ランプ追従」と「点ごとの直接指定」の2モードでユーザーが選べるようにする。BL/BR/TL/TRの4コーナーパラメータによる調整は廃止する。

### GRAD-005 アニメーションとキーフレーム

**変更前**: Ramp、通常アンカー、Meshコーナーがキーフレーム対象。Bezierの制御点は対象外。

**変更後**: Bezierの2制御点（`bezierControl.*`）と、Meshの全頂点の位置（`mesh.point.*.{x|y}`）がキーフレーム対象になる。直接色モードでは頂点の色（`mesh.point.*.{r|g|b}`）もキーフレーム対象。Bezierでは端点アンカーのキーフレーム記録時に制御点も同じ変位で記録され、再生中も端点と制御点が一貫して動く。

**変更理由**: GRADATIONタイプのBezierがアニメーション中に操作・一貫表示できない問題を解消する。

## ADDED Requirements

### GRAD-024 Meshグリッドの色モード

メッシュは「ランプ対応」と「直接色」の2つの色モードを持ち、右サイドバーのMeshセクションで切り替える。

- ランプ対応（既定）: 各頂点の色はグリッド縦位置 v で共有ランプをサンプルする。ランプ編集がメッシュ全体へ追従する。
- 直接色: 各頂点が直接Hex色 `pointColors` を持つ。切替時は現在のランプ色（v軸）を初期化し、以後は点クリック→色スウォッチ→Tweeq InputColorで個別編集できる。1点の変更は他点に影響しない。

### GRAD-025 Bezier制御点とMeshグリッドのMCP操作

kgg-control/MCPに、Bezier制御点の移動（`set_bezier_control`）、Meshグリッド寸法（`set_mesh_grid_size`）、グリッド点位置（`set_mesh_grid_point`）、色モード切替（`set_mesh_color_mode`）、グリッド点色（`set_mesh_grid_point_color`）の操作がある。UIの編集操作とMCPの操作が同じデータを同じ範囲・検証で変更する。

## REMOVED Requirements

### GRAD-004（一部）「MVPでは複数セルの編集や複数パッチは提供しない」

複数セル編集を提供するため文言を削除する。複数セルの自動連続性保証や完全な逆写像は引き続き対象外とする。

### 旧 `colorPositions`（4コーナーのランプ位置）とそのスライダーUI

ランプ対応モードではランプをグリッド縦方向（v軸）へ投影する方式へ変更したため、コーナーごとのランプ位置 `colorPositions` と、それを調整するBL/BR/TL/TRスライダーは廃止した。旧データはランプ対応（v軸投影）として読み込む。
