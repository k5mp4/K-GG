---
id: SPEC-024
title: 動画書き出しFFmpeg待機の応答性改善
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-21
depends_on: [SPEC-007, SPEC-014, SPEC-016, SPEC-023]
related_adrs: [ADR-0002, ADR-0005]
related_code: [src/App.tsx, src/components/ExportPanel.tsx, src/components/TimelineBar.tsx, src/adapters/tauri/videoExportService.ts, src-tauri/src/lib.rs, src/lib/exportProgress.ts]
related_tests: [src/lib/exportProgress.test.ts, src/lib/renderBridge.test.ts, src-tauri/src/lib.rs]
human_review: completed
---

# SPEC-024: 動画書き出しFFmpeg待機の応答性改善

## 背景・問題

複数のポストプロセスエフェクトを有効にした動画では、フレーム生成の進捗が約70%に到達した後、
FFmpegエンコード中に画面が停止したように見えることがある。現状の進捗設計では70%がフレーム生成の
終点を表すため、エンコード開始後も同じ値が表示され、実際の待機状態を利用者が判断できない。
さらにTauriコマンド内でFFmpegの同期処理を実行しているため、エンコード時間が長い場合にアプリの
応答性を損なう可能性がある。

## ゴール・成功条件

- FFmpegの同期的なプロセス待機をTauriのブロッキング用スレッドへ分離し、UIを応答可能にする。
- 70%到達後は推定パーセントを表示せず、「FFmpegでエンコード中」と段階表示する。
- エンコード中もプレビューキャンバスを停止したままにする。
- 保存成功後だけ完了扱いとし、エラー・キャンセル時は開始前の再生状態を復元する。

## スコープ

### 対象

- Tauri版MOV／MP4書き出しのFFmpeg処理スレッド分離
- ExportパネルからTimelineへの書き出し段階通知
- フレーム生成終了後のエンコード中表示
- 既存のFFmpeg引数、品質設定、コンソール非表示、プレビュー停止仕様との整合

### 対象外

- FFmpegの実時間進捗取得、エンコード中のキャンセル処理
- エフェクトシェーダーの画質・アルゴリズム変更
- 固定時間・固定ファイルサイズの保証

## 方針

FFmpegコマンドの引数検証とプロセス待機を同期関数へ分離し、公開Tauriコマンドは
tauri::async_runtime::spawn_blockingで同期関数を実行する。Renderer側ではフレーム生成を0〜70%とし、
エンコード中は段階ラベルだけを表示する。保存中は95%を維持し、保存成功後の完了通知で100%へ進める。

## 受け入れ条件

- AC-001: MOV／MP4のFFmpegエンコード中もTauriのUIイベント処理が長時間ブロックされない。
- AC-002: 70%到達後、TimelineとExportパネルにエンコード中の段階が表示される。
- AC-003: エンコード中および保存中にプレビューキャンバスが再生されない。
- AC-004: エンコード失敗、保存キャンセル、その他のエラー時に開始前の再生状態へ戻る。
- AC-005: RGB形式、品質プリセット、ファイル名、FFmpegコンソール非表示が維持される。
- AC-006: TypeScriptテスト、Rustテスト、lint、build、docs検証が成功する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-005 | Rustテスト／Windows手動確認 | Tauriコマンド、FFmpegプロセス |
| AC-002 | TypeScriptユニットテスト／Windows手動確認 | exportProgress、Timeline、Exportパネル |
| AC-003, AC-004 | 既存テスト／Windows手動確認 | renderBridge、動画書き出し |
| AC-006 | 自動検証 | npm相当コマンド、Cargo、docs scripts |

## 検証結果

2026-07-21に次を確認した。

- TypeScript型検査、Vitest 24ファイル・148テスト、lint（エラー0件、既存警告23件）が成功した。
- Vite本番ビルドが成功した。Node.js 18.15.0のため、ViteからNode.js 20.19+または22.12+を推奨する警告が表示された。
- cargo fmt --manifest-path src-tauri/Cargo.toml --check、Rustテスト13件、cargo check --manifest-path src-tauri/Cargo.tomlが成功した。
- npm run docs:check相当のドキュメントチェック（25仕様・6 ADR）とVitePressビルドが成功した。
- security-auditorの読み取り専用レビューでspawn_blocking化、引数配列、パス検証、コンソール非表示を確認した。P0はなかった。
- FFmpeg実行ファイルの信頼性検証、出力ファイルのリンク／TOCTOU、エンコードのタイムアウト・キャンセルは既存のフォローアップ課題として残る。
- Windows Tauri実機での複雑なEffect Stackを使った70%以降のUI応答性、FFmpegコンソール非表示、各保存経路の手動確認は未実施である。
