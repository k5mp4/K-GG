---
title: 配布安全性とライセンス
---

# 配布安全性とライセンス

## Tauriの更新署名

Windows Authenticodeは採用しない。Tauri updaterの署名は別の仕組みで、有料証明書を必要としない。現在の公開鍵を維持し、対応する秘密鍵をGitHub release environmentの`TAURI_SIGNING_PRIVATE_KEY`、パスフレーズを`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`へ保管する。秘密鍵をリポジトリやログへ出力しない。紛失に備え、アクセスを限定した別の場所へバックアップする。

既存インストールは埋め込まれた公開鍵を信頼するため、鍵を安易に再生成しない。紛失時は署名付き更新を継続できない。漏えい時はリリースを止め、配布経路の調査と鍵の移行を別途設計する。初回のみ新規鍵が必要な場合は、公式[Tauri updater手順](https://v2.tauri.app/plugin/updater/)に従い`npm run tauri -- signer generate -w <安全な保存先>`で生成し、公開鍵だけを`npm run updater:key`の手順で設定する。

`npm run release:check`はHTTPS、公開鍵の構造、updater artifact生成、CSPの存在を確認する。秘密鍵との対応や実際の署名の正しさを証明する検査ではない。リリース前に旧版から更新し、改ざんassetと署名が拒否されることを確認する。GitHubアカウント・Actions権限や秘密鍵が侵害されると、署名付きの不正更新を配布できるため、2FA、最小権限、release environmentとbranch rulesの管理も必要になる。

## WebViewと通信

本番CSPはスクリプトを同梱元へ制限し、通信は同梱元とTauri IPCに限定する。フォントCSS・フォント取得だけは既存のGoogle Fontsを許可する。更新通信はWebViewのfetchではなくRust updaterがHTTPSで実施する。CSPの`connect-src`へGitHubを追加する必要はない。開発時のみViteと開発用のローカルMCP bridgeの通信を許可する。

WebView2はEvergreen Runtimeの更新が行われる環境で利用する。SmartScreenを無効化する起動引数は使用しない。CSPはRustコマンドのパス検証や権限検証の代わりにはならない。動画保存ではTauri filesystem scopeを確認するが、既に許可されたパスはプロセス内で再利用できる。毎回の保存操作に限定した許可が必要になった場合は、Rust側でダイアログと保存処理を一体化する設計を検討する。

## ライセンス一覧の更新

ヘルプの「第三者ライセンス」は`src/generated/thirdPartyLicenses.json`の本文を同梱する。npmのproduction依存とWindows Cargo graph（build依存を含む）、固定上流コミットのTweeq推移依存を広く収録する。tree shakingで除外される部品もあるため、この一覧を厳密な実行バイナリのSBOMとは扱わない。GSAPはUIから除去した。

依存を更新したときはWindows上で次を実行する。Python 3.11以上、Rust、npm依存が必要である。通常のbuildではPython・ネット接続による収集は行わず、コミットされた一覧を検査する。

```sh
npm ci
cargo fetch --manifest-path src-tauri/Cargo.toml
python tools/collect-tweeq-licenses.py
npm run licenses:generate
npm run licenses:check
```

Tweeq収集は固定コミットのpnpm lockfileをたどり、tarballのintegrityを確認する。crateに不足する本文は固定コミットの上流から取得し、`tools/license-overrides.json`へ取得元付きで保存する。selectorsのMPL本文はMozilla公式本文とcrateの通知を収録する。依存更新時は生成差分のライセンス・著作権表示をレビューする。MPL対象crateは未改変で、アプリ内に該当バージョンのソース取得リンクを表示する。今後改変した場合は、その改変ソースの提供方法も更新する。

この一覧には利用者が別途導入するFFmpegやWebView2自体の再配布は含まない。将来それらを同梱する場合は別途配布条件を確認する。
