# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 rotary containment | browser DOM / screenshot | `src/App.css`, Slit Angle／Offset Angle | pass |
| AC-002 compact Angle | browser DOM / screenshot | `src/components/SliderField.tsx`, `src/components/TimelineBar.tsx` | pass |
| AC-003 behavior compatibility | unit / browser interaction | `src/lib/tweeqAngle.test.ts` and existing effect/animation tests | pass |
| AC-004 quality | lint / build / docs | project validation commands | pass |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`

## Browser manual

Vite開発サーバー上でSlitのAngle／Offset Angleを確認し、InputAngleの境界245×26px、ロータリーとSVGの26×26px、数値欄211×26pxが収まることを確認した。Animation方向も112×26px内に収まり、ロータリーとSVGが境界外へ出ないことを確認した。アプリCSS内に誤った`button[tweak-mode]`セレクターが残っていないことも確認した。

## Command results

以下を実行済み。

- `npm run docs:check` — pass（41 legacy specs、4 current specs、3 changes、13 ADRs）
- `npm run docs:build` — pass
- `npm test -- --run` — pass（44 files、225 tests）
- `npm run lint` — pass（0 errors、既存warning 24件）
- `npm run build` — pass（既存chunk size warning 1件）

lint warningは既存のReact Hook依存関係、`any`、未使用catch等です。build warningは既存の大きなchunkに関するものです。ドキュメントコマンドには実行環境由来の`RequestsDependencyWarning`が表示されますが、検査・ビルドは成功しています。
