---
type: change
id: CHANGE-050
title: K-GGからデザインアプリへPNGを直接送信
status: archived
change_kind: F
owners: [maintainer]
created: 2026-09-21
updated: 2026-09-25
current_specs: [CURRENT-DESIGN-APP-CONNECTORS]
related_adrs: [ADR-0020]
related_code: [packages/kgg-image/src, src/integrations/connectors, src/components/DesignAppSendPanel.tsx, src/components/ExportPanel.tsx, src-tauri/src/design_app_bridge.rs, connectors/figma, connectors/affinity]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: Figma Desktopでの接続・PNG受信確認とAffinity公式登録条件の確認"
---

# CHANGE-050 K-GGからデザインアプリへPNGを直接送信

## Request source

Direct request。K-GG独自の画像ファイル形式を介さず、開いているFigmaまたはAffinityへ直接送れる操作に変更する。

## 変更理由

独自形式を保存してから受信アプリで選ぶ操作は、既存のPNG書き出しと役割が重なる。受信アプリを接続しておき、K-GGの静止画Exportパネルから直接送れると、目的のアプリへ短い操作で画像を渡せる。

## レビュー後の設計

- K-GG Desktopがloopback HTTP bridgeを起動し、Figmaの受信状態を管理する。
- Figma PluginはPNG bytesを受信し、開いているファイルのviewport中央へ配置する。
- Affinity向けの受信スクリプトは調査用プロトタイプとして保持する。
- 受信アプリから接続要求を送り、K-GGのExportパネルで送信先を確認して許可する。
- 交換データは標準PNGとし、独自の`.kggimg`形式は作らない。

## Affinity提供状態の変更

2026-09-22のDirect requestにより、Affinityの導入案内はAffinity公式SDKとAffinity本体の機能に基づいて整備する。公式のスクリプト登録・配布手順と生成物の適合を確認する間、K-GGのAffinity送信UIをグレー表示し、接続許可と転送を停止する。Affinityプロトタイプは調査用として保持する。

## ゴール・受け入れ条件

- K-GG DesktopにFigmaの接続要求、接続状態、送信結果を表示し、Affinity送信先を準備中として表示する。
- Figmaの接続要求をK-GGで許可した後、セッションを確立して送信を開始できる。
- 接続中のFigmaへ現在の出力キャンバスをPNGとして送信し、開いているFigmaファイルへ配置する。
- 選択中のK-GG送信画像があれば更新し、選択対象がない場合は新しい画像を追加する。同じ転送IDを再受信しても二重配置しない。
- Affinity送信先をExportパネルに表示し、公式SDKのスクリプト登録手順を確認するまで準備中の無効状態にする。
- Affinityの接続許可、送信サービス、bridge endpointは停止状態を返す。
- Figma Pluginをビルドし、生成物のパスと登録方法をガイドに記載する。Affinityのユーザー向け登録手順は公式仕様の確認後に用意する。
- Windows版TauriインストーラーにFigma Connectorのmanifest、実行JS、UI HTMLを同梱し、Exportパネルからmanifestのフォルダーを開ける。
- PNGのサイズと寸法を送受信時に制限し、エラー内容をK-GG上に表示する。
- 通常のPNG/JPG/WebP書き出し、既存の画像入力、After Effects連携を維持する。
- Exportパネルではデザインアプリ送信をAfter Effects接続の下に配置する。

## 対象外

- Figma/AffinityからK-GGへの同一セッション内直接送信、双方向同期。
- ベクター、レイヤー構造、動画、Gradient / Shader / Recipeの変換。
- Affinityの既存Document内へレイヤーとして配置する機能。
- クラウド転送、アカウント連携、外部ネットワークサービス。
- After Effectsの送信・接続動作の変更。

## Current Spec

[Design App Direct Send](../../../specs/current/design-app-connectors)に現在の受信・送信動作を記録する。既存の[Gradient System](../../../specs/current/gradient-system)と画像入力の描画・保存契約は維持する。

## 検証

TypeScript型検査、K-GG frontend build、Figma connector build、Rust `cargo check`、Docs checkをMerge Gate候補として確認する。Figma Plugin登録と受信はRelease Observationとして記録し、Affinityは公式登録手順と生成物適合の確認後にRelease Observationを行う。

## Finalization

- Finalized: 2026-09-25
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Figma Desktopでの接続・PNG受信確認とAffinity公式登録条件の確認
