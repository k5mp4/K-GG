---
type: change
id: CHANGE-024
title: SANDBOXの2D Canvas／3D Cloth表示モード
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-09
updated: 2026-08-11
current_specs: [CURRENT-GRADIENT, CURRENT-EFFECT-STACK, CURRENT-PRESET, CURRENT-VIDEO-EXPORT]
related_adrs: []
human_review: completed
---

# CHANGE-024 SANDBOXの2D Canvas／3D Cloth表示モード

## 変更理由

リモート最新のSANDBOX Cloth Gradientは、Three.jsのオフスクリーン結果を既存の2D Canvas描画経路へ入力する設計になっている。処理済みCanvasの見た目を、独立した3Dクロスメッシュ上でも確認できる表示モードを追加する。

## 対象

- SANDBOXの`Cloth Gradient`プロパティモジュール内で2D Canvasと3D Clothを切り替えるUI
- Preview右側にあった表示モード切り替えの重複UIを撤去し、表示面の選択とClothパラメータを同じ編集領域へ集約する
- 既存の2D Effect Stack結果を、Cloth Baseの二重適用なしでThree.jsのクロスメッシュへCanvasTextureとしてマッピングする表示アダプター
- Previewで見えている表示面を、PNG／JPG／WebP、連番PNG ZIP、MOV／MP4の書き出し対象へ接続する出力アダプター
- Cloth準備中・Renderer失敗時の2D Canvas維持／フォールバック
- 表示モードの一時状態（Presetには保存しない）

## 対象外

- 既存SANDBOX Cloth GradientのShader、Ramp適用順序、Effect Stack順序の変更
- Clothの物理シミュレーション、カメラ操作

## 受け入れ条件

- AC-001: 既定値は2D Canvasで、SANDBOXの`Cloth Gradient`プロパティモジュールから3D Clothへ切り替えられる。
- AC-002: 3D Clothには既存の処理済みCanvas結果（Noise／Distort／SANDBOX Cloth Gradientを含む）が継続反映される。
- AC-003: Cloth準備中はCanvasを隠さず、Renderer初期化・描画失敗時はCanvas表示へ戻る。
- AC-004: 表示モードはPresetへ保存しない。2Dモードの書き出しは従来どおり2D Canvasを使用し、3Dモードの書き出しはPreviewに表示中の3D Cloth Canvasを使用する。
- AC-005: 3Dモードの動画・連番PNG書き出しは、各フレームの処理済み2D CanvasをCanvasTextureとして3D Clothへマッピングしてからキャプチャし、元の2D描画だけを出力しない。
