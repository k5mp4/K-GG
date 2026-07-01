# Windows版のリリースと自動更新

このページは、K-GGのWindows x64版をGitHub Releasesへ公開する管理者向けの手順です。

## 仕組み

K-GGは、公開済みの最新GitHub Releaseに含まれる`latest.json`を起動時に確認します。Gitタグを送信するとGitHub ActionsがDraft Releaseを作りますが、Draftの間は利用者へ配信されません。管理者が実機確認後に**Publish release**を押した時点で配信が始まります。

更新パッケージはTauriの署名鍵で検証されます。この署名はWindowsの発行元表示に使うコード署名とは別物です。

## 初回だけ行う設定

### 1. Tauri更新署名鍵を作る

リポジトリのルートでPowerShellを開き、次を実行します。

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.tauri"
& ".\node_modules\.bin\tauri.cmd" signer generate --write-keys "$env:USERPROFILE\.tauri\k-gg.key"
```

推測されにくいパスワードを設定してください。次の2ファイルが生成されます。

- `k-gg.key`: 秘密鍵。公開・共有・Gitへの追加は禁止
- `k-gg.key.pub`: 公開鍵。アプリへの組み込みが必要

公開鍵だけをTauri設定へ反映します。

```powershell
npm run updater:key -- "$env:USERPROFILE\.tauri\k-gg.key.pub"
```

`src-tauri/tauri.conf.json`に公開鍵が書き込まれます。この設定ファイルはコミットして構いません。秘密鍵とパスワードは別々の安全な場所へバックアップしてください。どちらかを失うと、既に配布したアプリへ更新を提供できなくなります。

ローカルでWindowsインストーラーを検証する場合は、同じPowerShell内で署名鍵を一時的に環境変数へ設定してビルドします。

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "$env:USERPROFILE\.tauri\k-gg.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = Read-Host "署名鍵のパスワード" -MaskInput

npm run tauri:build:windows

Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY
Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD
```

### 2. GitHub EnvironmentとSecretsを作る

GitHubの`k5mp4/K-GG`で次を操作します。

1. **Settings → Environments → New environment**
2. Environment名を`release`にする
3. Deployment branches and tagsを**Selected branches and tags**にする
4. Tagルール`v*`を追加する
5. **Environment secrets → Add secret**から次の2つを登録する

| Secret | 登録する値 |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | `k-gg.key`の全内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 鍵生成時のパスワード |

秘密鍵をターミナル履歴、Issue、Pull Request、チャット、READMEへ貼らないでください。GitHubのSecret入力欄へ直接貼り付けます。

### 3. GitHub Actionsを許可する

**Settings → Actions → General**を開き、Actionsが有効であることを確認します。外部Actionを制限している場合は、次のリポジトリを許可します。

- `actions/checkout`
- `actions/setup-node`
- `dtolnay/rust-toolchain`
- `Swatinem/rust-cache`
- `tauri-apps/tauri-action`

ワークフロー内ではすべて完全なコミットSHAへ固定されています。リポジトリ全体のWorkflow permissionsは読み取りのままで構いません。リリース処理だけが`contents: write`を要求します。

## 毎回のリリース

以下は`0.1.0`を公開する例です。バージョン番号は公開ごとに必ず増やします。

### 1. mainを更新して検証する

```powershell
git switch main
git pull --ff-only origin main
git status
npm ci
npm run release:version -- 0.1.0
npm run release:check
npm test
npm run lint
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

`git status`に意図しない変更がある場合は、先へ進まないでください。バージョン変更をコミットします。

```powershell
git add package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -m "chore: release v0.1.0"
git push origin main
```

### 2. リリースタグを送る

```powershell
git tag -a v0.1.0 -m "K-GG v0.1.0"
git push origin v0.1.0
```

タグ名は必ず`v`とアプリのバージョンを一致させます。タグ送信後、**Actions → Publish Windows release**で処理状況を確認します。

失敗した場合はDraftを公開せず、失敗したステップのログを確認します。成功するとReleasesにDraftが自動作成されるため、手動で新規Releaseを作る必要はありません。

### 3. Draftを実機確認する

1. GitHubの**Releases**からDraftを開く
2. `setup.exe`をダウンロードする
3. Windows x64実機へインストールする
4. K-GGが起動し、ヘルプ画面のバージョンが正しいことを確認する
5. プリセットの保存、再起動後の読込、画像・動画書き出しを確認する
6. Draftのリリースノートを編集する
7. **This is a pre-release**を無効にする
8. **Set as latest release**を有効にする
9. **Publish release**を押す

公開前に最低限、NSISインストーラー、`.sig`ファイル、`latest.json`が添付されていることを確認してください。

### 4. 公開後を確認する

次のURLを確認します。

- 最新版: `https://github.com/k5mp4/K-GG/releases/latest`
- 更新情報: `https://github.com/k5mp4/K-GG/releases/latest/download/latest.json`

旧バージョンを起動し、更新通知、ダウンロード進捗、再起動、バージョン更新、プリセット保持を確認します。`0.1.0`には更新元がないため、新規インストールを確認し、最初の完全な更新試験は`0.1.0`から`0.1.1`への更新で行います。

## 障害時

- Draft確認中の不具合: Publishせず修正する
- 公開後の不具合: 公開済みタグや成果物を差し替えず、上位の修正版を公開する
- 署名エラー: `release` Environmentの2つのSecretと公開鍵の組み合わせを確認する
- `latest.json`がない: Releaseを公開せず、GitHub ActionsのTauriビルドを確認する
- 更新確認の通信失敗: アプリは継続利用できる。更新画面から再試行する

## Windowsの警告について

初回リリースではWindows Authenticodeコード署名を行いません。そのため、ダウンロードしたインストーラーにMicrosoft Defender SmartScreenの警告が表示される場合があります。

Tauri更新署名は更新ファイルの改ざん防止に使われますが、Windowsの発行元表示やSmartScreen評価は変更しません。将来必要になった場合に、有料証明書またはOSS向け署名サービスを別途導入します。
