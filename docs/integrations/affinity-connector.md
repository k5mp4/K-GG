# Affinity連携の提供状態

Affinity連携は準備中です。K-GGのExportパネルには送信先をグレー表示で表示し、接続許可と送信を停止しています。再開時の導入案内はAffinity公式SDKとAffinity本体の機能に基づいて整備します。

## SDK資料の確認

[Affinity SDK 3.3.0](https://sdk.affinity.studio/33000/)はAffinityのJavaScript APIと`affinity:*`モジュールを説明し、JSLibの参照用ライブラリを提供しています。Affinity公式の[スクリプティング紹介](https://www.affinity.studio/blog/affinity-automation-scripting-claude)では内蔵エディターとScriptsパネルが案内されています。

現行SDK資料はJavaScript APIとモジュールの使い方を中心に説明しています。スクリプトの登録・配布手順を公式資料で確認した後に、製品内のAffinity接続を再開します。

## リポジトリ内のプロトタイプ

`connectors/affinity/`には、Affinity SDKを調査するための受信スクリプトとビルド設定を保持しています。ビルド生成物の`connectors/affinity/dist/kgg-affinity-connector.js`は、Affinity公式の登録形式との適合を確認した後に導入ファイルとして案内します。

## 再開条件

- Affinity公式資料で、開発したスクリプトの登録・配布形式と操作手順を確認できる。
- K-GGの生成物がその形式に適合する。
- Affinity本体で登録、接続、PNG受信、新規Document表示を確認する。

再開時はK-GG上のAffinity送信操作とローカルbridgeのAffinity用経路を有効に戻し、実機確認の結果を記録します。
