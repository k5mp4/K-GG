---
title: Releaseと環境検証
---

# Releaseと環境検証

ReleaseはMergeとは別の判断です。CIのMerge Gateが成功しても、GPU、Tauri、FFmpeg、After Effects、installer、updaterの確認が済んだとは限りません。

## Release Gateチェックリスト

- Windows x64 Tauri installerが起動する。
- updater署名、`latest.json`、draft Release assetが整合する。
- FFmpegが未導入・導入済みの両方でMOV/MP4出力を確認する。
- After Effects連携を対象バージョンで確認する。
- 実GPUでPreview、Preview/Export parity、context lost/restoredを確認する。
- 必要なPreset互換、保存先、キャンセル、再試行を確認する。

未確認の項目があれば、対象ChangeをActiveへ戻しません。GitHub Issueに環境、再現手順、期待結果、Release前提を記録し、Archiveの`follow_up`から参照できる状態にします。Issueがまだ作成できない場合は、PRの未確認事項として明記し、人間が作成します。

## 現行のRelease入口

```sh
npm run release:check
npm run check:release
npm run verify:windows
```

`release:check`はversion、Tauri updater key、tagの整合を確認します。`check:release`はmainのActive境界、Merge Gate、native validationをまとめます。installerの署名鍵や公開はローカル/ GitHub environmentの秘密情報を必要とするため、通常のPRでは実行しません。

## GitHub設定（管理者操作）

現状のリポジトリには`main`のbranch protection/rulesetがなく、merged branch自動削除も無効です。少人数開発の最小設定として、管理者が次を検討します。

- `main`へのPull Request必須
- required status checksに`Determine validation scope`と`fast-check`を登録し、変更時の`render-check`/`native-check`もrequired checkとして扱えることを確認
- force push禁止
- stale approvalの扱いを明示
- merged branch自動削除を有効化
- 不要なreview人数・CODEOWNERS・外部Botを必須にしない

設定はGitHub側の権限を持つ人が変更し、変更後のRuleset名とrequired check名をPR/開発文書へ反映します。
