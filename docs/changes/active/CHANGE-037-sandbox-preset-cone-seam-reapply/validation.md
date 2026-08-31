---
type: validation
id: CHANGE-037
title: SANDBOX Preset Coverage and Cone Color Reapply Seams
status: approved
---

# Validation

実装後の自動検証結果を記録する。仕様変更を伴うため、ブラウザ描画確認と全体ドキュメント検査の結果も未確認事項として分離する。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 SANDBOX設定のPreset保存・復元 | unit / manual | `src/lib/presetModel.diffuse.test.ts`、Preset save helper | pass（Cloth/Coneを含むsnapshotの保持を確認。実UI操作は未確認） |
| AC-002 既存方式の互換性 | unit / source review | `src/types/coneView.test.ts`、`src/lib/coneView.test.ts`、既存shader分岐 | pass（Mirror Repeat／Edge Weldの分岐を維持し、legacy値はEdge Weldへ正規化） |
| AC-003 Gradient ReapplyのRGB補正とalpha保持 | unit / shader source | `src/lib/coneSeam.test.ts`、`src/lib/coneSeam.ts` | pass（raised-cosine、RGB delta、center alpha保持、zero-width境界のCPU/GPU定数一致を確認） |
| AC-004 U／V／四隅の連続性 | unit / manual | `src/lib/coneSeam.test.ts`、Renderer shader source | partial（CPU基準関数で四隅平均色への収束を確認。ブラウザ3×3反復は未確認） |
| AC-005 Preview／Export／Preset互換 | unit / source review | `src/lib/presetModel.diffuse.test.ts`、ConeCanvas共通renderer確認 | partial（round tripと共通rendererを確認。実Preview／Export操作は未確認） |
| AC-006 文書・依存境界 | command | `npm run docs:check`、`npm run docs:build`、依存差分確認 | pass（文書検査・VitePress build成功。CHANGE-037による依存追加なし） |

## Commands

- `npm test -- --run src/lib/coneSeam.test.ts src/types/coneView.test.ts src/lib/coneView.test.ts src/lib/presetModel.diffuse.test.ts` → 4 files / 28 tests passed
- proof-first red run（実装前）: 同上 → coneSeam module missing、reapply index、save helper、normalizerの失敗を確認
- `npm test` → 72 files / 426 tests passed
- `npm run lint` → 成功（error 0、既存warning 21件。React Hook依存、`any`、Fast Refreshなどの既存警告）
- `npm run build` → 成功（1m47s。既存のTauri API dynamic/static import警告と500 kB超chunk警告あり）
- `git diff --check` → 成功
- `npm run docs:check` → 成功（41 legacy specs、8 current specs、28 changes、18 ADRs）
- `npm run docs:build` → 成功（VitePress build complete in 252.48s）
- `docs/code-reviews/20260830-192527/report.md` → CHANGE-037のみをレビュー。validated actionable findingなし、実GPU／目視確認は未実施として記録

## 未確認事項

- Browser webview／Chrome extensionの接続がtimeoutしたため、実際のSANDBOX UI操作、Coneの3×3反復表示、Preview／Exportの目視確認は未実施。
- GPU shaderの実コンパイルは未実施。型・shader sourceテストと既存のrenderer経路確認まで。
- Gradient Reapply関数を既存2方式と同じshaderへ含めるため、既存方式のshaderサイズ・コンパイル負荷がわずかに増える可能性がある。方式別shader variantは別changeで検討する。
- After Effects WIP（ソース、仕様、文書）はCHANGE-037の対象外として保持し、変更していない。
