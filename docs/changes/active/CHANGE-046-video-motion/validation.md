---
type: change-validation
id: CHANGE-046
status: draft
---

## Merge Gate

- `npm run typecheck`: pass.
- Focused Video Motion tests: pass, 7 files / 79 tests.
- `npm run check:render`: pass, 7 files / 130 tests.
- `npm run check:merge`: pass. Vitest passed 110 files / 588 tests; lint completed with 21 existing warnings and no errors; production build passed with existing dynamic-import and chunk-size warnings.
- `npm run change:check`: pass.
- Focused ESLint for the changed TypeScript files: pass with no warnings.
- SwiftShader compile/link of the dedicated Video Motion shader: pass.
- Browser E2E: PNG, lifecycle, and smoke pass. PNG ZIP reached 79% before the default timeout; an isolated retry then failed to expose the E2E bridge before the test began. No Video Motion shader or page error was reported, and the failing path ran with Video Motion disabled.
- Browser playback with real MP4 and a full export comparison: not run in this environment.
- WebGL shader compile on the local ANGLE/NVIDIA browser session: `Video Motion` reached `APPLIED`; motion field playback with an uploaded MP4 remains not run because the browser file chooser was not exercised.

## Observation

The frame-difference source is intentionally a lightweight fallback. It is suitable for an Effect Stack preview/export session but does not claim codec-vector quality or full-resolution optical-flow accuracy. Export determinism requires the same loaded video element to remain available for the export session. The 32-sample nearest-ramp projection is a deliberate quality/performance compromise and requires representative-video GPU validation. The Motion Debug panel is an observation aid, not a substitute for that validation.
