---
type: delta
id: CHANGE-027
title: SANDBOX Seamless Tiling
status: approved
---

# Delta

## ADDED Requirements

### SANDBOX-002 — Seamless image processing

SANDBOXは、処理済み2Dキャンバスの左右・上下の対向辺をクロスフェードするSeamlessモジュールを提供する。モジュールが無効な場合は入力を変更しない。`Blend Width` は正規化された単一の幅として扱い、幅が大きいほど広い帯域をなじませる。

処理は、左右方向の対向辺クロスフェード後に上下方向の対向辺クロスフェードを行う。四隅は両方向の処理を受けるため、水平・垂直の両方の反復境界を扱える。

### EFFECT-024 — Seamless stage

固定されたエフェクト順序 `Base → Surface → Main Stack → Prism → Particles` を変更しない。Seamlessは、Particlesを含む2D色処理結果に対する表示前の最終境界処理として扱う。Particles有効時は中間テクスチャへ合成してからSeamlessを適用し、フルフレームとタイル出力の対象を一致させる。

Cloth/Cone表示アダプターは、Seamlessを反映済みの2Dキャンバスを入力として利用する。Seamless無効時の各アダプターの入力は変わらない。

### UI-020 — Seamless controls

SANDBOXのモジュール一覧にSeamlessを追加する。モジュール内に有効・無効の切り替えとBlend Widthの数値コントロールを表示し、範囲、単位、処理の説明を日本語・英語で提供する。

### PRESET-015 — Seamless persistence

プリセットはSeamlessの有効状態とBlend Widthを保存・復元する。設定が存在しない旧プリセットは `enabled: false` と既定のBlend Widthへ正規化する。SANDBOXの選択中モジュールは保存しない。

### EXPORT-009 — Seamless export parity

プレビュー、サムネイル、静止画、動画フレームは同じSeamless設定を参照する。タイル出力はタイル結合後の全体キャンバスに基準CPU実装を適用し、タイル単位の処理による継ぎ目を作らない。

## MODIFIED Requirements

### EFFECT-003 — 固定段と描画順

既存の`Base → Surface → Main Stack → Prism → Particles`の順序を維持し、Seamlessを有効にしたときだけ最終境界処理を後置する。

### UI-012 — SANDBOXモジュール入口

既存SANDBOXモジュールの入口・選択状態・表示アダプター契約を維持したまま、Seamlessを同じ一覧へ追加する。

## REMOVED Requirements

なし。
