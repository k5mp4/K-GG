# CHANGE-024 Design

## 描画構成

```text
[Gradient / Effect Stack]
          ↓ 3DモードではCloth Baseを無効化
       [既存 GradientCanvas]
          ↓ processed Canvas
[ClothGradientRenderer: CanvasTexture + Cloth UV]
          ↓ 一度だけクロス変形
       [3D Cloth preview]

[export session: processed 2D frame]
          ↓ 3Dモード時だけ同じCloth rendererで再マッピング
       [visible preview canvas] → [PNG / ZIP / MOV / MP4]
```

既存のGradientCanvasは常時マウントして処理済みCanvasを更新する。Canvasモードでは従来のSANDBOX Cloth Baseを含む表示を維持し、ClothモードではCloth Baseを入力キャンバスから外す。そのキャンバスにはNoise／Curl／Distortなどの2D Effect Stack結果を残し、`ClothGradientRenderer.renderMappedTexture`がCanvasTextureとしてクロスのUVへ直接マッピングする。

表示面の切り替えはSANDBOXの`Cloth Gradient`プロパティモジュール先頭に置く。Cloth GradientのQuality、Surface Wave、Organic Motion、Lighting、Specular、Fresnel、Rampと同じ編集コンテキストで表示面を選択できるようにし、Preview右側には重複する表示モードUIを置かない。

Clothの最初のフレームが描画されるまでCanvasを表示し続ける。Renderer生成、Resize、CanvasTexture更新、描画のいずれかが失敗した場合はClothを破棄してCanvasへ戻す。

## ライフサイクル

- モード変更時にClothの準備状態をリセットする。
- `ResizeObserver`で表示領域とカメラを同期する。
- 毎フレーム、CanvasTexture更新、クロスの頂点変形、法線計算、表面ライティング、描画を同じThree.jsシェーダーで行う。
- モード解除・サイズ変更・アンマウント時にRAF、Observer、Geometry、Material、Texture、Rendererを破棄する。
- 3DモードのExportでは、export sessionの2Dフレーム生成sequenceを完了してからCloth rendererを同期描画し、同じ3D出力Canvasをcaptureする。Export中はPreview RAFが出力Canvasを上書きしない。

## 互換性

モードstateはReactの一時stateのみで保持し、Presetモデルには保存しない。2DモードのExport経路は維持し、3DモードではPreviewの出力Canvasを明示的にExportへ渡す。
