---
id: SPEC-004
title: 内蔵SVGアイコンへの移行
status: implemented
owners: [maintainer]
created: 2026-07-04
updated: 2026-07-04
depends_on: []
related_adrs: [ADR-0001]
related_code: [index.html, src/components/Icon.tsx, src/index.css, src/App.tsx, src/components/TimelineBar.tsx, src/features/updater/UpdateDialog.tsx]
related_tests: [npm run lint, npm run build]
human_review: completed
---

# SPEC-004: 内蔵SVGアイコンへの移行

## 背景・問題

操作アイコンをGoogle FontsのMaterial Symbols Roundedへ依存しているため、
ネットワーク接続や外部フォント配信状態によってアイコンが文字列として表示される。
デスクトップ配布でもアイコン表示だけのために外部フォントへ接続する。

## ゴール・成功条件

- 主要操作アイコンが外部アイコンフォントなしで表示される。
- アイコン利用箇所が型付けされた共通コンポーネントを使用する。
- ボタンのラベル、title、aria-label、操作動作を変更しない。

## スコープ

### 対象

- 共通SVGアイコンコンポーネント
- 既存Material Symbols利用箇所の置き換え
- Material SymbolsのWebフォント読込とCSS定義の削除

### 対象外

- Noto Sans JPとOpen Sansの配布方式
- ボタン配置、操作フロー、配色の再設計

## 方針

必要なパスだけを`Icon`コンポーネントへ同梱し、`IconName`で利用可能なアイコンを
制限する。SVGは装飾要素として`aria-hidden`にし、操作名は親ボタンの既存ラベルで
提供する。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| Material Symbolsをセルフホスト | 不採用 | 未使用グリフを含むフォント管理が必要になる |
| アイコンごとにSVGを直接記述 | 不採用 | パスとアクセシビリティ属性が重複する |
| 型付き共通SVGコンポーネント | 採用 | 外部通信をなくし、利用箇所を一貫させられる |

## エラー・境界条件

- 未定義のアイコン名はTypeScriptで拒否する。
- アイコン自体へフォーカスを移さず、親操作要素のキーボード操作を維持する。

## 受け入れ条件

- AC-001: Material Symbolsを読み込まずに主要アイコンが表示される。
- AC-002: 全利用箇所が定義済み`IconName`だけを使用する。
- AC-003: 操作ボタンの既存ラベルとアクセシビリティ情報が維持される。
- AC-004: lintとWebビルドが成功する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-003 | 手動画面確認 | アプリ画面、更新ダイアログ |
| AC-002, AC-004 | 型検査、lint、ビルド | `npm run lint`, `npm run build` |

## 移行・互換性

保存データと利用者操作への影響はない。アイコンの線形デザインは変わるが、
同じ操作位置と意味を維持する。

## 未決定事項

なし。
