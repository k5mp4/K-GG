---
title: DocDD運用ガイド
---

# DocDD運用ガイド

DocDDは文書を増やすことではなく、現在の動作と変更の判断を必要な範囲で共有するための方法です。全てのRequestに同じ文書セットを要求しません。

## 文書の責務

| 場所 | 記録する内容 | 通常読むタイミング |
| --- | --- | --- |
| `docs/specs/current/` | 現在有効な観測可能動作、互換性、境界条件 | 対象領域を変更する前 |
| `docs/adr/` | 複数機能を長期に拘束するArchitecture Decision | 設計判断が関係するとき |
| `docs/changes/active/` | PR中のDesigned Changeの一時Capsule | 対象Capsuleがあるとき |
| `docs/changes/archive/` | 完了・移行済みChangeのWhy、差分、検証履歴 | 履歴調査が必要なとき |
| `docs/development/` | workflow、validation、AI、release、実装ガイド | 開発の入口 |
| `docs/specs/SPEC-*.md` | 旧方式のLegacy Change Specification | Current/ADRだけで判断できないとき |

IssueとPRはリポジトリ文書の代替ではありません。Issueは継続追跡のWhy/Problem、PRはWork/Review/Validationを担い、Current SpecとADRの意味的な契約はリポジトリで版管理します。

## 参照の優先順位

変更に固有の契約がある場合は、次の順で確認します。

1. 承認済みのactive Change Capsule（今回の差分）
2. 対象Current Spec（現在の動作）
3. accepted ADR（長期の設計判断）
4. 実行可能なテスト
5. 実装コード
6. Issue/PRの補足とLegacy文書

この順序は矛盾を自動解決しません。仕様、テスト、実装が異なる場合は、影響と選択肢をRequest/PRへ報告し、Current SpecまたはChangeをレビューします。

## Requestに応じた文書量

| 分類 | 文書の扱い |
| --- | --- |
| Quick Change | Change不要。PRに理由、対象外、検証、未確認事項を記載する |
| Tracked Change | Issue + PR。仕様差分が大きい場合だけSpec Deltaを追加する |
| Designed Change | Issue + 必要なproposal/delta/design/tasks/validation/ADR。CapsuleはPRの一時成果物 |
| X Experiment | sandbox/experimentと結果。製品Current Specへは承認まで統合しない |

Bの不具合では再現テストまたは再現手順を残します。Fの観測可能な機能変更ではCurrent SpecとPRを同期します。Aの永続化、主要依存、層構造、配布、セキュリティなどはDesignとADRを検討します。

## Current Specの更新

Current Specは履歴を時系列で追記せず、現在の契約になるよう編集します。変更後はRequirement ID、関連ADR、関連Change、関連コード/テストを同期します。意味的な内容の更新は人間またはAIが行い、`docs:check`はmetadata、参照、heading、index、リンクの整合を検査します。

対象領域にCurrent Specがない場合は、Legacy SPEC、コード、テストから次の3つを分けて調査します。

- コードとテストで確認できた事実
- Current Specへ記録できる観測可能な契約
- まだ手動・実機で確認できないこと

未確認の挙動をCurrent Specの確定契約として書きません。

## Validationとの関係

受け入れ条件は、Merge Gate、Release Gate、Observationに分けて検証します。Release GateやObservationが未確認でも、Merge Gateが満たされていればChangeはArchiveへfinalizeできます。未完了の作業はArchiveの`outcome: follow-up`とGitHub Issueで追跡し、Activeを待機場所にしません。

```sh
npm run docs:check
npm run docs:build
npm run change:check
npm run change:finalize CHANGE-###
```

## 禁止事項

- Issueの有無だけでQuick/Tracked/Designedを決めること。
- Quick Changeへ形式的なIssueや全てのChange文書を要求すること。
- 手動確認待ちだけを理由にmainへActive Capsuleを残すこと。
- CI結果をValidation Markdownへ全文複製して二重管理すること。
- ArchiveやLegacy SPECを現在仕様として無条件に採用すること。
- 自動検査だけでCurrent Specの意味、human review、Release Gate完了を宣言すること。
