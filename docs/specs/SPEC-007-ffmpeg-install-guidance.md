---
id: SPEC-007
title: K-GG専用フォルダとPATHからのFFmpeg検出
status: implemented
owners: [maintainer]
created: 2026-07-06
updated: 2026-07-07
depends_on: [SPEC-005]
related_adrs: [ADR-0001, ADR-0002]
related_code: [src/App.tsx, src/components/ExportPanel.tsx, src/components/FfmpegSetupDialog.tsx, src/adapters/types.ts, src/adapters/tauri/videoExportService.ts, src/lib/exportVideo.ts, src-tauri/src/lib.rs, docs/index.md, src/docs/help.md, NOTICE]
related_tests: [src-tauri/src/lib.rs, npm test, npm run lint, npm run build, npm run docs:check, npm run docs:build, cargo fmt --manifest-path src-tauri/Cargo.toml --check, cargo test --manifest-path src-tauri/Cargo.toml, cargo check --manifest-path src-tauri/Cargo.toml]
human_review: completed
---

# SPEC-007: K-GG専用フォルダとPATHからのFFmpeg検出

## 背景・問題

Tauriデスクトップ版のMOV / MP4書き出しにはFFmpegが必要である。現在はPATH上の
`ffmpeg`コマンドを直接呼び出しており、未導入状態を事前に判定せず、K-GG専用の配置場所もない。

利用者が次のどちらかを選べるようにする。

- K-GGが用意する専用フォルダへ`ffmpeg.exe`を配置する。
- 従来どおりシステムPATHから`ffmpeg`を実行可能にする。

どちらも利用できない場合はExportタブで案内モーダルを表示し、gyan.devのFFmpeg Buildsページと
専用フォルダを開けるようにする。

## ゴール・成功条件

- Windows x64デスクトップ版の起動時にK-GG専用FFmpegフォルダを作成する。
- 専用フォルダの`ffmpeg.exe`またはPATH上の`ffmpeg`を検出・検証して動画書き出しに使用する。
- 専用フォルダを優先し、利用できない場合だけPATHへフォールバックする。
- どちらも利用できない場合、Exportタブのクリック時に導入案内を表示する。
- K-GG自身はFFmpegをダウンロード、コピー、同梱、削除しない。
- FFmpegがなくても、FFmpegを使わない書き出しは継続利用できる。

## スコープ

### 対象

- Windows x64 Tauri版
- K-GG専用FFmpegフォルダの作成と表示
- 専用フォルダとシステムPATHからのFFmpeg探索
- FFmpegの実行可否、アーキテクチャ、必要エンコーダーの検証
- Exportタブ選択時の未導入案内モーダル
- gyan.dev FFmpeg Buildsページへの外部リンク
- MOV / MP4処理での検出済みFFmpegパス使用
- 利用中のFFmpegの場所、バージョン、状態表示
- 利用者向けガイド、アプリ内ヘルプ、`NOTICE`

### 対象外

- K-GGによるFFmpegのダウンロード、コピー、展開、更新、削除
- K-GGのインストーラーまたはReleaseへのFFmpeg同梱・転載
- PATH、レジストリ、システムディレクトリの変更
- 利用者が指定した任意パスの永続保存
- FFmpeg DLLとの静的・動的リンク
- macOS、Linux、Windows ARM64
- Web版でのMOV / MP4対応
- 動画コーデック、品質、ファイル名の変更

## 専用フォルダ

実行ファイル横やインストール先は更新時の置き換えと書き込み権限の影響を受けるため、
Tauriのアプリローカルデータ領域に次のフォルダを作成する。

```text
<app_local_data_dir>/ffmpeg/
└─ ffmpeg.exe
```

Windowsデスクトップ版の起動時にフォルダがなければ作成する。作成失敗はアプリ起動を妨げず、
Exportパネルと案内モーダルに理由を表示する。

案内モーダルとExportパネルには`Open FFmpeg Folder`を表示し、OSのファイルエクスプローラーで
このフォルダを開く。利用者は自身で取得・展開した`ffmpeg.exe`をここへ配置する。

K-GGはフォルダ内の`ffmpeg.exe`以外を探索・実行せず、配置されたファイルを変更または削除しない。
アプリのアンインストール時にアプリデータが残る場合があることを利用者ガイドへ記載する。

## 探索と検証

起動時、Exportタブのクリック時、MOV / MP4書き出し開始直前に次の順序で確認する。

1. `<app_local_data_dir>/ffmpeg/ffmpeg.exe`
2. システムPATH上の`ffmpeg`

Windowsのパッケージ済みアプリは、起動元のExplorerやショートカットが開発シェルと異なるPATHを
継承する場合がある。そのため、Rust側はプロセスの`PATH`を先に候補へ加え、その後に
HKCU/HKLMの環境変数`Path`を読み取り専用で参照して同じ優先順位のPATH候補へ加える。
K-GGはPATHまたはレジストリを書き換えない。

各候補に対してタイムアウト付きで`-version`と`-encoders`を実行し、次を確認する。

- コマンドが正常終了する。
- Windows x64で実行可能なFFmpegである。
- MOV用の`qtrle`エンコーダーが存在する。
- MP4用の`libx264rgb`エンコーダーが存在する。

専用フォルダの候補が存在しない、起動できない、または必要条件を満たさない場合はPATH候補を確認する。
PATH候補が利用可能なら動画書き出しを有効にし、専用フォルダ側の問題は非ブロッキング警告として表示する。

両方が利用可能な場合は専用フォルダを使用する。確認結果には
`source: app-data-folder | system-path`、実際のパス、バージョン、警告を含める。

検出済みパスをフロントエンドからエンコードコマンドへ任意指定できないよう、Rust側で保持・再確認する。
書き出し開始直前の再確認に失敗した場合はフレーム生成を開始せず、案内状態へ戻す。

エンコードコマンドに渡すPNG連番の入力パターンと出力ファイルも、Rendererから受け取った値を
そのまま信頼しない。Rust側で、どちらもOSの一時ディレクトリ配下にあるK-GGの動画書き出し用
一時フォルダ内であり、入力は`frame_%04d.png`、出力は`output.mov`または`output.mp4`であることを確認する。
条件を満たさない場合はFFmpegを起動しない。

## 案内UI

Exportタブの明示的なクリック時に再確認する。ホバー切り替えではモーダルを開かない。
どちらの候補も利用できない場合、次を含むモーダルを表示する。

- MOV / MP4書き出しにFFmpegが必要であること
- K-GG専用フォルダへ配置する方法
- PATHへ追加する従来の方法も利用可能であること
- gyan.devからWindows x64用`release essentials` ZIPを取得し、展開する手順
- `Open gyan.dev`
- `Open FFmpeg Folder`
- `Check Again`
- `Not Now`

案内先は次とする。

`https://www.gyan.dev/ffmpeg/builds/#release-builds`

外部リンクはOS既定のブラウザで開き、K-GG自身はダウンロードを開始しない。
モーダルを閉じてもExportパネルは開き、静止画とPNG連番ZIPを利用できる。

Exportパネルには検出状態を次のように表示する。

- 専用フォルダ利用中: `FFmpeg ready · K-GG folder · <version>`
- PATH利用中: `FFmpeg ready · System PATH · <version>`
- 未検出: `FFmpeg not found`
- 検証中: `Checking FFmpeg…`
- 検証失敗: 簡潔な理由と`Check Again`

確認中または未検出時はMOV / MP4だけを無効化する。

## ライセンス表示

K-GGはFFmpegを配布せず、利用者が導入した別プログラムをコマンドラインで実行する。
gyan.devの推奨ビルドはGPLv3であり、現行MP4に必要な`libx264`を含む。

導入モーダル、アプリ内ヘルプ、`NOTICE`には次を明示する。

- K-GG本体はApache-2.0であること
- FFmpegのライセンスは利用者が配置またはPATHへ追加したビルドに従うこと
- gyan.devの推奨ビルドはGPLv3であること
- FFmpeg、gyan.dev、GPLv3全文、FFmpegソースへのリンク
- H.264等の特許・利用条件は地域や用途で異なり、利用者が確認する必要があること

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| PATH上のFFmpegだけを使う | 不採用 | PATH設定なしでK-GG専用配置を選べない |
| 実行ファイル横へ専用フォルダを作る | 不採用 | 更新と書き込み権限の影響を受ける |
| アプリデータ領域へ専用フォルダを作る | 採用 | 更新から分離でき、利用者権限で配置できる |
| K-GGがFFmpegを直接ダウンロードする | 不採用 | 利用者の要求と異なり、通信と取得物管理をK-GGが担う |
| 専用フォルダだけを使う | 不採用 | 既にPATHを設定済みの利用者に再配置を求める |
| 専用フォルダを優先しPATHへフォールバックする | 採用 | K-GG専用配置と既存環境の両方を利用できる |

## エラー・境界条件

- 専用フォルダ作成失敗はアプリ起動を妨げず、PATH候補を確認する。
- 専用フォルダのファイルが不正でも、PATH候補が有効なら動画出力を許可する。
- 外部リンクを開けない場合はURLをコピー可能な文字列として表示する。
- gyan.devの外部リンクはRendererから任意URLを渡さず、Rust側の固定URLをOS既定ブラウザで開く。
- 検証処理の多重起動を防ぎ、最後に開始した確認結果だけをUIへ反映する。
- 検証コマンドにはタイムアウトを設け、ハングした実行ファイルを終了する。
- 書き出し中は利用中パスを固定し、途中で別候補へ切り替えない。
- Rendererから渡された入力パターンまたは出力ファイルがK-GGの動画書き出し用一時フォルダ外を指す場合、FFmpegを起動しない。
- FFmpeg専用フォルダをOSのファイルブラウザで開く処理は、PATH検索に依存せずWindows Explorerの既知の場所を使用する。
- FFmpegが利用不能でもZIP PNG等の書き出しは利用可能とする。
- Web版ではローカル探索を行わず、従来どおりMOV / MP4非対応とする。

## 受け入れ条件

- AC-001: Windows x64デスクトップ版の起動時にK-GG専用FFmpegフォルダが存在する。
- AC-002: 専用フォルダに有効な`ffmpeg.exe`がある場合、PATH未設定でもMOV / MP4を利用できる。
- AC-003: 専用フォルダに有効なFFmpegがなくてもPATH上のFFmpegが有効ならMOV / MP4を利用できる。
- AC-004: 両方が有効な場合は専用フォルダのFFmpegを使用する。
- AC-005: 両方が無効な状態でExportタブをクリックすると、gyan.dev、専用フォルダ、再確認の操作を含む案内モーダルが表示される。
- AC-006: K-GGはFFmpegをダウンロード、コピー、削除せず、PATHとレジストリを変更しない。
- AC-007: 必要エンコーダーが不足する候補を無効として扱い、利用者へ理由を表示する。
- AC-008: 書き出し開始直前に再確認し、無効ならフレーム生成を開始しない。
- AC-009: Web版、非対応OS、タブのホバー切り替えでは案内モーダルを表示しない。
- AC-010: FFmpeg未検出時もFFmpegを使わない書き出しを利用できる。
- AC-011: アプリ内ヘルプ、利用者ガイド、`NOTICE`に探索順序、配置場所、案内先、ライセンス情報が記載される。
- AC-012: 専用フォルダ、PATH、優先順位、タイムアウト、必要エンコーダー不足を自動テストで検証する。
- AC-013: docsチェック、docsビルド、フロントエンドテスト・lint・ビルド、Rustテスト・checkが成功する。
- AC-014: Windows x64実機で専用フォルダ、PATH、未検出、MOV、MP4を手動確認する。
- AC-015: FFmpegエンコードコマンドは、K-GGの動画書き出し用一時フォルダ外の入力パターンまたは出力ファイルを拒否する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-004, AC-007, AC-008, AC-012, AC-015 | Rust unit / integration | FFmpeg探索・検証・パス解決 |
| AC-005, AC-009〜AC-011 | component / manual | FFmpeg案内UI、利用者文書 |
| AC-013 | automated | `npm run verify` |
| AC-014 | manual | Windows x64 Tauri release build |

## 検証結果

2026-07-06に次を確認した。

- TypeScript型検査、フロントエンドテスト37件、lint、本番ビルドが成功した。
- docsチェックとVitePressビルドが成功した。
- Rustテスト7件と`cargo check`が成功した。
- PATH上のWindows x64 FFmpegに`qtrle`と`libx264rgb`があることを確認した。
- セッション内でアプリ内ブラウザを利用できなかったため、AC-014のTauri実画面確認は未実施。

2026-07-07に次を確認した。

- TypeScript型検査、フロントエンドテスト37件、lint、本番ビルドが成功した。
- docsチェックとVitePressビルドが成功した。
- Rustフォーマット確認、Rustテスト9件、`cargo check`が成功した。
- エンコード入力パターンと出力ファイルがK-GGの動画書き出し用一時フォルダ外を指す場合に拒否することをRustテストで確認した。
- Windows x64実機でのFFmpegフォルダ表示、MOV、MP4の手動確認は未実施。

2026-07-07に次を確認した。

- パッケージ済みexeが開発シェルと異なるPATHを継承する場合に備え、HKCU/HKLMの環境変数`Path`を読み取り専用で候補へ加えた。
- gyan.devを開く操作をTauriコマンド化し、Rust側の固定URLをWindows Explorer経由でOS既定ブラウザへ渡すようにした。
- TypeScript型検査、フロントエンドテスト37件、lint、本番ビルドが成功した。
- docsチェックとVitePressビルドが成功した。
- Rustフォーマット確認、Rustテスト12件、`cargo check`が成功した。
- `npm`が実行環境にないため、Vite build後にTauri CLIの`beforeBuildCommand`だけを空にして`tauri build --no-bundle`相当を実行し、release exeのコンパイルが成功した。

## 移行・互換性

既存プリセットと生成ファイル形式への影響はない。既にPATH上のFFmpegを利用している環境は
引き続き動作する。専用フォルダへ有効な`ffmpeg.exe`を置くと、次回確認からそちらが優先される。

## 未決定事項

なし。
