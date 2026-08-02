# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `src/lib/effectPipeline.test.ts`、Effect Stackのランダム化ボタン | pass: 全9種類を含むランダム順序とブラウザー操作を確認 |
| AC-002 | unit | `src/lib/effectPipeline.test.ts`、ランダム化後の順列と`enabled`値 | pass |
| AC-003 | unit / manual | `src/lib/effectPipeline.test.ts`、Preset保存・再読込、固定段確認 | pass: 遷移・ランダム化は主スタックだけを対象に実装 |
| AC-004 | unit / source review / manual | `src/lib/effectPipeline.test.ts`、主スタック行とToggleのAltクリック | pass: `enabled`を主スタック全体へ適用し、同じ対象の再Altクリックで捕捉済み状態を復元する経路、行／Toggle双方のAltクリック経路、ソロ化で新たに無効化された行の黄色`STAY`表示を確認。ブラウザーでAltソロ、`STAY`表示、再Altクリックによる復帰を確認済み |
| AC-005 | unit | `src/lib/effectPipeline.test.ts`、保存値に`solo`キーがないこと | pass |
| AC-006 | manual | 通常クリック、トグル、ドラッグ並べ替え | pass: 既存の行操作経路を維持 |
| AC-007 | unit / source review | `src/lib/effectStackTransition.test.ts`、`src/lib/renderSceneAtTime.ts`、`src/lib/webgl.ts`、`src/components/PostprocessStackPanel.tsx` | partial: 400ms easeInOutのWebGLクロスフェードと、Effect Stack行のFLIP補正による現在位置基準アニメーション実装・単体テストはpass。遷移中の画面を目視するブラウザー確認は未実施 |
| AC-008 | unit / source review | `src/lib/effectStackTransition.test.ts`、`src/hooks/useWebGL.ts` | pass: 遷移状態はexportへ渡さず、完了時に確定する経路を確認 |

## Commands

- `node.exe node_modules/typescript/bin/tsc -b --pretty false`
- `node.exe node_modules/vitest/vitest.mjs run`
- `node.exe node_modules/eslint/bin/eslint.js .`
- `node.exe node_modules/vite/bin/vite.js build`
- `node.exe tools/check-docs.mjs`
- `node.exe node_modules/vitepress/bin/vitepress.js build docs`

実行結果: TypeScript型チェック成功、Vitest 52ファイル／264テスト成功、ESLint 0エラー・24警告、Vite build成功（既存のchunk-size warningのみ）。

## 未確認事項

- 遷移中の画面ブレンドはブラウザーCDPのタイムアウトにより目視未確認。
