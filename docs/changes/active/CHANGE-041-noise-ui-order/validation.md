---
type: validation
id: CHANGE-041
title: Noise UI共通プロパティとタイプ順序
status: approved
---

# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 共通プロパティ順序 | component test / source review | `src/components/NoiseDistortionPanel.tsx`、NoiseパネルのDOM順序 | 自動テスト pass（focused file 5 tests）。Type直後を `Amount`、`Scale`、`Seed` の順に配置し、Seed行を1つへ統合。ブラウザDOMの手動確認は未実施。 |
| AC-002 Type一覧順序 | component test | `src/components/NoiseDistortionPanel.tsx`、Type選択肢 | 自動テスト pass。11候補を `Fast Curl`、`Curl (Legacy)`、`Simplex`、`fBm`、`Aura Ridges`、`Fractal Drift`、`Domain Warp`、`Seamless`、`Voronoi`、`Caustics`、`Phasor Lines` の順で確認。 |
| AC-003 Type-specific設定の維持 | source review / full test suite | 全11 Typeの条件分岐、狭幅パネル | Type-specificの既存条件分岐とコントロールは維持し、Curl系Seedの重複表示を除去。Seedキー選択の3ケースを自動テストで確認し、`npm test` pass。全Typeのブラウザ表示と狭幅レイアウトは未確認。 |
| AC-004 保存・描画互換性 | full test / build / source review | Preset、Reset、Undo/Redo、Noise preview | `npm test`、`npm run build` pass。変更は表示順と既存Seedキーへのルーティングに限定し、描画・Preset・Undo/Redoの実装は変更なし。実操作の手動確認は未実施。 |

## Commands

- `npm test -- --run src/components/NoiseDistortionPanel.test.tsx` — 1 file / 5 tests passed。vendor/tweeqのsource map欠落警告あり（既存警告）。
- `npm test` — 78 files / 448 tests passed。vendor/tweeqのsource map欠落警告あり（既存警告）。
- `npm run lint` — 0 errors / 21 warnings。既存ファイルの警告のみ。
- `npm run build` — 成功。Tauri dynamic importと500 kB超chunkの既存警告あり。
- `npm run docs:check` — 成功（41 legacy specs、8 current specs、31 changes、18 ADRs）。
- `npm run docs:build` — 成功。
- `git diff --check` — 成功。
- Impeccable detector — `[]`。

## 未確認事項

- ブラウザ上での通常幅・狭幅の表示確認、全11 Typeの切替確認、Preset／Reset／Undo／Redo／Noise previewの実操作確認は、この環境でブラウザ操作手段が利用できないため未実施。
- そのため、このchangeは `active` に残し、手動確認後にArchiveへ移動する。
