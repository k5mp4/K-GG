# CHANGE-022-cloth-ramp-last-shading Validation

## Target Specs and Changes

- CHANGE-022-cloth-ramp-last-shading

## Acceptance Criteria

| AC | 内容 | 検証方法 |
| --- | --- | --- |
| AC-001 | ライティング・スペキュラー・フレネルが白黒シェーディングとしてランプ適用前に計算される | コードレビュー + ブラウザ目視 |
| AC-002 | ピクセルの色が常にグラデーションランプから決定され、ライティング色の濁りや白ハイライトが消える | ブラウザ目視 |
| AC-003 | 廃止キー (lightWeight 等) が型・シェーダー・UIから消え、`rampOffset` が残る | 自動テスト + lint |
| AC-004 | 廃止キーを含む旧 Preset を読み込んでも正常動作する | ブラウザ目視 + 正規化テスト |
| AC-005 | Preview / PNG Export / Tile Export で見た目が一致する | ブラウザ目視 |
| AC-006 | すべての自動テスト、Lint、Build、Docs チェックが成功する | npm スクリプト |

## Validation Plan

1. **自動テスト (`npm test`)**: `tests/clothGradient.test.ts` の廃止キー検証を含む全テストを実行し全件パスすることを確認。
2. **Lint & Check (`npm run lint`, `npm run docs:check`)**: コードおよびドキュメントの整合性チェック通過を確認。
3. **Build & Verify (`npm run build`, `npm run docs:build`)**: TypeScript ビルドと Vitepress ビルドが成功することを確認。
4. **手動確認 (ブラウザ)**: Cloth Gradient ON 時に、山・谷・ハイライトがすべてグラデーションの色相で描画されること、Ramp Offset でランプ位置がずれること、旧 Preset 読み込みが正常なことを確認。

## Commands

```sh
npm test
npm run lint
npm run build
npm run docs:check
npm run docs:build
```

## Execution Log

| 日時 | コマンド | 結果 | 備考 |
| --- | --- | --- | --- |
| 2026-08-05 | `npm test` | Pass | 54 passed (289 tests)、`clothGradient.test.ts` (9 tests) 含む |
| 2026-08-05 | `npm run lint` | Pass | 0 errors, 24 warnings (既存) |
| 2026-08-05 | `npm run build` | Pass | `tsc -b` & `vite build` 成功 |
| 2026-08-05 | `npm run docs:check` | Pass | 11 active changes, 41 legacy specs, 5 current specs, 14 ADRs |
| 2026-08-05 | `npm run docs:build` | Pass | Vitepress ビルド完了 |

## 未確認事項

- ブラウザでの目視確認（白黒シェーディングのランプ適用前計算、グラデーション色相の維持、旧Preset読込、Export一致）は未実施。実行方法:
  1. `npm run dev` で起動し、SANDBOX → Cloth Gradient を ON。
  2. カラフルなグラデーションを設定し、布の山・谷・ハイライトがすべてグラデーションの色相で描画されることを確認。
  3. Specular Strength を上げ、ハイライトが白ではなくグラデーションの明るい色で現れることを確認。
  4. Fresnel Color を変更してもグラデーションの色相が失われないことを確認。
  5. Ramp Offset を動かし、ランプ全体の位置がずれることを確認。
  6. Preview / PNG Export / Tile Export で見た目が一致することを確認。
  7. 旧 Preset (lightWeight 等を含む) を読み込み、正常に動作することを確認。
