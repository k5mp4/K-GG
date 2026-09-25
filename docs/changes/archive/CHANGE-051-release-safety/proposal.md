---
type: change
id: CHANGE-051
title: 配布時のライセンス表示と外部入力の安全性
status: archived
change_kind: B
owners: [maintainer]
created: 2026-09-22
updated: 2026-09-25
current_specs: [CURRENT-PRESET, CURRENT-UI-CONTROLS, CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0007, ADR-0011]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: WebView2実機、OS保存、更新署名・改ざん検知のRelease Gate確認"
---

# 配布時のライセンス表示と外部入力の安全性

Request source: Direct request。Windows Authenticodeは導入せず、GSAP・第三者ライセンスと安全に修正できる配布上の問題を実装する。

## 変更理由

ライセンス名と外部リンクだけでは、配布物へ本文・著作権表示を同梱する要求を満たせない。Preset ZIPの一括展開は展開後の制限より先にメモリやCPUを消費する。Renderer由来の動画保存パスにはRust側でも権限確認が必要である。

## 変更内容と受け入れ条件

- GSAPを依存・UIから除き、ブラウザ標準のアニメーションへ置換する。描画・書き出しの時刻計算は変更しない。
- ヘルプから日英UIでライセンス本文をオフライン閲覧・検索できる。npm、Windows Rust依存、Tweeq内包依存を対象とし、依存更新による一覧の陳腐化をbuildで拒否する。
- Preset importをWorkerへ移し、32 MiBの入力、16 MiBのmanifest、単一ZIP32エントリ、CRC、10秒の処理期限を検証する。失敗時に既存ライブラリへ部分適用しない。
- 動画のnative copyは既存のリンク・パス検証に加え、Tauri filesystem scopeに含まれる保存先だけを受け付ける。
- CSPを有効化しSmartScreen無効化フラグを除く。fflateとrustlsを修正版へ更新し、更新設定のHTTPSと署名用公開鍵の形式をrelease checkで確認する。

## 対象外

Windows Authenticode、鍵生成・交換、GitHub管理設定、公開済みバイナリの置換、Issue作成は行わない。commit・push・ドラフトPR作成は追加のDirect requestで承認済み。開発専用AE HTTP bridgeの設計変更は含めない。

## 互換性

K-GGが出力する単一manifest ZIPと既存JSONを維持する。追加ファイル、ZIP64、破損ZIPは従来読めた場合も拒否する。filesystem scopeはプロセス内で共有されるため、保存操作だけの一回限りの許可とは異なる。

検証と残作業は[validation](./validation.md)、運用は[配布安全性](../../../development/release-security.md)を参照する。

## Finalization

- Finalized: 2026-09-25
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: WebView2実機、OS保存、更新署名・改ざん検知のRelease Gate確認
