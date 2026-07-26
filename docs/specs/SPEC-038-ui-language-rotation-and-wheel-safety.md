---
id: SPEC-038
title: UI英語表記・角度描画・キャンバスサイズ操作の回帰修正
status: implemented
owners: [maintainer]
created: 2026-07-26
updated: 2026-07-26
depends_on: [SPEC-028, SPEC-037]
related_adrs: [ADR-0012]
related_code: [src/i18n/messages.ts, src/components/PostprocessStackPanel.tsx, src/components/ColorPaletteGenerator.tsx, src/components/TimelineBar.tsx, src/components/GradientAnchorEditor.tsx, src/App.tsx, src/App.css, src/hooks/useCanvasSize.ts, src/lib/noiseAngle.ts, src/lib/webgl.ts, docs/development/ui-terminology.md]
related_tests: [src/lib/noiseAngle.test.ts, 'manual: English top bar/effect stack and Gradient Ramp import labels, InputAngle layout, Dice CSS, anchor visibility, wheel arming']
human_review: completed
---

# SPEC-038: UI英語表記・角度描画・キャンバスサイズ操作の回帰修正

## 背景・問題

日英切替後も、トップバーとEffect Stackではエフェクト名を英語で統一したい。Gradient Rampの主要な開閉・読込操作も英語表記を優先する。また、Animationの狭いInputAngleではTweeqの数値部が消えて描画が成立しない場合があり、Diceには外側の境界線が残っている。NoiseのDomain Warp角度はキャンバス上のInputAngleと回転方向が一致せず、アンカー表示切替は状態だけ変わって描画へ反映されない。キャンバスサイズ入力はホバー直後のホイールでも変更され、誤操作を誘発する。

## ゴール・成功条件

- トップバー、Effect Stackの効果名・カテゴリ名・見出し、Gradient RampのOpen/Import操作を英語で表示する。
- AnimationのInputAngleはダイヤルと数値入力が同時に視認できる幅で描画する。
- Diceの外側の枠線を表示せず、フォーカス時のアクセシビリティ表示だけを残す。
- NoiseのDomain Warp角度入力とキャンバス上のInputAngleが同じ視覚的な回転方向になる。
- Gradient Anchorの表示切替が実際のオーバーレイ描画へ反映される。
- キャンバス幅・高さのホイール変更は、対象入力へ2秒間ホバーした後だけ有効にする。ホバー解除・フォーカス解除で再び待機状態へ戻す。
- UI用語集は、現在非表示のパネル・ダイアログ・通知を含む全メッセージキーと共通パラメータ名を参照できる状態にする。

## 方針

- 日本語辞書でもトップバー・Effect Stack固有の英語キーは英語値を保持する。パネル内部の説明文は既存の日英方針を維持する。
- Gradient Rampの画像・Overlay取り込みには辞書キーを追加し、操作名を`Open`/`Import`で統一する。
- AnimationのInputAngleは入力値の契約を変更せず、コンテナの最小幅だけをTweeqの表示条件（入力高さの4倍超）に合わせる。
- Noiseの回転角は保存値を変更せず、WebGLへ渡す符号をキャンバスの角度表示と一致するよう補正する。
- GradientAnchorEditorは`visible`プロパティを受け取り、非表示時はDOMとポインターイベントを生成しない。
- ホイール待機は入力要素ごとのタイマーで管理し、待機中は値を変更せず既定のスクロールも抑止する。
- 用語集は実表示の一次情報である辞書・`uiLabels`とキー単位で対応させ、将来の非表示領域も同じ表へ記録する。

## 受け入れ条件

- AC-001: 日本語設定でトップバーとEffect Stackの効果名・カテゴリ名・見出しが英語で表示される。
- AC-002: Gradient Rampの編集を開く操作、画像・Overlay取り込み操作が英語のOpen/Import表記になり、英語設定でも日本語が混在しない。
- AC-003: AnimationのInputAngleでダイヤルと数値入力が表示され、直接入力・ドラッグ・キーフレーム更新が従来どおり動作する。
- AC-004: NoiseのDomain Warp各角度を同じ方向へドラッグしたとき、キャンバスの角度入力と同じ回転方向で描画へ反映される。
- AC-005: Gradient Anchor表示ボタンを押すとアンカー、制御点、接続線が表示・非表示になる。
- AC-006: Dice周辺に常時表示の枠線がなく、フォーカスリングはキーボード操作時だけ表示される。
- AC-007: キャンバス幅・高さのホイールはホバー開始から2秒未満では値を変更せず、2秒経過後だけ従来の1/10px刻みを適用する。離脱後の再ホバーでは再度2秒待つ。
- AC-008: 用語集に辞書キー、英語名、日本語名、アイコン／表記規則、非表示領域のキーが記録される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-008 | 辞書テスト、ブラウザ日英確認、文書チェック | `src/i18n/messages.ts`, `docs/development/ui-terminology.md` |
| AC-003 | DOM確認、InputAngleの手動操作、既存キーフレームテスト | `src/components/TimelineBar.tsx` |
| AC-004 | WebGL角度ユニフォームの回帰テスト、ブラウザ手動操作 | `src/lib/webgl.ts`, `src/shaders/noise.glsl` |
| AC-005 | DOM表示状態テスト、ブラウザ手動操作 | `src/App.tsx`, `src/components/GradientAnchorEditor.tsx` |
| AC-006 | DOM/CSS確認、キーボードフォーカス確認 | `src/components/*Panel.tsx`, `src/App.css` |
| AC-007 | タイマー付きフックテスト、ブラウザホイール確認 | `src/hooks/useCanvasSize.ts` |

## 移行・互換性

プリセットJSON、キーフレーム、保存された角度値、WebGLの座標契約は変更しない。表示言語の保存形式もSPEC-037の契約を維持する。

## 未決定事項

なし。
