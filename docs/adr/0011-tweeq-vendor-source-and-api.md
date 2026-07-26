---
id: ADR-0011
title: Tweeq vendorを固定上流ソースから最小構成で生成する
status: accepted
date: 2026-07-26
deciders: [maintainer]
related_specs: [SPEC-021, SPEC-036]
supersedes: [ADR-0006]
---

# ADR-0011: Tweeq vendorを固定上流ソースから最小構成で生成する

## コンテキスト

K-GGはTweeqを`file:vendor/tweeq`から利用している。カーブとシャッフルを追加する一方で、npm配布物や上流の未固定変更へ依存せず、採用したReact実装とライセンスを追跡できる必要がある。

## 判断

- 上流を`https://github.com/arcatdmz/tweeq`、固定コミットを`75542380032f3429b737cea3840d719cdbc5f7f8`とする。
- K-GG専用の最小エントリから必要APIだけを生成し、React以外の実行時依存をvendor成果物へ内包する。
- 上流の動的式評価はK-GG安全化パッチで有限数・不活性文字列の解析へ置換し、Iconifyの外部ローダーはローカルSVGへ置換する。
- アプリの依存宣言は`file:vendor/tweeq`だけとし、npm版Tweeqは追加しない。
- vendor READMEへ上流、コミット、公開API、ライセンス、再生成・検証手順を記載し、上流checkoutを明示入力にする更新スクリプトを保守する。
- 更新時は固定コミットからclean worktreeを作り、固定lockfileでfresh installする。成果物は公開export、外部依存、危険な実行時コード、ライセンスを一時領域で検査してから置換する。

## 代替案

- npm版へ直接依存する案は、上流の配布状態と依存更新がアプリの再現性に影響するため採用しない。
- K-GG内で類似UIを再実装する案は、React版Tweeqとの挙動差と保守対象を増やすため採用しない。
- 上流全体をvendoringする案は、未使用コンポーネントと依存を持ち込むため採用しない。

## 結果

更新には固定コミットのcheckoutとvendor再生成が必要になる。安全化パッチは上流更新時に再適用可否を確認する。
vendor差分は依存・ライセンス・外部通信・動的コード実行を含むためセキュリティレビュー対象とする。
