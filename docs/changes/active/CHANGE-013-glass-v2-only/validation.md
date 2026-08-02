# Validation

## 受け入れ条件

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | source review / browser未実施 | `src/components/PostprocessStackPanel.tsx`、EffectStackKind、利用者向けヘルプ | partial: StackのGlass表記とGlass V2行の除去をコードで確認。実機DOM操作は未実施 |
| AC-002 | unit / shader parity | `src/lib/effectPipeline.test.ts`、`src/lib/webglCompilePolicy.test.ts`、`src/lib/webglExportPrograms.test.ts` | pass |
| AC-003 | unit | `src/lib/effectPipeline.test.ts`の旧`glass`／`glassV2`統合テスト | pass |
| AC-004 | unit / source review | `src/lib/glass.test.ts`、`src/lib/effectShaderParity.test.ts`、`src/components/PostprocessPanel.tsx` | partial: 80px上限と色調整経路は確認。実機UI表示は未実施 |
| AC-005 | unit | `src/lib/glass.test.ts`、`src/lib/effectShaderParity.test.ts`、`src/lib/glass.ts` | pass |
| AC-006 | unit / source review | 全Vitest、`src/lib/webgl.ts`、`src/hooks/useWebGL.ts` | pass: 統合後の正規化Effect Pipelineと既存共通export経路を確認 |
| AC-007 | regression / source review | `src/lib/webglCompilePolicy.test.ts`、`src/lib/webglExportPrograms.test.ts`、`src/lib/effectPipeline.test.ts` | pass |
| AC-008 | docs / build | `tools/check-docs.mjs`、VitePress docs build | pass |
| AC-009 | source review / browser未実施 | `src/components/PostprocessPanel.tsx` | partial: プロパティ選択肢は`glassV2`を表示名Glassとする一つだけになった。実機DOM操作は未実施 |
| AC-010 | unit | `src/lib/postprocessStack.test.ts`、`src/store/gradientStore.postprocessStack.test.ts`、`src/store/gradientStore.glass.test.ts` | pass |
| AC-011 | source review / browser未実施 | `src/components/PostprocessPanel.tsx`、`vendor/tweeq/index.d.ts` | partial: 2項目ともTweeq InputColorへ置換しnative color inputを除去。実機操作は未実施 |
| AC-012 | unit / source review | `src/lib/postprocessStack.test.ts`、`src/store/gradientStore.postprocessStack.test.ts`、`src/components/PostprocessPanel.tsx` | pass: 正規化後はGlass V2のみが残り、旧Glass分岐へ到達しない |
| AC-013 | source review / browser partial | `src/components/PostprocessPanel.tsx`、ブラウザー実測 | partial: 2項目へ同一の`GLASS_COLOR_INPUT_CLASS`（`w-[132px] flex-none`）を適用。修正前はFlex縮小で幅が113.5px／132.9pxに分かれることを実測し、修正後の再実測はブラウザーCDPタイムアウトで未確認 |

## Commands

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run docs:check`
- `npm run docs:build`
- `node_modules/vitest/vitest.mjs run src/lib/postprocessStack.test.ts src/store/gradientStore.postprocessStack.test.ts src/store/gradientStore.glass.test.ts src/lib/glass.test.ts src/lib/postprocessAnimation.test.ts`

実行環境のPATHにnpmがないため、上記package script相当をNode.js 24.4.1の絶対パスから実行した。

```text
Vitest: 52 files / 264 tests passed
TypeScript: tsc -b passed
ESLint: 0 errors / 24 existing warnings
Vite build: passed; existing chunk-size warning only
DocDD check: passed
VitePress docs build: passed
```

CI再現確認: `src/lib/effectShaderParity.test.ts`のGlass V2 uniformブロック比較がWindowsのCRLF／LF差分に依存していたため、比較前に改行をLFへ正規化した。対象テスト23件、全Vitest 264件で再確認済み。

## 未確認事項

- Effect Stackのブラウザー実機操作、Previewでの表示確認、Glassを有効にした実機exportは未実施。
- Postprocessプロパティの実機DOM操作、InputColorのブラウザー操作、Glassを有効にした実機exportは未実施。
- 追加要求によるInputColor幅の修正は承認済みで実装済み。修正後の実機DOM幅確認が未実施のため、CHANGE-013は受け入れ確認待ちとしてactiveに保持する。
