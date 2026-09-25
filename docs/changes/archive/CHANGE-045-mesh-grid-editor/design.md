# Design

## 採用する実装方針

既存の単一Coonsパッチ（`corners`/`handles`）を後方互換のまま維持し、その上に可変グリッド表現を「正規化済みの共通形式」として追加する。描画・UI・アニメーション評価は共通形式を一次情報とし、旧形式は読込時に共通形式へ導出する。

- 頂点格子: `points` = 縦 `gridRows` × 横 `gridCols` のUV座標配列（行major、row 0が下辺）。
- セル辺: `edgeHandles`。水平辺は `h{row}`（row 0..gridRows、col 0..gridCols-1）、垂直辺は `v{col}`（col 0..gridCols、row 0..gridRows-1）。各辺は2つのベジエ制御点を持つ。セル間で共有されるため、内部エッジを動かすと隣接セルが同時に追従しC0連続が構造的に保証される。
- 省略時は直線（各辺の制御点を端点の1/3・2/3に補間）。
- セルは4辺（下 `h{r}`、右 `v{c+1}`、上 `h{r+1}`、左 `v{c}`）で囲まれたCoonsパッチとして評価する。
- **色モード**: `colorMode`（`'ramp'` | `'direct'`）で色ソースを切り替える。

### 新旧互換マッピング

旧形式（`corners` + `handles` のみ）は gridRows=gridCols=2 の単一セルとして読む:
- points = corners 順 [BL, BR, TL, TR]
- 旧handles.bottom/right/top/left → edgeHandles h0/v1/h1/v0
- 旧 `colorPositions` は廃止し、ランプ対応モード（v軸投影）で表示する。

`rows`/`columns`（旧セル数、常に2）は保存互換のため残し、gridRows/gridCols（頂点数）と整合させる。UI表示はセル数 = grid-1 を基準にする。

## データモデル

`src/types/gradient.ts` に次を追加・変更する。

```ts
export type MeshColorMode = 'ramp' | 'direct';

export type MeshGradientConfig = {
  rows: 2; columns: 2;               // 旧セル数。常に gridCols-1 / gridRows-1
  corners: [Vec2Tuple; 4];           // 旧単一パッチ頂点（互換）
  handles: { bottom/right/top/left: [cp0, cp1] };  // 旧単一パッチ辺ハンドル（互換）
  colorMode: MeshColorMode;          // 'ramp'(既定) または 'direct'
  pointColors?: string[];            // directモードの各頂点Hex(row-major)

  // ---- 新: 可変グリッド（正規化後は常に存在） ----
  gridRows: number;   // 頂点の縦数 2..8（= セル数+1）
  gridCols: number;   // 頂点の横数 2..8
  points: Vec2Tuple[];               // gridRows × gridCols
  edgeHandles: Record<string, [Vec2Tuple, Vec2Tuple]>;  // 'h{r}-{c}' / 'v{c}-{r}'
  colorInterpolation: 'bilinear';
};
```

`normalizeMeshGradientConfig`:
- 旧形式のみの入力 → points/edgeHandles を導出して返す（旧フィールドも整合して保持）。colorMode は `'ramp'` 既定。
- gridRows/gridColsは2..8へ、pointsは不足を等間隔補間・超過を切捨て、座標はMESH_COORDINATE_MIN/MAX(-4..5)へclamp。
- `colorMode` が `'direct'`（または保存済み `pointColors` がある）なら `pointColors` を row-major で正規化（欠損は #FFFFFF 補完）。`'ramp'` では `pointColors` を持たない（ランプが全頂点を駆動）。
- 旧 `colorPositions` は読まない（廃止）。旧データはランプ対応（v軸投影）として表示。

## 状態管理

`documentSlice.ts` / `documentActions.ts` / `application/commands.ts` に追加:
- `setMeshGridSize(gridRows, gridCols)` — 点を等間隔再配置。directモードでは点色をbilinear再サンプル、rampモードは不要。
- `setMeshGridPoint(index, position)` — 頂点の位置。
- `setMeshEdgeHandle(edgeKey, handleIndex, position)` — セル辺の制御点。
- `setBezierControl(index, position)` — bezier制御点。
- `setMeshColorMode(mode)` — ramp/direct切替。directへ切替時は現在のランプ色（v軸）を各点のHexへ初期化（見た目の連続性を確保）。rampへ戻すと pointColors を破棄。
- `setMeshPointColor(index, hex)` — directモードの1点のHexを更新（他点は不変）。

既存 `setMeshCorner` / `setMeshHandle` / `resetMeshGradient` / `straightenMeshHandles` は単一セル互換として維持。旧 `setMeshColorPosition`（コーナーランプ位置）は削除。

選択状態 `selectedGradientAnchors: number[]` は、グリッド点index（row*gridCols+col）を表すようUI解釈を広げる。配列型は変更しない。

## UI構成

`MeshGradientEditor.tsx` を全面改修:
- 全グリッド点を円形ハンドルで表示（コーナーは既存サイズ、内部はやや小さく）。ドラッグで `setMeshGridPoint`、Shiftで複数選択。
- 全セル辺の共有ベジエハンドルを◇で表示。内部辺は隣接セル共有のため1セットのみ。
- 点ハンドルの色: rampモードはグリッド縦位置 v のランプ色、directモードは `pointColors[index]`。rampモードのセル内部も、四隅の色を後から単純補間せず、同じ論理v座標で共有ランプを連続サンプルする。
- rampモードでは各カラーストップのv位置をメッシュ形状に沿った等値線として表示し、右端にstop番号・v値・色をラベル表示する。ラベルクリックは `selectedStops` と同期し、右サイドバーの該当stopを選択する。repeat/mirror時は論理v軸上の対応位置を複数表示し、repeatが多い場合は最初のサイクルのみ表示して明示する。
- directモードで単一選択中の点に色スウォッチを表示し、クリックで `ColorPicker`（Tweeq InputColor）を開き `setMeshPointColor`。
- アニメーション有効時、選択点にtimerボタン → rampは位置 `{x|y}`、directは位置 `{x|y}` + 色 `{r|g|b}` キーフレーム記録。

`GradientRamp.tsx`（右サイドバー、グラデーション形式の直下）:
- Mesh選択時: Reset Mesh / Straighten / Rows / Cols に加え、色モード切替（Ramp/Direct ボタン → `setMeshColorMode`）。旧 BL/BR/TL/TR スライダーは削除。
- Rampモードでは、Rampと同じ横方向スケール上にメッシュ各行の点ラベル（初期2×2はBL/BR/TL/TR）とv→t対応を表示する。ラベルクリックでキャンバス上の対応点を選択し、DirectモードではRamp非依存であることを表示する。Ramp本体もrepeat/mirror後の実サンプル色を描画する。

`GradientAnchorEditor.tsx`（bezier）:
- 制御点ドラッグを `setBezierControl` 経由に変更し、キーフレーム有効時は `bezierControl.{i}.{x|y}` を記録/更新。
- A/B端点をドラッグしたとき、キーフレーム有効なら制御点も同変位で追従記録。
- アニメ中は制御点の表示位置を補間値から計算。

`GradientCanvas.tsx`（フォールバック時の制御線表示）:
- フォールバック2D canvas は `z-index:1` を持ち、`z-index:auto` の制御線SVG（GradientAnchorEditor/MeshGradientEditor）を覆ってキャンバス内の線を隠していた。ルートに `isolation:'isolate'` を付けて内部のスタッキングを分離し、フォールバックcanvasを `z-index:0` に下げる。これでWebGLフォールバック（2Dプレビュー）時も制御線・アンカーがキャンバス内で表示される。

## 描画・外部プロセス・Tauri側の変更

`meshGradientField.ts`:
- `evaluateMeshPatch(mesh, u, v)` を単一セル評価として維持しつつ、セル(r,c)の4辺を共有edgeHandlesから組み立てる `cellCorners/cellEdges` を導入。
- `gridPointColor` はモード分岐: direct なら `pointColors[index]` を直接使用、ramp ならグリッド縦位置 v で `rampData` をサンプル。rampモードのセル内色も各テッセレーション点のグローバルvで `rampData` を連続サンプルし、途中stopを四隅の単純補間で失わない。
- 全セルを同解像度(既定32分割)で前方向テッセレーション→ラスタライズ。フォールバック塗りはコーナー4点を `gridPointColor` で解決。

`webgl.ts`:
- `uploadMeshGradientTexture` は rampData と gradient.mesh を受け、内部で頂点色を解決（ramp: v軸ランプサンプル / direct: pointColors）。signatureは mesh全JSON + rampData を含むため、ランプ・点色の変更で自動的に再bakeされる。
- `applyMeshGradientUniforms`（legacy）は新フィールドを無視して現状維持。旧 `u_meshColorPositions` uniform は既定値を送る（シェーダーはbake済みテクスチャを参照）。shader側 `u_gradientType==6` のサンプリングは無変更。

`presetPreview.ts`:
- `meshPatchPoint`/`meshPatchDerivatives` をセル対応へ。`samplePreviewMeshUV` は該当セル探索→セル内Newton逆写像へ。
- 色は `buildMeshGradientField` 経由でランプサンプル。

## 変更対象の主要ファイル

コード: `src/types/gradient.ts` `src/lib/meshGradientField.ts` `src/lib/webgl.ts` `src/lib/presetPreview.ts` `src/lib/sceneEvaluation.ts` `src/lib/animationRegistry.ts` `src/store/documentSlice.ts` `src/store/documentActions.ts` `src/store/documentModel.ts` `src/application/commands.ts` `src/components/MeshGradientEditor.tsx` `src/components/GradientAnchorEditor.tsx` `packages/kgg-control/src/controls.ts` `packages/kgg-control/src/parameterLimits.ts` `src/lib/kggControlRuntime.ts` `src/i18n/messages.ts` `src/i18n/uiLabels.ts` `src/docs/help.md`

テスト: `src/types/gradient.test.ts` `src/lib/meshGradient.test.ts` `src/lib/presetModel.test.ts` `src/lib/webglShaderSources.test.ts` `src/lib/kggControlRuntime.test.ts`

## 代替案とトレードオフ

| 案 | 採否 | 理由 |
| --- | --- | --- |
| 既存単一パッチのままUIだけ改善 | 不採用 | キャンバス内部の編集という要求を満たせない |
| グリッドを直線セルのみにする | 不採用 | 内部エッジも曲げたいという要求と既存Coonsの整合を欠く |
| 新形式で旧フィールドを削除 | 不採用 | 保存互換・旧プリセット読込を保つため |
| 全セルで独立した非共有ハンドル | 不採用 | セル境界の連続性が壊れる。共有ハンドルでC0を保証 |

## 移行方法

1. 旧プリセットJSONは `normalizeMeshGradientConfig` で新形式へ導出。`corners`/`handles` は保持して保存。
2. 旧 `colorPositions` 値は廃止し、ランプ対応（v軸投影）で表示する。
3. 旧 `mesh.corner.*` キーフレームトラックは読込時に `mesh.point.{r}.{c}.{x|y}` 形式へ移行。
4. 旧API（setMeshCorner等）は単一セル時の新API委譲として維持。旧 `setMeshColorPosition` は削除し `setMeshColorMode`/`setMeshPointColor` へ置き換え。

## ロールバック方法

- データ互換: 保存JSONの旧フィールド維持により、旧バージョンでも単一セルデータは読める。
- コード: 変更は1つのDesigned Change PRにまとめ、描画・UI・アニメーションを段階的に戻せるようコミットを機能単位に分ける。gridRows/gridCols>2を含むデータは旧バージョンでは単一セルとして読まれないため、必要なら変更前にプリセットのバックアップを推奨。
