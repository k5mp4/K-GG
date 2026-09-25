---
id: ADR-0021
title: macOSデスクトップ版を外部FFmpegとDMGで試験配布する
status: accepted
date: 2026-09-24
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0021: macOSデスクトップ版を外部FFmpegとDMGで試験配布する

## コンテキスト

K-GGのWindows x64版はNSIS、Tauri updater、Windows専用のAfter Effects連携、K-GG専用FFmpegフォルダーを前提としている。macOS版を追加する際に、Windowsの配布契約やRust境界へmacOS固有の条件を混ぜると、既存の更新と検出順序を壊すリスクがある。

## 決定

- GitHub ActionsでmacOS arm64（`macos-15`）とIntel（`macos-15-intel`）を別ターゲットとしてDMG化する。
- macOSのDMGはAd-hocコード署名を行い、notarizationは行わず、試験配布として明示する。TauriのmacOS bundle設定で`signingIdentity: "-"`を指定する。
- macOSのFFmpegは`ffmpeg`と`ffprobe`をPATHから検出し、`qtrle`と`libx264`をRust側で検証する。Windowsの専用フォルダー優先、PATH・レジストリ参照、`ffmpeg.exe`検証は維持する。
- macOSではTauri Openerを使ってURLとReveal操作をOSへ委譲する。Figma loopbackの通信契約はOS非依存として維持する。
- macOSビルドではupdater artifactを生成せず、Windows release jobが作成した同じDraft ReleaseへDMGを追加する。macOS更新は当面GitHub Releasesからの手動更新とする。
- After Effects自動操作はWindows x64のみとし、macOSでは利用不可をUI・仕様に明示する。

## 理由

Tauriのbundle targetをmacOS用overlayへ分離すると、既存の`nsis`・Windows updater設定を変更せずにDMGを生成できる。macOS FFmpegをPATH依存にすることでHomebrewなど利用者が管理する導入方法を尊重し、K-GGが第三者バイナリを配布・更新する責務を増やさない。macOS jobはWindows jobの後にDraft Releaseへ追加するため、`latest.json`をmacOS jobが競合更新しない。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| Windows用Tauri設定のbundle targetをmacOS向けに変更する | Windows NSISとupdater artifactの既存契約を壊す |
| macOSへWindowsと同じ専用FFmpegフォルダーを導入する | macOSではPATH管理とHomebrew導入が自然で、専用コピー責務を増やす |
| macOSにもupdater artifactを生成する | 公証・更新 endpointの設計が未確定で、Ad-hoc署名DMGの自動更新を約束できない |
| After Effects連携をmacOSへ移植する | OS間で異なるAfter Effects自動操作機構の設計・検証が別Requestになる |

## 結果

Windowsのリリース、FFmpeg探索、After Effects連携は変更せず、macOSはFFmpeg PATH、Ad-hoc署名DMG、手動更新、未公証の試験配布という明示的な境界で提供する。CIは生成した`.app`とDMG内の`.app`を`codesign --verify --deep --strict`および`Signature=adhoc`で検証する。macOS実機のGPU、WebView、DMG起動、Gatekeeper挙動はRelease Gateで確認する。
