---
title: 現行仕様
---

# 現行仕様

ここには、現在のK-GGが利用者や外部システムから観測できる振る舞いを、機能領域ごとに記録します。変更の理由や作業手順は[変更仕様](../../changes/)へ、長期的な技術判断は[ADR](../../adr/)へ記録します。

## 一覧

| ID | 領域 | 状態 |
| --- | --- | --- |
| CURRENT-GRADIENT | [Gradient System](./gradient-system) | current |
| CURRENT-EFFECT-STACK | [Effect Stack](./effect-stack) | current |
| CURRENT-PRESET | [Preset System](./preset-system) | current |
| CURRENT-UI-CONTROLS | [UI入力コントロール](./ui-controls) | current |

## 読み方

- `GRAD-*`、`EFFECT-*`、`PRESET-*` は、変更をまたいで維持する要件IDです。
- 内部実装のファイル名や関数名は、契約として固定する必要がない限り現行仕様の本文へ記載しません。
- 過去の判断を調べる場合は、各仕様の変更履歴からLegacy Change Specificationへ進みます。

## 未移行領域

アニメーション、動画出力、UI言語、FFmpeg、更新機構などは、現時点では変更仕様とLegacy SPECを一次の履歴として扱います。現行仕様化は、対象機能の変更時に小さな領域単位で追加します。
