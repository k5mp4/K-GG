---
title: 開発ワークフロー
---

# 開発ワークフロー

K-GGの開発入口はGitHub IssueではなくDevelopment Requestです。RequestはIssue、PR、AIエージェント、CLI、MCP、外部サービス、開発中の発見など、どの経路から始まっても構いません。入力元ではなく、変更の規模・追跡必要性・仕様影響で進め方を選びます。

## Source of Truth

| 情報 | 一次情報 | 記録すること |
| --- | --- | --- |
| Why / Problem / 継続追跡 | GitHub Issue（存在する場合） | 問題、要求、後続作業、Release Gate待ち |
| Work / Review / Validation | Pull Request | 実装、対応Request、実行した検証、CI、未確認事項、文書同期 |
| 現在の動作 | `docs/specs/current/` | 現在観測できる契約、互換性、境界条件 |
| 長期の設計判断 | `docs/adr/` | 複数機能を拘束するWhy/Decision、代替案、再検討条件 |
| 機械的な判定 | CI | typecheck、lint、test、build、docs、Rustなどの実行結果 |
| 過去の経緯 | `docs/changes/archive/`、Git履歴 | 変更時点の理由、差分、検証記録 |

IssueはWeb UIで作られたものに限定しません。APIや外部サービスが作ったIssueも、内容が読めれば同じRequestとして利用します。

## Requestの分類

| 分類 | 使う場面 | 基本成果物 |
| --- | --- | --- |
| Quick Change | typo、局所CSS、明確な小修正、外部契約を変えない内部整理 | short-lived branch、実装、Merge Gate、PR。Issue/Change Capsuleは不要 |
| Tracked Change | Bug、Feature request、Improvement、technical debt、後続作業、複数PR | Issue（または既存Issue）、short-lived branch、PR |
| Designed Change | Current Spec、保存・出力・描画契約、複数機能の設計、長期判断へ影響 | Issue、必要なSpec Delta/Change Capsule/ADR、PR、finalize |

S/B/F/A/Xの区分は補助的に維持します。Sは外部から観測できる契約を変えない整理だけに限定し、B/F/Aはそれぞれ不具合・機能・長期設計の影響を示します。Xは製品仕様へ統合する前の隔離実験です。

## 基本ライフサイクル

```text
Development Request
        ↓
Classification（Quick / Tracked / Designed）
        ↓
short-lived branch（mainから分岐）
        ↓
Issue / Spec Delta / Change Capsule / ADR（必要なものだけ）
        ↓
Implementation → Local Automated Feedback
        ↓
Pull Request → CI / Merge Gate
        ↓
Current Spec / ADR sync → Change finalize
        ↓
main → Release Gate / Observation → Release
```

長寿命feature branchは原則避け、大きな機能は独立してmerge可能な縦方向のPRへ分割します。未完成機能をmainへ入れる必要がある場合はfeature flag、experimental flag、SANDBOX境界のいずれかで未公開状態を明確にします。

## 途中昇格

Quick Changeとして開始しても、次の事実が分かった時点でTrackedまたはDesignedへ昇格します。

- 複数PRへ分割する必要が出た。
- 後続作業、Release Gate、再現条件を保存する価値が出た。
- Architecture判断、保存・出力・描画契約の変更が発生した。
- 当初の対象外や受け入れ条件を変える必要がある。

昇格時は既存のRequest/Issueを使い、同じ目的に収まる限りChange directoryを増やしません。独立した目的や対象外の変更だけを別Requestへ分けます。

## Change Capsule

CapsuleはDesigned Changeなど複雑な変更の一時的な実装契約です。`docs/changes/active/`へ置けるのはfeature branch/PRの間だけで、mainへマージする前にCurrent Spec/ADRを同期し、Archiveへfinalizeします。

必要なファイルだけを作成します。

- `proposal.md`: Why、What、対象外、受け入れ条件、metadata
- `delta.md`: Current Specとの差分がある場合
- `design.md`: 複数の実装判断、移行、ロールバックがある場合
- `tasks.md`: PR checklistと重複しない作業分解が必要な場合
- `validation.md`: Change固有の判断、Gate、未確認事項を残す場合。CIログの全文転記には使わない

構造とindexは`npm run change:check`で確認し、完了時は次を実行します。

```sh
npm run change:check
npm run change:finalize CHANGE-###
```

`change:finalize`はCurrent Specの意味的な内容を生成しません。人間またはAIが同期した後、toolingが参照・構造・リンクを確認してArchiveへ移動します。既存履歴の整理には`--migration --outcome=follow-up`を使い、実装完了と移行を混同しません。

## Git / PR

```text
main ← Pull Request ← short-lived branch
```

- ブランチ名は目的が分かる短い名前にする。
- Quick ChangeでもPRを作成し、変更区分、影響、検証を記録する。
- IssueがないPRでは、Request sourceに`Direct request`、`AI request`、`CLI/MCP request`などを記載する。
- PRでCIが成功し、Review、Current Spec/ADR同期、Merge Gateが確認できたらmergeする。
- commit、push、PR作成は実行者の明示的な依頼に従う。GitHub設定の変更権限がない場合は、必要設定を文書化する。

## 完了後

Merge Gateが満たされていれば、Release GateやObservationが未確認でもChangeをArchiveへ移します。未完了の実装、失敗、実機確認はArchiveの`outcome: follow-up`とIssueで追跡し、main上にActiveを残して待機しません。
