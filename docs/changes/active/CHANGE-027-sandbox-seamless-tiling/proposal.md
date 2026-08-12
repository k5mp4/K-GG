---
type: change
id: CHANGE-027
title: SANDBOX Seamless Tiling
status: approved
change_kind: F
owners: [maintainer]
created: 2026-08-11
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK, CURRENT-UI-CONTROLS, CURRENT-PRESET, CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/App.tsx, src/components/GradientCanvas.tsx, src/components/PresetPanel.tsx, src/components/SandboxPanel.tsx, src/components/SeamlessPanel.tsx, src/i18n/messages.ts, src/i18n/uiLabels.ts, src/lib/effectPipeline.ts, src/lib/exportCanvas.ts, src/lib/history.ts, src/lib/presetModel.ts, src/lib/presetThumbnail.ts, src/lib/renderSceneAtTime.ts, src/lib/seamless.ts, src/lib/tileRender.ts, src/lib/videoExportFrames.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/shaders/seamless.frag.glsl, src/store/gradientStore.ts, src/types/latestState.ts, src/types/seamless.ts]
related_tests: [src/lib/seamless.test.ts, src/lib/tileRender.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/presetThumbnail.test.ts]
human_review: completed
---

# SANDBOX Seamless Tiling

## Why

SANDBOXで作成した画像をグリッド状に反復配置すると、キャンバスの左右・上下の境界が不連続に見えることがある。画像処理によって対向する辺をなじませ、反復時のハードな継ぎ目を目立たなくする操作を、既存のSANDBOXモジュールとして提供する。

今回の実装は、外部の画像処理ライブラリをランタイム依存にせず、対向する辺のクロスフェードをGPUとCPUで実装する。アルゴリズムのライセンス根拠と採用範囲は `design.md` に記録する。

## What

- SANDBOXに `Seamless` モジュールを追加する。
- モジュールの有効・無効と、対向する辺を混ぜる `Blend Width` を編集できるようにする。
- 有効時は、通常の色処理結果に対して、左右方向、続いて上下方向の対向辺クロスフェードを適用する。
- プレビュー、静止画、サムネイル、動画フレーム、タイル出力で同じ設定を使用する。
- タイル出力では、個別タイルに処理をかけず、タイルを結合したキャンバスへCPU実装を適用して、タイル境界に依存しない結果にする。
- プリセットに設定を保存し、旧プリセットに設定がない場合は無効・既定幅へ正規化する。
- SANDBOX内の現在選択中モジュールは、既存仕様どおりプリセットへ保存しない。

## Scope

### In scope

- 2Dキャンバスの四辺を反復したときの連続性を改善する画像処理。
- GPUプレビューと、GPUを使わないタイル結合後のCPU処理との結果整合。
- 既存の表示アダプター（Cloth/Cone）が参照する処理済み2Dキャンバスへの反映。
- 日本語・英語の表示名、説明、アクセシブルなラベル。

### Out of scope

- 画像の内容を推定して欠損部分を生成するテクスチャ合成、画像修復、AI生成、Poisson合成。
- GIMP/OpenCVなどの外部画像処理ランタイム依存の追加。
- 水平・垂直で別々の幅を指定するUI、複数の合成方式を選択するUI。
- 既存のNoiseの周期ループ設定や、既存エフェクトの順序変更。
- SANDBOXの選択中モジュールのプリセット保存。

## Acceptance criteria

- **AC-001 — SANDBOX操作**: SANDBOXにSeamlessモジュールが表示され、有効・無効とBlend Widthを編集できる。幅は範囲外入力を正規化し、既定値で再現可能な結果になる。
- **AC-002 — 四辺の連続性**: 有効時、処理済み画像の左右端および上下端を反復したときのハードな色差がなくなる。CPU処理の境界画素について、対応する左右端・上下端の値が許容誤差内で一致する自動テストを持つ。
- **AC-003 — 既存動作の保全**: Seamlessが無効な場合、既存エフェクトの順序、表示、保存形式、出力結果を変更しない。既存のSANDBOXモジュールとCloth/Cone表示アダプターを継続利用できる。
- **AC-004 — 保存と互換性**: Seamless設定がプリセットの保存・読み込み、サムネイル、プレビュー、静止画、動画フレームへ引き継がれる。旧プリセットは読み込み時に無効設定へ正規化される。
- **AC-005 — フルフレームとタイル出力**: 同じ入力・設定に対して、通常出力とタイル結合出力のSeamless処理が同じCPU基準実装に一致する。個別タイルの境界が最終結果へ混入しない。
- **AC-006 — ライセンス境界**: 新しいランタイム依存を追加せず、実装コードは既存リポジトリのライセンス方針に従う。参照したCC0資料、採用しなかったGPL資料、外部ライブラリを追加しない理由を `design.md` に記録する。

## Review gate

このchangeは、`status: approved` と `human_review: completed` が確認されるまで実装へ進めない。承認後にWhy/What、対象範囲、受け入れ条件を変更する場合は、実装を止めてレビューへ戻す。
