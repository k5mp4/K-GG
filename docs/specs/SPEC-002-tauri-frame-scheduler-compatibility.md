---
id: SPEC-002
title: Tauri WebGLフレーム処理互換性の修正
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-04
depends_on: []
related_adrs: [ADR-0001]
related_code: [src/lib/latestFrameScheduler.ts, src/components/GradientCanvas.tsx, src/hooks/useWebGL.ts]
related_tests: [src/lib/latestFrameScheduler.test.ts]
human_review: completed
---

# SPEC-002: Tauri WebGLフレーム処理互換性の修正

## 背景・問題

Windows向けTauri製品ビルドを起動すると、画面が一度表示された後に
`TypeError: Illegal invocation`が発生し、Reactのルート要素が空になって黒画面になる。

`LatestFrameScheduler`がブラウザの`requestAnimationFrame`と
`cancelAnimationFrame`を未バインドの関数として保持し、スケジューラ自身を
レシーバーとして呼び出していることが原因である。WebView2はブラウザAPIの
レシーバーを検証するため、GPU初期化後の最初の静的描画予約で例外になる。

## ゴール・成功条件

- Tauri製品ビルドでGPU初期化後も画面が表示され続ける。
- フレーム予約とキャンセルをブラウザが要求するレシーバーで呼び出す。
- 最新描画要求への集約とキャンセルという既存動作を維持する。

## スコープ

### 対象

- `LatestFrameScheduler`の既定フレームAPI呼び出し
- 呼び出しレシーバーを検証する回帰テスト
- 静止描画要求を同一フレームの最新1件へ集約する処理
- React StrictModeで同一Canvas・同一シェーダーバージョンのWebGL初期化を共有する処理
- Windows向けTauri製品ビルドの起動確認

### 対象外

- WebGL描画内容、GPU選択、最適化設定の変更
- アップデート確認処理の変更
- フレームスケジューラの集約方式や公開APIの変更

## 方針

既定の`requestAnimationFrame`と`cancelAnimationFrame`を直接保持せず、
`window`上のAPIを呼び出す小さなラッパーを保持する。これにより、実行時の
レシーバーを常に`window`へ固定する。

テストから注入するフレーム関数の契約は変更せず、既存テストと利用箇所を
維持する。

停止中の静止描画は`LatestFrameScheduler`で集約し、入力イベントごとに重い
WebGLパスを同期実行しない。WebGL初期化はCanvasとシェーダーバージョンをキーに
進行中Promiseを共有し、StrictModeのsetup/cleanup再実行でGPUコンパイルを重複
させない。シェーダーバージョンが変わる場合は直前の初期化完了後に直列実行する。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| `bind(window)`した関数を保持する | 不採用 | 動作は満たすが、ラッパーの方が呼び出し境界を直接表現できる |
| 呼び出し時に`.call(window)`を使う | 不採用 | 注入されたテスト関数にもブラウザ固有のレシーバーを強制する |
| 既定値だけ`window`経由のラッパーにする | 採用 | ブラウザAPIだけを修正し、注入可能な契約を維持できる |

## エラー・境界条件

- 同一フレーム内の複数要求は、従来どおり最後のコールバックだけを実行する。
- 予約済みフレームをキャンセルした場合、コールバックを実行しない。
- 注入されたフレーム関数は、従来どおり呼び出し元固有の実装を使用できる。

## 受け入れ条件

- AC-001: 既定スケジューラがフレーム予約APIを`window`レシーバーで呼び出す。
- AC-002: 既定スケジューラがフレームキャンセルAPIを`window`レシーバーで呼び出す。
- AC-003: 複数の描画要求が最新の1件へ集約され、キャンセル時は実行されない。
- AC-004: Windows向けTauri製品ビルドでGPU初期化後もReactルートが維持され、
  `Illegal invocation`が発生しない。
- AC-005: 文書検証、テスト、lint、Webビルド、Tauriビルドが成功する。
- AC-006: 同一フレーム内の静止描画要求は最新の1件へ集約される。
- AC-007: 同一Canvas・同一シェーダーバージョンの進行中WebGL初期化は共有される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | レシーバー検証付きユニットテスト | `src/lib/latestFrameScheduler.test.ts` |
| AC-003 | 既存ユニットテスト | `src/lib/latestFrameScheduler.test.ts` |
| AC-004 | 製品ビルドを起動し、WebViewの例外とReactルートを確認 | Windows Tauriアプリ |
| AC-005 | 自動検証 | npm scripts、`tauri build` |
| AC-006 | 最新要求への集約テスト | `src/lib/latestFrameScheduler.test.ts` |
| AC-007 | StrictModeを含む起動確認 | 開発ビルド、Windows Tauriアプリ |

## 検証結果

- `npm test`: 7ファイル、37テスト成功
- `npm run lint`: エラー0件（既存警告31件）
- `npm run build`: 成功
- `npm run docs:check`, `npm run docs:build`: 成功
- `cargo test`: 3テスト成功、`cargo check`: 成功
- `npm run tauri:build -- --no-bundle`: 成功
- `npm run tauri:build`: TauriアプリケーションとNSISの生成に成功。更新アーティファクトの
  署名のみ、ローカル環境に`TAURI_SIGNING_PRIVATE_KEY`がないため未実施
- 生成した製品ビルドを30秒以上起動し、Reactルート1件とCanvas 5件が維持され、
  GPU初期化後も`Illegal invocation`が発生しないことを確認

## 移行・互換性

プリセット、保存データ、利用者操作、公開APIへの影響はない。内部のブラウザAPI
呼び出し方法だけを変更するため、データ移行は不要である。

## 未決定事項

なし。
