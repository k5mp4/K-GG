---
type: change-validation
id: CHANGE-048
status: draft
---

# Validation

## Acceptance Criteria

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit | `src/lib/effectPipeline.test.ts` — Coneの正規化、選択、順序、solo、render plan | pass |
| AC-002 | shader source characterization | `src/lib/webglShaderSources.test.ts` — 前段`u_sourceTex`参照、Gradient Rampでの再着色なし、Cone mode dispatch | pass |
| AC-003 | Preview／Export plumbing | `src/lib/renderFrame.test.ts`, `src/store/gradientStore.effectPipeline.test.ts` | pass |
| AC-004 | component and control API | Effect Stack／Postprocess／SANDBOX tests、`src/lib/kggControlRuntime.test.ts`, `packages/kgg-control/src/scenarios.test.ts` | pass |
| AC-005 | existing Cone color/seam behavior | `src/lib/coneSeam.test.ts`, `src/lib/coneViewRenderer.test.ts` | pass |
| AC-006 | Cone parameter propagation | `LatestState.coneView`の必須化、`src/lib/presetThumbnail.test.ts`、ローカルBrowser実GPU確認 | pass |

## Merge Gate

- Focused Vitest: 13 files / 114 tests pass.
- TypeScript build-mode check, `node node_modules/typescript/bin/tsc --build tsconfig.json --pretty false`: pass.
- Render gate: 7 files / 134 tests pass.
- Full Vitest: 113 files / 603 tests pass.
- ESLint: 0 errors, 21 existing warnings (React hook dependency, Fast Refresh export shape, explicit `any`, and unused catch variables outside this change).
- Frontend production build: pass. Existing Tauri mixed static/dynamic import and chunk-size warnings remain non-fatal.
- Documentation check: pass (41 legacy specs, 8 current specs, 38 changes, 19 ADRs).
- Documentation build: pass.
- Change structural check: pass on `codex/cone-effect-stack`.
- `git diff --check`: pass.
- Vitest prints a non-fatal missing source map warning for the shared checkout's `vendor/tweeq/index.es.js.map`.
- Characterization-first evidence: before the normalizer and shader pass were implemented, Cone was dropped from the canonical stack and the expected Cone shader pass was absent (2 tests failed, 58 passed). Before control API allowlisting was updated, the new Cone scenario command test failed with `expected true, received false` (1 failed, 15 passed).
- Parameter propagation evidence: `LatestState.coneView`を必須化した直後のTypeScript checkで、Previewの`GradientCanvas`とPreset thumbnailがCone設定を描画状態へ含めていないことを検出。その後、両経路へ正規化済み設定を渡してcheckがpass。

## Release Gate

- ローカルBrowser／ANGLE (NVIDIA GeForce RTX 3060 Ti, D3D11)でCone選択、toggle、dragを確認: pass。ConeをGlassより前へ移動し、両レイヤーが`APPLIED`になって後段Glassを含む描画が更新されることを確認。
- 同環境でCone投影後も既存4色がHistogramとCanvasに残り、単色Gradientへ置換されないことを目視確認: pass。
- 同環境でDepth `6 → 20`、Rotation `0° → 135°`、Texture Repeat `1 → 3`、Apex位置のドラッグを順に行い、各操作後にPreview Canvasの画像signatureが直前値から変化することを確認: pass。
- randomize／solo、全Seam Mode、alpha、複数aspect ratio、Apex端位置の網羅的目視確認: not run.
- 静止画、連番、動画ExportとのPreview parityおよびタイル出力の実機確認: not run.
- Rust/Tauriコード変更なし。Native validation: not run.

## Observation

- ローカルBrowser上の実GPU compile／基本描画は確認済みです。初回`stackCore` compileはparallel compile watchdog後の同期確認を経て`APPLIED`になり、コンソールにGLSL compile/link errorはありませんでした。
- Exportと網羅的なSeam／alpha／aspect ratio確認は未実施です。

## Commands

- `node node_modules/vitest/vitest.mjs run src/lib/effectPipeline.test.ts src/lib/webglShaderSources.test.ts src/lib/renderFrame.test.ts src/components/PostprocessStackPanel.test.tsx src/components/PostprocessPanel.test.tsx src/components/SandboxPanel.test.tsx src/lib/coneSeam.test.ts src/lib/coneViewRenderer.test.ts src/store/gradientStore.effectPipeline.test.ts src/lib/effectStackDrag.test.ts src/lib/kggControlRuntime.test.ts packages/kgg-control/src/scenarios.test.ts src/lib/presetThumbnail.test.ts`: 13 files / 114 tests pass.
- `node node_modules/vitest/vitest.mjs run src/lib/effectPipeline.test.ts src/lib/effectShaderParity.test.ts src/lib/webglExportPrograms.test.ts src/lib/webglShaderSources.test.ts src/lib/webglNormalMapParity.test.ts src/lib/webglPerformance.test.ts src/lib/tileRender.test.ts`: 7 files / 134 tests pass.
- `node node_modules/vitest/vitest.mjs run --exclude=tests/e2e/**/*.spec.ts`: 113 files / 603 tests pass.
- `node node_modules/typescript/bin/tsc --build tsconfig.json --pretty false`: pass.
- `node node_modules/eslint/bin/eslint.js .`: pass with 21 warnings and 0 errors.
- `node node_modules/vite/bin/vite.js build`: pass with non-fatal existing warnings.
- `node tools/check-docs.mjs`: pass.
- `node node_modules/vitepress/bin/vitepress.js build docs`: pass.
- `node tools/change-workflow.mjs check`: pass.
- `git diff --check`: pass.
