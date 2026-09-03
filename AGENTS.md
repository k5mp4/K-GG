# K-GG repository instructions

K-GGはRequest-firstの開発フローとDocsDDを採用します。利用者向けの現在動作は[`docs/specs/current/`](docs/specs/current/)、長期的な設計判断は[`docs/adr/`](docs/adr/)、開発フローの詳細は[`docs/development/workflow.md`](docs/development/workflow.md)と[`docs/development/change-workflow.md`](docs/development/change-workflow.md)を参照してください。

## Requestの入口と分類

- 変更要求をDevelopment Requestと呼び、GitHub Issue、PR、AIへの直接指示、CLI、MCP、API、外部サービス、開発中の発見を同じ入口として扱う。
- Issueは必須入口ではない。Why、Problem、将来作業、複数PR、Release Gate待ちを追跡する価値がある場合に作成または既存Issueへ紐付ける。
- Quick ChangeはIssueとChange directoryなしで開始できる。Tracked ChangeはIssueを使い、Designed Changeは仕様・設計への影響に応じて必要なSpec Delta、Change Capsule、ADRを使う。
- 実装中に複数PR、後続作業、再現条件の保存、Architecture判断、保存・出力・描画契約の変更が分かったらTracked/Designedへ昇格する。
- S/B/F/A/Xは補助分類として使う。外部から観測できる動作を変えるものをS（文書整理）として扱わない。

## 作業前に読むもの

1. [`docs/development/`](docs/development/)から対象に合うworkflow、validation、AI開発ガイドを読む。
2. 対象のCurrent Specと、frontmatterの`related_adrs`にあるaccepted ADRを読む。
3. Tracked/DesignedではRequest/IssueのWhy、対象外、未決定事項を確認する。
4. Current Specがない場合はLegacy SPEC、コード、テストから現在動作を調査し、未確認の挙動を確定仕様として書かない。
5. `docs/changes/archive/`と`docs/specs/SPEC-*.md`は履歴調査が必要な場合だけ読む。

仕様、テスト、実装が矛盾した場合は、どれかへ黙って合わせず、差異・影響・選択肢をRequest/PRへ報告する。

## Changeとmain

- Change CapsuleはDesigned Changeなど複雑な変更に限定し、必要なファイルだけ作る。Quick Changeでは作らない。
- `docs/changes/active/`はfeature branch/PR上の一時領域であり、`main`上は原則0件にする。
- Merge前にCurrent Spec/ADRを同期し、`npm run change:check`で構造・参照・indexを確認してから`npm run change:finalize CHANGE-###`を実行する。
- 手動・GPU・Tauri・FFmpeg・After Effects確認はRelease GateまたはObservationとして記録する。未確認だけを理由にActiveへ残さず、必要な継続作業はIssueへ移す。
- Archiveは現在仕様の根拠ではない。Current Specへdeltaを統合し、Archiveには経緯と検証証拠を残す。

## Validation

Merge Gate、Release Gate、Observationを分離する。変更範囲に応じて次を使う。

```sh
npm run change:check
npm run check:merge
npm run check:render     # Shader / WebGL / Render Plan変更時
npm run check:native     # src-tauri / Rust変更時
npm run release:check    # version / updater設定
npm run change:finalize CHANGE-###
```

`npm run check:fast`はtypecheck、unit/component、lint、frontend build、docs check/buildを含みます。既存互換の`npm run verify`はrelease設定・fast・nativeをまとめて実行します。警告はエラーと区別し、実行していない手動確認をpassにしない。

## Git / PR

```text
main ← Pull Request ← short-lived branch
```

- 長寿命feature branchを避け、大きな変更は独立してmerge可能な縦方向のPRへ分割する。
- Quick ChangeでもPRに分類、変更理由、対象外、検証、未確認事項を記載する。Issueがない場合はRequest sourceを`Direct request`等と明記する。
- commit、push、Pull Request、GitHub Issue作成などの外部操作は、ユーザーが明示した範囲だけ実行する。
- PRでは対象差分だけを確認し、CI結果・Review・Current Spec/ADR同期を揃える。GitHub側のbranch protectionは[`docs/development/releasing.md`](docs/development/releasing.md)の管理者設定を参照する。

## 守る境界

- 利用者向け機能、描画結果、Preset形式は、明示されたRequestの範囲外で変更しない。
- React/UI、WebGL/GLSL、保存、出力、Tauri/Rustを変更する場合は、関連Current Spec・テスト・アダプター境界を確認する。
- プリセット型は`src/lib/presetModel.ts`を一次情報とし、Browser/Tauriの保存処理を直接混ぜない。
- RendererからTauriへ渡る外部入力を信頼しない。パス、FFmpeg、OS機能は既存のRust境界と安全検証を維持する。
