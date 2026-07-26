---
id: SPEC-037
title: 日英切替とアイコン中心UI
status: implemented
owners: [maintainer]
created: 2026-07-26
updated: 2026-07-26
depends_on: [SPEC-004, SPEC-011, SPEC-036]
related_adrs: [ADR-0012]
related_code: [src/i18n/, src/components/Icon.tsx, src/components/IconButton.tsx, src/components/GradientTypeSelector.tsx, src/components/GradientRamp.tsx, src/components/HelpPanel.tsx, src/components/PanelEdgeToggle.tsx, src/docs/help.md, src/docs/help.en.md, docs/development/ui-terminology.md]
related_tests: [src/i18n/language.test.ts, 'manual: Japanese/English desktop and mobile UI, html lang, Gradient Type keyboard operation, accessible icon names']
human_review: completed
---

# SPEC-037: 日英切替とアイコン中心UI

## 背景・問題

現在の画面には日本語と英語が混在し、同種の操作が文字、絵文字、SVGで不統一に表現されている。制作ツールとして直感的に操作でき、表示言語を選べる共通UI基盤が必要である。

## ゴール・成功条件

- アプリ本体と組込みヘルプを日本語・英語で切り替えられる。
- 共通操作を型付きアイコンと共通ボタンへ統一し、言語に依存せず理解しやすくする。
- Gradient Typeを実際のアンカー配置を模したアイコンから選べる。
- 表示名称と追加手順を用語集で継続的に管理できる。

## 方針

外部i18n依存を追加せず、型付きの日英メッセージ辞書と`LanguageProvider`を設ける。`kgg.ui-language`を`localStorage`へ保存し、未保存時は`navigator.language`が`ja`で始まれば日本語、それ以外は英語とする。`document.documentElement.lang`と別ウィンドウを同期する。言語はプリセットJSONに含めない。

全パネル、ダイアログ、通知、確認文、エラー、ツールチップ、aria属性、更新、書き出し、ランタイムヘルプを辞書へ移す。エフェクト名とパラメータ名も翻訳し、`K-GG`、`Tweeq`、RGB、FPS、BPM、PNG、MP4、FFmpeg、WebGLなどの固有名・標準略語は共通表記とする。ヘルプMarkdownは言語別に管理する。

アイコン専用操作は共通`IconButton`を使い、現在言語のtooltip、`aria-label`、フォーカス表示、disabled状態を必須とする。書き出し、保存など主要操作はアイコンと短い文言を併記する。

Gradient Typeは3×2のradiogroupとし、Linear、Radial、4-color、Diamond、Angle、Bezierの既定アンカーを模したSVGを表示する。マウス、タッチ、Tab、矢印キー、Enter、Spaceで操作できる。

## エラー・境界条件

- 保存言語が不正な場合はOS言語判定へ戻す。
- 翻訳キー不足やプレースホルダー不一致はテストで失敗させる。
- アイコンだけでは意味が成立しない主要操作には短い文言を残す。
- popupや分離ウィンドウでも表示言語とアクセシブル名を同期する。

## 受け入れ条件

- AC-001: 日本語と英語の辞書キー、プレースホルダーが一致し、OS判定と保存値復元が正しい。
- AC-002: 設定画面から言語を切り替えると全画面、組込みヘルプ、別ウィンドウ、`html lang`が同期する。
- AC-003: 全アイコン専用ボタンがローカライズ済みのtooltipとアクセシブル名、フォーカス表示、disabled表示を持つ。
- AC-004: Gradient Typeの6種を3×2アイコンradiogroupで選択でき、各図が既定アンカー配置を表す。
- AC-005: Gradient Typeをマウス、タッチ、Tab、矢印キー、Enter、Spaceで操作できる。
- AC-006: 日本語・英語それぞれで意図しない言語混在がなく、開発者向けUI用語集に翻訳キー、名称、アイコン、表記規則、追加手順が記録される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001 | unit | i18n辞書・resolverテスト |
| AC-002, AC-006 | component / manual | desktop、mobile、Tauri、分離Effect Stack、help |
| AC-003 | DOM contract / manual | 共通IconButtonと利用箇所 |
| AC-004, AC-005 | component / keyboard manual | Gradient Ramp |

## 移行・互換性

既定の暗色・工業的な視覚方向と情報密度を維持する。VitePressサイト全体の英訳は対象外とする。

## 未決定事項

なし。
