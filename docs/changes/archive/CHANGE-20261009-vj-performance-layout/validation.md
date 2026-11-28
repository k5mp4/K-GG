# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| VJ-001 レイアウト・復帰・canvas維持 | unit / browser | `src/adapters/tauri/vjWindow.test.ts`, `tests/e2e/vj-performance.spec.ts`, `tests/e2e/workspace-layout.spec.ts` | pass |
| VJ-002・003 次候補・4拍・遅延・BPM | unit / browser | `src/features/vj/vjPlayback.test.ts`, `tests/e2e/vj-performance.spec.ts` | pass |
| VJ-004 共通読み込み・解像度・準備 | unit / browser | `src/lib/applyPreset.test.ts`, `src/lib/shaderWarmup.test.ts`, `tests/e2e/vj-performance.spec.ts` | pass |
| VJ-005・006 合法値・ロック・範囲 | unit / browser | `src/features/vj/vjParameters.test.ts`, `tests/e2e/vj-performance.spec.ts` | pass |
| VJ-007 takeover・復帰・保存 | unit / browser | `src/features/vj/vjDocument.test.ts`, `src/features/vj/vjSettings.test.ts`, `tests/e2e/vj-performance.spec.ts` | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Structural references | `npm run change:check` | pass |
| Fast validation | `npm run check:merge`の構成checkを個別に再実行（下記Commands） | pass |
| Browser | `npm run check:e2e`と対象project再実行（下記Commands） | pass |
| Native compile/test | `npm run check:native` | pass |

## Release Gate

- 未実施: Tauri／WebView2の640×270論理px、OS表示倍率、最大化からの切替・復帰。mock hostは実機確認の代替ではない。
- 未実施: Spout受信側で演奏中の出力解像度が固定されること。ブラウザーではdrawing buffer寸法を確認する。
- commit／Issue／PR作成は直接依頼の範囲外。必要なRelease Gate継続先は公開を依頼された時点で決定する。

## Observation

- 複雑な3D・Datamosh・外部素材Presetの長時間演奏、全ランダム時のGPU負荷、実タッチ操作。
- Chrome自動検証のスクリーンショットで1920×270と640×270を目視確認済み。Main・Next2・リスト・Effect列、640pxでの横スクロールと復帰操作を確認。

## 初回VJ実装のCommands

- `npx vitest run src/features/vj src/adapters/tauri/vjWindow.test.ts src/lib/shaderWarmup.test.ts src/lib/applyPreset.test.ts --maxWorkers=2`: 7 files / 47 tests pass。Noise種類変更でのロック・空範囲保持、不適合モード候補除外、新項目のbounded初期範囲、巡回末尾のNext2、破損Presetの無変更と正常Presetの一括反映を確認。
- `npm test -- --maxWorkers=2`: 最終sourceで151 files / 1094 tests pass。過去の全体チェックでは既存ConeViewPanel／PostprocessPanelが5秒timeoutになったため、同じassertionのままworker数を抑えて全件再実行した。
- `npm run lint`: pass（0 errors / 既存20 warnings）。最終修正後の`npx eslint src/features/vj src/lib/applyPreset.ts src/lib/applyPreset.test.ts tests/e2e/vj-performance.spec.ts`も0 errors / 0 warnings。
- `npm run build`: 最終sourceでpass。license check、TypeScript、Vite build、production bundleにE2E bridgeが含まれないことを確認。
- `npm run docs:check`, `npm run docs:build`, `npm run change:check`: pass。
- `npm run check:merge`: 初回pass（151 files / 1088 tests）。追加修正後の一括実行は既存componentのtimeoutで失敗したため、最終sourceのunit／lint／build／docs／構造checkを個別に再確認して上記結果を得た。一括commandの最終実行をpassと扱っていない。
- `npm run check:e2e`: 初回4 pass／ZIP・licensesの2 timeout。失敗対象を含む`npx playwright test --project=export-zip --project=licenses --project=vj-performance --project=workspace-layout`は4 pass。PNGと全WebGL2 programのコンパイルは初回でpass。
- 最終sourceの`npx playwright test --project=vj-performance --project=workspace-layout`: 追加した準備失敗／退出取消／自動切替の停止取消／再読み込み／破損Presetの無変更シナリオはpass（22.2秒）。SwiftShaderの表示テストと既存workspaceは180秒timeout。
- その2件を`KGG_E2E_GPU=1`, `CI=1`で`npx playwright test --project=vj-performance --project=workspace-layout --grep 'workspace adapts|VJ controls preserve' --retries=0`として再実行: 2 pass（46.1秒）。実GPU、動画記録なしでassertionを維持し、1920×270／640×270、出力寸法・canvas維持、4拍切替、undo、新項目の範囲初期化、再入場時のidentityを確認。
- `npm run check:native`: pass。Rust 69 tests pass／2 tests ignored（DirectX 11実機のSpout検証）、cargo checkとFigma Connector buildもpass。
- 警告はエラーと分離: 既存lint 20 warnings、vendored Tweeqのsource map欠落、Viteのchunk size、PlaywrightのNO_COLORとoptimizeDeps deprecation。新しいVJファイルのlint警告は解消。

## 初回VJ実装の品質確認

`ce-simplify-code`の3観点を実施。Noise seedの既存helperとlayout型を再利用し、拍のstateをVJ子コンポーネントへ分離し、変化のない範囲設定の保存を省いた。小さいhelper抽出とtrack通知省略は、利益と挙動維持の観点から見送った。

`ce-code-review mode:agent`を9観点で完了。run_idは`20261009-120227-vj`、receiptはstatus `complete`／open findings 0。Noise初期値によるロック上書き、新規表示項目のbounded範囲漏れ、巡回末尾のAfter Next欠落、再入場時の古いPreset ID、準備中の自動切替停止、失敗・取消の検証不足、破損Presetの部分適用を修正して回帰確認した。独立validatorも、libraryが受け付けるnull trackの破損Presetで映像とstate参照が変わらず、通知0件であることを確認した。

Tauri復帰APIの失敗時挙動はmockから実機の発生頻度を判断できないため、WebView2／DPI／最大化復帰のRelease Gateで確認する。AIレビューは人間の承認を代替せず、Changeはreview、ADRはproposedを維持する。

## 追加要求: 事前ロードと保存済みフォルダ巡回

2026-10-09の追加Direct requestは、K-GG内の保存済みフォルダを対象とする。全件のCPU／GPU準備、有限のNoise variant保持、同期反映、フォルダの直接／子孫対象、変更追従、退出取消、コンテキスト失効、準備失敗を確認した。描画式・保存形式・出力方式は変更していない。

| Check | Command / Evidence | 結果 |
| --- | --- | --- |
| Unit | `npm test -- --maxWorkers=2` | 最終source: 153 files / 1112 tests pass。任意CPU benchmarkのみ1 file / 1 test skip |
| Lint | `npm run lint`と最終変更ファイルの`npx eslint ...` | 全体0 errors / 既存20 warnings、対象ファイル0 errors / 0 warnings |
| Frontend | `npm run build` | pass。型・license・productionのE2E marker不在も確認 |
| UI・巡回・復旧 | `KGG_E2E_GPU=1`, `CI=1`, `npx playwright test --project=vj-performance --project=workspace-layout --project=lifecycle --retries=0` | 最終source: 5 pass（1.2分）。1920×270／640×270、フォルダ内ループ・子孫包含・移動追従・カスタム復帰・4拍・退出取消・失敗時の映像維持・GPU context復旧とresource解放 |
| Program実コンパイル | `KGG_E2E_GPU=0`, `CI=1`, `npm run check:render -- --retries=0` | 最終source: SwiftShader WebGL2で全72 Program pass（31.0秒） |

フォルダE2Eは準備済み2件を20回切り替え、各click直後の同じタスク内で映像ドキュメントが目的のPresetになったことを確認した。追加prefetch呼び出しは0回。CPU処理は中央値0.8ms／p95 1.3msだった。画面描画・GPU時間は含まない。測定値は`C:/Users/fjkg/.codex/visualizations/2026/10/09/01a11e59-3e16-7370-b11d-9e6756c79121/vj-synchronous-switch.json`へ保存した。

追加のlifecycle検証は、意図的なcontext loss中のShaderコンパイルを失敗としてログ出力するため2回失敗した。復旧・resource解放のassertion自体は成功していた。コンパイル・待機・準備済み判定で失効を扱い、失敗／readyイベントを発行しないよう修正した。ログ除外やassertionの緩和は行わず、lifecycle単独1 pass、上記全5件の再実行でもpass。unitでは準備済み／準備途中の失効と、VJ中の通常バックグラウンド準備停止・退出後再開を追加確認した。

任意の`KGG_BENCHMARK_VJ=1 npx vitest run tests/performance/vj-switch.test.ts --maxWorkers=2`では、128×128の変位マップ付きの2件を各50回反映した。通常clone・正規化経路は中央値3.908ms／p95 8.070ms、準備済み反映は中央値0.021ms／p95 0.057ms。これはdocument反映だけのCPU比較であり、UI handler全体やフレーム時間ではない。`--enable-gpu`でのUIテスト成功も、固定GPUのfingerprint・RGBA品質Gateの証拠とは扱わない。

`ce-simplify-code`のreuse・quality・efficiencyの3観点を完了。死んだloading条件、重複した演奏一覧の検索、切替時の二重patch解決、準備完了時の重複通知を除去した。短いtarget IDの文字列用helperの公開は、利益が小さいため見送った。

追加要求の`ce-code-review mode:agent`（run_id `20261009-1800-preload`）は、オーケストレーターとlocal reviewerが利用上限で終了し、完了receiptを生成できなかった。Claudeルートは`jq`不足でproviderへ送る前に終了し、外部レビューは行っていない。先の完了receiptを今回の差分レビューの代替にしない。

Code review: skipped (ce-code-review unavailable) — 実行時の利用上限でtop-level reviewが終了し、完了receiptを得られないため。残った差分を手動で確認し、live値引継ぎとGPU準備の一致、animation／live値で後から必要になるShader、コンテキスト失効、有限のProgram保持と退出時の解除、folder membership、同期適用、canvas維持をテストと照合した。独立レビュー完了とは扱わず、human_review: requiredを維持する。

終了済みpeer jobの一時ログ削除は自動承認ポリシーで拒否され、ログを保持した。実装・commit・公開の操作は追加していない。Tauri UI／Spout／長時間演奏のRelease GateとObservationは引き続き未実施。

## 追加要求: 自動の範囲内ランダムと有効エフェクト8列

4拍の自動読み込みだけは、次の元Presetに現在の範囲内ランダム設定を事前適用したPreparedPresetを使う。次候補用の1件キャッシュは元のマップを共有し、軽いCPU準備をrequestAnimationFrameで進める。元Presetの手動読み込み・保存データ・出力寸法を維持する。エフェクト欄は有効なlayerだけを1920pxで8列表示し、数値入力とrangeから調整できる。

- Red: `vjDocument.test.ts`の事前ランダム結果・非公開準備・ロック・無効エフェクト保持テストは、関数追加前に期待どおりfail。`vjPresetCache.test.ts`のカスタム準備とルール変更テストも、引数対応前の元Preset値でfail。
- `npm test -- --maxWorkers=2`: 最終sourceで153 files / 1115 tests pass、任意benchmarkのみ1 skip。最初の全体実行では、取消後に既に成功した同じShaderを失敗させる旧mockで1 fail。失敗シナリオを新しい失敗GPU contextに変更し、取消／失敗のassertionを維持して再実行した。
- `npm run lint`: 0 errors / 既存20 warnings。追加差分のscoped lintは0 errors / 0 warnings。
- 初回ブラウザー確認: 8列・数値／range操作・最初の自動反映が指定値0.23であることはpass。999 BPMで次の候補が通常のアイドルtimeoutに間に合わず停止する問題を再現し、自動のCPU準備を次の描画フレームへ変更。対象テストを同じassertionのまま再実行して1 pass（37.4秒）。検証中のsource編集で生じた一時的なHMRのmodule失効もあり、最終実行はsourceを固定する。
- `npm run build`: pass。初回typecheckでは追加テストが存在しないStretchのmap fieldを参照して失敗。実際の`manualDistort.displacement`の参照共有を検証するassertionに訂正し、対象6 testsとbuildを再実行してpass。license check、TypeScript、Vite build、productionのE2E bridge不在を確認。
- `KGG_E2E_GPU=1`, `CI=1`, `npx playwright test --project=vj-performance --project=workspace-layout --retries=0`: VJの3件pass（32.8秒／16.8秒／17.6秒）。有効layer限定の8列・数値入力・range・最初の自動反映・999 BPM・フォルダ巡回を確認。既存workspaceの1件はscroll後に起動画面となりcanvas不在でfail。同じassertionのまま`--project=workspace-layout --retries=0`を単独実行して1 pass（24.3秒）。同時実行時の一時的な起動画面への遷移原因は未特定であり、最初の一括実行をpassと扱わない。
- `npm run check:docs`, `npm run change:check`: pass。追加ファイルのscoped lintとstaged／unstagedのdiff whitespace checkもpass。Viteの既存chunk size警告はエラーではない。
- 1920×270の8列表示を保存画像で目視確認。`C:/Users/fjkg/.codex/visualizations/2026/10/09/01a11e59-3e16-7370-b11d-9e6756c79121/k-gg-vj-eight-effects-1920x270.png`。
- コードレビューのローカル8観点で候補2件を受領。根拠を実装と照合し、ランダム化済みのloaded baselineと元のanimation baselineを分離した。元Presetにkeys trackを持たせ、値復帰でstaticを保持し、明示的なanimation復帰でkeysへ戻るブラウザー回帰を追加。Noiseをsimplexからperlinへランダム変更するテストも追加し、新variantの準備待ち中は無変更、準備後はperlinだけを一括反映、反映時の追加compileなしを確認した（対象13 unit tests pass）。

Code review: skipped (ce-code-review unavailable) — run_id `20261009-200937-bounded`はfailed。ローカル8観点はterminalだが、Claude/acpxはprovider送信前のtransport errorで失敗し、外部レビューは実施されていない。新規job3件の削除が自動承認レビューで「blocked by policy」と拒否され、mandatory cleanupを完了できなかった。さらにhostのagent thread上限でmerge／validator／reportの開始・再利用ができず、complete receiptはない。ログは保持し、削除の再試行や回避をしない。旧receiptやraw候補を独立validatorの検証済みfindingsとして扱わない。

残るcoverage gapは、ルール変更または候補変更がGPU準備途中と重なるシナリオ、および999 BPM再生中の範囲編集。通常のルール変更、取消、999 BPMでの巡回は別の既存テストで確認した。今回の最終修正後のchecks結果は下記へ追記する。実機Tauri／Spout／長時間演奏は引き続きRelease GateまたはObservationとして未確認。Changeはreview、human_reviewはrequired、ADRはproposedを維持する。

### 最終修正後の検証

- `npm test -- --maxWorkers=2`: 153 files / 1116 tests pass、任意benchmarkのみ1 file / 1 test skip（26.60秒）。
- `npm run build`: pass。license、TypeScript、Vite build、production bundleのE2E bridge不在を確認。`npm run lint`: 0 errors / 既存20 warnings。Viteの既存chunk sizeとvendored Tweeqのsource map欠落は警告であり、エラーではない。
- `npm run check:docs`, `npm run change:check`, `git -c core.whitespace=cr-at-eol diff --check`: pass。
- `KGG_E2E_GPU=1`, `CI=1`, `npx playwright test --project=vj-performance --project=workspace-layout --retries=0`: 4 pass（2.0分）。自動読み込み後の数値復帰でstatic trackを保持し、animation復帰で元のkeys trackへ戻ることも確認した。999 BPM、8列・数値入力・range、フォルダ同期切替、通常layout／canvas維持を含む。
- その前の同じ4件ではVJの3件がpass、通常workspaceがnavigationで1 fail。traceで同じpageの再起動を確認した。最終実行はコード・ドキュメント・Git indexを含めて変更を停止して4 pass。再読み込みの原因は特定していないため、前の実行をpassとは扱わない。
- レビュー用に一時stageした14ファイルは、receipt受領後にexact pathsでunstageした。開始時と同じ空のindexへ戻し、変更内容は作業ツリーへ保持した。commit／push／Issue／PR作成は行っていない。

`ce-simplify-code`の3観点を完了。quality 1件（モード変更後のパラメータ収集の共通化）、efficiency 1件（変化のないcache snapshotの通知省略）を適用。数値clamp helperへの置換は短い局所式のため見送り、既存バックグラウンド準備のretention通知待ちへの変更は今回の追加差分を超えるため見送った。scope test 60件とscoped lintで確認した。
