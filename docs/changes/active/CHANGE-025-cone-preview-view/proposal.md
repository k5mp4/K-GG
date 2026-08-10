---
type: change
id: CHANGE-025
title: SANDBOX 3D Cone Preview View
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-10
updated: 2026-08-10
current_specs: [CURRENT-GRADIENT, CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-VIDEO-EXPORT, CURRENT-UI-CONTROLS]
related_adrs: []
related_code: [src/types/renderView.ts, src/types/coneView.ts, src/store/gradientStore.ts, src/lib/presetModel.ts, src/lib/coneView.ts, src/lib/coneViewRenderer.ts, src/lib/processedCanvasClock.ts, src/components/ConeCanvas.tsx, src/components/ConeApexEditor.tsx, src/components/ConeViewPanel.tsx, src/components/SandboxPanel.tsx, src/components/GradientCanvas.tsx, src/App.tsx, src/i18n/messages.ts, src/i18n/uiLabels.ts]
related_tests: [src/types/coneView.test.ts, src/lib/coneView.test.ts, src/lib/processedCanvasClock.test.ts, src/lib/videoExportFrames.test.ts]
human_review: completed
---

# CHANGE-025 SANDBOX 3D Cone Preview View

## 背景・問題

既存のPreviewは2D Canvasと3D Clothを選択できるが、処理済みCanvasを奥行きのある空間へ展開する表示面はない。映像素材として平面描画だけではインパクトが不足する場合に、既存のGradient／Effect Stack結果を損なわず、円錐内面が画面全体を覆う立体表現を作れるようにする。

## 変更理由

処理済みCanvasを開口部から頂点へ収束する円錐内面へ貼り、画面中央の頂点から利用者側へ広がる奥行きとTexture Flowを加える。ConeはEffect Stackへ新しい処理段を加えず、3D Clothと同じ後段の表示アダプターとして扱う。

2026-08-10の追加要望により、Seam Blendの上限を25%から50%へ拡張し、反復境界の両側を共通の中間値へ収束させることで、極座標由来の直線とFlow由来の円形境界を自然に連続させる方針を承認済みとする。今回の修正では主用途をMirror RepeatとEdge Weldへ絞り、Wrapped Smoothを削除する。あわせて、アニメーション中のMapping設定変更を即時反映し、頂点をキャンバス上のハンドルで操作できるようにする。Depthは30、Flow Cyclesは±30まで設定できるようにし、効果が不明瞭なPerspectiveパラメータは削除する。各継ぎ目方式はアルファレイヤーを重ねるのではなく、最終サンプル色を決めるシェーダー処理とし、アニメーション中も継ぎ目の位置を固定する。

## ゴール・成功条件

- SANDBOXのEdit LayerからCloth／Coneを同じ粒度のモジュールとして編集でき、各モジュールのON/OFFで2D Canvas／3D Cloth／3D Coneを切り替えられる。
- Coneの頂点をCanvas外を含む任意の位置へ移動でき、正規化値-2..2（Canvasの幅・高さに対して最大50%外側）で制限しつつ、縦長・横長・正方形でCanvas外周まで円錐内面が覆う。
- Texture RepeatとFlow Cyclesの円周方向・高さ方向の継ぎ目を、選択したSeam Modeに応じて連続化し、反復境界を硬い線として表示しない。
- Seam ModeをMirror Repeat／Edge Weldから選択できる。Seam Blendは0..0.5で編集でき、最大値ではU／Vの反復境界を選択方式に応じて連続化する。ブレンド中も絵柄の移動方向を維持する。
- ConeのMappingをFlow／Direct Projectionから選択でき、Direct ProjectionではFlowを止めた処理済み2Dフレームを円錐内面へそのまま投影できる。Gradient Rampは右サイドバーだけで操作し、変更結果をConeテクスチャへ反映する。プレビュー面のグラデーションアンカーは表示を維持する。
- 環境光や立体ライティングを加えず、処理済みCanvasの色を円錐内面へ表示する。
- Texture Flowは共通タイムラインと同期し、Previewと動画・連番出力で同じ位相になる。
- Seam Modeを含むCone設定はPresetへ保存し、表示面の選択状態は保存しない。

## 対象

- SANDBOX Edit LayerのCloth／ConeモジュールとCone編集モジュール。
- Three.js ConeGeometry、CanvasTexture、BackSide、unlit materialによる内面描画。
- Depth（2..30）、Rotation、頂点位置（Apex X／Apex Y）、Texture Repeat、Seam Blend、Seam Mode、Flow Cycles（-30..30）の設定と正規化。Perspectiveは持たない。
- Preview、PNG／JPG／WebP、連番PNG ZIP、MOV／MP4へのCone表示面接続。
- Renderer準備中の2D表示維持と失敗時フォールバック。頂点移動はCanvas外を許可し、正規化値-2..2の有限範囲へ制限する。
- Presetの後方互換、日英表示、現行仕様と利用者向けヘルプの同期。

## 対象外

- カメラ前進、Twist、開口率、環境光、スペキュラー、フレネル。
- 画面空間の極座標エフェクトへの置き換え。
- ConeをEffect Stackの並べ替え可能な段へ追加すること。
- Preset ThumbnailをCone表示で生成すること。
- Rust／Tauriコマンド、FFmpeg連携、既存Clothシェーダーの変更。

## 受け入れ条件

- AC-001: SANDBOXのEdit LayerでCloth／Coneを同じ粒度のモジュールとして編集でき、各モジュールのON/OFFで対応する3D表示へ切り替えられる。専用のPreview Surface表示モードは表示しない。Gradient Rampは右サイドバーから編集でき、プレビュー面のグラデーションアンカーとCone頂点ハンドルを表示する。頂点ハンドルはドラッグで移動でき、リセットUIで中央へ戻せる。グラデーションアンカー非表示操作は頂点ハンドルにも適用する。
- AC-002: Coneは処理済みCanvasを円周×奥行きのUVへ貼り、キャンバス上の頂点ハンドルで開口部を中央に保ったまま頂点をCanvas外まで移動できる。頂点の正規化位置は-2..2へ制限する。1:1、16:9、9:16の全てで画面四隅に背景を露出しない。
- AC-003: Coneはunlitかつ不透明で、環境光・ライト・スペキュラー・フレネルによる色変更を加えない。
- AC-004: Depth（2..30）、Rotation、Texture Repeat、Seam Blend（0..0.5）、Seam Mode（Mirror Repeat／Edge Weld）、Flow Cycles（-30..30）、Mapping（Flow／Direct Projection）を編集できる。Perspectiveは表示しない。Texture RepeatとFlow Cyclesの反復境界は選択した方式で不透明な最終色へ連続化し、継ぎ目の両側を共通の中間値へ収束させても絵柄の移動方向を反転させず、Texture Flowは共通normalizedTimeへ同期する。Mappingを変更したときも、最後に完了した処理済みCanvasを同じ時刻で即時再マップする。Direct ProjectionはV offsetを固定する。
- AC-005: Cone設定はPresetへ保存・正規化され、旧Presetは既定値を使う。Cloth／Coneの表示状態は保存せず、読込後は2D Canvasを維持する。
- AC-006: Cone準備中は2D Canvasを維持し、Renderer失敗時は設定を失わず2D Canvasへ戻って警告する。
- AC-007: Cone選択中の静止画・連番・動画は、各時刻の処理済み2DフレームをConeへマッピングした後のCanvasを出力する。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)
- [Effect Stack](../../../specs/current/effect-stack)
- [Preset System](../../../specs/current/preset-system)
- [動画・連番フレーム出力](../../../specs/current/video-export)
- [UI入力コントロール](../../../specs/current/ui-controls)

## 関連ADR

- 新しい長期アーキテクチャ判断はなく、既存の表示アダプターと出力契約を拡張するため追加しない。

## 主なリスク

- Camera Frustumと開口部の計算が不十分だとCanvasの四隅にclear colorが露出する。
- CanvasTextureの色空間設定やmaterial設定で入力Canvasと異なる明暗になる可能性がある。
- Preview RAFがexport session中のCone Canvasを上書きすると、フレーム列が非決定的になる。
- 円錐頂点とUVの縮退点付近で継ぎ目や強い縮小が発生する。

## 承認記録

2026-08-10に利用者が本変更の計画全文を指定し、実装を明示的に依頼した。同日の追加要望（Mappingの即時反映、キャンバス上の頂点ハンドル、Depth／Flow Cycles上限、Perspective／Wrapped Smoothの削除、頂点のCanvas外移動）も本changeの修正仕様として利用者確認済みとする。2026-08-10の追加要望（Apex表記の削除、グラデーションアンカー非表示操作の頂点ハンドルへの適用、Preview Surface表示モードの削除、Cloth Gradient表示名のClothへの変更）も利用者確認済みとする。未決定事項はない。
