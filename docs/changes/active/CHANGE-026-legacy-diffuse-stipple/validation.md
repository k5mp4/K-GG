# Validation

部分実装の検証記録。2026-08-11、ユーザー確認によりStippleはまだ完全ではなく、代表設定の見た目要件を満たしていないと判断して実装を停止した。下表のpassは候補実装に対する自動検証結果であり、CHANGE-026全体の受け入れ完了を意味しない。試行方式と再開時の判断基準は`design.md`に記録する。

Node.js／npmはPATHに存在しないため、ローカル依存のVitest、Vite、ESLint、TypeScript、文書ツールをDeno 2.2.4から実行した。変更仕様はactiveのままとし、Archiveへ移動しない。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / source | `src/lib/effectShaderParity.test.ts`, `src/lib/webglShaderSources.test.ts` | 候補実装の自動テストpass（対象5ファイル64件、全57ファイル317件） |
| AC-002 | unit / manual | source texel center固定テスト。Diffuseパネルで `Stipple` を選択し、Scatter=47、Grain=0.23、Seed=0を同一PNGで比較 | **未達**。production previewの起動・WebGL描画・console error 0件は確認したが、ユーザー判断では見た目が未完成。旧版PNGとの定量・目視比較は未実施 |
| AC-003 | unit / source | Direct generatorとPostprocess stackのmode=legacy経路、およびDiffuse単独時のV2テクスチャ経路 | pass（forced texture経路とStipple限定point sampleを検証） |
| AC-004 | integration | `src/store/gradientStore.effectPipeline.test.ts`、Image Gradient protected時の一度だけ適用 | pass（全317件） |
| AC-005 | unit / integration | `src/lib/presetModel.diffuse.test.ts`、`src/lib/webglExportPrograms.test.ts`、Preview／Thumbnail／Export経路 | pass（全317件） |
| AC-006 | regression | 既存Diffuse／Effect Stackテスト一式 | 候補実装ではpass（全57ファイル317件）。最終方式決定後に再実行が必要 |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## 実行結果

- `deno run --no-lock -A node_modules/vitest/vitest.mjs run src/lib/effectPipeline.test.ts src/lib/effectShaderParity.test.ts src/lib/imageGradientProtected.test.ts src/lib/webglExportPrograms.test.ts src/lib/presetModel.diffuse.test.ts` — pass（5 files / 64 tests）
- `deno run --no-lock -A node_modules/vitest/vitest.mjs run` — pass（57 files / 317 tests）
- `deno run --no-lock -A node_modules/vite/bin/vite.js build` — pass（既存のNode version、dynamic import、chunk size警告あり）
- `deno run --no-lock -A node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 56123 --strictPort` — pass（ブラウザーでK-GG画面とWebGL描画を確認、console error 0件）
- `deno run --no-lock -A node_modules/typescript/bin/tsc -b` — pass
- `deno run --no-lock -A node_modules/eslint/bin/eslint.js src/lib/webgl.ts src/lib/effectShaderParity.test.ts src/lib/imageGradientProtected.test.ts src/lib/webglExportPrograms.test.ts` — pass
- `deno run --no-lock -A node_modules/eslint/bin/eslint.js .` — timeout（120秒、診断出力なし）
- 型だけを修正した`src/lib/webglExportPrograms.test.ts`の再実行 — blocked（Deno上でVitest workerへNode専用`--experimental-import-meta-resolve`が渡り起動不可）。修正前の同テストを含む全317件はpassし、修正後のTypeScript検査はpass
- `npm run docs:check`、`npm run docs:build`、`npm test`、`npm run lint`、`npm run build` — blocked（`node`／`npm`がPATHに存在しない）
