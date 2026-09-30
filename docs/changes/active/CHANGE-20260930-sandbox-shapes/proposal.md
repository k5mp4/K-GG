---
type: change
id: CHANGE-20260930-sandbox-shapes
title: SANDBOX Shapes（SVG形状の輝度の場とGradient Ramp、表示・非表示ループ）
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-30
updated: 2026-09-30
current_specs: [CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-UI-CONTROLS]
related_adrs: [ADR-20260930-sandbox-shapes-final-stage]
related_code: [src/types/shapes.ts, src/lib/shapesLibrary.ts, src/shaders/shapes.frag.glsl, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/renderFrame.ts, src/lib/renderSceneAtTime.ts, src/lib/sceneRenderPlan.ts, src/lib/sceneEvaluation.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/history.ts, src/lib/exportRenderState.ts, src/features/shapes/shapesMaskStore.ts, src/components/ShapesPanel.tsx, src/components/SandboxPanel.tsx, src/components/GradientCanvas.tsx, src/components/PresetPanel.tsx, src/store/documentActions.ts, packages/kgg-control/src/parameterLimits.ts]
related_tests: [src/types/shapes.test.ts, src/lib/shapesLibrary.test.ts, src/lib/presetModel.shapes.test.ts, src/lib/renderFrame.test.ts, src/lib/webglExportPrograms.test.ts, src/components/SandboxPanel.test.tsx, tests/e2e/shaders.spec.ts]
human_review: required
---

# SANDBOX Shapes（SVG形状の輝度の場とGradient Ramp、表示・非表示ループ）

Request source: Direct request（AIへの直接指示）。SVGフィルターで「動くストライプ＋グレイン感のあるオーラ風グラデーション」を作る仕様プロンプトを参照し、SVGを読み込んで表示・非表示のループアニメーションを作れるようにする。実装先は利用者の回答により「K-GGのSANDBOXにShapesとして実装し、K-GGの描画をシェイプに割り当てる」、表示・非表示は「フェード＋発光」を含めて切替方式を選べるものとした。初版を確認した利用者から「インナーシャドウでSVGパスをなめらかに縁取り、パス内部のFillに動きをつけ、その輝度をグラデーションへ反映して有機的・流体のような、サーモグラフィやdepthパスのような連続的なグラデーションにしたい」とのフィードバックを受け、同じChange内で描画モデルを変更した。

## 背景・問題

K-GGの描画は常にCanvas全面の矩形として出力され、ロゴや文字、アイコンの形へ割り当てる手段がない。形状に合わせて光らせる・点滅させる表現は、別のツールで合成する必要がある。

## 変更理由

K-GGで作ったグラデーションやEffect Stackの画が、任意の形状に割り当てたときにどのようなグラフィックになるかを、K-GGの中で試せるようにする。動画素材として使えるよう、表示・非表示をAnimationのループに合わせて繰り返せるようにする。

## ゴール・成功条件

- SANDBOXの`Shapes`で、円・星・文字のアウトラインの内蔵形状か、読み込んだSVGを選べる。
- 形状のアルファから、なめらかな輪郭、インナーシャドウの奥行き、動くFill（フロー、リップル、ストライプ、K-GGの描画の輝度）、オーラ、グレインで連続した輝度の場を作り、Gradient Rampで着色できる。
- 表示・非表示ループを「フェード＋発光」「ワイプ」「ネオン点滅」「常に表示」から選べ、Animationのループ端で途切れない。
- Preview、Thumbnail、静止画、動画、タイル書き出しで同じ結果になり、旧Presetは無効の既定値で読める。
- typecheck、unit/component test、lint、WebGL2 shader compileが通る。

## 対象

- `shapes`設定（型、正規化、パラメータ制約、Preset保存、履歴）と、セッション内だけのSVGマスク。
- 内蔵形状のパスデータ、SVGの無害化・ラスタライズ。
- WebGLの`shapes` program、最終段としての実行、Export準備。
- SANDBOXのShapesパネル、日英表記。
- Current Spec（Effect Stack、Preset、UI Controls）とADRの同期。

## 対象外

- 読み込んだSVGのPresetへの保存。
- 複数の形状の同時表示、形状ごとの別設定。
- Shapesのパラメータのキーフレーム化、MCP（`kgg-control`）への公開。
- 元のプロンプトにある単体HTML／SVGフィルター版の成果物（K-GG本体へ統合するため作成しない）。`prefers-reduced-motion`はアプリのAnimation ON／OFFで代替する。
- 実GPU・Tauri実機でのフレーム時間の測定。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack.md)
- [Preset System](../../../specs/current/preset-system.md)
- [UI Controls](../../../specs/current/ui-controls.md)

## 関連ADR

- [ADR-20260930-sandbox-shapes-final-stage](../../../adr/20260930-sandbox-shapes-final-stage.md)

## 主なリスク

- 互換性: `shapes`がない旧Presetは無効の既定値になり、見た目は変わらない。SANDBOXのモジュール数が6から7になる。
- 性能: 有効時に描画面のコピーと、1画素あたり最大約125回のmask参照と約27回の3Dノイズ評価を行うフルスクリーン1パスが増える。実GPUでの時間は未測定。
- セキュリティ: 利用者のSVGはDOMParserで解析し、スクリプト・`foreignObject`・イベント属性を除去したうえで画像としてデコードする（画像としてのSVGはスクリプトを実行せず外部資源を読まない）。
- 見た目: ぼかしはmipmapによる近似で、SVGフィルターの`stdDeviation`とは一致しない。

## 未決定事項

- なし（human reviewで、既定値と見た目を確認する）。
