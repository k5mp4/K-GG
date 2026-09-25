---
type: change
id: CHANGE-052
title: macOSデスクトップ版の試験ビルドと配布
status: review
change_kind: A
owners: [maintainer]
created: 2026-09-24
updated: 2026-09-25
current_specs: [CURRENT-VIDEO-EXPORT, CURRENT-AFTER-EFFECTS-INTEGRATION, CURRENT-DESIGN-APP-CONNECTORS]
related_adrs: [ADR-0002, ADR-0021]
human_review: required
---

# macOSデスクトップ版の試験ビルドと配布

Request source: Direct request。既存Windows版の動作・リリースフローを維持したまま、macOS arm64・Intel向けのTauri DMGをCI/Releaseでビルドできるようにする。

## 変更理由

元の依頼はmacOS向け`.app`/`.dmg`、FFmpeg PATH検出、Figma connector、システムフォント、CI/releaseを一度に要求している。一方、既存設定はWindows NSIS固定で、RustのFFmpeg検証とExplorer起動もWindows専用だった。macOS用設定をoverlayへ分離し、外部プロセス・OS openerの境界だけを共通化する必要がある。

## 変更内容と受け入れ条件

- Windows x64のNSIS、Tauri updater署名、専用FFmpegフォルダー優先、After Effects連携を変更しない。
- macOS arm64（`macos-15`）とIntel（`macos-15-intel`）でTauri DMGを生成し、Ad-hoc署名された`.app`を含むDMGをDraft Releaseへ追加する。macOS updater artifactは生成せず、未公証の試験配布と明示する。CIは生成物とDMG内の`.app`を署名検証する。
- macOSはPATH上の`ffmpeg`と`ffprobe`を検出し、FFmpegのqtrle/libx264を検証する。`ffprobe`はCI smoke gateでも動画メタデータを確認する。K-GGはFFmpegを同梱・ダウンロード・PATH変更しない。
- macOSのFFmpeg UIはHomebrew導入とPATH設定を案内し、Windows専用フォルダー操作を表示しない。
- Figma connectorフォルダーと外部URLはTauri Openerへ委譲し、loopback通信とmacOSシステムフォント探索は既存契約を継続する。
- After EffectsのmacOS操作は実装せず、利用不可を既存ステータスで表示する。
- CIにmacOS native checkとFFmpeg smoke、Ad-hoc署名検証、ReleaseにWindows後のarm64/Intel jobを追加する。

## 対象外

Apple Developer証明書、notarization、macOS updaterの自動更新、After Effects自動操作、Homebrew自体の導入、commit・push・Pull Request・GitHub設定変更は対象外とする。Ad-hoc署名とそのCI検証は対象に含める。

## 互換性

Windowsでは`<app_local_data_dir>/ffmpeg/ffmpeg.exe`を優先する既存探索順序を維持する。macOSでは専用FFmpegフォルダーを使わず、`PATH`の`ffmpeg`を検証する。Windows release jobがDraft Releaseと`latest.json`を作成し、macOS jobはDMGだけを追加する。

検証と未確認事項は[validation](./validation.md)に記録する。
