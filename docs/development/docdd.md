---
title: DocDD運用ガイド
---

# DocDD運用ガイド

K-GGでは、仕様をコードの後付け説明ではなく、変更意図と利用者向け契約をレビューする一次情報として扱います。目的は文書量を増やすことではなく、現在の動作を短く確認でき、次の変更を安全に提案できることです。

## 文書の役割

| 場所 | 役割 | 何を書くか |
| --- | --- | --- |
| `docs/specs/current/` | 現行仕様 | 現在有効な観測可能動作、互換性、境界条件 |
| `docs/changes/active/` | 変更仕様 | 今回のWhy/What、delta、実装中の検証 |
| `docs/changes/archive/` | 変更履歴 | 完了した変更、当時の検証、移行経緯 |
| `docs/changes/active/<CHANGE-ID>/design.md` またはArchive | 設計文書 | How、データモデル、代替案、移行・ロールバック |
| `docs/adr/` | ADR | 複数機能を長期に拘束する技術判断と理由 |
| `docs/specs/SPEC-*.md` | Legacy Change Specification | 旧DocDDで蓄積した変更履歴。現在仕様の必須資料ではない |
| `docs/development/` | 開発ガイド | 構造、ローカル開発、共通の運用ルール |

現行仕様と変更仕様の関係は次のとおりです。

```text
current spec（現在の真実）
          ▲ deltaを統合
active change（今回の差分） ──完了──> archive（過去の履歴）
          │
          └── design（How） / tasks（作業） / validation（検証）
```

現行仕様は履歴を時系列に追記せず、常に現在の状態へ編集します。なぜ変わったかはArchiveとGit履歴で追跡します。

## 参照の優先順位

作業対象を決めるときは、次の順で確認します。

1. `approved` 状態のactive change（今回の変更契約）
2. 対象領域のcurrent spec（現在有効な契約）
3. `accepted` 状態のADR（長期的な技術判断）
4. 実行可能なテスト（保証されている実例）
5. 実装（現在の事実）
6. Legacy Change Specification（過去の意図と経緯）

この順序は矛盾を自動解決する規則ではありません。仕様、テスト、実装、Legacyの記述が異なる場合は、対象箇所・利用者影響・選択肢を報告し、人間がcurrentまたはchangeを再レビューします。

## 変更区分

| 区分 | 例 | 必要な文書 |
| --- | --- | --- |
| S: 軽微 | 誤字、コメント、意味を変えない整理 | 原則として変更仕様不要。関連indexやリンクは同期 |
| B: 不具合 | 既存の期待動作との差異を修正 | proposal、delta、tasks、validation。期待動作をcurrentへ追記 |
| F: 機能 | UI、出力、保存、描画など観測可能な変更 | proposal、delta、tasks、validation |
| A: 設計 | 永続化形式、主要依存、層構造、配布、セキュリティ | proposal、delta、design、ADR、tasks、validation |
| X: 実験 | Shader実験、技術検証、性能計測 | experimentまたはproposal、validation。製品仕様へ未統合 |

迷ったら、外部から観測できる動作が変わる場合はF、複数機能を長期拘束する場合はAとします。Xの結果は承認されるまでcurrentへ入りません。

### 実装を開始してよい条件

- S区分は、利用者向け契約、保存形式、出力、描画、UI、外部連携の振る舞いを変えない文書整理に限ります。
- B/F/A区分は、対象current spec、delta、対象外、受け入れ条件がレビュー済みで、変更仕様が `approved` かつ `human_review: completed` になってから実装します。A区分はdesignとADRも確認します。
- X区分は実験用の領域へ隔離し、結果が有用でも製品コードやcurrent specへ黙って取り込みません。製品化するときはFまたはAのchangeとして再レビューします。
- 対象current specがまだない領域では、Legacy SPEC・実装・テストから現行動作を調査し、最小のcurrent specとchangeを作成します。未移行であることを理由に、コードだけを先に仕様化しません。
- `approved`後にWhy/What、スコープ、ACを変更する場合は、`review`へ戻して再承認します。AIや`docs:check`は人間の承認を代替しません。

## Change IDと要件ID

- 既存の `SPEC-000`〜`SPEC-040` は削除・再利用しません。新しい変更は `CHANGE-###-short-name` のディレクトリと `CHANGE-###` のIDを使います。
- current specは `CURRENT-*` の領域IDを持ち、要件には `GRAD-*`、`EFFECT-*`、`PRESET-*` のような安定IDを付けます。
- 変更仕様の受け入れ条件は `AC-###` とし、安定したcurrent要件IDとは分けます。
- 要件の意味を変える場合は既存IDをMODIFIEDとして明示し、新しい無関係の動作を一つの要件へ詰め込みません。

## 標準ワークフロー

### 1. 調査

1. `docs/development/index.md` と対象current specを読む。
2. current specの `related_adrs`、依存するADR、active changeを確認する。
3. 必要な範囲でLegacy SPEC、コード、テストを調べる。Legacyだけから理想仕様を作らない。
4. 現在の実装、テストの保証範囲、未検証の手動動作を分けてメモする。

current specが存在しない場合は、現行動作の調査結果を「確認できた事実」「テストで保証されること」「まだ手動確認が必要なこと」に分けます。未確認の挙動をcurrent specの確定契約として書かないでください。

### 2. 変更仕様の作成

`docs/changes/_template/`から `docs/changes/active/CHANGE-###-short-name/` を作成し、まず次を記入します。

- `proposal.md`: 背景、理由、ゴール、対象外、影響、リスク、未決定事項
- `delta.md`: `ADDED`、`MODIFIED`、`REMOVED` の差分だけ。既存要件IDを明示
- `design.md`: A区分または実装判断が複数にまたがる場合のHow
- `tasks.md`: 受け入れ条件に対応した小さな作業
- `validation.md`: ACごとのテスト/手動確認と結果、実行コマンド

`proposal.md` と `delta.md` が人間レビューを通るまで、観測可能な本実装を開始しません。調査用プロトタイプはXとして隔離し、本番コードへ残す前に改めて仕様化します。

### 3. 実装と検証

1. `approved` changeの対象と対象外を確認する。
2. 変更仕様にない改善を同じPRへ混ぜない。
3. ACごとに自動テストまたは再現可能な手動確認を追加する。
4. 仕様とコードに差異が出たら、コードを正として黙って仕様を書き換えない。changeを再レビューする。
5. `related_code`、`related_tests`、`validation.md`を実態に合わせる。

実装中に仕様外の改善、別領域の整理、未承認の設計変更が見つかった場合は、現在のchangeへ混ぜず、別のchange候補として記録します。

### 4. 完了とArchive

1. すべてのACを検証し、結果を記録する。
2. deltaをcurrent specへ統合する。現在の本文に過去の経緯を追記しない。
3. current specの要件ID、ADRリンク、関連コード、関連テストを更新する。
4. `tasks.md`を完了状態にし、`status: implemented`へ更新する。
5. 同じPRで文書、コード、テスト、利用者向け説明を同期する。
6. 完了した変更フォルダを `docs/changes/archive/YYYY-MM-DD-short-name/` へ移動し、proposalの状態を `archived` にする。

Archiveへ移動する前に、`docs/specs/current/index.md`、`docs/specs/index.md`、`docs/changes/*/index.md` のリンクとID・タイトル・statusを確認します。実装していない、またはACが未検証のchangeはArchiveへ移動せず、残る理由を `proposal.md` に記録します。

実装しないことが明確な変更や、currentへのdeltaがない開発基盤変更も、Archiveにvalidationを残すことで後から判断を追えます。

## 状態

### 変更仕様

```text
draft -> review -> approved -> implemented -> archived
                       └──> cancelled
```

| 状態 | 意味 |
| --- | --- |
| `draft` | 作成中。未決定事項を含む |
| `review` | 人間レビュー中。実装開始前 |
| `approved` | 人間がdeltaとスコープを承認済み |
| `implemented` | コード、テスト、validation、current統合が完了 |
| `archived` | 完了記録をArchiveへ移動済み |
| `cancelled` | 実装しないと判断。理由を残す |

`approved`以降にWhy/Whatを変える場合は `review`へ戻して再承認します。AIや自動検査は人間の承認状態を代替しません。

## 仕様と実装が異なる場合

1. 仕様ID、該当箇所、現在の実装、テストが保証する範囲、利用者への影響を記録する。
2. 期待動作を維持してコードを直すのか、期待動作を変えてchangeを再承認するのかを分ける。
3. 既存コードを事実上の仕様としてcurrentへ黙って転記しない。望ましい動作と現状を人間が確定する。
4. 確定後にコード、テスト、current、change/Archiveを同じPRで同期する。

### 現行仕様

現行仕様は `status: current` とし、現在有効な契約を記載します。要件の廃止は本文から黙って削除せず、後継要件または廃止状態を示し、対応する変更履歴をリンクします。

## 現行仕様の記述ルール

現行仕様は利用者や外部システムから検証できる単位で書きます。目的、現在の要件、境界条件、互換性、他領域との関係、検証上の未確認事項を含めます。

次は契約でない限り本文へ固定しません。

- Reactコンポーネント名、Zustand action名、関数名
- Shader uniform名、内部の一時的な数値マッピング
- 実装ファイル一覧（frontmatterの参照情報を除く）

一方、Preset JSONの識別値、Web/Tauri共通の保存契約、export互換性、既存データ移行規則は外部契約として記載します。

## 設計文書とADRの使い分け

- `design.md` は一つの変更を実装するためのHowです。変更完了後も履歴としてArchiveに残ります。
- ADRは複数の機能や将来の変更を拘束するWhy/Decisionです。主要依存、永続化形式、描画方式、ブラウザ/Tauriの責務、セキュリティ・配布方式などに使います。
- 局所実装の選択をすべてADRにしません。後から戻すコストが高い判断だけをADRへ昇格します。

## 検証コマンド

文書だけの変更でも、最低限次を実行します。

```sh
npm run docs:check
npm run docs:build
```

コード変更を含む場合は変更範囲に応じて次も実行します。

```sh
npm test
npm run lint
npm run build
```

Tauri/Rust、ファイル操作、FFmpeg、更新機構、依存関係、外部入力を変更する場合は次も実行し、セキュリティ観点をレビューします。

```sh
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

コマンドは `validation.md` のCommandsへ、ファイルパスはfrontmatterの `related_code` / `related_tests` へ分けて記載します。

## 関連資料

- [現行仕様](../specs/current/)
- [変更仕様](../changes/)
- [Legacy Change Specifications](../specs/#legacy-change-specifications)
- [ADR](../adr/)
- [GitHub: Pull Request template](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
- [OpenSpec: Core Concepts](https://openspec.dev/docs/overview)
- [MADR: Markdown Any Decision Records](https://adr.github.io/madr/)

OpenSpecのcurrent/delta/archiveの分離と、MADRのdecision/statusの考え方を参考にしています。K-GGでは外部ツールを必須化せず、既存のMarkdown、VitePress、Node検査だけで運用します。
