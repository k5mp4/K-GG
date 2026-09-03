# Validation

承認済み仕様に対して、純粋なRender Plan、shader source parity、Preview／Exportのprogram selection、既存回帰テストを実行した。GPU上の実描画とPNG比較はブラウザ接続制約のため未確認として残す。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit | `src/lib/effectPipeline.test.ts`、Render Planのreason／consumedLayers／firstTextureLayerIndex | pass（39 tests） |
| AC-002 | unit | `src/lib/effectPipeline.test.ts`、Noise → DiffuseとDiffuse → Noiseの順序fixture | pass |
| AC-003 | implementation / unit | `src/lib/effectPipeline.ts`、`src/lib/webgl.ts`、direct出力と`gradFbo`一回境界のRender Plan | pass（コードとunitで確認、GPU実描画は未確認） |
| AC-004 | source / unit | `src/lib/effectShaderParity.test.ts`、`src/lib/webgl.ts`、Glass後段のtexture連鎖とconsumed layer skip | pass（36 parity tests） |
| AC-005 | unit | 4つの代表順序を`src/lib/effectPipeline.test.ts`で確認 | pass |
| AC-006 | regression | `src/lib/imageGradientProtected.test.ts`を含む全回帰テスト、Cloth／Mesh／Flow／Seamless／legacy／Stipple fallback | pass |
| AC-007 | source / unit | GeneratorのNoise → Diffuse → Ramp順序、uniform gate、FBO filter未変更 | pass（固定解像度PNGとGPU間pixel比較は未確認） |
| AC-008 | unit | `src/lib/webglExportPrograms.test.ts`、全テストによるThumbnail／scene evaluation／Flow／Seamless options parity | pass |
| AC-009 | manual | 1920x1080 lossless PNG、Noise、Diffuse Block／Smooth、Scatter=47px、Grain=0.23px、Seed=0、ブラウザConsole | not-run（統合ブラウザからlocalhostへ接続できず） |
| AC-010 | regression / docs | `npm test`、DocsDD検査、Lint、build | pass |

## Commands

文書変更時に実行する。

- `npm run docs:check`
- `npm run docs:build`

コード変更後に実行する。

- `npm test`
- `npm run lint`
- `npm run build`

Tauri/Rustへ変更を広げた場合に追加する。

- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## 実行結果

- `npm run docs:check` — pass（変更パッケージ形式、index、frontmatter、関連参照を確認）
- `npm run docs:build` — pass（VitePress build完了）
- `npx markdownlint docs/changes/active/CHANGE-033-analytic-gradient-prefix/*.md docs/adr/0017-analytic-gradient-prefix.md` — pass（この変更パッケージとADRのMarkdownのみ）
- `npx vitest run src/lib/effectPipeline.test.ts src/lib/effectShaderParity.test.ts src/lib/webglExportPrograms.test.ts` — pass（85 tests）
- `npm test` — pass（69 test files、406 tests）
- `npm run lint -- --no-fix` — pass（0 errors、21 warnings。既存component／hook／型警告のみ）
- `npm run build` — pass（TypeScriptとVite build完了。既存のTauri dynamic/static importおよびchunk size warningあり）

## 未確認事項

- proposal、delta、design、ADR-0017はユーザー承認済みで、`status: approved`、`human_review: completed`、ADR `accepted`を記録した。
- ブラウザshader compile、4経路のPNG比較、1920x1080 lossless PNG、Console error 0件は未確認である。統合ブラウザはlocalhost接続を拒否し、既存サーバーはIPv6 loopback（`::1:5173`）のみで待受していた。
- 全AC確認前のため、deltaのcurrent spec統合とArchive移動は未実施である。
- GPU間のpixel完全一致はcurrent specの未確認事項として扱う。
- CHANGE-026のStipple見た目条件はこのchangeのvalidation対象ではなく、CHANGE-026側のactive状態を維持する。
