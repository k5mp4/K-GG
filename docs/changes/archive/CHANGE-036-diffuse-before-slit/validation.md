# Validation

CHANGE-036の受け入れ条件に対する検証記録。実装前の回帰テスト失敗、実装後のRender Planと既存描画経路の確認、全体検証結果を記録する。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit | `src/lib/effectPipeline.test.ts`、`Diffuse → Slit`のAnalytic Prefix境界とFBO計画 | pass |
| AC-002 | source / unit | `src/lib/webgl.ts`、`src/shaders/postprocess/main.glsl`、既存のDiffuse遅延評価経路 | pass（既存の`diffuseAfterSlit`経路とshaderの出力座標評価を確認） |
| AC-003 | regression | `src/lib/effectPipeline.test.ts`、Diffuse→Glass等の既存Prefix境界 | pass |
| AC-004 | regression / docs | `npm test`、`npm run docs:check`、`npm run docs:build`、`npm run lint`、`npm run build` | pass |

## Commands

- `npx vitest run src/lib/effectPipeline.test.ts --run`
- `npx vitest run src/lib/effectPipeline.test.ts src/lib/effectShaderParity.test.ts --run`
- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## 実行結果

- `npx vitest run src/lib/effectPipeline.test.ts --run`（実装前） — fail（2 tests failed、現行コードがDiffuseをAnalytic Prefixへ消費）
- `npx vitest run src/lib/effectPipeline.test.ts --run`（実装後） — pass（1 file、41 tests）
- `npx vitest run src/lib/effectPipeline.test.ts src/lib/effectShaderParity.test.ts --run` — pass（2 files、77 tests）
- `npm test` — pass（71 test files、418 tests）
- `npx eslint src/lib/effectPipeline.ts src/lib/effectPipeline.test.ts` — pass
- `npm run lint` — pass（0 errors、21 warnings。既存component／hook／型警告のみ）
- `npm run build` — pass（既存のTauri dynamic/static importおよびchunk size warningあり）
- `npm run docs:check` — pass（41 legacy specs、7 current specs、26 changes、17 ADRs）
- `npm run docs:build` — pass
- `git diff --check` — pass

## 未確認事項

- ブラウザ上の実描画で、Slitの延長領域へDiffuseのセルが反映されることは未確認。
- 既存の作業ツリーにはCHANGE-028のWebGL関連変更とCHANGE-035のSlit loop変更があるため、今回のfix-owned files以外の差分は変更対象に含めない。

## Post-Fix Quality

- Scope: fix-owned files only（既存の未コミット変更を含むbranch全体はレビュー対象にしない）
- Simplify: skipped（5行の条件追加と既存テストへの回帰追加のみで、抽象化・整理の余地がない機械的に近い最小修正）
- Review: targeted manual（`src/lib/effectPipeline.ts`、`src/lib/effectPipeline.test.ts`、current spec、CHANGE-036のみを確認）
- Residuals: ブラウザ上の実描画目視は未実施。コード経路とShader sourceは確認済み。
- Re-verification: 対象77テスト、全418テスト、Lint、Build、DocsDD、Docs build、差分チェックを実行し、すべてpass。
