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
| SPEC-011 | [Postprocess Effect Stack](./SPEC-011-postprocess-effect-stack.md) | implemented |
| SPEC-012 | [Unified Effect Stack V2](./SPEC-012-unified-effect-stack-v2.md) | approved |
| SPEC-013 | [Effect Stackの折りたたみと描画安定化・軽量化](./SPEC-013-effect-stack-stability-and-performance.md) | implemented |
| SPEC-014 | [DiffuseのEffect Stackレイヤー化](./SPEC-014-configurable-diffuse-stack-position.md) | implemented |
| SPEC-015 | [Effect Stack操作と描画リカバリー](./SPEC-015-effect-stack-interaction-and-render-recovery.md) | implemented |
| SPEC-016 | [Tweeqによるパラメータ入力コントロール](./SPEC-016-tweeq-controls.md) | implemented |
| SPEC-017 | [Slit AngleへのTweeq InputAngle導入](./SPEC-017-tweeq-slit-angle.md) | implemented |
| SPEC-018 | [Glass V2光学屈折エフェクト](./SPEC-018-glass-v2-optical-refraction.md) | implemented |

## 新しい仕様の作り方

1. 次の未使用番号を採番する。
2. [_template.md](./_template.md)を`SPEC-NNN-short-name.md`としてコピーする。
3. フロントマターと本文を記入し、一覧へ追加する。
4. `npm run docs:check`を実行する。

ファイル名の短い名前には、小文字の英数字とハイフンを使用します。仕様IDは削除や再利用をせず、廃止時は`deprecated`として履歴を残します。
