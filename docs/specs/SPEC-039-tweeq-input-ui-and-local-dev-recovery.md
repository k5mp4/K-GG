---
id: SPEC-039
title: Tweeq入力UIの安定化とローカル開発サーバー再利用
status: implemented
owners: [maintainer]
created: 2026-07-26
updated: 2026-07-26
depends_on: [SPEC-021, SPEC-028, SPEC-036, SPEC-037, SPEC-038]
related_adrs: [ADR-0011, ADR-0012]
related_code: [tools/dev-local.mjs, tools/tweeq-vendor/kgg-entry.ts, tools/tweeq-vendor/index.d.ts, src/App.css, src/components/BlockNoisePanel.tsx, src/components/GradientRamp.tsx, src/components/SidebarSection.tsx, tests/tweeqVendor.test.ts]
related_tests: ['npm test (37 files, 192 tests)', 'npm run build', 'npm run lint (0 errors, 24 existing warnings)', 'npm run docs:check', 'npm run docs:build', 'npm run dev:local (existing K-GG server reuse)', 'manual: browser DOM and visual checks for InputAngle, Diffuse radio modes, Gradient Ramp Repeat, and removed Angle/Open labels']
human_review: completed
---

# SPEC-039: Tweeq入力UIの安定化とローカル開発サーバー再利用

## 背景・問題

Tauri開発起動時に同じK-GGのViteサーバーが既に5173番ポートを使用していると、`beforeDevCommand`が失敗する。また、Tweeqの`InputAngle`は入力欄の表示に必要な幅を下回ると数値入力を省略するため、狭いパネルやタイムラインで表示が不安定になる。DiffuseとGradient RampにはTweeqの入力コンポーネントへ統一できるUIが残っている。

## ゴール・成功条件

- 既にK-GGのViteサーバーが5173番ポートで稼働している場合は再利用してTauriを起動できる。
- K-GG以外のプロセスが5173番ポートを使用している場合は、誤って接続せず原因を説明して停止する。
- `InputAngle`は狭い表示領域でもダイヤルと数値入力を同時に表示する。
- DiffuseのBlock / Smooth / DitherはTweeq`InputRadio`で選択でき、名称は常に英語で表示する。
- Gradient RampのRepeatはTweeq`InputNumber`で入力でき、Angle入力とSidebarSectionの開閉状態文字列は表示しない。
- 固定vendorからTweeqの公式Input Components一式（既存の数値・色・カーブ・シャッフルを含む）を将来利用できる。

## 方針

- `tools/dev-local.mjs`で5173番ポートの応答がK-GGのVite入口か確認し、該当時だけ再利用する。別プロセスの場合は`strictPort`のまま明示的に失敗させる。
- Tweeqの`InputAngle`が要求する入力高さの4倍超を満たす最小幅をK-GG側のレイアウト境界として確保する。
- 上流固定コミットからInputButton、InputCheckbox、InputDropdown、InputDrum、InputPosition、InputRadio、InputSize、InputString、InputSwitch、InputTime、InputTranslate、InputVecをvendorの公開入口へ追加する。ReactとReact DOM以外の実行時依存は従来どおりvendorへ内包し、安全検査を通す。
- 既存の保存形式・WebGL計算契約は変更せず、機能していないGradient Angleの操作UIだけを削除する。

## 受け入れ条件

- AC-001: 5173番ポートでK-GGのVite応答が稼働中に`npm run dev:local`を実行しても、ポートエラーで終了せず既存サーバーを再利用する。
- AC-002: 別のHTTPサーバーが5173番ポートを使用している場合、`npm run dev:local`はK-GGとして再利用せず、ポート使用中の説明を表示して失敗する。
- AC-003: InputAngleを含むパネルを狭い幅で表示しても、ダイヤルと数値入力の両方がDOM上に存在し、直接入力・ドラッグ・キーフレーム更新が従来経路へ届く。
- AC-004: Diffuseの3モードがInputRadioのradiogroupとして表示され、ラベルがBlock、Smooth、Ditherである。
- AC-005: Gradient RampのRepeatがInputNumberで表示され、1〜20の整数を直接入力・ドラッグできる。Gradient Angleの操作欄とSidebarSectionのSelect/Open状態文字列は表示しない。
- AC-006: vendorの公開APIに公式Input Components一式が含まれ、依存・危険な動的実行・外部アイコン通信の検査を通過する。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | `npm run dev:local`の手動確認、ポート応答確認 | `tools/dev-local.mjs` |
| AC-003 | ブラウザでSlit、Noise、Animationの狭幅表示と操作を確認 | `src/App.css`, `src/components/SliderField.tsx` |
| AC-004 | DOM確認とブラウザ操作 | `src/components/BlockNoisePanel.tsx` |
| AC-005 | DOM確認とブラウザ操作 | `src/components/GradientRamp.tsx`, `src/components/SidebarSection.tsx` |
| AC-006 | vendor生成スクリプト、`npm run build`、vendor export検査 | `tools/update-tweeq-vendor.ps1`, `vendor/tweeq/` |

## 移行・互換性

既存プリセット、キーフレーム、Zustand状態、WebGL uniformの保存・評価形式は変更しない。`gradient.angle`は旧プリセットと描画互換性のため内部に残し、新しい操作UIからは除外する。

## 未決定事項

なし。
