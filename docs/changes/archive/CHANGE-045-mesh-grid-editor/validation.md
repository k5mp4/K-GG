# Validation

## Merge Gate

自動チェックは下記を実行して記録する。

- `npm run check:fast` — typecheck / unit / component / lint / frontend build / docs check/build
- `npm run change:check`
- `npm run check:render` — Shader / WebGL / Render Plan変更時

### 実行結果 (2026-09-07)

| チェック | 結果 | 備考 |
| --- | --- | --- |
| `npx tsc -b` | pass | 型エラーなし |
| `npx vitest run` (全unit/component) | pass | 1020 tests / 181 files |
| `npx eslint .` | pass | 0 errors（既存warningsのみ） |
| `npx vite build` | pass | 448 modules transformed |
| `npm run check:fast` | pass | docs build、unit/component、lint、frontend buildを一括確認 |
| `npm run check:render` | pass | 245 render/WebGL tests / 14 files |
| `npm run change:check` | pass | Active 1件、構造・参照OK |
| `npm run docs:check` | pass | 41 legacy / 8 current / 35 changes / 19 ADRs |

## 受け入れ条件の検証計画

| 受け入れ条件 | 自動 | 手動/ブラウザ |
| --- | --- | --- |
| メッシュ色がランプに全点連動する | `meshGradient.test.ts`（colorPositions保存） | Mesh選択→ランププリセット切替で全体色が追従することを確認 |
| メッシュ途中のRamp stop色が実色へ反映される | `meshGradient.test.ts`（2×2中央で中間stopを連続サンプル） | 初期2×2でRamp途中の色がキャンバス中央にも現れ、Ramp表示と実色が一致することを確認 |
| Ramp stopとMeshの対応が把握できる | — | キャンバスのv位置ガイド線・S番号ラベルと、Ramp上のBL/BR/TL/TR（または各行の点）表示が対応し、各ラベルクリックで同じ点/stopが選択されることを確認 |
| 旧2×2プリセットが従来と同一に見える | `gradient.test.ts`・`meshGradient.test.ts` | 旧プリセットを開き形状・色を確認 |
| グリッド点・内部エッジをドラッグ編集できる | UI unit（可能な範囲） | 3×3以上へ変更し内部点/内部ハンドルをドラッグ |
| グリッド点位置/ベジエ制御点のキーフレームが効く | `sceneEvaluation`テスト | タイムライン再生で一貫した移動を確認 |
| WebGLフォールバック時も制御線・アンカーが表示される | — | WebGL無効化ブラウザでリニア/メッシュの線・ハンドル表示を確認済み |
| MCP操作がUIとパリティを持つ | `kggControlRuntime.test.ts` | loopbackまたはCLIで操作 |

## Observation（手動確認が必要）

- 旧 `pointColors`（直接Hex）を持つプリセットの読込時、色がランプ連動表示へ変わることの許容。
- 実GPUでのテッセレーション品質・描画結果（Release Gate）。
- WebGLフォールバック（2Dプレビュー）時のエフェクト非適用は仕様どおり（バッジで明示）。

## Release Gate / Observation

- 実GPUでのテッセレーション品質・性能は本変更のMerge Gateでは未計測。Archive後にIssueで追跡する（outcome: follow-up）。
