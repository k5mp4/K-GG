---
type: change
id: CHANGE-014
title: Effect Stackのランダム順序とソロレイヤー
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-02
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS]
related_adrs: [ADR-0004, ADR-0010]
related_code: [src/components/PostprocessStackPanel.tsx, src/lib/effectPipeline.ts, src/lib/effectStackTransition.ts, src/lib/postprocessStack.ts, src/store/gradientStore.ts, src/i18n/messages.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectStackTransition.test.ts, src/lib/postprocessStack.test.ts, src/store/gradientStore.postprocessStack.test.ts]
human_review: completed
---

# CHANGE-014 Effect Stackのランダム順序とソロレイヤー

実装と自動検証は完了している。ブラウザーCDPの制約により遷移中のクロスフェード目視が未確認のため、受け入れ確認完了までactiveに保持する。

## 背景・問題

Effect Stackでは、効果の順序をドラッグして変更できますが、試行錯誤のために順序を一度に入れ替える操作がありません。また、特定のレイヤーだけの見た目を確認するには、他のレイヤーを個別に無効化してから元へ戻す必要があります。

## 変更理由

ランダムな順序をすぐに試せる操作と、Altクリックで一つのレイヤーだけを確認できる操作を追加し、効果の比較・探索を短縮します。ランダム化は現在の描画結果から新しい順序の描画結果へ滑らかに遷移させ、順序が突然切り替わることを避けます。既存の保存形式と描画順の決定性は維持し、ユーザーが明示的に操作したときだけ状態を変更します。

## ゴール・成功条件

- Effect Stackの操作から主スタック9種類の順序をランダムに並べ替えられる。
- ランダム化は全9種類を一度ずつ含む順列を作り、各レイヤーの有効／無効状態を変更しない。
- ランダム化の開始時は現在のレイヤー状態を保持し、現在の描画結果からランダム化後の描画結果へイージング付きの一回限りの遷移を行う。途中で画面が瞬時に新順序へ切り替わらない。
- 遷移完了後にランダム化後の順序を確定し、遷移中の一時状態はPreset、thumbnail、exportへ保存・持ち越ししない。
- ランダム化しても、選択中のレイヤー、固定段（Prism／Particlesなど）、Presetの保存形式は変更しない。
- Effect StackのレイヤーをAltクリックすると、クリックした主スタックレイヤーだけが有効になり、他の主スタックレイヤーは無効になる。
- 同じレイヤーをもう一度Altクリックすると、ソロ化前に有効だった主スタックの状態へ復帰できる。
- ソロ化は既存の`enabled`状態へ反映し、専用の一時フラグや新しい保存キーを追加しない。
- Altキーなしのクリック、トグル、ドラッグ並べ替えは既存の動作を維持する。

## 対象

- 主スタック9種類の順序をランダム化する純粋な状態変換とUI操作。
- 現在の描画状態からランダム化後の順序へ遷移する一時的なプレビュー状態とイージング制御。
- 主スタック行のAltクリックによるソロ化、選択状態更新、保存・再読込。
- 日本語・英語のボタン名、ツールチップ、キーボード操作説明。
- ランダム化とソロ化の単体テストおよびUIの再現可能な手動確認。

## 対象外

- Prism、Particles、Normal/Matcapなど固定段の順序変更・ソロ化。
- 主スタックへ効果の追加・削除、同一種類の複数インスタンス対応。
- 自動再生中の周期的なランダム化、乱数seedの保存、書き出しごとのランダム化。
- 各レイヤーのパラメータ値やキーフレームを補間するアニメーション。今回の滑らかさは、現在結果と遷移先結果の表示ブレンドで実現する。
- ランダム化・ソロ化に伴うシェーダー、描画式、export codecの変更。
- 別ウィンドウのライフサイクル修正（CHANGE-015で扱う）。

## 影響を受ける現行仕様

- [CURRENT-EFFECT-STACK](../../../specs/current/effect-stack)
- [CURRENT-UI-CONTROLS](../../../specs/current/ui-controls)

## 関連ADR

- ADR-0004、ADR-0010を確認し、既存のEffect Pipelineと固定段の境界を維持する。

## 主なリスク

- ランダム化により見た目が大きく変わるため、操作対象と結果をボタンのラベル・ツールチップで明示する。
- AltクリックはOSやブラウザーの既定操作と競合する可能性があるため、対象行のクリックでのみ処理し、ドラッグ開始やトグル操作へ波及させない。
- 無効化されたレイヤーをソロ解除する専用操作は追加しないため、復元には個別のトグル操作またはPreset再読込が必要になる。

## 実装決定

- ランダム化ボタンの配置とアイコンは、現行ヘッダーの操作密度を確認して最終決定する。ただし、主スタックの順序だけを対象とする契約は変更しない。
- ランダム化の乱数源は通常`Math.random`を使い、テストでは注入可能な乱数関数を使用する。
- 遷移時間は既定400ms、イージングは`easeInOut`とする。遷移中はランダム化操作を一時的に無効化し、同時実行による状態競合を避ける。
