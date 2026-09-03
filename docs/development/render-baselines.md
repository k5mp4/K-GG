---
title: 描画ベースライン
---

# 描画ベースライン

構造リファクタリングで描画結果を変えないため、代表ケースを次の条件で固定する。

- Preset: `Kagaribi_15`（新規エディタの既定状態）
- 解像度: `800 × 800`
- 正規化時刻: `0`, `0.5`, `1`
- seed: Noise `0`、Diffuse `0`、Stretch `12`、Flow `42`
- 出力経路: Preview、Preset Thumbnail、静止画、PNG Sequence、動画、Tile

入力条件とEffect Pipelineの契約は [`src/lib/renderGolden.ts`](../../src/lib/renderGolden.ts) と
[`src/lib/renderGolden.test.ts`](../../src/lib/renderGolden.test.ts) で固定する。全経路の描画条件は
`evaluateSceneAtTime` → `getSceneRenderPlan` → `renderSceneAtTime` → `renderFrame` を共有し、
出力先だけを各adapterが担当する。

## 画像比較

実GPUで取得したPNGまたはPNG Sequenceを同じ条件で比較する。連番ZIPは次のコマンドでRGBA画素を
デコードして比較できる。

```powershell
pwsh -NoProfile -File tools/compare-frame-zips.ps1 -FirstZip .\baseline.zip -SecondZip .\candidate.zip
```

`DecodedRgbaMatch: true`、フレーム数、寸法が一致することを確認する。単一フレームは同じRGBA
比較手順で確認する。

このリポジトリの自動テスト環境には実GPU／ヘッドレスWebGLキャプチャ基盤がないため、画像の
実キャプチャと比較はRelease Gate / Observationとして記録する。自動テストは代表入力と
Render Planの取り違えを検出する。
