---
title: 機能仕様
---

# 機能仕様

機能仕様は、K-GGへ加える変更の背景、期待動作、設計方針、受け入れ条件を記録する一次情報です。運用方法は[DocDD運用ガイド](../development/docdd.md)を参照してください。

## 仕様一覧

| ID | 仕様 | 状態 |
| --- | --- | --- |
| SPEC-000 | [DocDD基盤の導入](./SPEC-000-docdd-foundation.md) | implemented |
| SPEC-001 | [Postprocess時間アニメーション判定の一元化](./SPEC-001-postprocess-animation-policy.md) | implemented |
| SPEC-002 | [Tauri WebGLフレーム処理互換性の修正](./SPEC-002-tauri-frame-scheduler-compatibility.md) | implemented |
| SPEC-003 | [Organic Glass Postprocessエフェクト](./SPEC-003-organic-glass-postprocess.md) | implemented |
| SPEC-004 | [内蔵SVGアイコンへの移行](./SPEC-004-bundled-svg-icons.md) | implemented |
| SPEC-005 | [動画出力表示名とファイル名の整理](./SPEC-005-video-export-naming.md) | implemented |
| SPEC-006 | [統合検証コマンド](./SPEC-006-verification-commands.md) | implemented |
| SPEC-007 | [K-GG専用フォルダとPATHからのFFmpeg検出](./SPEC-007-ffmpeg-install-guidance.md) | implemented |
| SPEC-008 | [画像カラーパレット生成機能](./SPEC-008-color-palette-generator.md) | implemented |
| SPEC-009 | [画像グラデーション入力](./SPEC-009-image-gradient-source.md) | implemented |
| SPEC-010 | [Bezier Axisの廃止](./SPEC-010-remove-bezier-axis.md) | implemented |
| SPEC-011 | [右サイドバーの情報設計とキャンバス解像度プリセット](./SPEC-011-right-sidebar-organization.md) | implemented |
| SPEC-012 | [Postprocess Effect Stack](./SPEC-012-postprocess-effect-stack.md) | implemented |
| SPEC-013 | [Unified Effect Stack V2](./SPEC-013-unified-effect-stack-v2.md) | implemented |
| SPEC-014 | [Effect Stackの折りたたみと描画安定化・軽量化](./SPEC-014-effect-stack-stability-and-performance.md) | implemented |
| SPEC-015 | [DiffuseのEffect Stackレイヤー化](./SPEC-015-configurable-diffuse-stack-position.md) | implemented |
| SPEC-016 | [Effect Stack操作と描画リカバリー](./SPEC-016-effect-stack-interaction-and-render-recovery.md) | implemented |
| SPEC-017 | [Effect StackとColor Histogramのワークスペース配置](./SPEC-017-effect-stack-workspace-layout.md) | implemented |
| SPEC-018 | [Glass V2光学屈折エフェクト](./SPEC-018-glass-v2-optical-refraction.md) | implemented |
| SPEC-019 | [Gradient Rampのプロポーショナルストップ編集](./SPEC-019-proportional-gradient-stop-editing.md) | implemented |
| SPEC-020 | [Fast Curl Noiseの追加と軽量化](./SPEC-020-fast-curl-noise.md) | implemented |
| SPEC-021 | [Tweeqによるパラメータ入力コントロール](./SPEC-021-tweeq-controls.md) | implemented |
| SPEC-022 | [Slit AngleへのTweeq InputAngle導入](./SPEC-022-tweeq-slit-angle.md) | implemented |
| SPEC-023 | [動画書き出しUXとMP4品質設定の改善](./SPEC-023-video-export-ux-and-mp4-quality.md) | implemented |
| SPEC-024 | [動画書き出しFFmpeg待機の応答性改善](./SPEC-024-video-export-encode-responsiveness.md) | implemented |
| SPEC-025 | [プリセットライブラリとフォルダ階層](./SPEC-025-preset-library-and-folders.md) | implemented |
| SPEC-026 | [プリセットライブラリの操作性と描画サムネイル](./SPEC-026-preset-library-ux-and-rendered-thumbnails.md) | implemented |
| SPEC-027 | [Diffuse輝度カーブ制御](./SPEC-027-diffuse-luminance-curve.md) | implemented |
| SPEC-028 | [意味的角度入力のInputAngle統一](./SPEC-028-semantic-angle-inputs.md) | implemented |
| SPEC-029 | [エフェクトパラメータ制限の一元化](./SPEC-029-unified-parameter-limits.md) | implemented |
| SPEC-030 | [Image Gradient Sourceの保護描画](./SPEC-030-image-gradient-protected-rendering.md) | implemented |

## 新しい仕様の作り方

1. 次の未使用番号を採番する。
2. [_template.md](./_template.md)を`SPEC-NNN-short-name.md`としてコピーする。
3. フロントマターと本文を記入し、一覧へ追加する。
4. `npm run docs:check`を実行する。

ファイル名の短い名前には、小文字の英数字とハイフンを使用します。仕様IDは削除や再利用をせず、廃止時は`deprecated`として履歴を残します。
