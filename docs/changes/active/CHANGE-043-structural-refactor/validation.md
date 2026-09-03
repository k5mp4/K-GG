# Validation

外部挙動を変えない構造変更として、既存契約のcharacterizationと通常のMerge Gateを分けて記録する。

## Acceptance criteria

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | characterization / unit | `src/lib/*`, `src/store/*` の既存契約テスト | pass: 全体178 files / 985 tests、追加境界テストを含む |
| AC-002 | architecture review | `docs/development/architecture.md`, import boundary | pass: architecture mapとfeature/type/application境界を同期 |
| AC-003 | render parity | RenderPlan/Shader/既存render tests、代表Golden | pass: Render Gate 14 files / 240 tests、Golden plan/input contract pass。実GPU画像はRelease Gate |
| AC-004 | persistence parity | Preset roundtrip/legacy normalization tests | pass: 全体テストとPreset/thumbnail関連テスト pass |
| AC-005 | export parity | renderBridge/video/tile/adapter tests | pass: 全体テストとrender/export focused 140 tests pass |
| AC-006 | control parity | `kggControlRuntime.test.ts`, MCP verification | pass: runtime/MCP control tests pass。接続中MCPの実機往復は未実施 |
| AC-007 | quality gate | `npm test`, `npm run lint`, `npm run build`, docs/native focused checks | pass: Merge相当の個別チェック、Render/Native/Docs各Gate pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Tests | `npm test` | pass: 178 files / 985 tests。vendorのsource map warningあり |
| Lint | `npm run lint` | pass: 0 errors。既存warning 42件は変更対象外を含む |
| Build | `npm run build` | pass: 444 modules。既存のdynamic import/chunk size warningあり |
| Docs | `npm run docs:check` / `npm run docs:build` | pass |
| Render | `npm run check:render` | pass: 14 files / 240 tests |
| Native | `npm run check:native` when applicable | pass: Rust 21 tests、cargo check |
| Diff | `git diff --check` | pass |

## Release Gate

自動検証は完了した。実GPU/WebGL context lost/restore、Tauri、FFmpeg、After Effects、狭幅UI、長時間動画出力、Golden画像の実機確認は未実施であり、Release/Observationとして残す。自動テストでは代表条件のinput/Render Planを固定し、画像一致そのものは判定していない。

## Observation

既存warningの増減、React rerender、shader compile、texture/FBO allocation、export speed、メモリを代表条件で比較する。新しい性能閾値は導入しない。今回のローカル実行では実GPUの性能比較と長時間出力観測は未実施である。

## Commands

- `npm test`
- `npm run lint`
- `npm run build`
- `npm run docs:check`
- `npm run docs:build`
- `npm run check:render`
- `npm run check:native`
- `git diff --check`
