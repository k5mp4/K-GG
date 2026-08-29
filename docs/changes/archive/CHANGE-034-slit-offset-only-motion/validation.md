---
id: CHANGE-034
status: archived
---

# CHANGE-034 検証記録

> 実装と自動検証は完了。Source Imageの実ブラウザー表示は接続タイムアウトのため未確認で、JSXの表示順と既存ハンドラをソースレビューで確認した。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | source review / build | `src/components/SlitScanPanel.tsx` | pass |
| AC-002 | unit | `src/lib/presetModel.slit.test.ts`、`src/store/gradientStore.animation.test.ts`、`src/lib/sceneEvaluation.glass.test.ts` | pass |
| AC-003 | unit / shader parity | `src/lib/sceneEvaluation.glass.test.ts`、`src/lib/effectShaderParity.test.ts`、`src/lib/webgl.ts` | pass |
| AC-004 | unit | `src/lib/sceneEvaluation.glass.test.ts`、全回帰テスト | pass |
| AC-005 | automated | Commands below、`git diff --check` | pass |
| AC-006 | source review / manual | `src/components/SlitScanPanel.tsx` | pass |

MotionをLoop／PingPongとOffset Speedだけにし、Phase Speed／Phase MotionのUI入口がないことを確認した。新規状態・Presetから廃止キーと旧トラックを除去し、旧値をOffset Speedへ変換せず、静的`slitPhase`を保持することを確認した。Legacy GeneratorとEffect Stack V2の両経路でphase speed計算を削除し、Offset Speedのみを使用することを確認した。Preview評価時刻とExportの秒ベース時刻の一致、Loop／PingPongとOffset Speed 0の動作を確認した。Source ImageをSeed／Shuffleの後、プロパティモジュール末尾へ移動し、読込・削除・エラー表示の既存ハンドラを維持したことを確認した。

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`
- `git diff --check`

## 実行結果

- `npm test -- src/lib/sceneEvaluation.glass.test.ts src/lib/effectShaderParity.test.ts src/lib/presetModel.slit.test.ts src/store/gradientStore.animation.test.ts --run` — pass（4 files、47 tests）
- `npm test` — pass（70 files、409 tests）
- `npm run lint` — pass
- `npm run docs:check` — pass（41 legacy specs、7 current specs、24 changes、17 ADRs）
- `npm run docs:build` — pass
- `npm run build` — pass（Node 20.12.2に対するViteの要件警告、既存のTauri dynamic import警告、500 kB超chunk警告あり）
- `git diff --check` — pass（GitのLF→CRLF警告のみ）

## 未確認事項

- ローカル開発ブラウザーでのSlitプロパティモジュールの実表示と、Source Imageのクリック操作による画面上の確認。ブラウザー接続はタイムアウトしたが、Source ImageのJSX配置と読込・削除・エラー表示ハンドラはソースレビュー済み。
