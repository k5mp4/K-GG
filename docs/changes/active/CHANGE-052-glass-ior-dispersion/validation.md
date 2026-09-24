# Validation

## Merge Gate

- Focused Glass parameter／Preset／shader route／UI tests: `npm test -- src/lib/glass.test.ts src/store/gradientStore.glass.test.ts src/lib/webglShaderSources.test.ts src/lib/effectShaderParity.test.ts src/lib/sceneEvaluation.glass.test.ts src/lib/glassTileShader.test.ts src/components/PostprocessPanel.test.tsx` — 12 files、169 tests passed. This includes Organic/Ripple defaults and round-trip, Ripple controls on both shader routes, IOR/Chromatic Steps uniforms, and legacy Glass input normalization. Vite warned that `vendor/tweeq/index.es.js.map` is missing.
- `npm run check:render` — 14 files、256 tests passed.
- `npm run check:e2e` — 5/5 passed in 4.1 minutes, including browser Canvas checkpoints, PNG export, ZIP export, and WebGL lifecycle recovery. This run verifies the general browser/export paths, not a manual visual comparison of Ripple output. It used Chromium software rendering; it does not establish fixed-GPU appearance or performance.
- `npm run change:check` — passed.
- `npm run check:docs` — passed (41 legacy specs, 9 Current Specs, 42 Changes, and 20 ADRs checked; VitePress build completed).
- `npm run lint` — passed with 0 errors and 43 warnings. Warnings are in existing files, including the existing `.worktrees` checkout; none are in the changed Glass files.
- `npm run typecheck` — blocked by the existing unrelated `src/components/DockPanel.tsx(61,3): TS6133 'headerEnd' is declared but its value is never read.` No Glass TypeScript errors were reported.
- `npm run check:merge` — Docs passed, then the full unit suite stopped on one unrelated existing failure in `src/lib/glassTile.test.ts`: expected `edgeModeIndex: 1`, received `2`. `src/lib/glassTile.test.ts` and `src/lib/glassTile.ts` are unchanged. Before stopping, 195/196 test files and 1082/1083 tests passed. The composite command did not reach its lint or build steps; lint was run separately as recorded above.
- `git diff --check` — passed. A source/current-spec scan found no Fluted implementation or Glass surface-type references to Fluted.

### Ripple loop and lenticular profile follow-up (2026-09-25)

- Proof-first focused run initially failed on the new Ripple speed default/uniform, preset round trip, and UI contract; those failures were the intended missing behavior before implementation.
- `npm test -- src/lib/glass.test.ts src/store/gradientStore.glass.test.ts src/lib/effectShaderParity.test.ts src/components/PostprocessPanel.test.tsx src/lib/postprocessAnimation.test.ts` — 9 files, 169 tests passed. Vite reported the existing missing `vendor/tweeq/index.es.js.map` source map.
- `npm run check:render` — 14 files, 256 tests passed.
- `npm run change:check` — passed; 8 active Changes and 34 archive entries checked.
- `npm run check:docs` — passed; 41 legacy specs, 9 Current Specs, 42 Changes, and 20 ADRs checked; VitePress build completed.
- `npm run lint` — passed with 0 errors and 43 existing warnings; none are in the changed Glass/Ripple files.
- `git diff --check` — passed.
- `npm run typecheck` — blocked by the existing unrelated `src/components/DockPanel.tsx(61,3): TS6133 'headerEnd' is declared but its value is never read.` No errors were reported in the changed Ripple code.

### Faceted continuous triangular surface follow-up (2026-09-25)

- Focused Glass parameter／Preset／shader parity／UI／animation tests: `npm test -- src/lib/glass.test.ts src/store/gradientStore.glass.test.ts src/lib/effectShaderParity.test.ts src/components/PostprocessPanel.test.tsx src/lib/postprocessAnimation.test.ts` — 9 files、172 tests passed. The shader parity test verifies the Faceted height function matches between the full and dedicated Glass programs, and the preset/UI tests cover Faceted controls and persistence.
- `npm run check:render` — 14 files、257 tests passed.
- `npm run check:e2e` — 5/5 passed in 9.2 minutes. This verifies browser startup, general Canvas rendering, PNG/ZIP export, worker preset import, and WebGL resource recovery; it does not select Faceted or establish its visual distinction from GlassTile.
- `npm run change:check` — passed after updating the active Change Capsule.
- `npm run check:docs` — passed; 41 legacy specs, 9 Current Specs, 42 Changes, and 20 ADRs checked; VitePress build completed.
- `npm run lint` — passed with 0 errors and 43 existing warnings; none are in the changed Faceted files.
- `git diff --check` — passed.
- `npm run typecheck` — blocked by the existing unrelated `src/components/DockPanel.tsx(61,3): TS6133 'headerEnd' is declared but its value is never read.` No errors were reported in the changed Faceted code.

### GlassTile Faceted relocation follow-up (2026-09-25)

- Faceted was removed from Glass Surface Type and added as GlassTile Pattern index 5. It now uses a seeded, shared-vertex triangular height field in the dedicated GlassTile shader; GlassTile Triangle retains its separate domed/beveled-cell model. The controls and preset fields moved to `glassTileFacetDensity` and `glassTileFacetDepth`.
- The focused run exposed a pre-existing GlassTile contract mismatch: the shared enum registry and renderer default to Mirror (index 2), while the unit assertion expected index 1 and the Current Spec said Tile. The assertion and Current Spec now follow the implemented Mirror default; no renderer behavior changed for this correction.
- Focused UI／Preset／GlassTile normalizer／shader-source／parameter-registry／animation tests: `npm test -- src/lib/glass.test.ts src/lib/glassTile.test.ts src/lib/glassTileShader.test.ts src/lib/effectShaderParity.test.ts src/components/PostprocessPanel.test.tsx src/lib/postprocessAnimation.test.ts src/store/gradientStore.glass.test.ts packages/kgg-control/src/parameters.test.ts` — 13 files、193 tests passed. Vite reported the existing missing `vendor/tweeq/index.es.js.map` source map.
- `npm run check:render` — 14 files、257 tests passed.
- `npm run change:check` — passed; 8 active Changes and 34 archive entries checked.
- `npm run check:docs` — passed; 41 legacy specs、9 Current Specs、42 Changes、20 ADRs checked and VitePress built.
- `npm run check:merge` — Docs passed; full unit suite passed (196 files、1091 tests); lint passed with 0 errors and 43 existing warnings; offline license catalog passed (447 components). The build phase stopped at the pre-existing typecheck error `src/components/DockPanel.tsx(61,3): TS6133 'headerEnd' is declared but its value is never read.` Vite production build did not run.
- `git diff --check` — passed.
- Browser/GPU visual comparison of GlassTile Faceted against Triangle／Hexagon in Preview and Export — not run.

## Release Gate / Observation

- Manually compare Organic and Ripple at multiple Frequency/Depth values, and inspect tile-edge continuity at IOR 1.0, 1.5, and 2.5 — not run.
- Preview the Ripple loop at Animation Speed 1, 2, 4, and 8; check the loop seam and lenticular band profile in both Preview and Export — not run.
- Compare GlassTile Faceted with Triangle／Hexagon at several density/depth settings, and inspect the continuous facet edges in Preview and Export — not run.
- Visually compare Chromatic Steps 1, 2, and 3 on both shader routes — not run. Steps 1 retains each route's previous sampling branch in source; pixel-level equivalence has not been visually checked.
- Record a hardware GPU/browser and high-resolution performance at Ripple and Chromatic Steps 3 — not run.

## 未確認・既知の検査制約

- Full Merge Gate is not green until the existing GlassTile assertion and `DockPanel.tsx` type error are resolved or otherwise accounted for.
- Automated E2E covers browser rendering and exports but does not assert the appearance of the new Ripple profile.
- No hardware-GPU observation or manual Glass visual inspection has been performed.
