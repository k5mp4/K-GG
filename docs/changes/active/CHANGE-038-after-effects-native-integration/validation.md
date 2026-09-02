---
type: validation
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: approved
---

# Validation

受け入れ条件ごとの検証結果を実装段階ごとに記録する。After Effects実機を必要とする確認は、Windows x64 Tauri版で再現可能な手順と結果を残す。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 Tauri版のAE接続状態判定 | unit / integration / manual | Rustのプロセス検出・非対応判定、Tauri実機でAE起動・未起動確認 | partial（Rust commandのコンパイルと単体テストは成功、AE実機は未確認） |
| AC-002 PNG送信 | integration / manual | Tauri版Export PanelからPNG送信、AEコンポジションのレイヤー確認 | partial（Tauri経路のビルド成功、AE実機でのレイヤー確認は未実施） |
| AC-003 MOV・MP4送信 | integration / manual | 動画書き出し後の自動送信と手動送信、AEコンポジションのレイヤー確認 | fail / partial（「前回の動画をAEへ送る」による手動送信は成功。書き出し後の自動送信は動作せずK-GGがフリーズする。ネイティブ成果物の自動テスト26件とTauri debug buildは成功） |
| AC-004 Bridge手動起動不要とWeb版互換 | manual | Bridge停止状態のTauri版確認、Web版既存経路の確認 | partial（Web版Bridge契約テスト6件成功、Tauri版Bridgeなしの実機確認は未実施） |
| AC-005 失敗処理とパス安全性 | unit / integration | JSX生成、パスエスケープ、保存失敗、AE未起動、JSX失敗、作業領域削除 | partial（固定JSX、結果JSON、パス境界、サイズ上限、保存キャンセル・copy失敗・cancel時削除・一時的削除失敗の再試行を自動検証。実機失敗経路は未確認） |
| AC-006 レイヤーDTO読み込み | unit / manual | 選択コンポジション・選択レイヤー、空選択、非対応プロパティ確認 | pending |
| AC-007 素材・レンダー結果取り込み | integration / manual | Footage、テキスト、シェイプ、プリコンポの取り込み確認 | pending |
| AC-008 Kagaribi設定変換 | unit / manual | 対応パラメータ、未知パラメータ、式付きプロパティの変換確認 | pending |
| AC-009 文書・配布境界 | command / review | current spec、change、ADR、Tauri設定、利用者向け説明の整合確認 | pass（docs:check/docs:build成功） |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## 実行結果

- `npm test -- --run src/lib/aftereffectsExport.test.ts`: pass（4 tests）
- `npm run lint`: pass（0 errors、既存警告21件）
- `npm run build`: pass（Viteの既存チャンク/import警告あり）
- `npm run docs:check`: pass
- `npm run docs:build`: pass
- `cargo test --manifest-path src-tauri/Cargo.toml`: pass（21 tests）
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass
- `npm test`: pass（436 tests、74 files）

## 追加の3D出力安定性検証

- `npm test -- --run src/lib/coneViewRenderer.test.ts src/lib/webglPerformance.test.ts`: pass（2 files、18 tests）。入力Canvasのサイズ変更時のCanvasTexture再生成、Cone rendererの冪等dispose、context loss/restore後の再描画、失われたcontextでのoptional extension無効化を確認した。
- `npx tsc -p tsconfig.app.json --noEmit`: pass。
- ブラウザ再確認: 修正前は1920×1080から3840×2160へ変更した直後にCone用CanvasTextureの`texSubImage2D(INVALID_VALUE)`を再現した。修正後の同一手順は、検証ブラウザ側で意図的なcontext loss後にWebGL2自体が利用不能となり、実機での再確認を完了できていない。実機確認は未確認として扱う。

## 2026-09-02 MOV・MP4ネイティブ成果物経路の検証

- 原因調査: Tauri WebView上で200 MiBの動画相当ファイルを計測した。旧経路の`readFile`は約2.15秒、`Blob.arrayBuffer()`は約1.52秒、`writeFile`は約3.45秒で、最大event-loop gapは約277 msだった。同じファイルのOSネイティブコピーは約78 msだった。このWebView内コピーは停止要因の一つだが、後述の実機結果から自動送信フリーズの原因をすべて解消するには至っていない。
- 修正内容: FFmpeg出力を`NativeVideoArtifact`として保持し、利用者の保存先へ`copyFile`で保存して、AE送信時は同じ一時ファイルパスをRust commandへ渡す。最終動画の`readFile`、WebView `Blob`化、AE送信用の再`writeFile`を除去した。
- UI・寿命管理: 書き出し完了とPreview復帰をAE送信完了から分離した。AE操作を直列化し、最新操作だけが送信状態を更新する。動画自動送信は実行中1件と待機中1件に制限し、大容量成果物の無制限な滞留を防止した。保存キャンセル、cancel、置換、unmount、送信完了後の成果物解放と、一時的な削除失敗に対する上限付き再試行を追加した。
- `npm test -- --run src/adapters/tauri/videoExportService.native-artifact.test.ts src/adapters/tauri/afterEffectsService.native-artifact.test.ts src/adapters/tauri/exportService.native-artifact.test.ts src/lib/aftereffectsExport.test.ts`: pass（5 files、26 tests）。
- `npx vitest run --exclude ".worktrees/**"`: pass（81 files、466 tests）。既存の`vendor/tweeq/index.es.js.map`欠落によるsource map警告は残るが、テストエラーではない。
- `npm run lint`: pass（0 errors、42 warnings）。リポジトリ内の別worktreeも走査され、既存21 warningsが本体とworktreeで二重表示された。今回差分由来の警告はない。
- `npm run build`: pass。既存のdynamic/static import混在とchunk size警告は残るが、ビルドエラーではない。
- `npm run docs:check`: pass。
- `npm run docs:build`: pass。
- `cargo test --manifest-path src-tauri/Cargo.toml`: pass（21 tests）。
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass。
- `npx tauri build --debug --no-bundle`: pass。`fs:allow-copy-file`を含むcapability生成とWindows debug application buildを確認した。
- 自動レビュー: correctness、project standards、testing、maintainability、security、performance、reliability、frontend race、adversarialの各観点をGPT-5.6 Luna maxで確認した。StrictModeのmounted状態、cancel後の保持、AE状態の競合、未処理reject、削除再試行の指摘を反映し、独立validatorで再確認した。
- 実機確認: 「前回の動画をAEへ送る」による動画の手動送信は成功した。
- 未解消: 「動画書き出し後に自動送信」を有効にした経路は動作せず、K-GGがフリーズする。自動送信経路の追加調査と修正が必要である。
- 未確認: Bridge停止状態での送信、AE側120秒timeout時の最終挙動は未確認である。

## AE送信待ちと保存キャンセルの追加回帰検証

- `src/lib/videoExportLifecycle.test.ts`で、保存成功後にexport sessionを解放し、AE送信の完了を待たずに書き出し処理を完了することを検証する。保存キャンセル・保存失敗では成功表示とAE送信を行わず、送信失敗は切り離した処理内で扱う。
- `src/lib/aeStatusController.test.ts`で、古いAE送信の完了とidleタイマーが最新送信のステータスを上書きしないことを検証する。
- `src/adapters/tauri/exportService.test.ts`で、Tauri保存ダイアログのキャンセルは`false`を返し、ファイル書き込みを行わないことを検証する。
- 前回の実機確認で自動送信時のフリーズが残ったため、統合後のWindows x64 Tauri版で再確認するまで動画送信の受け入れ結果はfail / partialを維持する。

## WebGL validationと動画出力の回帰検証

- 修正前の検証ブラウザで初回描画後に`Enable webgl-lint`を有効化すると、`recordSamplerValues`の`TypeError: Cannot read properties of undefined (reading 'get')`を再現した。これは既存contextへwrapperを再適用してProgram／Uniform追跡Mapを失う経路である。
- 修正後の検証ブラウザで同じValidation切替とCone有効化を行い、同じ`recordSamplerValues`例外および`drawElements(...): no current program`例外の新規発生は確認されなかった。出力サイズ切替も完了した。
- 追加修正後の検証ブラウザでClothを有効化し、Three.jsのCanvasTexture更新を5秒以上継続した。`textureInfo.parameters`、`texParameteri`、`drawElements(...): no current program`の例外は発生しなかった。これはViteブラウザ経路の確認であり、Tauri版のMOV/MP4 encodeとAE送信は未確認である。
- 検証ブラウザはTauriネイティブAPIを提供しないため、Windows x64 Tauri版の実MOV／MP4 encode、保存ダイアログ、AE送信までの実機スモークは未確認である。既存のANGLE shader warningと、Validation有効時に表示される未設定optional uniformの診断ログは残るが、今回の例外とは別経路である。

## 書き出し後の白画面回帰検証

- `src/lib/webgl.ts`のGenerator描画で、`u_ridgeLacunarity`を未定義の`uniforms.ridgeLacunarity`へ渡していたため、WebGL validation環境で`uniform1f(undefined, 2)`が発生していた。宣言済みlocationを使うよう修正し、`src/lib/webglShaderSources.test.ts`で誤参照が再発しないことを確認した。
- `renderBridge.suspendAnimation()`は、停止時に同期実行されるPreview描画が例外を投げると停止フラグを残していた。例外時にフラグを解除して再送可能にする回帰テストを`src/lib/renderBridge.test.ts`へ追加した。
- Export sessionが初回フレーム前に終了した場合も、WebGLのProgram／Framebuffer状態を変更済みの可能性があるため、`endExportSession()`が常にPreviewを復元するよう修正した。3D出力向けの処理済みCanvas通知もBridgeのPreview復元経路へ統合した。
- Windows x64 Tauri開発版で、1920×1080・5秒・MP4 Highの書き出しを実行した。進捗は`7% → 22% → 56% → 保存中`と進行し、Tauri/WebViewは全工程で応答状態を維持した。保存ダイアログの上書き確認を確定後、K-GGのPreview・タイムラインが通常表示へ復帰し、動画ファイル（1,688,848 bytes）が生成された。白画面は再現しなかった。
- この実機確認はPR #40統合前の実装に対する結果である。統合後の自動AE送信は未確認とする。

## 2026-09-03 PR #40統合後の検証

- `npx vitest run src/lib/videoExportLifecycle.test.ts src/lib/aeStatusController.test.ts src/adapters/tauri/exportService.test.ts src/adapters/tauri/videoExportService.native-artifact.test.ts src/adapters/tauri/exportService.native-artifact.test.ts src/adapters/tauri/afterEffectsService.native-artifact.test.ts src/lib/aftereffectsExport.test.ts src/lib/renderBridge.test.ts src/lib/coneViewRenderer.test.ts src/lib/webglPerformance.test.ts src/lib/webglShaderSources.test.ts`: pass（11 files、76 tests）。
- `npx tsc -p tsconfig.app.json --noEmit`: pass。
- `npm test`: pass（84 files、481 tests）。既存の`vendor/tweeq/index.es.js.map`欠落によるsource map警告は残るが、テストエラーではない。
- `npm run lint`: pass（0 errors、既存21 warnings）。今回差分由来の警告はない。
- `npm run build`: pass。既存のdynamic/static import混在とchunk size警告は残るが、ビルドエラーではない。
- `cargo test --manifest-path src-tauri/Cargo.toml`: pass（21 tests）。
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass。
- `npm run docs:check`: pass。
- `npm run docs:build`: pass。
- 未確認: 統合後のWindows x64 Tauri版で、書き出し後の自動AE送信中もK-GGが応答し、動画がアクティブコンポジションへ追加されること。

After Effects本体を使ったWindows x64の手動スモークは一部実施済みで、動画の手動再送は成功した。起動中検出、PNG、自動動画送信、Bridge停止確認は完了していない。P1レイヤーDTO、P2素材/レンダー、P3設定変換も未実装である。
