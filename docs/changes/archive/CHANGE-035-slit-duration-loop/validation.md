# Validation

CHANGE-035の受け入れ条件に対する検証記録。実装前の再現テストで既存の不一致を確認し、実装後に境界位相、Legacy／V2経路、回帰テストを確認した。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / regression | `src/lib/slitAnimation.test.ts`、`src/lib/sceneEvaluation.glass.test.ts` | pass |
| AC-002 | unit | `src/lib/slitAnimation.test.ts` | pass |
| AC-003 | source / regression | `src/lib/webgl.ts`、`src/lib/effectShaderParity.test.ts`、`src/lib/sceneEvaluation.glass.test.ts` | pass |
| AC-004 | regression / docs | `npm test`、`npm run docs:check`、`npm run docs:build`、`npm run lint`、`npm run build` | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## 未確認事項

- ブラウザ上の実描画で、既定5秒ループの目視確認は未実施。shaderが周期関数であることと、Legacy／V2のuniform位相計算はsource／unitで確認済み。
- 既存の作業ツリーにはCHANGE-028のWebGL関連変更があり、今回の修正ではそれらを変更対象に含めない。

## 実行結果

- `npx vitest run src/lib/sceneEvaluation.glass.test.ts --run`（実装前） — fail（再現テストが0秒位相`0`と5秒位相`0.5`の差を検出）
- `npx vitest run src/lib/slitAnimation.test.ts src/lib/sceneEvaluation.glass.test.ts src/lib/effectShaderParity.test.ts --run` — pass（3 files、47 tests）
- `npx eslint src/lib/slitAnimation.ts` — pass
- `git diff --check` — pass
- `npm run docs:check` — pass（41 legacy specs、7 current specs、25 changes、17 ADRs）
- `npm run docs:build` — pass
- `npm test` — pass（71 test files、416 tests）
- `npm run lint` — pass（0 errors、21 warnings。既存component／hook／型警告のみ）
- `npm run build` — pass（既存のTauri dynamic/static importおよびchunk size warningあり）

## Post-Fix Quality

- Scope: fix-owned files only（既存の未コミットWebGL変更と同居する`src/lib/webgl.ts`は、Slitの3箇所だけを変更）
- Simplify: 実施。新規ヘルパーを3観点で確認し、速度絶対値の重複を整理した。Flow専用関数の再利用は責務結合を増やすため見送り、サイクル数のキャッシュは設定変更時の無効化を増やす割に効果が小さいため見送った。
- Review: targeted manual due to unrelated branch work。既存差分全体をレビュー対象にせず、Slit修正ファイルと関連呼び出しだけを確認した。
- Residuals: なし。ブラウザ実描画の目視のみ未確認事項として記録。
- Re-verification: ポストフィックス変更後に対象3ファイル47テスト、ヘルパーLint、差分チェックを再実行し、全てpass。
