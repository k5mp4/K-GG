# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 共通レジストリ整合 | check:fast、パラメータ契約テスト | packages/kgg-control/src/parameterLimits.ts、SliderField、documentModel | PASS（全体581テスト、共通範囲と既定値のテストを確認） |
| AC-002 Voronoi設定と保存互換 | check:fastとcheck:render、シェーダーソース・正規化テスト | src/lib/postprocessVoronoi.test.ts、src/lib/effectShaderParity.test.ts、src/shaders/postprocess | PASS（描画関連127テスト、保存互換を確認。実GPUの目視は未確認） |
| AC-003 コミット分割とmain起点 | origin/mainとのGit履歴確認 | codex/unified-parameters-voronoi | PASS（main起点。パラメータ統合とVoronoi改善を別コミットに分割） |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Documentation structure/build | npm run change:check、npm run check:fast | PASS |
| Automated tests | npm run check:fast | PASS（107ファイル、581テスト） |
| Static code checks | npm run check:fast | PASS（型チェック成功、Lintはエラー0・警告21件） |
| Production build | npm run check:fast | PASS（Tauri import/chunk sizeの警告あり。エラーではない） |
| Render checks | npm run check:render | PASS（7ファイル、127テスト） |

## Release Gate

実GPUでのセル形状、解像度別の描画、Tile／動画出力を使ったVoronoiの見た目確認は未実施です。Voronoiのセル内サンプルは全体UVをタイルローカル座標へ変換しますが、サンプル先が描画タイル外の場合は境界へクランプされるため、大きなセルやタイル端での一致は要確認です。変更はDraft PRで人間レビューを依頼します。

## Observation

通常のPreview、Preset読込、範囲外数値の正規化、Postprocess VoronoiのNoise Voronoiとの選択肢一致を確認対象とします。

## Commands

- npm run change:check
- npm run docs:check
- npm run docs:build
- npm run check:fast
- npm run check:render
- npm test -- packages/kgg-control/src/parameters.test.ts src/lib/parameterLimits.test.ts src/lib/glassTile.test.ts src/lib/postprocessVoronoi.test.ts src/lib/effectShaderParity.test.ts
- git diff --check HEAD

`npm ci` は成功しました。依存監査は中9件・高7件の脆弱性を報告しましたが、package.json／lockfileに変更はありません。VitestはTweeqのsource map欠落をログに出しますが、テストは成功しています。GPU／手動描画確認は未実施です。
