---
type: change
id: CHANGE-034
title: Slitのオフセット速度のみのループ
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-28
updated: 2026-08-28
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/types/distortion.ts, src/store/gradientStore.ts, src/components/SlitScanPanel.tsx, src/components/PresetPanel.tsx, src/lib/presetModel.ts, src/lib/sceneEvaluation.ts, src/lib/animationRegistry.ts, src/lib/webgl.ts, src/lib/effectShaderParity.test.ts]
related_tests: [src/lib/sceneEvaluation.glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/presetModel.slit.test.ts, src/store/gradientStore.animation.test.ts, npm test, npm run lint, npm run build]
human_review: completed
---

# CHANGE-034 Slitのオフセット速度のみのループ

## 背景・問題

Slitには、スリットごとの変化を進める`offsetSpeed`と、スリット帯域全体を動かす`phaseSpeed`／`phaseAnimEnabled`が別々に存在する。現在はPhase SpeedがUI、保存状態、シーン評価、Legacy／Effect Stack V2の描画経路へ接続されているため、速度の役割が二つに分かれている。

## 変更理由

Slitのループを一つの速度入力で管理し、PreviewとExportで同じ動きを再現しやすくするため。スリット位置の手動調整（`slitPhase`）は残し、時間経過による位相移動だけをなくす。

## ゴール・成功条件

- Motion UIにはLoop／PingPongとOffset Speedだけを残し、Phase Speedを表示しない。
- SlitのSource Image UIは、Slitプロパティモジュールの一番下に表示する。
- Slitの自動ループは`offsetSpeed`だけで進み、LegacyとEffect Stack V2の両描画経路で位相速度による追加移動を行わない。
- 新しい保存状態・Presetには`phaseSpeed`と`phaseAnimEnabled`を出力しない。
- 旧Presetに残る`phaseSpeed`、`phaseAnimEnabled`、Phase Motion用の`slitScan.slitPhase`トラックは読み込み時に無視し、旧値をOffset Speedへ変換しない。`slitPhase`の静的な手動位置は保持する。
- Preview、Thumbnail、静止画、連番、動画でOffset Speedだけを使う同じSlit時計を共有する。

## 対象

- SlitScanConfig、Store default、Preset load/saveの状態と旧Preset互換処理。
- SlitScanPanelのMotion UIとAnimation registryからのPhase Motion削除。
- SlitScanPanel内のSource Image UIの表示順序変更。
- Scene evaluation、Legacy Generator、Effect Stack V2のphase speed計算削除。
- Slitの自動ループがOffset Speedだけで動くこと、および既存のLoop／PingPong、手動`slitPhase`編集を確認するテスト。
- CURRENT-EFFECT-STACK、CURRENT-UI-CONTROLS、CURRENT-PRESETへのdelta統合。

## 対象外

- SlitのMode、Width、Offset、Variance、Seed、Angle、Offset Speedの範囲・意味の変更。
- Loop／PingPongの選択、AnimationのDuration／Speed、Preview・Exportの共通時計の変更。
- 手動オーバーレイによる`slitPhase`の位置調整、スリット個別幅編集、Slit以外のアニメーション。
- 旧Presetの他の値や、Effect Stackの順序・描画アルゴリズムの変更。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI Controls](../../../specs/current/ui-controls)
- [Preset System](../../../specs/current/preset-system)

## 関連ADR

- [ADR-0004 Postprocess Stackをping-pong FBOで描画する](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005 Unified Effect Stack V2を段階別ping-pong FBOで描画する](../../../adr/0005-unified-effect-stack-v2)

## 主なリスク

- 旧Presetや旧キーフレームを正しく除去できないと、保存状態にない位相移動が残る。
- LegacyとEffect Stack V2の片方だけにphase speed計算が残ると、Preview／Exportまたはスタック順によって見た目が分岐する。
- 新規保存から値を除去する処理が不十分だと、旧パラメータが再び保存される。

## 未決定事項

- なし。上記の旧Preset互換方針を含むdeltaの人間レビューが必要。

## Acceptance criteria

- **AC-001 — Motion UI**: SlitのMotionにはLoop／PingPongとOffset Speedだけが表示され、Phase SpeedおよびPhase Motionの入口が表示されない。
- **AC-002 — 状態とPreset互換性**: 新規のSlit状態・Presetに`phaseSpeed`／`phaseAnimEnabled`がなく、旧Presetの同キーは0相当の位相移動なしとして読み込まれ、保存時に再出力されない。旧Phase Motionトラックも適用されない。静的な`slitPhase`は保持される。
- **AC-003 — Offset Speedのみの描画**: Legacy GeneratorとEffect Stack V2の両経路で、Slitの時間変化はOffset SpeedとLoop／PingPongだけで決まり、phase speed由来の追加オフセットがない。
- **AC-004 — Preview／Export parity**: Preview、Thumbnail、静止画、連番、動画で同じSlit時計を使い、Offset Speedの正負、0、Loop／PingPongの境界を同じ結果にする。
- **AC-005 — 回帰と検証**: 既存SlitのMode、手動`slitPhase`、個別幅、Effect Stack順序を壊さず、関連テスト、docs:check、docs:build、lint、buildが成功する。
- **AC-006 — Source Imageの配置**: SlitのSource Image UIがSlitプロパティモジュール内の最下部に表示され、画像の読み込み・削除・エラー表示の動作は変わらない。

## Review gate

このchangeは、`status: approved` と `human_review: completed` が確認されるまでコード実装へ進めない。承認後にWhy／What、対象範囲、ACを変更する場合はreviewへ戻して再承認する。
