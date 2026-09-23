---
title: 配布安全性の検証
---

# 配布安全性の検証

## Merge Gate

- 不正追加エントリ・CRC不一致は変更前に失敗、変更後に成功を確認。
- ZIP64・サイズ偽装・ファイル読込前上限・Worker期限超過・キャンセルを回帰テストで確認。
- Rustの許可されない保存先では既存ファイルの内容が保持され、許可した保存先ではコピーできることを確認。
- `npm run check:merge`: 成功。1,077テスト、typecheck、lint、frontend/docs buildを通過。lintの42警告、既存Tweeq source map欠落、bundleサイズ・import混在の警告は残るがエラーではない。
- `npm run check:native`: 35テストとcargo check成功。
- `npm run release:check`、`npm run change:check`、`npm audit --omit=dev --audit-level=moderate`: 成功。production npm依存の既知脆弱性0件。
- Browser E2E: PNG・PNG ZIP・Previewのcheckpointは成功。lifecycleはファイル更新によるreloadで一度中断し、更新を止めた専用サーバーで再実行して成功。ライセンスとWorkerの検証は別projectで実施し、`npx playwright test --project=licenses --retries=0`が成功（専用ポート4193、CI=1）。検索、chroma-jsの本文表示、GSAPの不在、実WorkerによるZIP読込み、console/page error不在を確認。
- 実表示で遅延読込みが完了しない問題を検出し、ライセンスを静的に同梱する方式へ変更して再検証した。本文は展開した項目だけDOMへ載せる。

## Release Gate（未確認）

- 実WebView2で起動し、CSP下のライセンス表示、Preset Worker、画像、動画、フォント、ウィンドウ分離を確認。
- OS保存ダイアログでMOV/MP4を保存し、拒否パス・キャンセル・上書き・再実行を確認。
- 旧版から正しい更新署名で更新でき、改ざんしたasset・署名で失敗することを隔離したテストリリースで確認。
- 初回インストーラーはAuthenticode未署名。更新署名では初回配布元を認証できないため、公式GitHub Releaseの案内を維持する。

GitHub側の設定変更・Issue作成は今回の依頼に含まれない。上記は公開前にmaintainerが確認し、必要に応じてIssueへ追跡する。
