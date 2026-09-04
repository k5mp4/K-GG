# Validation

## Acceptance criteria

| AC | 検証方法 | 結果 |
| --- | --- | --- |
| AC-001 | `getV2RenderPlan`のcomposition planテスト | pass |
| AC-002 | `Glass → Noise → Diffuse`、Seamless、非隣接、Slit境界のplan／program要求テスト | pass |
| AC-003 | 専用shader source assembly、uniform重複、Noise→Diffuse順序のparity test | pass |
| AC-004 | Preview／Thumbnail／ExportがScene Render Planを共有する既存境界とExport program test | pass |
| AC-005 | Tile座標、既存Diffuse／Slit／Stipple／Image Gradient保護テスト | pass: 既存テストを含む自動検証 |
| AC-006 | 実GPUでのWebGL compile、画像見た目、長時間動画、全出力経路 | not-run: Release Gate / Observation |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Render tests | `npm run check:render` | pass: 14 files / 245 tests |
| Focused tests | `npx vitest run src/lib/effectPipeline.test.ts src/lib/effectShaderSources.test.ts src/lib/webglExportPrograms.test.ts src/lib/sceneRenderPlan.test.ts src/lib/renderGolden.test.ts src/lib/effectShaderParity.test.ts` | pass: 10 files / 207 tests |
| Typecheck | `npm run typecheck` | pass |
| Lint | `npm run lint` | pass: 0 errors。既存warning 42件は変更対象外を含む |
| Diff whitespace | `git diff --check` | pass |
| Change structure | `npm run change:check` | pass: 2 active, 32 archive entries |
| Full tests | `npm test` | pass: 178 files / 990 tests。Viteの既存source-map warningあり |
| Build | `npm run build` | pass: 445 modules transformed。既存のdynamic import／chunk size warningあり |
| Docs | `npm run docs:check` / `npm run docs:build` | pass: 41 legacy specs、8 current specs、34 changes、19 ADRs |
| Merge aggregate | `npm run check:merge` | pass。上記と同じ既存warningのみ |

## Release Gate

実GPU/WebGL context、shader compile結果、Preview／Thumbnail／静止画／連番／動画／Tileの画像比較、1920x1080のsubpixel Grain、長時間動画、性能・メモリ観測は未実施である。自動テストはRender Planとshader assemblyの契約を検証し、GPU画像一致を捏造しない。

## Observation

専用`noiseDiffuseStack`のcompile時間、FBO pass数、GPU負荷、Tile境界、Scatter=0とNoise単独の一致を代表GPUで確認する。shader compile error、feedback、FBO alias、Noise二重適用、既存Slit／Stipple差分があれば専用passを無効化して既存経路へ戻す。
