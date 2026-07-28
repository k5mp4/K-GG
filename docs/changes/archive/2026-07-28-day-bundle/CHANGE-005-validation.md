# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 preview color visibility | browser DOM / unit fixture | `src/lib/gradientPreview.test.ts`, `src/components/GradientRamp.tsx` | pass |
| AC-002 preview label readability | browser screenshot / browser interaction | `src/components/CustomSelect.tsx` | pass |
| AC-003 always-visible parity | browser DOM / browser interaction | `src/components/CustomSelect.tsx`, `src/components/GradientRamp.tsx` | pass |
| AC-004 generator sections | browser screenshot / DOM text | `src/components/ColorPaletteGenerator.tsx`, `src/i18n/messages.ts` | pass |
| AC-005 contrast | WCAG 2.2 calculation / browser manual | palette helper description and section background | pass |
| AC-006 compatibility | TypeScript / ESLint / browser runtime | existing gradient, palette, and preset integration | partial |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Browser manual

Color Mode／Interpのホバー選択肢とShow previewsの両方で色帯が黒化しないこと、ラベルが潰れないこと、画像からのストップ生成と配色補助が別区分で表示されること、説明文の視認性をブラウザーで確認した。Option previewsの15候補で色帯とチェッカーの両方、`background-size: 100% 100%, 8px 8px`、前面ラベルをDOMで確認した。配色補助説明はテーマ色の不透明度合成で約9.31:1となり、通常文字の4.5:1基準を満たす。

## Command results

- TypeScript compiler API（`tsconfig.app.json`） — pass（diagnostics 0件）
- ESLint API（`eslint .` 相当） — pass（0 errors、既存warning 24件）
- Browser runtime — pass（Vite開発サーバーで対象UIを再描画、console error 0件）
- `npm test` / `npm run build` / `npm run docs:check` / `npm run docs:build` — not-run（このシェル環境では`npm`／`node`実行ファイルがPATHに存在せず、Vitepress／Vitest APIも実行環境のパス制約で起動不可）

未確認事項: 上記4つのnpmコマンドの再実行結果は未確認。既存の変更前検証結果と、今回の型チェック・Lint・ブラウザー確認を記録している。
