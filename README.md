# K-GG

[英語版](README.en.md)

K-GGは、KAGARIBIのビジュアル制作向けのWebGLベースのグラデーションジェネレーターです。色とエフェクトを編集し、静止画・PNGシーケンスを書き出せます。公開中のWindowsデスクトップ版では、外部FFmpegを利用したMOV/MP4書き出しにも対応します。

[Web版を開く](https://kagaribi15-grad.ke-goworks.com/)

[Windows x64版をダウンロード](https://github.com/k5mp4/K-GG/releases/latest) · [使い方を見る](docs/index.md)

## ビジュアルプレビュー

READMEのヒーロー画像は、プロジェクトオーナーから提供され承認された完成出力を待っている状態です。必要な素材の仕様・配置・承認条件は[README用ビジュアル素材仕様](docs/development/readme-visual-assets.md)にまとめています。生成画像やサンプル画像、存在しない画像へのリンクは配置していません。

## 何が作れるか

- **グラデーション** — Linear、Radial、4-color、Diamond、Angle、Bezier、Mesh。Meshは、編集可能なコーナー色とBézierハンドルを持つ単一の2×2 Coons Patchです。
- **エフェクトスタック** — Diffuse、Noise、Slit、Stretch、Distort、Mirror、Kaleidoscope、Voronoi、Glassなどを重ねられます。
- **画像とモーション** — 画像をグラデーションソースやオーバーレイ・マスクとして使い、Static / Auto / Keysのアニメーションをプレビューして、静止画やPNGシーケンスを書き出せます。
- **高度な表示** — SANDBOXのCloth、Cone、Normal Map、Prism、Particles、Flow Gradient、Seamlessで、3D表現や試験的な見た目を試せます。

グラデーション、画像ソース、マスク、エフェクトスタック、アニメーション、プリセットを組み合わせて、静止画からモーション用の素材まで作成できます。

## 機能の位置づけ

以下は現在の製品画面と仕様に基づく位置づけです。すべてのモジュールが同じ実行環境やプラットフォーム対応範囲を持つことを保証するものではありません。

| 位置づけ | 現在の範囲 |
| --- | --- |
| 標準利用 | グラデーション編集、Image Gradient Source、画像オーバーレイ・マスク、メインのEffect Stack、アニメーションプレビュー、プリセット管理、画像書き出し、PNGシーケンスZIP書き出し。 |
| 試験運用 / Beta | SANDBOXの**Cloth**と**Normal Map**はBeta表示です。**After Effects Connect**もBetaです。 |
| SANDBOX / 高度な機能 | SANDBOXは独立した高度な表示領域です。メインのEffect Stackとは別のモジュールであり、3D・GPU・Bridgeの動作は実行環境に依存する場合があります。 |
| Windowsデスクトップ版 | 公開中のデスクトップ版はWindows x64です。MOV/MP4書き出しは、外部FFmpegを検出できる場合に利用できます。 |

## Windowsデスクトップ版のクイックスタート

1. [最新版のWindows x64版](https://github.com/k5mp4/K-GG/releases/latest)をダウンロードしてインストールします。
2. プリセットを使うかエディターでグラデーションを作り、**Export**を開きます。
3. PNGと画像シーケンスの書き出しにFFmpegは不要です。MOV/MP4には、[ユーザーガイド](docs/index.md)にある方法で外部の`ffmpeg.exe`を用意します。
4. 公開中のインストーラーはAuthenticode署名がないため、初回インストール時にWindows SmartScreenの警告が表示される場合があります。続行する前に、公式の[GitHub Release](https://github.com/k5mp4/K-GG/releases/latest)から取得したファイルであることを確認してください。

詳しい操作は[ユーザーガイド](docs/index.md)を参照してください。デスクトップ版の配布物・アップデート・FFmpegのRelease Gate確認事項は[リリースガイド](docs/development/releasing.md)にまとめています。

## 必要環境

### Windowsデスクトップ版を使う場合

- 公開インストーラーはWindows x64向けです。
- 外部FFmpegはMOV/MP4書き出しにのみ必要です。
- GPUとドライバーの対応状況は、WebGL2とSANDBOX/3D表示の結果に影響する場合があります。

### K-GGを開発する場合

- Node.js `22.12.0`、npm `>=10.9.0`。
- デスクトップ版をビルドする場合はRustとTauriの前提環境。
- FFmpegはネイティブ動画の検証に必要ですが、ブラウザ開発サーバーには不要です。

FFmpegは`ffmpeg`コマンドとしてPATHから実行できる状態にしてください。Windowsでは次のコマンドで導入できます。

```sh
winget install Gyan.FFmpeg
```

導入状態は次のコマンドで確認できます。

```sh
ffmpeg -version
```

## 開発者向けクイックスタート

依存関係をインストールします。

```sh
npm ci
```

長時間実行されるため、次のどちらか一方を起動します。

```sh
npm run dev:local       # ブラウザ版
```

```sh
npm run tauri:dev       # Tauriデスクトップ版
```

開発サーバーを停止してから検証を実行します。

```sh
npm run check:fast      # 型検査、テスト、Lint、ビルド、Docsチェック
npm run docs:check      # Docsの参照とindexを検証
npm run docs:build      # VitePress Docsサイトをビルド
```

開発ワークフロー、検証ゲート、ネイティブ確認の全体像は[開発者向けガイド](docs/development/index.md)を参照してください。[DocsDD運用](docs/development/docdd.md)では、現行動作・設計判断・変更履歴の置き場所を説明しています。

## ビルドとリリース検証

フロントエンドの本番ビルド、Tauriデスクトップ版、Windows x64 NSISインストーラーは次のコマンドで個別に生成できます。

```sh
npm run build
npm run tauri:build
npm run tauri:build:windows
```

リリース設定・高速検証・Rust検証をまとめて実行する場合は`npm run verify`を使います。`npm run verify:windows`はローカルのWindows環境専用で、`%USERPROFILE%\.tauri\k-gg.key`に更新署名秘密鍵を置き、署名鍵のパスワードを対話入力してからWindowsインストーラーを生成します。GitHub Actionsで公開リリースを作る場合は、`release` Environmentの`TAURI_SIGNING_PRIVATE_KEY`と`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`を使う[リリースワークフロー](.github/workflows/release.yml)を参照してください。どちらも通常のプルリクエストでは実行しません。

```sh
npm run verify
npm run verify:windows
```

## アーキテクチャとリポジトリ構成

主要な処理経路は次のとおりです。

```text
React UI → application commands → Zustand state → scene evaluation
         → render plan/frame bridge → WebGL2 canvas
         → export adapter
```

```text
src/                  React UI、state、evaluation、WebGL renderer、export adapters
src-tauri/            Windows/Tauri shell、native export、updater連携
docs/                 ユーザーガイド、開発Docs、現行仕様、ADR、履歴
tools/                Docsと開発用のユーティリティ
```

維持管理している技術概要は[アーキテクチャガイド](docs/development/architecture.md)にあります。このREADMEでは入口として必要な情報に絞り、内部仕様の重複は避けています。

## ドキュメント

開発Docsサイトを起動する場合は次のコマンドを使います。

```sh
npm run docs:dev
```

| 目的 | 入口 |
| --- | --- |
| 使い方 | [docs/index.md](docs/index.md) |
| 開発者向け | [docs/development/index.md](docs/development/index.md) |
| 現行仕様 | [docs/specs/current/](docs/specs/current/) |
| アーキテクチャ | [docs/development/architecture.md](docs/development/architecture.md) |
| 設計判断 / ADR | [docs/adr/](docs/adr/) |
| Releaseとネイティブ確認 | [docs/development/releasing.md](docs/development/releasing.md) |
| README用ビジュアル素材 | [docs/development/readme-visual-assets.md](docs/development/readme-visual-assets.md) |

## コントリビュートとIssue

プルリクエストの前に[CONTRIBUTING.md](CONTRIBUTING.md)と[開発ワークフロー](docs/development/workflow.md)を確認してください。バグ、機能提案、Docs改善、再現条件の共有は、公開追跡が必要な場合は[GitHub Issues](https://github.com/k5mp4/K-GG/issues)を利用できます。直接のRequestやプルリクエストも有効な入口です。

## リリース

- [最新版](https://github.com/k5mp4/K-GG/releases/latest)
- [リリース一覧](https://github.com/k5mp4/K-GG/releases)
- [リリースガイド](docs/development/releasing.md)

公開中のデスクトップ配布物はWindows x64インストーラーです。各バージョンの配布物とネイティブ環境の前提はリリースノートに記載されるため、固定バージョンのリンクではなくリリースページを利用してください。

本番版は起動時に公開済みの最新版を確認し、利用者が選んだタイミングでダウンロード・インストールします。自動ダウンロードや強制更新は行いません。初回インストーラーにはTauri updaterの署名がありますが、Windows Authenticodeコード署名はないため、初回インストール時にWindows SmartScreenの警告が表示される場合があります。

管理者はリリース前に更新署名鍵とGitHub Environmentを設定してください。詳しくは[リリースガイド](docs/development/releasing.md)を参照してください。

## 公開リポジトリについて

このリポジトリでは、ローカルのAI・ツール設定、依存関係フォルダー、ビルド成果物、ログ、VitePressのキャッシュを`.gitignore`で除外しています。

## ライセンスと公開時の注意

K-GGのソースコードは[Apache License 2.0](LICENSE)です。K-GGで生成した画像、動画、PNG連番などの成果物は、個人利用・非商用利用・商用利用を問わず利用できます。ただし、取り込んだ画像、ロゴ、キャラクター、商標、イベント素材など第三者素材の権利確認は利用者の責任で行ってください。

第三者ライセンスの要点は[NOTICE](NOTICE)にまとめています。現在のnpm / Cargo依存関係ではMIT、Apache-2.0、BSD、ISC系が中心で、Tauri/Rust依存ツリーにMPL-2.0のコンポーネントが含まれます。MPL-2.0は該当する第三者コンポーネントに適用され、K-GG本体のApache-2.0ライセンスを変更するものではありません。

K-GGはFFmpegを同梱・配布していません。デスクトップ版はMOV/MP4書き出し時に、利用者がK-GG専用のローカルデータ領域`<app_local_data_dir>/ffmpeg/ffmpeg.exe`へ配置したファイル、またはシステムのPATHにある`ffmpeg`コマンドを別プロセスで呼び出します。FFmpegのライセンスは利用するビルドに依存します。FFmpegをK-GGと一緒に再配布する場合は、[FFmpegのライセンス情報](https://ffmpeg.org/legal.html)と配布元の条件を確認してください。

GSAPはUIアニメーションに使用しており、MITではなくGSAP Standard Licenseが適用されます。一般的な商用利用は許可されますが、K-GGをアニメーション制作サービスやWebflow系のビジュアルアニメーション制作ツールと競合する形で公開・販売する場合は、公開前にGSAPライセンスを確認するか、GSAP依存を外してください。
