---
title: macOSデスクトップ版の検証
---

# macOSデスクトップ版の検証

## Merge Gate

- `npm run change:check`
- `npm run check:merge`
- `npm run check:native`
- macOS runnerで`npm run check:ffmpeg`が`ffmpeg`/`ffprobe`、qtrle、libx264、MOV/MP4メタデータを確認する。
- macOS runnerでarm64の`.app`と`.dmg`が生成される。
- macOS runnerで生成した`.app`とDMG内の`.app`に対し、`codesign --verify --deep --strict --verbose=2`、`codesign -dv --verbose=4`の`Signature=adhoc`を確認する。
- Windows runnerで既存のnative checkとNSIS buildが成功する。

## Release Gate（macOS実機未確認）

- arm64/Intel DMGをmacOS実機で起動し、Ad-hoc署名・未公証によるGatekeeper警告を記録する。
- macOSのFFmpeg PATH導入済み・未導入で、MOV/MP4とエラーUIを確認する。
- qtrle MOV、libx264 MP4、PNG ZIP、システムフォント、Figma loopback、connectorフォルダー表示を確認する。
- After EffectsがmacOSで利用不可と表示され、Windows x64の既存連携が維持されることを確認する。
- Windows `latest.json`と署名済みupdater artifactが変わらず、macOS DMGが同じDraft Releaseへ追加されることを確認する。

この作業環境ではmacOS runner・macOS実機・Homebrew・Gatekeeperを実行できないため、上記をローカルpassとは扱わない。
