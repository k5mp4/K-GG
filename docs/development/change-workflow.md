---
title: 変更パッケージ運用
---

# 変更パッケージ運用

K-GGでは、会話ターンではなく、Why／What／対象外／受け入れ条件がまとまった「変更パッケージ」を開発の基本単位にします。1つのパッケージに1つの`CHANGE-###-short-name`ディレクトリを割り当てます。

## 変更パッケージを作る基準

次のどれかに当てはまる観測可能な変更は、新しいパッケージとしてproposalを作成します。

- 新しい目的または利用者影響がある。
- 保存、出力、描画、UI、外部連携の契約が変わる。
- 既存パッケージの対象外、受け入れ条件、互換性を変える。
- 既存パッケージと同時にレビューすると、責任範囲やロールバック単位が不明瞭になる。

誤字や外部から観測できない整理は、S区分としてchangeを省略できます。判断が曖昧な場合は、まず既存パッケージへ混ぜず、候補として記録します。

## 過去履歴の日付整理

既存履歴を見やすくする目的で、同じ日に完了したchangeを日付bundleへまとめることがあります。日付bundleは履歴の格納単位であり、元のCHANGE ID、proposal、delta、tasks、validationの対応関係を保持します。日付bundleへの整理は、独立した要求のWhy／Whatや受け入れ条件を後から1つの実装契約へ合成することを意味しません。

このリポジトリでは、2026-07-28のCHANGE-002〜009をこの方式で整理しています。これ以降の実装は、日付bundleではなく、承認済みの1つのchangeパッケージをコード・テスト・文書・検証の基本単位にします。

## 追加指示の扱い

実装中の追加指示は、次の順に判定します。

```text
追加指示
  ├─ 同じ目的・利用者影響・契約・対象外に収まる
  │    └─ 既存changeのproposal / delta / tasks / validationへ追記
  │        必要ならreviewへ戻して再承認
  └─ 独立した目的・影響、またはAC・対象外を変更する
       └─ 新しいchange候補として分離
```

細かな修正や検証の追加だけで新しいディレクトリを作りません。既存パッケージへ追記した場合は、追加後の全受け入れ条件を再確認します。

## 変更パッケージのファイル

```text
CHANGE-###-short-name/
  proposal.md   Why / What / scope / acceptance criteria
  delta.md      current specとの差分
  design.md     複数の実装判断がある場合のHow
  tasks.md      作業項目
  validation.md ACごとの検証結果と未確認事項
```

F/B変更ではproposal、delta、tasks、validationを必須とします。A変更ではdesignと、長期的な判断を拘束する場合のADRを追加します。X変更は製品コードへ統合するまで実験として隔離します。

## 状態と実装開始条件

```text
draft → review → approved → implemented → archived
                         └→ cancelled
```

`proposal.md`が`status: approved`、`human_review: completed`で、レビュー済みのdeltaがある場合だけ本実装を開始します。承認後にWhy／What、対象外、受け入れ条件、互換性を変える場合は、同じchangeをreviewへ戻して再承認します。

## コミットとの関係

1つの変更パッケージは、原則としてコード・テスト・文書を1コミットへまとめられる単位にします。機械的整形や生成物の都合で複数コミットが合理的な場合は、changeパッケージを増やさず、各コミットの目的をvalidationへ記録します。

これはGit操作の自動許可ではありません。commit、push、Pull Request、公開はユーザーが明示的に依頼した場合だけ行います。依頼がない間は、作業ツリーの差分確認、検証、文書同期までを行います。

## 完了とArchive

1. 受け入れ条件を自動テストまたは再現可能な手動確認で検証する。
2. deltaをcurrent specへ統合し、関連コード・テスト・利用者向け文書を同期する。
3. `validation.md`へ実行コマンド、結果、未確認事項を記録する。
4. tasksを完了し、proposalを`archived`へ更新する。
5. `docs/changes/archive/YYYY-MM-DD-short-name/`へ移動し、active/archive indexを同期する。

未検証の受け入れ条件がある場合は、Archiveへ移動せず、残る理由をvalidationへ記録します。
