---
id: ADR-0024
title: 並列開発で衝突しないChange ID・一覧・逆参照
status: accepted
date: 2026-09-25
deciders: [maintainer]
related_specs: []
supersedes: []
---

# ADR-0024: 並列開発で衝突しないChange ID・一覧・逆参照

## コンテキスト

[ADR-0019](./0019-request-first-development-lifecycle.md)では、Designed ChangeのCapsuleをfeature branch/PR上に置き、toolingがindexと逆参照を検査する運用にした。しかし短命ブランチを並列に進めると、無関係なPR同士が次の共有箇所を同時に編集し、merge conflictが繰り返し発生した。

- `docs/changes/active/index.md`と`docs/changes/archive/index.md`: `change:finalize`が再生成し、各PRが表の同じ末尾へ行を追加する。
- `CHANGE-###`の連番: 各ブランチがmainを見て同じ「次の番号」を採番し、merge時に付け直しが必要になる。
- Current Specの`related_changes: [...]`: 1行のYAMLリストへ各PRが追記するため、同じ行で衝突する。

これらはどれも他の情報から導出できる、またはブランチ間で調整が必要な採番であり、意味的な競合ではない。

## 決定

Change Capsuleは自分のdirectoryだけで完結させ、複数PRが共有ファイルへ追記しない構造にする。

- Change一覧は各`proposal.md`のfrontmatterを正本とし、VitePressのdata loader（`docs/.vitepress/theme/changes.data.ts`）と`<ChangeIndex>`コンポーネントでビルド時に描画する。`docs/changes/{active,archive}/index.md`は説明文とコンポーネントだけを持ち、行をコミットしない。`docs:check`は手書きの行が戻っていないことを検査する。
- 新しいChange IDは`CHANGE-YYYYMMDD-slug`とし、directory名と一致させる。`npm run change:new`で作成する。`CHANGE-001`〜`CHANGE-056`は既存リンクと履歴のため有効なまま残し、CHANGE-057以降の連番は拒否する。
- ChangeとCurrent Specの関係はChangeの`current_specs`を正本とする。Current Specの`related_changes`への追記は要求しない。既存の値は履歴として残し、記載されたIDが実在することだけを検査する。
- `change:finalize`はindexを再生成せず、Change directoryの移動とproposal更新だけを行う。

Current Specの本文や要件の変更で起きる衝突は、同じ契約を並列に変えている意味的な競合なので、この決定では回避しない。

## 理由

- 並列PRが触る共有ファイルがなくなり、機械的なconflictとその解消コミットをなくせる。
- 導出できる情報をコミットしないことで、indexとproposalの不整合も起こらない。
- 日付+slugのIDはGitHub IssueやPRの作成を待たずに決まり、Direct requestやAIへの直接指示でも使える。
- 一覧のCurrent Spec列で、Change→Current Specの対応をビルド済みドキュメントから確認できる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| CIやbotがmerge後にindexを再生成してコミットする | mainへのbot書き込み権限とbranch protectionの例外が必要になり、ローカルとmainで一覧がずれる |
| `.gitattributes`の`merge=union` | 表の行には効くが、1行リストの`related_changes`とID採番の衝突は解消できず、壊れた表を黙って作る恐れがある |
| Issue/PR番号をChange IDにする | 一意性は保証されるが、Issue/PRを作るまでIDが決まらず、Direct requestの開始を遅らせる |
| 連番のまま衝突をCIで検出する | 検出はできても付け直しの手作業が残る |

## 結果

### 利点

- Change Capsuleの追加・finalizeが他PRと衝突しない。
- `change:new`によりAIや人間がID採番を判断しなくてよい。

### 欠点・コスト

- 一覧はMarkdownのままでは読めず、VitePressのビルド結果かproposalを直接参照する必要がある。
- IDが連番より長くなる。
- Current Spec側から関連Changeを辿るには、ビルド済み一覧のCurrent Spec列かChangeの`current_specs`を検索する。

## 再検討条件

ADR一覧やADR番号など、他の共有indexでも並列PRの衝突が継続的に発生した場合、同じ方針（正本からビルド時に生成、衝突しないID）を適用するか検討する。
