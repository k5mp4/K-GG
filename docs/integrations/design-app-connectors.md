# デザインアプリ連携ガイド

K-GG Desktopで作成したPNGを、開いているFigmaへ直接送信できます。AffinityはExportパネルに準備中の送信先として表示されます。

## できること

| 送信先 | K-GGから届く画像 |
| --- | --- |
| Figma | 開いているファイルのviewport中央へPNG画像を配置し、選択します。 |
| Affinity | 公式SDKのスクリプト登録手順を確認後に再開する連携先として、グレー表示の準備中ボタンを表示します。 |

送信する画像は現在のK-GG出力キャンバスです。標準PNGとしてFigmaへ届き、ラスタ画像のRectangleとして編集・保存できます。

## リポジトリの構成

| ディレクトリ | 内容 |
| --- | --- |
| `src-tauri/src/design_app_bridge.rs` | K-GG Desktopのloopback接続、Figmaの接続許可と送信queue |
| `src/integrations/connectors/` | PNG検証とK-GG画面からの送信処理 |
| `src/components/DesignAppSendPanel.tsx` | 接続リクエスト、接続状態、Figma/Affinity送信ボタン |
| `connectors/figma/` | Figma Pluginのmanifest、受信画面、画像配置処理 |
| `connectors/affinity/` | Affinity SDKの調査用プロトタイプ |
| `packages/kgg-image/src/` | 送受信PNGの寸法・サイズ・CRC検証 |

## ビルド

コマンドはリポジトリのルート`K-GG/`で実行します。

```sh
npm --prefix connectors/figma run build
```

| 対象 | 生成される場所 | アプリでの登録 |
| --- | --- | --- |
| Figma Plugin | `connectors/figma/dist/main.js` | FigmaのDevelopment Pluginとして`connectors/figma/manifest.json`を読み込みます。Pluginが`src/ui.html`を画面として使います。 |
| Affinity | — | 公式SDKのスクリプト登録・配布手順を確認後に利用手順を用意します。 |

K-GG側は通常のアプリビルドに含まれます。開発中に起動するときはリポジトリの既存手順に従ってK-GG Desktopを起動してください。

## 共通の接続手順

1. K-GG Desktopと送信先アプリを起動します。
2. Figma Pluginを起動します。
3. K-GGの静止画Exportパネルに接続リクエストが表示されたら、送信先を確認して「許可」を押します。
4. K-GGの送信欄で対象アプリが接続中になったことを確認します。
5. 「Figmaに送信」を押します。

Figma Pluginを閉じて再び起動した場合は、K-GGで新しい接続リクエストを許可します。

## Figmaへ送る

1. Figmaで送信先のデザインファイルを開きます。
2. Development Pluginの登録画面で`connectors/figma/manifest.json`を読み込み、Connectorを起動します。
3. K-GGの静止画Exportパネルに表示されたFigmaの接続リクエストで「許可」を押します。
4. 接続中になったら「Figmaに送信」を押します。
5. PNG画像がFigmaのviewport中央に配置され、選択状態になります。

起動中のPluginが、画像を配置するFigmaファイルを送信先として使います。レイヤー名の先頭に`[K-GG]`が付いた画像が送信画像です。その画像を選択して送信すると更新し、何も選択せずに送信すると新しい画像を追加します。

## Affinity連携

Affinityの送信先はグレー表示で「準備中」と表示されます。Affinity公式SDKのスクリプト登録・配布手順と、K-GGの生成物がその形式に適合することを確認後に再開します。再開時は公式資料とAffinity本体の機能に沿った操作手順を用意します。詳しくは[Affinity連携の提供状態](./affinity-connector)を参照してください。

## 対応する画像

PNGは20 MiB以下、各辺4096 px以下、総16,777,216 px以下です。K-GGは送信前にPNG構造と寸法を検証します。Figma Pluginも同じ画像上限とCRCを確認してから配置します。

通常のPNG、JPG、WebP書き出しと、画像ファイルをK-GGのImage Gradient Sourceへ読み込む操作も引き続き利用できます。

## トラブルシューティング

| 状態 | 対応 |
| --- | --- |
| 接続状態の確認 | Figma Pluginを起動し、K-GGに届いた接続リクエストを許可します。 |
| 接続リクエストの確認 | Figma Pluginが起動していることを確認し、K-GGで送信先名を確認します。 |
| Figmaの配置結果の確認 | K-GGの送信結果とPlugin画面の状態を確認し、Figmaのviewportを見ます。 |
| Affinity連携の状態 | Exportパネルに準備中の送信先として表示されます。 |
| 画像サイズの調整 | 出力サイズを上限内に調整してから再送信します。 |
| Figmaで配置結果が返るまで45秒を越えた場合 | Pluginを再起動して接続を許可し、もう一度送信します。 |

ローカル接続先は`localhost:43127`です。Figma manifestの許可先も`http://localhost:43127`です。接続の状態メッセージはExportパネルに表示されます。

## 参考資料

- [Figma Plugin manifest](https://developers.figma.com/docs/plugins/manifest/)
- [Figma Plugin network requests](https://developers.figma.com/docs/plugins/making-network-requests/)
- [Figma Node exportAsync](https://developers.figma.com/docs/plugins/api/properties/nodes-exportasync/)
- [Affinity SDK 3.3.0 documentation](https://sdk.affinity.studio/33000/)
- [Affinity Connector SDK Notes](./affinity-connector.md)
