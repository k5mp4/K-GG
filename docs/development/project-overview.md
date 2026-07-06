---
title: プロジェクト概要
---

# プロジェクト概要

最終確認日: 2026-07-04

## 目的

K-GGは、KAGARIBI関連のビジュアル制作を主用途とするグラデーション生成ツールです。制作者がグラデーション、歪み、スリット、アニメーションなどを対話的に調整し、静止画または動画素材として書き出せることを目的としています。

## 提供形態

- Webアプリケーション: ブラウザ内で編集し、PNG、JPG、WebP、スリット画像、PNG連番ZIPを出力する。
- Tauriデスクトップアプリケーション: Web版の機能に加え、外部FFmpegを利用してMOVとMP4を出力し、アプリ更新機能を提供する。

## 主要な機能領域

| 領域 | 概要 | 主な実装場所 |
| --- | --- | --- |
| グラデーション | ランプ、補間、アンカー、複数のグラデーション形状 | `src/types/gradient.ts`, `src/components/GradientRamp.tsx` |
| エフェクト | Diffuse、Noise、Slit、Stretch、Normal、Postprocessなど | `src/components/*Panel.tsx`, `src/types/distortion.ts` |
| 描画 | 状態を評価し、WebGL2とGLSLでフレームを生成 | `src/lib/sceneEvaluation.ts`, `src/lib/webgl.ts`, `src/shaders/` |
| アニメーション | Auto/Keys、タイムライン、イージング、フレーム評価 | `src/lib/animation.ts`, `src/lib/sceneEvaluation.ts`, `src/components/TimelineBar.tsx` |
| プリセット | 編集状態の保存、読込、JSON入出力 | `src/lib/presets.ts`, `src/adapters/*/presetRepository.ts` |
| エクスポート | 静止画、スリット画像、連番ZIP、MOV、MP4 | `src/components/ExportPanel.tsx`, `src/lib/export*.ts` |
| デスクトップ連携 | プリセット永続化、FFmpeg呼出し、更新 | `src-tauri/src/lib.rs`, `src/features/updater/` |

## 技術スタック

- React 19、TypeScript、Vite
- Zustandによる編集状態管理
- WebGL2、GLSLによる画像生成
- Vitestによるテスト
- Tauri 2、Rustによるデスクトップ機能
- VitePressによるドキュメントサイト

正確なバージョンは`package.json`と`src-tauri/Cargo.toml`を参照してください。

## 重要な制約

- WebGL2が描画の前提である。
- ブラウザ版とTauri版では、保存先と動画出力能力が異なる。
- Tauri版のMOV/MP4出力には、利用者環境の`ffmpeg`コマンドが必要である。
- 描画結果、プレビュー、エクスポートで同じ時刻評価を共有し、見た目の差異を防ぐ必要がある。
- プリセット形式には後方互換処理があるため、フィールドの削除や改名は移行方針なしに行わない。

## 対象外

この文書は画面上の全パラメータ仕様を定義しません。利用者向け操作は[使い方ガイド](/)、変更対象の厳密な期待動作は[機能仕様](../specs/index.md)に記録します。
