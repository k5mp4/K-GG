# Design

## 境界

`src-tauri/src/design_app_bridge.rs`がローカルHTTP bridge、Figmaの接続要求と利用者の許可、session、送信queueを管理する。`src/integrations/connectors`はK-GGの静止画キャンバスをPNG化し、bridgeへ送る。`DesignAppSendPanel`はFigmaの接続要求、受信状態、送信操作と、準備中のAffinity送信先をExportパネルに表示する。

Tauriの`build:desktop`はFigma PluginをビルドしてからWindows appをパッケージする。Tauri resourcesには`manifest.json`、`dist/main.js`、`src/ui.html`を同じ相対構成で含める。`open_figma_connector_folder` commandはdebug時にリポジトリ内のConnectorを優先し、release時はTauri resource directory内のConnectorを開く。

Figma Plugin UIはlocalhostをpollし、PNG bytesをPlugin mainへ渡す。Plugin mainは`documentAccess: dynamic-page`に合わせて現在のPageNodeを`loadAsync()`し、選択中の`[K-GG]` Rectangleがあれば画像を更新し、それ以外は新規Rectangleを追加する。`[K-GG]`で始まるレイヤー名で対象を識別し、この識別方法はFigma Plugin IDなしで動作する。Plugin mainからUIへは`figma.ui.postMessage`に応答データを直接渡し、UI側で`event.data.pluginMessage`から配置結果を受け取る。Affinityのプロトタイプは`connectors/affinity/`に保持し、公式登録形式を確認するまで製品内のAffinity経路を停止する。

## 転送契約

- endpoint: `http://localhost:43127`（IPv4/IPv6 loopback）
- Figmaは接続要求を送り、利用者がK-GG上で許可した後にsession tokenを受け取る。Affinityの接続経路は一時停止する。
- 未許可の要求は2分、許可後のsession token受取枠は30秒で期限切れとなる。
- K-GGからの送信にはアプリsession tokenを必要とする。
- 受信アプリはpollでsessionを維持し、送信ごとのACKで結果を返す。
- 1回に待機できる画像は各送信先1枚。前の転送結果が返ってから次の画像を送る。
- PNG上限は20 MiB、各辺4096 px、総16,777,216 px。
- Figmaの受信結果は45秒以内に届かない場合に転送を失敗として終了する。
- 許可時に新しいsession tokenを発行し、以前の転送状態を破棄する。

## PNG検証

K-GGはキャンバスをPNG化し、PNG signature、全chunk境界、CRC、IHDR、IDAT、IEND、寸法を確認してから送る。bridgeもHTTP body sizeとPNG header寸法を検証する。Figma Pluginも受け取ったPNGを同じ画像検証で確認してから`figma.createImage`へ渡す。

## 接続状態

Figma Pluginのpollは7秒以内の接続heartbeatとなる。送信画像には30秒の受信leaseを設け、45秒以内にACKがない場合は失敗として終了する。Affinityの接続は準備中状態で表示する。

## 実装上の制約

- Figma Plugin manifestはloopback endpointをnetwork許可先として宣言する。UI iframeはCORS preflightを行い、短いsession tokenをBearer headerで送る。
- Affinity公式のスクリプト登録・配布手順が確認できるまで、Affinity向け接続・送信・受信確認endpointは503を返す。
- Browser版はTauriのloopback bridge commandを利用できないため、直接送信はK-GG Desktopで提供する。
- Figma Pluginが閉じている間は受信が停止する。
- Figma Pluginは選択中のK-GG送信Rectangleを次の画像で更新する。対象が選択されていない場合は新しいRectangleを追加する。同一transfer IDの再配信は一度だけ配置する。
