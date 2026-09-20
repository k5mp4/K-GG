# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 共通レジストリ整合 | typecheckと静的差分確認 | packages/kgg-control/src/parameterLimits.ts、SliderField、documentModel | PASS（typecheck、正規化経路を確認） |
| AC-002 Voronoi設定と保存互換 | typecheck、シェーダーソース・正規化の確認 | src/lib/webgl.ts、src/shaders/postprocess、PostprocessPanel | PASS（typecheck、シェーダー・保存経路を確認。GPU描画は未確認） |
| AC-003 コミット分割とmain起点 | origin/mainとのGit履歴確認 | codex/unified-parameters-voronoi | PASS（d36ce92起点、独立コミット2件） |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Documentation structure | npm run change:check | PASS |
| Documentation build | npm run docs:check と npm run docs:build | PASS |
| Static code checks | npm run typecheck と npm run lint | PASS（Lintはエラー0、未変更行に警告21件） |
| Production build | npm run build | PASS（ViteのTauri import/chunk size警告あり。エラーではない） |
| Render checks | npm run check:render | 未実行。テストは依頼範囲外のため実行しない |

## Release Gate

実GPUでのセル形状、解像度別の描画、Tile／動画出力を使ったVoronoiの見た目確認は未実施です。Voronoiのセル内サンプルは全体UVをタイルローカル座標へ変換しますが、サンプル先が描画タイル外の場合は境界へクランプされるため、大きなセルやタイル端での一致は要確認です。変更はDraft PRで人間レビューを依頼します。

## Observation

通常のPreview、Preset読込、範囲外数値の正規化、Postprocess VoronoiのNoise Voronoiとの選択肢一致を確認対象とします。

## Commands

- npm run change:check
- npm run docs:check
- npm run docs:build
- npm run typecheck
- npm run lint
- npm run build
- git diff --check HEAD

`npm ci` は成功しました。依存監査は中9件・高7件の脆弱性を報告しましたが、package.json／lockfileに変更はありません。`npm run check:merge` は`npm test`を含むため未実行です。`npm test`、`npm run check:render`、GPU／手動描画確認も実行していません。
