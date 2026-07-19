---
id: SPEC-017
title: Effect StackとColor Histogramのワークスペース配置
status: draft
owners: [maintainer]
created: 2026-07-18
updated: 2026-07-19
depends_on: [SPEC-014, SPEC-016]
related_adrs: []
related_code: [src/App.tsx, src/components/EffectStackWorkspace.tsx, src/components/PostprocessStackPanel.tsx, src/components/ColorHistogram.tsx, src/components/GradientRamp.tsx]
related_tests: ['manual: desktop workspace swap', 'manual: document PiP open/close/reject']
human_review: required
---

# SPEC-017: Effect StackとColor Histogramのワークスペース配置

## 背景・問題

Effect Stackは現在キャンバス左上の固定位置に表示され、Color Histogramとの配置関係を利用者が選べない。編集対象を切り替えるたびに、プロパティを隠したり別の位置へ移動したりする手作業が発生する。また、Gradient RampにはDocument Picture-in-Pictureによる別ウィンドウ表示があるが、Effect Stackには同じ作業形態がない。

## 方針

- Effect StackとColor Histogramを`data-effect-stack-workspace`内の2つのワークスペーススロットとして扱い、初期状態はEffect Stack→Color Histogramの順とする。
- Effect Stackヘッダーの`⇄`操作で2つのスロットを入れ替える。配置は`kgg.effect-stack-workspace.order`へsessionStorage保存し、プリセットJSONへは保存しない。
- 配置の切り替えは、既存パネルが一方のスロットから他方へ滑らかに移動するアニメーションで表示する。配置変更は描画パイプラインやエフェクト設定を変更しない。
- Effect Stackヘッダーの`↗`操作で、Gradient Rampと同じDocument Picture-in-Pictureの分離操作を行う。対応ブラウザでは別ウィンドウへ専用マウント要素を介してポータル表示し、スタイルシートを複製してアプリ内と同じ外観を維持する。
- Picture-in-Picture非対応または権限拒否時は、通常の補助ウィンドウへフォールバックする。補助ウィンドウも作成できない場合は、現在のインライン表示を維持し、利用者へ理由を通知する。
- 配置・分離状態はエフェクトプリセットへ保存せず、UIセッションの状態として扱う。

## 対象外

- Effect Stackのエフェクト種類、順序、ON/OFF、描画結果の変更
- Color Histogramの集計アルゴリズムや表示内容の変更
- Document Picture-in-Pictureを未対応環境へ独自ウィンドウAPIで代替すること

## 受け入れ条件

- AC-001: Effect StackとColor Histogramの配置スロットを切り替えられ、両パネルが同じ場所へ重ならずに表示される。
- AC-002: `⇄`操作後、GSAPの約420msアニメーションでパネルが連続的に移動し、切り替え途中にクリック不能な長い空白やちらつきがない。
- AC-003: `↗`操作でDocument Picture-in-Pictureウィンドウが開き、Gradient Rampと同様にスタイルとパネル操作を維持できる。
- AC-004: 分離ウィンドウを閉じるとEffect Stackがインライン表示へ戻り、専用ポータル要素を破棄し、描画設定と選択中レイヤーが失われない。
- AC-005: PiP非対応・拒否時は通常の補助ウィンドウへフォールバックし、ポップアップも拒否された場合はインライン表示が壊れず、利用者が状態を理解できる通知が表示される。
- AC-006: 配置変更・分離・復帰を行っても、エフェクトスタックの描画結果とプリセット保存内容に影響しない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | デスクトップ幅で`⇄`を2回操作し、パネル矩形・約420ms移動・クリック可能状態を確認 | `EffectStackWorkspace.tsx`, `PostprocessStackPanel.tsx`, `ColorHistogram.tsx` |
| AC-003, AC-004, AC-005 | `↗`操作、別ウィンドウの操作、pagehide、未対応または拒否時の通知を手動確認 | `PostprocessStackPanel.tsx`, `GradientRamp.tsx` |
| AC-006 | ストア差分、プリセットJSON、WebGLプレビューの回帰確認 | `effectPipeline`、プリセット、WebGLプレビュー |
