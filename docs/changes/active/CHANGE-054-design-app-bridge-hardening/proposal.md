---
type: change
id: CHANGE-054
title: デザインアプリ接続bridgeの接続横取り対策
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
current_specs: [CURRENT-DESIGN-APP-CONNECTORS]
related_adrs: [ADR-0020]
related_code: [src-tauri/src/design_app_bridge.rs, src-tauri/tauri.conf.json, src/integrations/connectors/connectorService.ts, src/components/DesignAppSendPanel.tsx, connectors/figma/src/ui.html]
related_tests: [src-tauri/src/design_app_bridge.rs]
human_review: required
---

# CHANGE-054 デザインアプリ接続bridgeの接続横取り対策

## Request source

Direct request。利用者向けのセキュリティリスク調査で見つかった問題への対応。

## 背景・問題

`localhost:43127`のbridgeは、未許可の接続リクエストがある間に届いた別の`POST /api/connect/figma`へ既存のリクエストIDを返していた。リクエストIDだけで`/api/connect/figma/status`からsession tokenを取得できるため、利用者が本物のFigma Pluginを許可すると、同じIDを得た第三者もtokenを取得し、送信画像を先に受け取れた。

bridgeは`Access-Control-Allow-Origin: *`を返していたため、同じPC上のプロセスに加えて、ブラウザで開いたWebページからも応答を読み取れる可能性があった。接続元の表示名は要求側が自由に指定できるため、利用者は偽の「Figma」リクエストを見分けられなかった。

## 変更内容

- 接続リクエストごとに新しいリクエストIDを発行し、要求元へだけ返す。未許可のリクエストは新しいリクエストで置き換え、古いIDは無効にする。許可済みでtoken受け取り待ちのリクエストは置き換えず、409を返す。
- 接続リクエストごとに6桁の確認コードを発行し、K-GGの許可表示とFigma Pluginの両方に表示する。
- ブラウザOriginをFigma Plugin UI（`null`）、Tauriアプリorigin、Development用Vite originに限定し、それ以外は状態変更前に403で拒否する。CORS応答は許可したOriginだけに返す。
- bridgeの同時接続数を32までに制限する。
- 本番CSPの`connect-src`に`http://localhost:43127`を追加し、K-GG DesktopからFigma送信用のbridgeへ接続できるようにする。

## 対象外

- Affinity連携の再開。Affinity向けendpointは引き続き503を返す。
- `null` originを持つ任意のsandbox iframeの区別。確認コードの照合で利用者が接続元を確認する。
- ADR-0020の決定内容の変更。接続許可・session token・loopback bindの方針は維持する。

## 受け入れ条件

- AC-001: 2回目の接続リクエストは1回目と異なるIDを受け取り、1回目のIDではsession tokenを取得できない。
- AC-002: 許可済みでtoken受け取り待ちのリクエストがある間、新しい接続リクエストは409になる。
- AC-003: 許可外のOriginを持つ要求は403になり、接続リクエストを作成しない。
- AC-004: K-GGの許可表示とFigma Pluginが同じ6桁の確認コードを表示する。
