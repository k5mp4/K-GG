# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 SANDBOXのEdit LayerにShapesがあり、ON／OFFとアクティブ数（/7）に反映される | component | `src/components/SandboxPanel.test.tsx` | pass |
| AC-002 設定が範囲・列挙に正規化され、storeの部分更新も正規化される | unit | `src/types/shapes.test.ts`、`src/lib/presetModel.shapes.test.ts` | pass |
| AC-003 表示・非表示ループ（fadeGlow／wipe／flicker／none）が時刻0と1で一致し、サイクル・切替・非表示の配分に従う | unit | `src/types/shapes.test.ts` | pass |
| AC-004 Fillが整数周期で動き、Animation OFFで停止する | unit | `src/types/shapes.test.ts` | pass |
| AC-005 旧Presetは無効の既定値で読め、読み込んだSVGは保存されず、Thumbnailは星で描画する | unit | `src/lib/presetModel.shapes.test.ts` | pass |
| AC-006 Shapes有効時だけ`shapes` programがExport準備で要求され、shaderがES 3.00・グローバル座標である | unit | `src/lib/webglExportPrograms.test.ts` | pass |
| AC-007 `renderFrame`が`render`の後にShapesパスを同じサイズ・タイル・ループ位相で呼ぶ | unit | `src/lib/renderFrame.test.ts` | pass |
| AC-008 shaderが実際のWebGL2でコンパイル・リンクできる | e2e (shaders project) | `tests/e2e/shaders.spec.ts`（30 base program + Noise variant） | pass |
| AC-009 星（Flow）・円（Flow、Fill Amount 1）・文字（Ripple）がサーモグラフィ状のRampで縁から中心まで段差なく連続した輝度になる | manual（ヘッドレスChromium＋SwiftShader、1920×1080で撮影） | 各状態のフレームを目視。初版はフィードバックで作り直し、段差・平坦部・白飛びを順に解消 | pass（見た目の最終判断はhuman review） |
| AC-010 SVGの無害化：`script`、`foreignObject`、`on*`属性、`opacity`、`filter`を除去し、viewBoxへ余白を加え、SVGでない文書を拒否する | manual（ヘッドレスChromiumで`prepareShapeSvg`の出力を確認） | 出力マークアップ | pass |
| AC-011 タイル書き出しがフル描画と一致する | manual（`renderTiledToCanvas2D`で512pxタイルと単一描画を比較、文字・grain 0.2） | 1920×1080で最大差0 | pass |
| AC-012 SANDBOXでShapesを選び、ONにすると日英表記のパネルと描画が表示される | manual（ヘッドレスChromium） | SANDBOX → Edit Layer `Shapes` → ON | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Change構造 | `npm run change:check` | pass |
| Fast validation | `npm run check:merge` | pass（lint警告21件は既存、エラー0） |
| Shader compile | `npm run check:render` | pass |

## Release Gate

- 実GPU（統合GPU／専用GPU）でのフレーム時間。Shapes有効時（特にGlow Radius最大）のPreviewが目標フレームレートを保てるか。
- Tauri実機（WebView2／WKWebView）での静止画・動画書き出しの目視確認。WKWebViewでのSVGデコード（`Image.decode`）とmipmap生成。
- 4K以上の書き出しで、長辺2048pxのマスクによる輪郭の柔らかさが許容範囲か。

## Observation

- 既定値（Inner Shadow、Fill Amount、Glow）の見た目の好みと、代表的なGradient Rampとの組み合わせ。
- 塗りの背景矩形を含むSVGを読み込んだときに、矩形が形状になることへの利用者の戸惑い。

## Commands

- `npm run docs:check`
- `npm run change:check`
- `npm run check:render`
