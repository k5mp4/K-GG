# CHANGE-025 Design

## 採用する実装方針

```text
[Gradient / Effect Stack / SANDBOX Base]
                    ↓ processed 2D Canvas
       [ConeViewRenderer: CanvasTexture]
                    ↓ ConeGeometry / BackSide / unlit
               [3D Cone Canvas]
                    ↓ selected output surface
        [Preview / PNG / ZIP / MOV / MP4]
```

Coneは開口した`THREE.ConeGeometry`をカメラ方向へ向け、`THREE.BackSide`の内面だけを描画する。materialはunlit、white、tone mappingなしとし、source CanvasTexture以外の色要素を持たせない。Cameraは開口部側から頂点を正面に見る固定構図とする。

開口部半径は固定カメラFOV、Camera距離、Canvas aspectからFrustum四隅を外接する値を算出し、余白係数を乗せる。利用者向けPerspectiveパラメータは持たず、カメラ構図が不明瞭に変わらないようにする。Canvasの各画素方向が開口円内から円錐へ入ることで、全フラグメントが内面と交差しclear colorを露出しない。

## データモデル

`ConeViewConfig`は`depth`、`rotation`、`apexX`、`apexY`、`textureRepeat`、`seamBlend`、`seamMode`、`flowCycles`、`mappingMode`を持つ。Apex X／Apex Yは正規化画面座標として-2..2へ制限し、プレビュー面上のハンドルからCanvas外まで更新して、開口部を中央に保ったままConeGeometryの頂点だけを移動する。±2はCanvasの幅・高さに対して最大50%外側までを表す。`mappingMode`は`flow`（既存の頂点から開口部へ進むTexture Flow）と`projection`（処理済み2Dフレームを固定投影）の2種類を持つ。`seamMode`は`mirror`（Mirror Repeat）と`weld`（Edge Weld）の2種類を持つ。表示の有効状態は`RenderViewMode`の一時stateであり、Cone設定に`enabled`は追加しない。

| 項目 | 範囲 | 既定値 |
| --- | --- | --- |
| Depth | 2..30 | 6 |
| Rotation | -180..180° | 0° |
| Apex X / Y | -2..2（Canvas外へ最大50%） | 0 / 0 |
| Texture Repeat | 1..8 integer | 1 |
| Seam Blend | 0..0.5 | 0.25 |
| Seam Mode | mirror / weld | weld |
| Flow Cycles | -30..30 integer | 1 |
| Mapping | flow / projection | flow |

TextureのUは円周方向へRepeatし、RotationをU offsetへ変換する。`flow`ではVをCanvas上辺を頂点側、下辺を開口側へ対応させ、`normalizedTime * flowCycles`を整数周期のV offsetとして加える。`projection`ではV offsetを0に固定し、処理済み2Dフレームをそのまま円錐内面へ投影する。シェーダーはU／Vそれぞれの反復境界で、Seam Modeごとに異なる座標・色サンプルを使う。Mirror Repeatはタイル内座標を鏡面反射して境界の値を一致させる。Edge Weldは継ぎ目の左右から得た端色を不透明な色サンプルとして幅内で連続補間する。いずれもアルファレイヤーの重ね合わせではなく、最終的なテクスチャ色を一度決定する。Seam Blendは0..0.5で、0.5は1タイルの半分を使う最大値とするため、元Canvasの端の色が一致しなくても直線・円形の境界を硬線として表示しない。ConeView設定の変更時は、Rendererが保持する最後の処理済みCanvasとnormalizedTimeで同期再描画する。

## 状態管理

- Cone設定はZustand store、scene snapshot、Preset snapshotへ追加する。
- `renderViewMode`はReactの一時stateを維持し、既定値は`canvas`とする。
- Previewは共通timeline clockのnormalizedTimeを読み、exportは`VideoExportFrameRenderer`へ渡されたnormalizedTimeを使う。
- 旧Presetに`coneView`がない場合は既定値を補う。表示面は読込時に変更しない。

## UI構成

SANDBOX上部にはPreview Surfaceの専用選択を置かず、Edit LayerでClothとConeを同じ粒度のモジュールとして選択する。Cloth／ConeモジュールのON/OFFが2D Canvasと各3D表示の切替を兼ねる。Coneモジュールは状態表示、Mapping、Seam Mode、Depth、Rotation、Texture Repeat、Seam Blend、Flow Cycles、頂点位置のリセットUIを持ち、既存のCustomSelect、SliderField、focus ring、色、タイポグラフィ、日英メッセージを再利用する。頂点位置はプレビュー面上の専用ハンドルで操作し、グラデーションアンカー表示の切替に従って表示・非表示を切り替える。キャンバス上のApexという補助ラベルは表示しない。Gradient Rampは右サイドバーの既存UIだけを使用する。

## 描画・出力

`ConeViewRenderer`はCanvasTexture、ConeGeometry、MeshBasicMaterial、PerspectiveCamera、WebGLRendererを所有する。source Canvas、Canvasサイズ、Cone設定、normalizedTimeを同期入力として1フレーム描画できるAPIを提供する。Preview中はsource Canvasの更新へ追従し、export session中はPreview RAFを停止する。

Renderer生成、Texture更新、描画が失敗した場合はリソースを破棄して`canvas`表示へ戻す。切替・Resize・Unmount時はRAF、Geometry、Material、Texture、Rendererを破棄する。

## 代替案とトレードオフ

- 画面空間の極座標Shaderは全画素被覆が容易だが、要求された3Dプリミティブではないため不採用。
- Cloth Rendererへgeometry modeを追加する案は、Clothのライティング・設定・責務とunlit Coneを混在させるため不採用。
- ConeをEffect Stackへ追加する案は、表示面の選択と画像処理順を混同するため不採用。

## 移行・ロールバック

Presetへ任意フィールドを追加するだけで既存データ移行は不要。ロールバック時は`coneView`を未知フィールドとして無視でき、既存Canvas／Cloth表示を維持する。
