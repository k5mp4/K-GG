# Design

## 採用する実装方針

別ウィンドウを、Effect Stackの状態を持つ新しいストアとして実装せず、既存の`PostprocessStackPanel`を別ドキュメントのReact rootへ再マウントする。別ドキュメント側のrootだけ、LanguageProviderとTweeqのViewportを明示的にラップする。Tauriの起動エントリは既に通常のアプリrootでProviderを持つため、同じProvider構成を二重に追加しない。

TauriのWebviewWindow作成待機は、成功・エラー・タイムアウトを明示的な結果にし、タイムアウトを成功扱いにしない。失敗時は作成ハンドルを閉じられる範囲で片付け、呼び出し側は`tauriWindowOpen`を立てない。

## データモデル

変更しない。選択中レイヤー、主スタックの順序、有効状態、Glass設定は既存のgradient storeとEffect Pipelineを一次情報とする。

## 状態管理

ブラウザーの別rootは既存storeを購読するPanelをレンダリングする。別rootのclose、`beforeunload`、Document Picture-in-Pictureのcloseを既存のcleanupへ接続し、`pipRootRef`、`pipMount`、`pipWindow`を一貫して解除する。

Tauriでは作成成功後だけ`tauriWindowOpen`をtrueにし、closeイベントまたは別ウィンドウ側のclose処理でfalseへ戻す。WebviewWindowは`visible: false`で生成し、ネイティブの作成成功イベントまたはラベル存在確認後に表示・フォーカスする。Tauri APIのローカル作成イベントを取り逃がしても、バックエンド上のラベル存在を成功根拠として扱う。子側React rootの`EFFECT_STACK_READY_EVENT`は表示後の状態同期に使い、子側イベントが遅延・欠落しても表示処理をタイムアウトさせない。表示成功後はホストからも現在のスナップショットを一度送信する。同時の開く操作は一つの生成Promiseへ集約する。エラー・タイムアウトはインライン表示を維持する。

## UI構成

ブラウザーの通常ポップアップ用rootを次のProvider境界へ置く。

```tsx
<LanguageProvider>
  <Viewport appId="k-gg-effect-stack">
    {panel}
  </Viewport>
</LanguageProvider>
```

既存のインライン表示とTauriの`DetachedEffectStackApp`のUIは変更せず、ブラウザー別rootの不足Providerだけを補う。エラー表示を追加する場合も、ポップアップが開かないときのインライン表示を隠さない。

## 描画・外部プロセス・Tauri側の変更

ブラウザーでは新しい`Window`へCSSをコピーした後、Provider付きrootを作成する。Tauriでは作成元へ`core:webview:allow-create-webview-window`、Effect Stack側へ必要なWindow操作権限を付与する。ネイティブ作成イベントとラベル存在確認の待機境界にはタイムアウトとcleanupを追加し、子側準備完了イベントは既存の状態同期経路として扱う。失敗時はダイアログAPIへ依存せず、未処理Promiseを残さない。新しいIPCプロトコルは追加しない。

## 変更対象の主要ファイル

コード:

- `src/components/PostprocessStackPanel.tsx`
- `src/components/DetachedEffectStackApp.tsx`
- `src/lib/effectStackWindow.ts`
- `src/main.tsx`（必要な場合のみ）

テスト:

- `src/lib/effectStackWindow.test.ts`
- `src/components/PostprocessStackPanel.test.tsx`（既存の場合は追記）

## 代替案とトレードオフ

- 別ウィンドウ専用の完全なアプリentryを追加する案はProvider重複と保守対象を増やすため採用しない。
- ブラウザーrootからProviderを省略する案は、現在の`Toggle`／`useLanguage`の実行時エラーを解消できないため採用しない。
- Tauri作成待機を固定sleepだけにする案は、作成失敗と遅延成功を区別できないため採用しない。

## 移行方法

既存のURL、Window label、capability識別子、store状態は維持する。変更後はブラウザーで通常ポップアップとDocument Picture-in-Picture、Tauriで作成成功・失敗・close/reopenを順に確認する。

## ロールバック方法

別ウィンドウのProviderラッパーと作成待機境界を元に戻せば、インライン表示と既存の別ウィンドウ経路へ戻せる。storeやPresetの形式を変更しないため、データ移行は不要。
