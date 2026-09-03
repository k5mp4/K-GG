---
title: AI駆動開発
---

# AI駆動開発

K-GGではCodex、Claude Code、その他のAIエージェントを、特定サービスに依存しない開発者として扱います。AIはIssueの有無だけでworkflowを決めず、Requestの規模・追跡必要性・仕様影響を判断します。

## 標準コンテキスト

通常の変更では、次の順に必要な範囲だけを読みます。

```text
AGENTS.md
  ↓
docs/development/
  ↓
関連する docs/specs/current/
  ↓
関連する accepted ADR
  ↓
Development Request / Issue / PR
```

`docs/changes/archive/`と`docs/specs/SPEC-*.md`は、Current Spec、ADR、テスト、実装だけでは判断できない履歴を調べるときに限定します。過去Changeを通常コンテキストへ大量に含めません。

## 実装前の判断

1. RequestをQuick、Tracked、Designedへ分類する。
2. 変更対象のCurrent Specと、そのfrontmatterにある関連ADRを読む。
3. Quick以外はIssueまたは既存RequestのWhy、対象外、未決定事項を確認する。
4. Current Specにない領域は、Legacy SPEC・コード・テストから現在動作を調べ、未確認を確定仕様として書かない。
5. Designed Changeでだけ、必要なSpec Delta、Design、ADR、Validationを作成する。

仕様、テスト、実装に差異がある場合は、上位文書へ黙って合わせず、差異と選択肢をRequest/PRへ報告します。

## 実装中

- Quick Changeは小さく保ち、Scopeが広がったらTracked/Designedへ昇格する。
- UI、描画、保存、出力、外部連携の変更では、既存のCurrent Spec、型、テスト、アダプター境界を確認する。
- 新しい実装には、仕様のACを表すunit/component/integration testまたは再現可能な手動確認を対応付ける。
- Merge Gate、Release Gate、Observationを分け、Release Gate未確認を理由にmainへActive Capsuleを残さない。
- Current Specの意味的な更新、Issue作成、Release Gateの完了宣言を自動検査だけで行わない。

## 完了時の確認

```sh
npm run change:check
npm run check:merge
npm run change:finalize CHANGE-###
```

ChangeがないQuick Changeでは`change:finalize`は実行せず、PRに分類、対象外、検証、未確認事項を記載します。Changeがある場合は、Archiveへ移動した後に`npm run change:check -- --require-empty`を実行します。

## AIへのRequestの書き方

次の情報があれば、AIは最小コンテキストで開始できます。

- 解決したい問題と利用者/開発者への影響
- 変更分類の候補、対象、対象外
- 関連Current Spec、Requirement ID、ADR（分かる範囲）
- Merge Gate、Release Gate、Observationの期待結果
- 既存Issueまたは外部Requestへのリンク（ある場合）

Issueがないことは不足ではありません。Quick Changeなら`Direct request`を明記し、Tracked/Designedへ昇格した時点でIssueを作成または既存Issueへ紐付けます。
