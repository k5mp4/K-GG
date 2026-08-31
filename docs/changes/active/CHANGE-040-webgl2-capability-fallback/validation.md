---
type: validation
id: CHANGE-040
title: WebGL2 Capability Gate for SANDBOX 3D Fallback
status: approved
---

# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 WebGL2非対応時の2D継続とエラー抑止 | unit / source review | `src/lib/webglCapability.test.ts`、`src/hooks/useWebGL.ts` | pass（能力不足を専用エラーとして扱い、useWebGLの通常エラーログを抑止） |
| AC-002 Cone／ClothのThree.js生成前ゲート | unit / source review | `src/lib/coneViewRenderer.test.ts`、各Renderer初期化経路 | pass（取得失敗時はThree.jsを生成せず、成功時は取得済みcontextを渡す） |
| AC-003 再マウント時の再試行抑止 | unit / source review | `src/lib/webglCapability.test.ts`、Canvas fallback経路 | pass（unavailable状態をページ内で共有し、後続のgetContextを抑止） |
| AC-004 WebGL2利用可能時のPreview／Export互換 | unit / source review / manual | `src/lib/coneViewRenderer.test.ts`、Renderer lifecycle、実WebGL環境 | partial（unit／sourceはpass。実GPUのPreview／Export／context復旧は未確認） |
| AC-005 仕様・文書・品質検査 | command | `npm run docs:check`、`npm run docs:build`、通常テスト・lint・build | pass |

## Commands

- `npm test -- --run src/lib/coneViewRenderer.test.ts`（修正前） → 2 failures（context受け渡しなし／失敗時もThree.js生成）
- `npm test -- --run src/lib/webglCapability.test.ts src/lib/coneViewRenderer.test.ts` → 2 files / 8 tests passed
- `npm test` → 77 files / 443 tests passed
- `npm run lint` → error 0、既存warning 21件
- `npm run build` → 成功（既存のTauri dynamic import警告と500 kB超chunk警告あり）
- `npm run docs:check` → 成功（41 legacy specs、8 current specs、30 changes、18 ADRs）
- `npm run docs:build` → 成功（build complete in 75.22s）
- `node C:\Users\fjkg\.agents\skills\impeccable\scripts\detect.mjs --json src/components/ConeCanvas.tsx src/components/ClothCanvas.tsx` → `[]`
- `git diff --check` → 成功

## 未確認事項

- WebGLが有効なブラウザ／Tauri WebViewでの実3D描画、Preview、Export、context lost／restoredの手動確認。
- `Sandboxed = yes` と表示される現在の実行環境で、WebView側のGPU設定を変更した場合の復旧確認。
- ブラウザ自身が出す `[Intervention] Images loaded lazily...` はアプリのWebGL初期化エラーではなく、今回の変更対象外。
