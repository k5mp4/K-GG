# MOVコーデックと品質の検証

## Merge Gate

- Adapterのコーデック・品質既定値、明示指定、MOV以外へ設定を渡さない境界を検証する。
- 形式登録表で検出コーデックのみ表示し、旧バックエンドではAnimationを維持する。
- RustでH.264のCRF、ProResのprofile／pix_fmt、Animation保持、未知ID／品質の拒否を検証する。
- `npm run check:merge`: pass。132ファイル・919テスト、lint、型、frontend build、docs check/build。追加した`npm test -- src/components/ExportPanel.mov.test.tsx`も3テストpass。UI既定H.264／Balanced、Animation選択時の品質非表示、旧バックエンドを確認した。
- `npm run check:native`: pass。Rust 62テストpass、実GPU用の2テストは既存のignored、`cargo check`もpass。
- `npm run check:e2e`: pass。PNG保存、PNG ZIPとPreview復帰、ライセンス、WebGL全programの4テスト。
- `npm run change:check`: pass。Current Specにdeltaを統合済み。人間レビュー前なのでCapsuleはfeature branchのActiveに保持し、merge前にfinalizeする。
- `git diff --check`: pass。

最初の実行はCドライブの容量不足でfrontend buildとRustとE2Eが失敗した。今回生成したRust targetをEドライブへ移し、既存キャッシュの絶対パス参照をjunctionで保持して再実行した結果は上記のpass。環境設定をリポジトリへ追加していない。

警告はエラーではない。既存lint警告21件、vendor/tweeqのsource map欠落、Viteの500kB超chunk、E2Eの色環境変数とoptimizeDeps非推奨の警告が残る。

## 表示・差分確認

Browserの実UIでMOV／H.264／Balancedを表示し、288pxのプロパティパネル内で選択欄と説明が収まることを確認した。390px viewportでは既存の折り畳みUIになるため、MOV操作のモバイル検証は未確認。証跡はローカルの`test-results/mov-controls.png`。

ce-simplify-codeで重複・品質・効率を確認し、MOV／MP4のH.264 armを統合した。独立したce-code-reviewは2回ともworkspace routingのタイムアウトで完了しなかったため、完成したレビューとは扱わない。Code review: skipped (ce-code-review unavailable)。代わりにホストが差分を読み、MOVのenum許可リスト、検出・DTO・UIの対応、品質既定値、既存パス検証、保存・解放・AE経路への影響を確認した。残る指摘はない。PR／merge前のレビューは別途必要。

## Native Release Gate

`npm run check:ffmpeg`はWindowsの実FFmpeg／ffprobeでpass。H.264 MOV、ProRes HQ／422／LT、Animation MOV、MP4についてコーデック、pixel format、寸法、4フレーム、非空ファイル、一時領域の解放を確認した。元映像の品質・サイズ比較は未実施。

別の5秒・1920×1080・30fpsの`testsrc2`映像で、qtrle／rgb24は42,533,091 bytes、H.264／CRF22／slowは4,341,694 bytes（約89.8%削減）だった。入力生成は`ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=30:duration=5 -c:v qtrle -pix_fmt rgb24`、圧縮は生成MOVを入力にアプリと同じBalanced引数を指定した。元の681MBの映像とは異なるため、その削減率は保証しない。画質の目視比較は未実施。

## 未確認

Tauri UI、After Effects、macOSは未実施。Browser／Rust／実FFmpegの成功で代替せず、リリース前に別途確認する。
