---
type: current
id: CURRENT-DESIGN-APP-CONNECTORS
title: Design App Direct Send
status: current
owners: [maintainer]
created: 2026-09-21
updated: 2026-09-22
requirement_ids: [CONN-001, CONN-002, CONN-003, CONN-004, CONN-005, CONN-006]
related_adrs: [ADR-0020]
related_changes: [CHANGE-050]
related_code: [packages/kgg-image/src, src/integrations/connectors, src/components/DesignAppSendPanel.tsx, src/components/ExportPanel.tsx, src-tauri/src/design_app_bridge.rs, connectors/figma, connectors/affinity]
related_tests: []
---

# Design App Direct Send

## 目的

K-GG Desktopで描画中のPNGをFigmaへ直接送る。ExportパネルにはAffinity送信先も表示し、Affinity公式SDKのスクリプト登録手順を確認する間は「準備中」の無効状態にする。

## 現在の要件

### CONN-001 接続

K-GG DesktopはIPv4/IPv6 loopback上の`localhost:43127`でデザインアプリ用のローカル接続を開始する。利用者はFigma Pluginから接続をリクエストし、静止画Exportパネルで許可する。Affinityの接続許可は停止状態とし、Affinity向けbridge endpointは503応答を返す。

### CONN-002 K-GGから送信

Figma接続中に送信ボタンを押すと、現在の出力キャンバスをPNG化してFigmaへ送る。送信結果と配置結果をExportパネルに表示する。Affinity送信ボタンはパネルに表示し、無効状態にする。送信サービスもAffinity宛ての操作を拒否する。

送信できるPNGは20 MiB以下、幅と高さはそれぞれ4096 px以下、総画素数は16,777,216以下とする。K-GGは送信前にPNG構造、CRC、寸法を検証する。Figma Pluginは受信時に同じ検証を行う。

### CONN-003 Figma

Figma Connector PluginはK-GGで接続を許可された後にK-GG Desktopをポーリングし、受信したPNGを開いているFigmaファイルのviewport中央へRectangleとして配置する。Rectangle名の先頭に`[K-GG]`を付けて識別する。選択中の`[K-GG]` Rectangleがある場合はその画像を更新し、それ以外の場合は新しいRectangleを追加する。転送IDが再配信された場合は二重配置しない。Rectangleを選択し、画面内へ表示する。画像はPNGの寸法を維持したラスタ画像である。

Pluginを閉じるとFigma接続が停止する。再び送る場合はPluginを開いて接続する。

### CONN-004 Affinity

Affinity送信先はExportパネルにグレー表示の「準備中」ボタンとして表示する。接続許可と送信を無効にし、bridgeのAffinity接続・送信・受信確認endpointは503応答を返す。SDK公式のスクリプト登録・配布手順と生成物の適合を確認した後に再開する。Affinity SDK検証用プロトタイプは`connectors/affinity/`に保持する。

### CONN-005 実行範囲

デザインアプリへの直接送信はK-GG Desktopで利用できる。Browser版では送信機能の接続状態を表示する。送る画像は現在の静止画キャンバスをPNGにしたものとする。

通常のPNG、JPG、WebP書き出しと、画像ファイルをImage Gradient Sourceへ読み込む既存操作は継続して利用できる。

### CONN-006 接続状態

K-GGはFigmaの接続リクエスト、接続、送信待ち、送信完了、受信失敗の状態を表示する。利用者がK-GG上で接続を許可した後、アプリ別session tokenで送信先を識別する。送信データはloopback接続内で扱う。Affinityは固定の準備中状態を表示する。

未許可のFigma接続リクエストは2分で期限切れとなる。接続許可後、受信アプリは30秒以内にsession tokenを取得する。Figma送信は45秒以内に受信結果が届かない場合に失敗として終了する。

詳細な操作手順は[デザインアプリ連携ガイド](../../integrations/design-app-connectors)、Affinity連携の提供条件は[Affinity Connector SDK Notes](../../integrations/affinity-connector)を参照する。
