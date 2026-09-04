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

Browser側の代表Canvasは次のコマンドでWebGL `readPixels`由来のtop-to-bottom RGBAを取得し、
manifestとraw frameを保存できる。

```powershell
$env:KGG_CAPTURE_OUTPUT = 'test-results/render-capture-a'
npm run capture:render:rgba
node tools/compare-render-captures.mjs --mode reproducibility `
  --first test-results/render-capture-a/capture.json `
  --second test-results/render-capture-b/capture.json `
  --output test-results/render-reproducibility.json
```

同一commit・同一runner・同一browser・同一Canvas・同一Render Contractが揃わない比較は
`not-eligible`となり、base/head比較へ進めない。SwiftShader captureはBrowser Merge Gateの
証拠であり、実GPUのbase/head比較は`.github/workflows/render-fixed-gpu.yml`を使うmanual
Release Gateとする。未接続の固定GPU runnerで取得した結果をpassとして扱わない。
