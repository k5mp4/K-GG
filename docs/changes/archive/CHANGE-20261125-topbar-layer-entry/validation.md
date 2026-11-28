# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| TOPバーにレイヤータブがなく、「編集中」、SANDBOX、Export、Presetだけが並ぶ | unit / e2e | `src/features/workspace/tabs.test.ts`、`tests/e2e/workspace-layout.spec.ts` | pass |
| 「編集中」が選択中レイヤー名を示し、モードから選択中レイヤーのプロパティへ戻れる | unit / e2e | `tabs.test.ts`（resolveEditingLayer）、`workspace-layout.spec.ts` | pass |
| Postprocess系レイヤーに`Edit Layer`と全体ON／OFFがなく、見出しにレイヤー名とON／OFFが出る | unit / e2e | `src/components/PostprocessPanel.test.tsx`、`workspace-layout.spec.ts` | pass |
| ExportとPresetに副ラベルが出ない | e2e | `workspace-layout.spec.ts`（navのaccessible nameが`Export` / `Preset`） | pass |
| プロパティモジュールの内部IDは不変 | unit | `tabs.test.ts`（LEFT_TABS） | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pass（unit 1193、lintエラー0・既存警告のみ、build） |
| Change structure | `npm run change:check` | pass |
| E2E | `npx playwright test --project=workspace-layout --project=export-png --project=licenses` | pass |

## Release Gate

- Tauri（WebView2）実機で、TOPバーの「編集中」とLayersカラムからの編集導線を確認する。

## Observation

- `vj-performance`の`failed or cancelled preload preserves the live document and ready cues remain usable`は、変更前から同じ環境で失敗している（#124のvalidationを参照）。同プロジェクトの他2件はpass。

## Commands

- `npm run docs:check`
- `npm run change:check`
- `npm run check:merge`
