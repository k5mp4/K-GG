---
title: 進行中の変更
---

# 進行中の変更

新しい変更は、会話ターンや日付ごとではなく、[変更パッケージ運用](../../development/change-workflow)で定義する1つのまとまった依頼ごとに管理します。既存パッケージへ収まる追加指示ではディレクトリを増やさず、同じパッケージへ追記します。収まらない独立要求だけ、[変更仕様テンプレート](../_template/proposal)から `CHANGE-###-short-name` のディレクトリを作り、まず `proposal.md` と `delta.md` をレビューへ出します。

## 変更パッケージ

| ID | 変更 | 状態 |
| --- | --- | --- |
| CHANGE-011 | [GLASS／GLASS V2書き出し決定性修正](./CHANGE-011-deterministic-glass-export/proposal) | approved |
| CHANGE-013 | [Effect Stack GlassをGLASS V2へ統合](./CHANGE-013-glass-v2-only/proposal) | approved |
| CHANGE-014 | [Effect Stackのランダム順序とソロレイヤー](./CHANGE-014-effect-stack-controls/proposal) | approved |
| CHANGE-015 | [Effect Stack別ウィンドウの廃止](./CHANGE-015-effect-stack-window-repair/proposal) | approved |
| CHANGE-018 | [SANDBOX描画モジュールの新設](./CHANGE-018-sandbox-graphics/proposal) | approved |
| CHANGE-019 | [Diffuse描画モードとEffect Stack UIの拡張](./CHANGE-019-diffuse-halftone-ascii-adaptive-ui/proposal) | approved |
| CHANGE-020 | [歪みマップテクスチャの Float32 化による量子化段差の修正](./CHANGE-020-distort-float32-precision/proposal) | approved |
| CHANGE-021 | [SANDBOX Cloth Gradient Base Generator](./CHANGE-021-cloth-gradient/proposal) | approved |
| CHANGE-022 | [Cloth Gradientのランプ適用順序の反転（白黒シェーディング→グラデーション）](./CHANGE-022-cloth-ramp-last-shading/proposal) | approved |
| CHANGE-023 | [ASCIIのフォント選択と文字サイズ](./CHANGE-023-ascii-font-controls/proposal) | draft |
| CHANGE-024 | [SANDBOXの2D Canvas／3D Cloth表示モード](./CHANGE-024-cloth-preview-view-mode/proposal) | approved |
| CHANGE-025 | [SANDBOX 3D Cone Preview View](./CHANGE-025-cone-preview-view/proposal) | approved |
