---
id: ADR-0020
title: デザインアプリへのPNGをloopback経由で直接送る
status: accepted
date: 2026-09-22
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0020: デザインアプリへのPNGをloopback経由で直接送る

## コンテキスト

K-GGで作成した画像をFigmaやAffinityで使うとき、画像を書き出して受信側で選ぶ操作が必要だった。利用者の希望は、受信アプリを開いて待機させ、K-GGからそのアプリへ直接送ることである。

Figma PluginのUI iframeはネットワーク要求を行え、manifestで許可する接続先を指定できる。Affinity SDK 3.3.0の公開HTTP APIはGET要求と応答の読み取りを提供する。両アプリのAPIを調査した結果、共通のloopback接続とアプリ別の受信処理を組み合わせる。

## 決定

1. K-GG DesktopがIPv4/IPv6 loopback上の`localhost:43127`でローカルHTTP bridgeを実行し、現在の出力キャンバスを標準PNGとして受信アプリへ送る。
2. Figma PluginとAffinity ScriptはK-GGへ接続リクエストを送り、K-GG Exportパネルで利用者が送信先ごとに許可する。許可後、受信側はbridgeをポーリングする。
3. Figma PluginはPNG bytesを受け取り、開いているFigmaファイルのviewport中央へ画像Rectangleを作る。Figma manifestではこのloopback endpointを許可する。
4. Affinity ScriptはGET要求で送信待ち状態と一時PNGのパスを取得し、そのPNGを新規Documentとして開く。K-GGが一時ファイルを作成・整理するため、利用者がファイルを保存・選択する操作は発生しない。
5. 各送信は20 MiB以下のPNG、幅と高さ各4096 px以下、総16,777,216 px以下に制限する。K-GG上の利用者による接続許可、session token、loopback bind、短い受信leaseで接続と転送を管理する。
6. K-GG独自の画像交換ファイル形式は導入しない。標準PNG / JPG / WebP exportと既存の画像入力は従来どおり利用する。

## 理由

- Figmaを開いた状態でK-GGから送信し、選択中のファイルへすぐ配置できる。
- 接続要求をK-GGで許可するため、受信アプリとK-GGの接続先を利用者が確認できる。
- Affinityでは受信スクリプトを一度起動しておけば、送信画像が新しいDocumentとして届く。
- 通常の画像形式、現在のPNG出力、既存の画像入力を活用する。
- 受信アプリの選択と送信完了をK-GG上に明示できる。

## 代替案

| 案 | 判断 |
| --- | --- |
| `.kggimg`などの独自形式で保存・選択 | 受信時にファイルを選ぶ工程が残るため、直接送信の操作に合わない。 |
| クラウド経由で送信 | アカウント、ネットワークサービス、同期状態の管理が必要になる。ローカルアプリ間の画像転送にloopbackを使う。 |
| FigmaとAffinityで同一の受信APIを使う | 公開SDKの操作に合わせ、FigmaはPNG bytes、AffinityはK-GG管理下の一時PNGパスを受信する。 |

## 結果

### 利点

- PNG保存と受信側でのファイル選択を省いた操作になる。
- 各アプリで受信先を開いている状態をK-GGが確認してから送れる。
- 外部ネットワークサービスを介さず、標準PNGを受け渡す。

### 実装コストと制約

- Figma PluginまたはAffinity Scriptを接続状態で起動する必要がある。
- Figmaでは画像がラスタRectangleとして配置される。Affinityでは新しいDocumentが開く。
- Affinity向けには一時PNGファイルを使用し、K-GGが受信後または期限切れ時に整理する。
- 初回接続と実機操作はアプリごとに確認する。

## 再検討条件

- FigmaまたはAffinityの公開APIが、画像を既存Documentへ配置する別の直接操作を提供した場合。
- 利用者がデザインアプリからK-GGへの同一セッション内直接送信を求めた場合。
- PNG上限や接続方式が実際の利用画像に合わない場合。

## 現在の提供状態

2026-09-22時点ではFigma連携を提供し、Affinity連携は準備中としてExportパネルに無効表示する。Windows版インストーラーにはFigma manifestと実行ファイル、UIファイルを同梱し、Exportパネルからmanifestの場所を開ける。Affinityの接続許可・送信操作・bridge経路は、公式SDKのスクリプト登録・配布手順とK-GG生成物の適合を確認するまで停止する。再開時はAffinity公式資料とAffinity本体の機能に沿った導入手順を整備し、実機で受信まで確認する。
