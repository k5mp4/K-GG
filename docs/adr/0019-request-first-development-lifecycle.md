---
id: ADR-0019
title: Request-first開発ライフサイクルとValidation Gate分離
status: accepted
date: 2026-09-03
deciders: [maintainer]
related_specs: []
supersedes: [ADR-0014]
---

# ADR-0019: Request-first開発ライフサイクルとValidation Gate分離

## コンテキスト

K-GGはブラウザ、WebGL、Tauri/Rust、外部FFmpeg、After Effects連携を持ち、変更の自動検証と実環境確認のコストが大きく異なる。従来は観測可能な変更を一律Change Packageへ入れ、手動確認が終わるまでActiveに置いていたため、実装済みの変更がmain上へ蓄積した。また、GitHub Issueを必須入口にすると、AI、CLI、MCP、外部サービスからの要求を同じRequestとして扱いにくい。

## 決定

開発の入口をDevelopment Requestとし、入力経路ではなく規模・追跡必要性・仕様影響で次の3分類を選ぶ。

- Quick Change: IssueとChange Capsuleを必須にしない。短命ブランチ、実装、Merge Gate、PRで完了する。
- Tracked Change: IssueでWhy/Problem/後続作業を追跡し、PRで実装とValidationを管理する。
- Designed Change: Issueに加えて、必要なSpec Delta、Change Capsule、ADRを同じPRの範囲で管理する。

Issueは継続追跡のWhy、PRはWork/Review/Validation、Current Specは現在の観測可能動作、ADRは長期判断、CIは機械的Validation、Archiveは過去の経緯を担う。ValidationはMerge Gate、Release Gate、Observationへ分離する。Release GateまたはObservationが未確認でも、Merge Gateが満たされCurrent Spec/ADRが同期済みならChangeをArchiveへfinalizeできる。未完了の継続作業はArchiveの`follow_up`とGitHub Issueで追跡する。

`main`の`docs/changes/active/`は原則空とし、Designed ChangeのActive Capsuleはfeature branch/PR上だけに存在させる。Current Specの意味的な更新は人間またはAIが行い、toolingはmetadata、構造、逆参照、index、リンクを検査する。

## 理由

- 小変更の入口を軽くし、IssueやCapsuleを追跡価値がある変更へ集中できる。
- CIの成功とGPU/Tauri/外部連携の実機確認を同じ完了条件にせず、mainの履歴を整理できる。
- GitHub UIに限定せず、APIや外部サービスが作るIssueも同じRequestとして扱える。
- AIは現在仕様と関連ADRだけを読み、過去のChange履歴を通常コンテキストへ持ち込まずに実装できる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| すべてIssue-first | Quick Changeのコストが高く、直接のAI/CLI要求を不自然にする |
| すべての変更をActive Capsuleへ記録 | 実装済み変更とRelease Gate待ちが混ざり、mainへ蓄積する |
| 手動確認をMerge Gateにする | GPU、Tauri、FFmpeg、AEを持たないCI環境を不必要に必須化する |
| Current Specを自動生成する | 意味的な契約を誤って更新する危険がある |

## 結果

### 利点

- Requestの入口と追跡方法を分離できる。
- 実装、Merge、Release、Observationの責務が明確になる。
- Active ChangeをPR内の一時成果物へ限定できる。

### 欠点・コスト

- Release Gate待ちのIssueを人間が作成・管理する必要がある。
- Changeの分類とCurrent Specの意味的同期には判断が残る。
- CIのpath判定が誤る場合に備え、必要なfocused checkをPRで明示する必要がある。

## 再検討条件

複数人チーム化、必須監査証跡、リリース頻度の増加、GPU/Tauriの安定したCI環境、またはCurrent Spec同期の不整合が継続的に発生した場合に、分類・Gate・branch protectionを見直す。
