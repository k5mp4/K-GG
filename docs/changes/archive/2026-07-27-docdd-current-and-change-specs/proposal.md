---
type: change
id: CHANGE-001
title: DocDDを現行仕様＋変更仕様へ移行
status: archived
change_kind: A
owners: [maintainer]
created: 2026-07-27
updated: 2026-07-27
current_specs: [CURRENT-GRADIENT, CURRENT-EFFECT-STACK, CURRENT-PRESET]
related_adrs: [ADR-0001]
human_review: completed
---

# CHANGE-001 DocDDを現行仕様＋変更仕様へ移行

## 背景・問題

変更ごとのSPECが増えたことで、現在有効な動作を複数の履歴文書から再構成する必要がありました。古いSPECと現在の実装の関係も、初めて参加する開発者やAIが判断しにくい状態でした。

## 変更理由

現在の契約、今回の差分、内部設計、長期判断、過去の履歴を分離し、現行動作の確認と変更レビューを短くします。既存SPECのIDとリンクを壊さず、段階的に移行できることを優先しました。

## ゴール・成功条件

- Gradient、Effect Stack、Presetの現行動作を機能単位の文書だけで確認できる。
- 新規変更は現行仕様との差分としてレビューでき、完了後に現行仕様へ統合できる。
- Legacy SPECは履歴として残り、現在の仕様と誤認されない。
- ドキュメント構造を自動検証し、VitePressで各文書へ移動できる。

## 対象

- `docs/specs/current/` と `docs/changes/` の導入
- 3領域の現行仕様の初期整理
- 変更仕様テンプレートとArchive運用
- DocDD、AGENTS、CONTRIBUTING、Pull Requestテンプレート、VitePressナビゲーション、文書チェッカーの更新

## 対象外

- アプリケーションの機能、UI、Preset形式、Shader結果、Export結果の変更
- 全Legacy SPECの再作成または削除
- 外部仕様管理ツール、Playwright、Cucumber、GitHubラベルやBranch Protectionの必須化
- 未承認のSPEC-008を現行仕様へ統合すること

## 影響を受ける現行仕様

- [CURRENT-GRADIENT](../../../specs/current/gradient-system)
- [CURRENT-EFFECT-STACK](../../../specs/current/effect-stack)
- [CURRENT-PRESET](../../../specs/current/preset-system)

## 関連ADR

- [ADR-0001 文書を一次情報とする](../../../adr/0001-documentation-source-of-truth)
- Gradient、Effect Stack、Presetの内容は各現行仕様から既存ADRへリンクする。

## 主なリスク

- 現在のコードと過去SPECの差異を完全には解消せず、未確認事項として残す必要がある。
- 既存の直下SPECを移動すると外部リンクが壊れるため、Legacyとして同じ場所に残す。
- 現行仕様へ理想機能を混ぜると誤誘導になるため、未実装のPreset更新操作や同種Effect複数インスタンスは未提供として記録する。

## 未決定事項

- 実機GPUごとの画素一致・性能保証は別途測定する。
- 未移行領域は、その機能を次に変更するときに現行仕様化する。
