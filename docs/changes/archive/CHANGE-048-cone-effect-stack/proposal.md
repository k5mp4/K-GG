---
type: change
id: CHANGE-048
title: Coneを順序変更可能なEffect Stackレイヤーとして統合
status: archived
change_kind: F
owners: [maintainer]
created: 2026-09-21
updated: 2026-09-25
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-GRADIENT, CURRENT-PRESET, CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0004, ADR-0005, ADR-0009, ADR-0010, ADR-0017]
related_code: [src/types/distortion.ts, src/lib/effectPipeline.ts, src/components/PostprocessStackPanel.tsx, src/components/PostprocessPanel.tsx, src/components/SandboxPanel.tsx, src/features/workspace/CanvasWorkspace.tsx, src/features/workspace/useWorkspaceController.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/renderSceneAtTime.ts, src/lib/kggControlRuntime.ts, packages/kgg-control/src/types.ts, packages/kgg-control/src/scenarios.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/webglShaderSources.test.ts, src/lib/renderFrame.test.ts, src/lib/kggControlRuntime.test.ts, packages/kgg-control/src/scenarios.test.ts, src/components/PostprocessPanel.test.tsx, src/components/PostprocessStackPanel.test.tsx, src/components/SandboxPanel.test.tsx, src/store/gradientStore.effectPipeline.test.ts]
human_review: required
outcome: follow-up
migration: historical
follow_up: "issue-needed: Seam/alpha/aspect ratioの網羅確認と静止画・動画・TileのPreview parity確認"
---

# CHANGE-048 Coneを順序変更可能なEffect Stackレイヤーとして統合

## 背景・問題

Request sourceは利用者からの直接依頼です。Coneは従来SANDBOXの独立した表示として扱われ、他の効果と同じEffect Stack内で順序を調整できませんでした。Coneを後段へ分離する構成ではEffect Stackの順序変更に参加しないため要求を満たしません。

## 変更理由

利用者の依頼に従い、Coneを通常のEffect Stackレイヤーとして扱います。Cone passは直前のMain Stack textureの色を円錐面へ投影し、その出力を後続レイヤーへ渡します。Gradient RampをCone用の単色・別グラデーションとして再適用せず、前段の色ロジックを維持します。

## ゴール・成功条件

- Coneを`EffectStackKind`および`effectPipeline.effectStack`へ追加し、選択、ON/OFF、drag、randomize、solo、Preset永続化、render plan順序変更に参加させる。
- Cone passはスタック内の配置順で前段textureを入力し、円錐面への投影結果をping-pong出力へ書き込む。後段レイヤーはその出力を入力として使う。
- 既存のMapping、Texture Flow、Seam Mode、Gradient ReapplyのRGB補正とalpha保持、Apex／Depth等の設定を維持する。
- 外部control APIからもConeの列挙、有効化、順序変更ができる。
- SANDBOXからConeを除き、Canvas上のApex編集を残す。PreviewとExportで同じstack passを使う。
- ConeをMain Stackとは別に管理する段階や専用の有効状態を追加しない。

## 対象

Effect Stack型／正規化／render plan、Cone用WebGL stack pass、スタックUI、Preview／Exportの共通描画経路、関連するCurrent Spec、focused testsを対象とします。

## 対象外

- Color Palette Generatorおよびpalette固有コードの変更。
- Cloth、Prism、Flow Gradient、ParticlesなどCone以外の描画順・仕様変更。
- Tauri/Rustや出力形式の変更。
- commit、push、Pull Request、GitHub Issueなどの外部操作。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)
- [UI入力コントロール](../../../specs/current/ui-controls)
- [Gradient System](../../../specs/current/gradient-system)
- [Preset System](../../../specs/current/preset-system)
- [動画・連番フレーム出力](../../../specs/current/video-export)

## 関連ADR

- [ADR-0004](../../../adr/0004-postprocess-stack-rendering)
- [ADR-0005](../../../adr/0005-unified-effect-stack-v2)
- [ADR-0009](../../../adr/0009-unified-parameter-limits)
- [ADR-0010](../../../adr/0010-image-gradient-color-field-rendering)
- [ADR-0017](../../../adr/0017-analytic-gradient-prefix)

## 主なリスク

- Cone shader passがWebGL2の通常stack経路で動作しない場合、Coneを含む順序構成でPreview／Exportの結果が壊れる可能性があります。
- 旧PresetのeffectStackにConeがない場合、互換性のため新規Cone layerは無効として補完します。自動有効化による予期しない見た目変更を避けます。
- GPUによる見た目、タイル出力、実機上のPreview／Export parityは自動テストだけでは確定できず、手動確認が必要です。

## 未決定事項

- 実装契約とローカル自動検証に未決定事項はありません。GPU／ブラウザーでの目視確認はRelease GateまたはObservationとして残し、人間レビューを必要とします。
- 外部Issueは作成していません。単一の直接依頼として追跡でき、外部操作も依頼されていないためです。

## Finalization

- Finalized: 2026-09-25
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: Seam/alpha/aspect ratioの網羅確認と静止画・動画・TileのPreview parity確認
