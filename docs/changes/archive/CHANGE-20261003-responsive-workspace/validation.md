# 検証記録

2026-10-03、Windows／Chromium（SwiftShader）で検証。実機確認は自動テストと分けて記録する。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | 設定確認・browser | `src-tauri/tauri.conf.json`、`tests/e2e/workspace-layout.spec.ts` | 最小設定640×480。幅320／640／800／1024／1440のbrowser検証 |
| AC-002 | browser | `tests/e2e/workspace-layout.spec.ts` | 開閉・Escape・focus復帰・非表示bodyと非選択moduleのfocus抑止 |
| AC-003 | unit・browser | `src/features/workspace/workspaceLayout.test.ts`、`tests/e2e/workspace-layout.spec.ts` | 幅の予算配分、480px高でTimeline216px以下／Preview200px超 |
| AC-004 | browser | `tests/e2e/workspace-layout.spec.ts` | ホイールで一覧scroll、Preview倍率保持、touchのpreventDefault抑止、末尾Texture到達、drag並べ替え |
| AC-005 | unit・browser | 同上 | Canvas同一node、Export入力値、選択module、希望panel幅／Timeline高さの復元 |
| AC-006 | コード確認・unit | `workspaceLayout.ts`、`useWorkspaceLayout.ts`、`DockPanel.tsx` | policy／実寸観測／表示を分離 |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| 全体チェック | `npm run check:merge` | pass。133 files／925 tests、docs check/build、typecheck、lint、frontend build |
| Responsive browser | `npx playwright test --project=workspace-layout` | pass。1 integration test（38.8s）、全体47.9s。focus・scroll・drag・寸法／状態復元を含む |
| Native自動チェック | `npm run check:native` | pass。connector build、Rust 61 tests pass／2 GPU tests ignored、cargo check |
| Docs構造・参照 | `npm run change:check` | pass。既存7件に本Changeを加えActive 8件、Archive 46件 |
| 差分形式 | `git diff --check` | pass |

lintは0 errors／既存21 warnings。vendor Tweeqの不足sourcemapとfrontend buildの大きいchunk警告が残る。ブラウザー起動の色設定・Vite手動optimizerの非推奨警告もエラーではない。

## レビューで修正した操作

- ツール内のホイールをviewportがpreventDefaultしてscrollできない問題を、browser testの失敗で再現し修正。touch／中ボタンも操作UI境界で除外した。
- compact Effect Stackのpointerdownがプロパティ表示通知を呼び、ドラッグ中にツールを閉じる問題を、browser testの失敗で再現し修正。選択のみのcallbackを分離し、ドラッグ後も表示を保って順序変更できることを検証する。
- 非表示Histogramのサンプリングを停止し、通常pointermoveでresize用DOM寸法を読まないようにした。

最終コードレビューはcorrectness、project standards、testing、maintainability、adversarial、frontend racesの観点で実施し、現在差分の未解決指摘は0件。人間レビューと実機確認の代替とはしない。

## Release Gate

Tauri／WebView2実機で640×480まで縮小できること、Close／Escape、effect並べ替え、Timeline操作を確認する。今回はTauri実ウインドウを起動していない。

## Observation

OS表示倍率、実タッチ端末、native Effect Stack別ウインドウのdetach／reattach、Timelineの全設定操作は未確認。GLSL・描画pipeline・Preset／Export契約は変更していないため`check:render`は対象外。

## 人間レビュー

ADRはproposed、人間レビューはrequiredのままとする。追加指示に従いcommit／push／ドラフトPR作成を行う。Issue作成は対象外。人間レビュー完了後、Merge前にCurrent Spec／ADRを同期し`change:finalize`を実施する。未確認の実機動作だけを理由にActiveへ残しているわけではない。

## 2026-10-04 CI書き出しテストの修正

[PR #107の失敗ログ](https://github.com/k5mp4/K-GG/actions/runs/37120262965/job/111194856512)では、小画面テストはpassし、PNG／ZIPテストがExportボタンの検索でtimeoutした。上部タブのaccessible nameは`Export Off`だが、既存テストは`/^Export$/i`を全画面から探していた。非選択moduleをinertにしたことで、その検索は上部タブにも非選択パネル内にも一致しなくなった。

`tests/e2e/export.spec.ts`でnavigation内のExportタブを指定し、`aria-pressed=true`とExport moduleのinert解除を確認する。PNGの寸法／画素比較とZIPのframe検証は維持する。修正前の180秒timeoutをローカルでも再現し、修正後はPNGがpassした。

- `npm run check:merge`: pass。925 tests、lint 0 errors／既存21 warnings、typecheck、build、docs check/build。
- `CI=1 npm run check:e2e -- --retries=0`: pass。5 tests、2.9分、再試行なし。小画面操作、PNG画素比較、ZIPの6 framesとPreview復帰、ライセンス／Worker、全WebGL2 programの実コンパイルを検証。
- 初回の全体E2Eでは小画面テストもdrag途中で一度timeoutし、再試行は42.3秒でpass。PNG pass後に実行を中断し、全体チェック終了後にE2E一式を再実行した。
- 差分はテストと本検証記録のみ。小さな操作先指定の修正のため追加のsimplify／専用reviewは省略し、差分を手動確認する。
- この修正でRust／Tauri設定は変更していないためNative自動チェックの再実行は対象外。実機確認と人間レビューは引き続き未実施。
