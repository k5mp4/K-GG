---
type: design
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: approved
---

# Design

## 採用する実装方針

Tauri/RustをAfter Effects連携のローカル実行境界とする。既存のBridgeが持つAEプロセス検出、送信ファイル保存、JSX実行、シリアル化の考え方を移植するが、Tauri版ではWebViewからローカルHTTPポートへ接続しない。

Web版は現在のHTTP Bridgeを使用し、Tauri版はAdapterからTauri commandを使用する。`src/lib/aftereffectsExport.ts`は実行環境による選択のFacadeとして残し、UIへプラットフォーム判定を漏らさない。

## データモデル

P0の送信結果は、処理状態、送信種別、保存先、After Effectsの実行結果を返す。P1以降のレイヤー情報はK-GGの`StoreSnapshot`とは別の連携DTOとし、AEの識別子、コンポジション、レイヤー、素材参照、対応可否を保持する。

動画や大きな画像の本文はTauri commandのJSON引数へ直接詰めず、K-GGの一時作業領域へ保存したパスをRustへ渡す。FFmpegが生成したMOV・MP4はWebViewへ読み戻さず、保存先へのコピーとAE送信で同じネイティブ成果物を使用する。作業領域は要求単位で分け、保存キャンセル・失敗時に解放し、最後の動画として保持する場合は置換・unmount・AE送信完了後に安全に削除する。

## 状態管理

After Effectsの状態は、未確認、利用可能、送信中、成功、AE未起動、処理失敗を区別する。AE内部のJSX失敗をAfterFXプロセスの終了コードだけで成功扱いにしない。

複数の送信や問い合わせが同時に発生した場合は、AE操作を一つずつ実行する。書き出し完了とPreview復帰はAE操作の完了を待たず、最新のAE操作だけがUI状態を更新する。動画自動送信は実行中1件と待機中1件までとし、上限中は新しいMOV・MP4書き出しを無効にして大容量成果物の無制限な滞留を防ぐ。各要求は一意な作業領域と完了マーカーを持つ。

## UI構成

既存のAfter Effects Connect領域と自動動画送信設定を維持する。Tauri版ではBridgeの起動確認ではなく、AE接続状態を表示する。AE未起動、保存先選択のキャンセル、対象コンポジション不在、未対応レイヤーは個別に判別できる状態へ分ける。

P1以降のレイヤー取り込みUIは、読み込み対象のコンポジションとレイヤーを明示し、元ファイル取り込み、レンダー取り込み、設定変換を同じ操作として混同しない。

## 描画・外部プロセス・Tauri側の変更

Windowsでは起動中の`AfterFX`プロセスから実行ファイルを取得し、引数を固定した非表示プロセスとしてAfterFXへJSXを渡す。macOSの実装余地は残すが、現行配布ターゲットと実機確認の対象を先に明確にする。

JSXは固定テンプレートから生成し、ファイルパスをAEスクリプト文字列へ埋め込む前にエスケープする。JSXは指定された操作だけを実行し、完了JSONへ成功または失敗を書き込む。任意JSX本文は受け付けない。

P1の読み込みは`app.project.activeItem`とコンポジションの選択レイヤーを起点にする。自動的に最初のコンポジションへ切り替える挙動は採用せず、対象が曖昧な場合はエラーとして返す。

## 変更対象の主要ファイル

コード:

- `src/lib/aftereffectsExport.ts`
- `src/adapters/types.ts`
- `src/adapters/index.ts`
- `src/adapters/browser/afterEffectsService.ts`
- `src/adapters/tauri/afterEffectsService.ts`
- `src/types/afterEffects.ts`
- `src/lib/afterEffectsLayer.ts`
- `src/lib/afterEffectsImport.ts`
- `src/components/ExportPanel.tsx`
- `src-tauri/src/lib.rs`
- `src-tauri/src/after_effects.rs`
- `src-tauri/capabilities/default.json`
- `src-tauri/tauri.conf.json`

テスト:

- `src/lib/aftereffectsExport.test.ts`
- `src/lib/afterEffectsLayer.test.ts`
- `src/lib/afterEffectsImport.test.ts`
- `src-tauri/src/after_effects.rs`の`cfg(test)`モジュール

## 代替案とトレードオフ

- Node BridgeをSidecarとして同梱する案は、P0を早く再現できるが、別プロセスの起動・終了・配布管理が残るため採用しない。
- Tauri版もHTTPへ寄せる案は、既存UIの変更を小さくできるが、ローカルポートとCORSの境界を残すため採用しない。
- レイヤーを画像へ常に平坦化する案は、取り込み成功率は高いが、元素材と設定の編集可能性を失うためP2のフォールバックとして限定する。

## 移行方法

Web版は既存Bridgeを継続利用する。Tauri版は新しいAdapterへ切り替え、Bridgeが起動していなくても接続状態を判定する。既存のBridge配布物はこのchangeでは削除しない。

P1〜P3はP0の送信・応答・作業領域が安定してから追加する。非対応のAE構造は読み込みを拒否するのではなく、読み込めた情報と非対応理由を区別して返す。

## ロールバック方法

Tauri版のAdapter選択を既存のBridge経路へ戻せるようにし、Web版の連携は変更しない。新しいAE連携DTOや変換器はK-GGの既存Preset保存形式へ混ぜず、削除しても既存のPresetを壊さない。
