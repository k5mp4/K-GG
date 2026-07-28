# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 color mode preview | browser manual / build | `src/components/GradientRamp.tsx`, existing ramp color evaluation | pass |
| AC-002 interpolation preview | browser manual / build | `src/components/GradientRamp.tsx`, existing ramp color evaluation | pass |
| AC-003 always-visible toggle | browser interaction | `src/components/CustomSelect.tsx`, `src/components/GradientRamp.tsx` | pass |
| AC-004 header removal | browser manual / grep | `src/App.tsx`, `src/i18n/messages.ts` | pass |
| AC-005 delete icon | browser screenshot / build | `src/components/Icon.tsx`, `src/components/IconButton.tsx` | pass |
| AC-006 harmony palette generator | unit / browser manual | `src/lib/colorHarmony.test.ts`, `src/components/ColorPaletteGenerator.tsx`, tweeq `InputColor` | pass |
| AC-007 compatibility | unit / build | existing gradient and preset tests | pass |

## Commands

- `npm run docs:check` — passed
- `npm run docs:build` — passed
- `npm test` — passed (45 files / 229 tests)
- `npm run lint` — passed (24 existing warnings, 0 errors)
- `npm run build` — passed (既存のチャンクサイズ警告あり)

## Browser manual

ブラウザー確認済み: Color Mode／Interpの候補プレビュー、Show previews／Hide previews切替、tweeqのInputColorによる基準色1色の指定、補色の追加1色・トライアドの追加2色を含む配色チップ、Gradient適用、不要見出しの消失、配色補助に不要な色数・Hex入力がないことを確認した。deleteアイコンはパスとbuildで確認済み。色チップのクリックコピーはDOMのaria-labelで確認した。

## Command results

- `npm run docs:check` — pass（Archive移動前後とも成功、41 legacy specs、4 current specs、4 changes、13 ADRs）
- `npm run docs:build` — pass
- `npm test` — pass（45 test files、229 tests）
- `npm run lint` — pass（0 errors、既存warning 24件）
- `npm run build` — pass（既存のchunk size warning 1件）

lint warningは既存のReact Hook依存関係、`any`、未使用catch等です。build warningは既存の大きなchunkに関するものです。ドキュメントコマンドには実行環境由来の`RequestsDependencyWarning`が表示されますが、検査・ビルドは成功しています。
