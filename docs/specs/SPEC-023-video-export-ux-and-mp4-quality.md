---
id: SPEC-023
title: 動画書き出しUXとMP4品質設定の改善
status: implemented
owners: [maintainer]
created: 2026-07-20
updated: 2026-07-20
depends_on: [SPEC-007]
related_adrs: [ADR-0001, ADR-0002]
related_code: [src/App.tsx, src/components/ExportPanel.tsx, src/components/GradientCanvas.tsx, src/adapters/index.ts, src/adapters/types.ts, src/adapters/tauri/videoExportService.ts, src/adapters/browser/videoExportService.ts, src/lib/exportVideo.ts, src/lib/exportProgress.ts, src/lib/exportSlits.ts, src/lib/renderBridge.ts, src-tauri/src/lib.rs, docs/index.md, docs/development/development-guide.md, src/docs/help.md]
related_tests: [src/lib/ffmpegDebug.test.ts, src/lib/exportProgress.test.ts, src/lib/renderBridge.test.ts, src-tauri/src/lib.rs, npm test, npm run lint, npm run build, npm run docs:check, npm run docs:build, cargo fmt --manifest-path src-tauri/Cargo.toml --check, cargo test --manifest-path src-tauri/Cargo.toml, cargo check --manifest-path src-tauri/Cargo.toml]
human_review: completed
---

# SPEC-023: 動画書き出しUXとMP4品質設定の改善

## 背景・問題

動画フレームの生成が終わった直後にプレビューアニメーションが再開し、FFmpegエンコードや
保存ダイアログの待機中にキャンバスが再生される。また、FFmpegのコンソールプロセスが
Windowsで一時的に表示されることがある。

現在のMP4は`libx264rgb`のCRF 0で完全無劣化として出力されるため、短い動画でもファイルサイズが
過大になる。開発環境にFFmpegがある場合、未導入利用者向けの案内UIを再現しにくい。

## ゴール・成功条件

- FFmpeg関連の非対話プロセスをWindowsのコンソール非表示で実行する。
- MOV、MP4、連番PNG ZIP、スリット書き出しの開始から保存完了までプレビューを停止する。
- フレーム生成、FFmpeg処理、保存の段階をUIへ表示し、保存成功後だけ100%にする。
- MP4にHigh、Balanced、Smallの3段階品質設定を追加する。
- 開発環境変数でFFmpeg未導入状態を再現し、既存の案内UIを確認できるようにする。

## スコープ

### 対象

- Windows x64 Tauri版のFFmpeg検証・エンコードプロセス表示
- Tauri版とブラウザ版の長時間書き出し中のプレビュー停止制御
- MOV、MP4、連番PNG ZIP、スリット書き出しの段階表示
- MP4品質プリセットのセッション内設定
- FFmpeg未導入状態の開発用シミュレーション
- 利用者向けガイドと開発者向けガイド

### 対象外

- FFmpegの実時間進捗取得、エンコード中キャンセル
- MP4のRGB色空間、`libx264rgb`、ファイル名の変更
- 品質設定のプリセット保存、アプリ設定保存
- FFmpegのダウンロード、同梱、更新、PATH変更
- Web版へのネイティブ動画エンコード追加

## 方針

### FFmpegプロセス

Windowsでは`CREATE_NO_WINDOW`をFFmpegの`-version`、`-encoders`、エンコード処理へ適用する。
FFmpegは引き続きRustの`Command`から直接起動し、PowerShellなどのシェルは経由しない。
FFmpeg探索のための`reg.exe`も非対話プロセスとしてコンソールを表示しない。Explorerを開く操作は
従来どおりOSのUIとして表示する。

### MP4品質

既存のRGB出力を維持したまま、次の品質プリセットを`libx264rgb`のCRF値へ変換する。

| プリセット | CRF | 既定 | 意図 |
| --- | ---: | --- | --- |
| High | 18 | ○ | 見た目を優先 |
| Balanced | 22 |  | 品質とサイズの均衡 |
| Small | 27 |  | サイズを優先 |

全プリセットで`-preset slow`、`-pix_fmt rgb24`、`-movflags +faststart`を使用する。
品質値はRendererからそのまま信頼せず、Rust側で許可された値だけをCRFへ変換する。

### プレビュー停止と進捗

Export開始時に現在のプレビュー再生状態を記録し、アニメーションループを停止する。
フレーム生成処理の内部では再生を再開しない。FFmpeg処理、出力Blobの読み込み、保存ダイアログ、
指定フォルダへの書き込みが完了した後にだけ、開始前の再生状態へ戻す。エラーまたはキャンセル時も
同じ復元処理を行う。

動画の進捗はフレーム生成を0〜70%、FFmpeg処理をエンコード中表示、保存開始を95%、保存成功を100%とする。
ZIPとスリットは書き出し中の進捗と保存中表示を使用する。100%通知は保存処理の完了後に限定する。

### 開発用未導入シミュレーション

Vite開発時に`VITE_KGG_DEBUG_FFMPEG_MISSING=1`が設定されている場合、実際の検出結果を使わず、
フロントエンドへ`available: false`を返す。`import.meta.env.DEV`がfalseの製品ビルドではこの値を無視する。
シミュレーション時もExportパネル、案内モーダル、MOV／MP4無効化、再確認操作は実際の未導入時と同じ表示にする。

## エラー・境界条件

- FFmpegがなくても静止画と連番PNG ZIPは利用できる。
- FFmpegの検証失敗時もコンソールを表示せず、既存の案内UIへ戻る。
- 保存ダイアログをキャンセルした場合もプレビュー停止を解除する。
- 品質値が未指定の場合はHighとして扱う。
- 不正な品質値はRust側で拒否し、FFmpegを起動しない。
- 開発用シミュレーションは製品ビルドの実際のFFmpeg探索結果を変更しない。

## 受け入れ条件

- AC-001: WindowsのFFmpeg検証・エンコードでコンソールウィンドウが表示されない。
- AC-002: MOV／MP4／ZIP PNG／スリット書き出しで、保存完了までプレビューが再生されない。
- AC-003: 書き出し開始前の再生／停止状態が保存完了、エラー、キャンセル後に復元される。
- AC-004: フレーム生成、FFmpeg処理、保存の段階が表示され、保存成功後にだけ100%となる。
- AC-005: High、Balanced、SmallがそれぞれCRF 18、22、27へ変換され、未指定時はHighになる。
- AC-006: MP4が`libx264rgb`、RGB、`+faststart`を維持したままCRF圧縮される。
- AC-007: `VITE_KGG_DEBUG_FFMPEG_MISSING=1`の開発起動でFFmpeg未検出UIを再現できる。
- AC-008: デバッグフラグがない場合、PATHまたはK-GG専用フォルダの実FFmpeg検出が維持される。
- AC-009: FFmpeg未導入時も静止画と連番PNG ZIPを利用できる。
- AC-010: docsチェック、docsビルド、フロントエンドテスト・lint・ビルド、Rustテスト・checkが成功する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-005, AC-006 | Rust unit / Windows手動確認 | FFmpeg起動・品質引数 |
| AC-002〜AC-004 | TypeScript unit / Tauri手動確認 | ExportPanel、GradientCanvas、renderBridge |
| AC-007〜AC-009 | TypeScript unit / 開発起動確認 | FFmpegデバッグ状態、Export UI |
| AC-010 | 自動検証 | npm scripts、Cargo commands |

## 検証結果

2026-07-20に次を確認した。

- TypeScript型検査、Vitest 12ファイル・59テスト、lint（エラー0件、既存警告24件）、Vite本番ビルドが成功した。
- `npm`が実行環境のPATHにないため、npmスクリプトの代わりにリポジトリ内のNode実行ファイルで同等のTypeScript、Vitest、ESLint、Vite検証を実行した。
- `npm run docs:check`相当のドキュメントチェックとVitePressビルドが成功した。
- `cargo fmt --manifest-path src-tauri/Cargo.toml --check`、Rustテスト13件、`cargo check --manifest-path src-tauri/Cargo.toml`が成功した。
- security-auditorの読み取り専用レビューでP0/P1はなく、FFmpegプロセス、品質値検証、Tauri引数、デバッグフラグに重大な問題がないことを確認した。
- Windows Tauri実機でのFFmpegあり／なし、コンソール非表示、保存ダイアログ／指定フォルダ、MOV／MP4／ZIP／スリットの手動確認は未実施である。
- 動画一時パスのsymlink／TOCTOU対策は既存実装の残課題（P2）として、今回の仕様対象外に記録する。

## 移行・互換性

プリセット形式、既存ファイル名、FFmpeg探索順序、RGB形式への変更はない。MP4の既定エンコードだけが
CRF 0からCRF 18へ変わり、新しく品質設定を選択できる。品質設定はセッション内状態であり、既存の
保存データ移行は不要である。

## 未決定事項

なし。
