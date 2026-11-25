# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| dock表示でLayersカラムがPreviewと重ならず、Layers→Properties→Previewの順に並ぶ | e2e | `tests/e2e/workspace-layout.spec.ts`（docked Layers column…） | pass |
| Timelineの開閉・高さで表示方法が変わらない | unit / e2e | `src/features/workspace/workspaceLayout.test.ts`、`tests/e2e/workspace-layout.spec.ts` | pass |
| 全レイヤー名が省略されない（216px） | e2e / browser | `tests/e2e/workspace-layout.spec.ts`。1440×900で`Distort Chroma`は97px／表示幅103px | pass |
| 幅不足時は左右パネルより先にレールへ切り替わり、幅が戻ればカラムへ戻る | unit / e2e | `workspaceLayout.test.ts`（1100×800でrail）、e2e | pass |
| 手動のレール折りたたみ・展開、レールからのレイヤー選択とドラッグ並べ替え（カラムへ戻した後も順序が保たれる） | e2e | `tests/e2e/workspace-layout.spec.ts` | pass |
| 折りたたみ・展開時に幅（280ms）と内容のフェード（220ms）がアニメーションする | browser | 1440×900で`getAnimations()`により`width`のCSSTransitionと`effect-stack-layers-in`を確認 | pass |
| native別ウインドウ表示中はLayersを隠しPreviewへ幅を返す | unit | `workspaceLayout.test.ts`（layersDetached） | pass（Tauri実機はRelease Gate） |
| 1000px未満ではPreviewを覆うdrawerを使わず、左overlayのレイヤー／プロパティ切替で全レイヤーへ到達できる | e2e | `tests/e2e/workspace-layout.spec.ts`（640×480の並べ替え、スクロール、選択） | pass |
| Histogramは既定で非表示、設定でONにすると右パネルのセクションに表示される | e2e / browser | `tests/e2e/licenses.spec.ts`、`workspace-layout.spec.ts`、ブラウザーで設定スイッチから確認 | pass |
| 1440×900でPreview幅616px、1920幅で1000px以上 | unit | `workspaceLayout.test.ts` | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pass（lintは既存ファイルの警告のみ、エラー0） |
| Change structure | `npm run change:check` | pass |
| Workspace layout E2E | `npx playwright test --project=workspace-layout` | pass（2件） |
| Licenses E2E | `npx playwright test --project=licenses` | pass |

## Release Gate

- Tauri（WebView2）実機で、Effect Stack別ウインドウを開閉したときにLayersカラムが隠れ・戻ること。
- Tauri実機のFHD・1440幅ノートPCで、カラム幅216pxとOS表示倍率での名前の省略がないこと。

## Observation

- `vj-performance` E2Eの`failed or cancelled preload preserves the live document and ready cues remain usable`は、変更前のコードでも同じ環境で失敗した（`Start auto switching`がdisabledのまま）。本Changeとは無関係の既存の不安定性として扱う。同プロジェクトの他2件は本ブランチでpass。

## Commands

- `npm run docs:check`
- `npm run change:check`
- `npm run check:merge`
- `npx playwright test --config=playwright.config.ts --project=workspace-layout`
