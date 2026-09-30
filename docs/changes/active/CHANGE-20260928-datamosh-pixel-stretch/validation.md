# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| `pixelStretch` sourceの受理、設定の範囲正規化、既存Presetの補完 | unit | `src/types/datamosh.test.ts` | pass |
| Datamosh programへのPixel Stretch chunkとsource 3の組み込み | unit | `src/lib/webglExportPrograms.test.ts` | pass |
| Datamosh programのWebGL2実コンパイル | e2e | `tests/e2e/shaders.spec.ts`（`npm run check:render`） | pass |
| 伸び・保持・Length・Angle・Refreshの挙動 | simulation | 実際のDatamosh chunkを結合し、ヘッドレスChromiumのWebGL2で256×128の合成入力を複数論理フレーム描画して画素を検査（一時スクリプト、リポジトリ外） | pass |
| 実アプリPreviewでの見た目 | manual | Datamoshを有効化し、SourceをPixel Stretchにしてタイムラインを再生 | pending（Release Gate） |

シミュレーション結果（Strength 0.6、Refresh 0、破損0、Length Variance 0、8×8の明部をx=40〜47に配置）:

- 40フレームで右へ40px伸び（x=87まで）、伸びた色は元の明部と同じ。明部の後方・伸びの前方の暗部は変化しない。
- 明部を別の位置へ移して30フレーム後も、元の伸び（x=87まで）と元の明部位置は残り、新しい位置から29px伸びる。
- Length 20では80フレーム後もx=67（明部端+20px）で止まる。
- Angle 90°では上へ40px伸び、右へは伸びない。
- Refresh 0.5では伸びが残らない。

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Fast validation | `npm run check:merge` | pass（docs check/build、typecheck、unit 205 files / 1228 tests、lint 0 errors、build）。ローカルでは`.claude/worktrees/`配下の別作業ツリーのspecをvitestが拾うため除外して実行 |
| Shader compile | `npm run check:render` | pass |

## Release Gate

- 実GPUのPreviewで、Pixel Stretch sourceの伸びと保持、Angle 0°が右・90°が上であることを目視確認する。
- 4K書き出しでPixel Stretch source選択時の描画時間が許容範囲であることを確認する。

## Observation

- 明るいNoiseアニメーション上でRefresh 0のとき、焼き付きの蓄積が意図した見た目か。
