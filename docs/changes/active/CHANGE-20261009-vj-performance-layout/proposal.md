---
type: change
id: CHANGE-20261009-vj-performance-layout
title: VJレイアウトと拍同期プリセット演奏
status: review
change_kind: F
owners: [maintainer]
created: 2026-10-09
updated: 2026-10-09
current_specs: [CURRENT-VJ-PERFORMANCE, CURRENT-WORKSPACE-LAYOUT, CURRENT-PRESET, CURRENT-WEBGL-PERFORMANCE]
related_adrs: [ADR-20261009-vj-performance-session, ADR-0009]
related_code: [src/features/vj/useVjSession.ts, src/features/vj/VjDeck.tsx, src/lib/applyPreset.ts, src/adapters/tauri/vjWindow.ts]
related_tests: [src/features/vj/vjPlayback.test.ts, src/features/vj/vjParameters.test.ts, src/features/vj/vjDocument.test.ts, src/lib/applyPreset.test.ts, src/adapters/tauri/vjWindow.test.ts, tests/e2e/vj-performance.spec.ts]
human_review: required
---

# VJレイアウトと拍同期プリセット演奏

Request source: Direct request。利用者の手描きレイアウトと要件に基づく設計案に対して「その要件で実装してみて」と依頼された。分類はDesigned Change / F。実装と検証後にcommit、push、PR作成を明示的に依頼された。ドラフトPRとして公開し、merge前の人間レビューとfinalizeを残す。Issue作成は依頼されていない。

追加のDirect request: 切替の読み込み待ちを減らすための事前ロードと、K-GG内の保存済みプリセットフォルダ内でのループ。OSディレクトリではなくアプリ内の保存済みフォルダであることを利用者へ確認済み。

追加のDirect request: 4拍の自動読み込みでは、次のPresetをBoundedRandomの状態で事前準備する。Effect parametersは有効なエフェクトだけを表示し、数値を調整でき、1920pxで8列を同時に表示する。

## 背景・問題

通常エディターは詳細編集向けで、限られた高さでプリセットを連続切替する演奏操作と、エフェクト値のランダム化をまとめて操作できない。

## 変更理由

FHD画面の1/4程度の高さを操作卓として使い、既存プリセットの演奏と、その場での値の変化を両立する。既存利用者の通常表示と保存データを維持する。

## ゴール・成功条件

- 設定から通常／VJを切り替え、270pxの操作領域でMain、Next、演奏リスト、Effectを扱える。
- 既存Presetの手動選択とBPMの4拍切替を行い、次候補と実際の切替対象を一致させる。
- 完全／範囲内ランダム、項目ロック、値・アニメーションの復帰を行える。
- レイアウト切替とPreset演奏でcanvasと出力解像度を維持する。
- 全件のCPU・GPU準備を切替前に済ませ、準備済み切替に非同期待ちや変位マップのcloneを含めない。
- 保存済みルート／フォルダと任意の子フォルダから演奏対象を作り、その範囲内で順送り・シャッフル巡回する。
- 4拍の自動読み込みでは次候補に範囲内ランダムを事前適用し、手動読み込みの元の値を維持する。
- エフェクト欄は有効なものだけを表示し、1920pxで8列の数値入力とスライダーを操作できる。

## 対象

VJ UI、アプリ設定、独立拍時計、キュー、scalarパラメータカタログ、共通Preset適用処理、既存Shader warmup、Tauriメインウインドウのサイズ変更権限と復帰アダプター。Unit、実ブラウザー、Merge Gate、native gateを確認する。

## 対象外

MIDI／OSC／音声同期、プリセット間クロスフェード、演奏リストの共有ファイル、Shaderの描画アルゴリズム変更、動画やSpoutの方式変更、外部素材の生成、全画面フラッシュ制限、OSフォルダの直接読み込み。

## 影響を受ける現行仕様

- [VJ Performance](../../../specs/current/vj-performance.md)
- [Workspace Layout](../../../specs/current/workspace-layout.md)のLAYOUT-001に通常／VJの区別を追加。
- [Preset System](../../../specs/current/preset-system.md)のPRESET-008に、映像へ適用する際の正規化成功後の一括反映を明記。

## 関連ADR

- [VJ演奏の時計と設定をPresetから分離する](../../../adr/20261009-vj-performance-session.md)（proposed）

## 主なリスク

Preset適用の抽出が通常読み込みへ影響するリスクは互換テストで確認する。GPU準備・小さいWebView・OS倍率の影響はブラウザー検証と実機Release Gateを分離する。パラメータ制限と外部素材モードの検査を維持する。

## 未決定事項

実装範囲に未決定の要件はない。要件への実装依頼を受けた後の差分レビューは未完了としてhuman_review: requiredを保つ。Merge前に人間のレビュー記録、ADRの扱い、Release Gateの継続先を確認し、implementedへの更新とchange:finalizeを行う。
