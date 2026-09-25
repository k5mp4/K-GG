# Spec Delta

## ADDED Requirements

### CONN-001 K-GG Desktop connection

K-GG Desktopはloopback endpointでFigma Connectorからの接続リクエストを受け付ける。利用者は静止画Exportパネルで送信先を確認して許可し、接続状態と送信状況を確認する。Affinityは準備中状態で表示する。

### CONN-002 direct PNG send

利用者は接続中のFigmaを選び、現在の出力キャンバスをPNGとして送る。Affinityの送信ボタンは無効状態にし、送信サービスはAffinity宛てを拒否する。PNGは20 MiB以下、各辺4096 px以下、総16,777,216 px以下とする。送信時に標準的なPNG構造、CRC、寸法を確認する。

### CONN-003 Figma receive

Figma Pluginは接続許可後にloopback endpointをpollし、受信PNGを開いているFigmaファイルのviewport中央へRectangleとして配置・選択する。選択中のK-GG送信Rectangleがあれば画像を更新し、選択中に対象がなければ新しいRectangleを追加する。転送IDの再配信では二重配置しない。画像はPNG寸法のラスタ画像とする。

Windows版K-GG DesktopインストーラーにはFigma Pluginの`manifest.json`、`dist/main.js`、`src/ui.html`を`connectors/figma/`以下に同じ相対構成で含める。Exportパネルから登録用フォルダーを開き、Figma DesktopのDevelopment Pluginとしてmanifestを登録できる。

### CONN-004 Affinity receive

Affinity連携はExportパネルに準備中の送信先として表示する。Affinity公式SDKのスクリプト登録・配布手順とK-GG生成物の適合を確認するまで、接続許可、転送、受信確認endpointは503応答を返す。

### CONN-005 existing image workflow

デザインアプリ連携は現在の静止画PNG出力を使う。通常のPNG、JPG、WebP exportと、画像ファイルをImage Gradient Sourceへ読み込む既存機能を維持する。独自画像交換file formatを定義しない。Exportパネル内ではデザインアプリ送信をAfter Effects接続の下に配置する。

### CONN-006 desktop scope and status

K-GG Desktopでloopback接続を開始し、Figmaの接続要求、接続、転送待ち、完了、失敗を表示する。Affinityの接続操作は準備中状態で表示する。Browser版は接続状態を案内する。

## MODIFIED Requirements

CHANGE-050の接続方法を、K-GG上で送信先を確認して許可するフローへ変更する。Figma送信は前回のK-GG生成Rectangleを更新して最新画像を表示し、同一transfer IDの再受信を一度だけ処理する。送信欄はAfter Effects接続セクションの下へ置く。

## REMOVED Requirements

None. The prior `.kggimg` design existed only in this unmerged change branch.
