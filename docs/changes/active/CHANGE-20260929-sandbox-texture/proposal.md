---
type: change
id: CHANGE-20260929-sandbox-texture
title: Texture Effect Stackレイヤー（異方性反射・質感）
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-29
updated: 2026-09-29
current_specs: [CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-UI-CONTROLS]
related_adrs: [ADR-20260929-sandbox-texture-material-stage]
related_code: [src/types/texture.ts, src/shaders/texture.frag.glsl, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/effectPipeline.ts, src/lib/sceneRenderPlan.ts, src/lib/renderFrame.ts, src/lib/renderSceneAtTime.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/history.ts, src/lib/exportRenderState.ts, src/components/TexturePanel.tsx, src/components/SandboxPanel.tsx, src/components/GradientCanvas.tsx, src/components/PresetPanel.tsx, src/features/workspace/useWorkspaceController.ts, src/store/documentActions.ts, packages/kgg-control/src/parameterLimits.ts]
related_tests: [src/types/texture.test.ts, src/store/gradientStore.texture.test.ts, src/lib/presetModel.texture.test.ts, src/lib/effectPipeline.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/renderFrame.test.ts, src/components/SandboxPanel.test.tsx, tests/e2e/shaders.spec.ts]
human_review: required
---

# Texture Effect Stackレイヤー（異方性反射・質感）

Request source: Direct request（AIへの直接指示）。

## 背景・問題

K-GGにはCDの盤面のような異方性反射や、金属・紙の質感を画像へ重ねる手段がない。Normalは輝度から法線を作るだけでライティングをしないため、ライトに応じて動くハイライトや虹色の回折は作れない。

## 変更理由

Effect Stackで作った画像に、任意の画像または決まった描画方法で質感を与えられるようにする。当初はSANDBOXの固定段として実装したが、実際に使った利用者の要望で、他の効果と同じく並べ替え可能なEffect Stackレイヤーへ変更した。

## ゴール・成功条件

- Effect Stackに`Texture`レイヤーがあり、ON／OFF・並べ替え・solo・randomizeができ、Postprocessの`Edit Layer`から設定を編集できる。
- 手続き型プリセット（ヘアライン金属、旋盤仕上げ金属、CDの溝、紙）と、読み込んだ画像の高さ場のどちらでも質感を重ねられる。
- 異方性反射（グレインに沿ってハイライトが伸びる）、ライトの回転、CD風の虹色の回折を表現できる。
- Preview、Thumbnail、静止画、動画、タイル書き出しで同じ結果になり、旧Presetは無効の既定値で読み込める。
- typecheck、unit/component test、lint、WebGL2 shader compileが通る。

## 対象

- `texture`設定（型、正規化、パラメータ制約、Preset保存、履歴）と、`EffectStackKind`の`texture`（既定は最後・無効）。
- WebGLの`texture` program、Render Plan、主ループ内での実行。
- PostprocessのTextureパネル、画像の読み込み、日英表記。MCPの`EffectKind`への`texture`追加。
- Current Spec（Effect Stack、Preset、UI Controls）とADRの同期。

## 対象外

- Legacy V1パイプラインでの動作（V2だけ）。
- 画像素材のPresetへの保存（既存の外部画像と同じくセッション内のみ）。
- 法線マップ・ラフネスマップなど、高さ以外の素材入力。
- Texture固有のパラメータ操作をMCPへ公開すること（レイヤーのenable／reorderだけが対象）。
- 実GPU・Tauri実機でのフレーム時間の測定。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack.md)
- [Preset System](../../../specs/current/preset-system.md)
- [UI Controls](../../../specs/current/ui-controls.md)

## 関連ADR

- [ADR-20260929-sandbox-texture-material-stage](../../../adr/20260929-sandbox-texture-material-stage.md)

## 主なリスク

- 互換性: `texture`が無い旧Presetは無効の既定値になり、見た目は変わらない。主スタックの種類が12から13になり、MCPの`EffectKind`にも`texture`が加わる。SANDBOX時代の保存（レイヤーなし・`texture.enabled`のみ有効）は読み込み時にレイヤーを有効にして引き継ぐ。
- 性能: 有効時にフル解像度のパスが1つ増え、1画素あたり3回の高さ評価を行う。実GPUでの時間は未測定。
- 見た目: 高周波の溝（`cdGroove`、`spunMetal`）は縮小表示でモアレが見える。

## 未決定事項

- なし（human reviewで、プリセットの初期値と見た目を確認する）。
