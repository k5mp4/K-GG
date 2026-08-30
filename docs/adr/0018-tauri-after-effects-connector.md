---
id: ADR-0018
title: TauriからAfter Effectsへ固定JSXと一時ファイルで接続する
status: accepted
date: 2026-08-30
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0018: TauriからAfter Effectsへ固定JSXと一時ファイルで接続する

## コンテキスト

K-GGのWeb版After Effects連携は、別プロセスの`KGG_AE_Bridge`がHTTPを受け付け、ファイル保存とAfter Effectsスクリプト実行を担当している。Tauri版でも同じBridgeを手動起動する必要があり、ローカルアプリとしての配布体験を損ねている。

Tauriには外部プロセス、ファイル、一時領域を扱う既存の境界がある。一方、K-GGのWebViewから任意のAfter Effectsスクリプトや任意のOSパスを実行できる設計は、ファイル操作とコード実行の範囲を広げる。

## 決定

1. Tauri/RustがAfter Effectsプロセスの検出、送信ファイルの一時保存、固定テンプレートのJSX生成、After Effectsへのスクリプト実行、完了結果の回収を担当する。
2. Tauri版のReact UIはHTTP Bridgeへ接続せず、既存のAdapter境界からTauri commandを呼び出す。Web版は既存Bridge経路を維持する。
3. 送信・読み込み処理は固定された操作種別と検証済みパスだけを受け付ける。WebViewから任意のJSX本文を受け取らない。
4. TauriとAfter Effectsの往復結果は、一時作業領域内の完了JSONまたはエラーマーカーで受け渡す。AfterFXプロセスの終了コードだけを成功判定に使わない。
5. P0ではAfter Effects本体が起動済みであることを前提とし、K-GGがAfter Effectsのインストール場所を推測して自動起動する処理は追加しない。
6. P0の送信対象はAfter EffectsのアクティブなViewer/コンポジションに限定し、対象がない場合は利用者にAE側でコンポジションをアクティブ化して再試行するよう案内する。最初のコンポジションを暗黙に選ばない。
7. After Effectsレイヤー情報はK-GGの`StoreSnapshot`へ直接混ぜず、連携専用DTOとして読み込む。K-GGへ変換できる設定だけを明示的にマッピングする。

## 理由

- 別Bridgeの手動起動をなくしながら、既存Tauriの外部プロセス・一時ファイル境界を再利用できる。
- Web版とTauri版の責務を分けることで、ブラウザの既存動作とローカル配布の安全境界を維持できる。
- 固定操作と完了結果を使うことで、任意コード実行、パス注入、AE内部失敗の見逃しを抑えられる。
- レイヤーDTOをK-GGの単一シーンモデルから分離することで、非対応のAE構造を誤って編集可能と表示しない。

## 代替案

| 案 | 不採用理由 |
| --- | --- |
| BridgeをK-GGの管理下で同梱・自動起動する | 手動起動は解消できるが、Bridgeの別プロセス、配布・終了・バージョン整合、HTTPポートの管理が残る。P0では単一のTauri command境界を優先する |
| BridgeのNode実行ファイルをSidecarとして同梱する | 手動起動はなくせるが、別プロセスの配布・起動・終了・バージョン管理が残る |
| Tauri版もlocalhost HTTP Bridgeを使う | ポート、CORS、常駐プロセス、他アプリからの到達範囲を管理し続ける必要がある |
| `kagaribi_ae`プラグインに通信を追加する | 現在のプラグインは描画エフェクトであり、プロジェクト操作やレイヤー交換の責務を持たない |
| AEプロジェクト全体をK-GGのStoreSnapshotへ変換する | AEの任意レイヤー、式、マスク、3D、プリコンポをK-GGのモデルで表現できない |

## 再検討条件

- 複数のAEインスタンス、複数のK-GG Runtime、常時接続、またはリアルタイム双方向同期が必要になった。
- macOSを正式なTauri配布対象へ戻し、Automation権限の扱いを製品契約に含める必要が生じた。
- AEの新しい拡張方式が、固定JSXより安定した常駐接続を提供するようになった。
