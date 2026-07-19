---
id: SPEC-016
title: Effect Stack操作と描画リカバリー
status: implemented
owners: [maintainer]
created: 2026-07-14
updated: 2026-07-19
depends_on: [SPEC-013, SPEC-014, SPEC-015]
related_adrs: [ADR-0005]
related_code: [src/components/PostprocessStackPanel.tsx, src/components/PropertyModulesSettingsPanel.tsx, src/components/GradientCanvas.tsx, src/App.tsx, src/hooks/useWebGL.ts, src/lib/effectStackDrag.ts, src/lib/glass.ts, src/lib/postprocessAnimation.ts, src/lib/webgl.ts, src/shaders/postprocess.frag.glsl]
related_tests: [src/lib/effectStackDrag.test.ts, src/lib/glass.test.ts, src/lib/effectShaderParity.test.ts, src/lib/postprocessAnimation.test.ts]
human_review: completed
---

# SPEC-016: Effect Stack操作と描画リカバリー

## 背景・問題

GLASSのSurface/Opticsパラメータを連続操作すると、GPUへ渡る値・高さ場の勾配・光学サンプルの境界が同じフレームで安定して扱われず、キャンバスとRealtime Statsがちらつくことがある。また、Effect Stackのドラッグ解除時にドラッグ中の変形と並べ替え後のレイアウトが同時に更新され、対象行が不自然に落下して見える。ポインターキャンセル時の確定や、スタックが見えなくなった際の復旧手段も必要である。

## ゴール・成功条件

- GLASSのScale、Stretch、Refraction、Chromatic Aberration、Highlightを連続操作しても、表示が明滅せず、有限値のフレームを継続して表示する。
- Effect Stackのドラッグ中は対象行と周辺行がポインター位置へ追従し、左クリック解除時は対象行が目的スロットへ短く収束してから位置を確定する。
- ポインターキャンセル、コンポーネントのアンマウント、スタックの再描画が起きてもドラッグ状態が残らず、スタック行が消えない。
- Hover設定モーダルからアプリを再読み込みでき、WebGLや画面が壊れた場合に利用者が復旧できる。
- プロパティモジュールの数値入力は、各プロパティの下限値・上限値を越えず、Angle入力も同じ範囲へ正規化される。

## スコープ

### 対象

- GLASS入力値、勾配、法線、光学サンプルの有限値化と連続性
- Effect Stackのポインター操作、確定アニメーション、キャンセル処理
- Hover設定モーダルのアプリ再読み込み操作
- 上記の決定的なユニットテストとシェーダー契約テスト

### 対象外

- GLASSのアルゴリズム全体の置き換え
- Effect Stackの永続化形式、順序、エフェクト種類の変更
- 再読み込み前の未保存編集状態の自動復旧

## 方針

GLASSはCPU側でrenderer limitsへ正規化した値を作り、タイル解像度・サンプル座標・高さ場の出力・勾配をGLSLの各境界で有限値化する。高さ場は画素フットプリントに対して帯域制限し、Scale/Stretchの高周波成分がスライダー操作中に折り返さないようにする。RefractionのUV移動量は入力値の上限を超えない有界ベクトルとし、Chromatic Aberration/Roughnessを含む全ての光学方向は勾配ゼロ近傍でも連続に変化させる。Mix 0または光学項が全て0の場合はV2/Legacyの専用Glassパス自体を省略し、入力テクスチャをそのまま次段へ渡す。

V2では`effectPipeline`をGlassの有効状態、アニメーション判定、タイル余白、描画パス選択の唯一のソースとする。Legacyの`postprocess.effectStack`だけを参照してGlassの時間依存性やサンプル余白を決めてはならない。

Effect Stackはドラッグ中の仮レイアウトと確定済みストアを分離する。解除時は仮レイアウト内で対象行を目的位置へ収束させ、収束時間後に1回だけストアを更新する。キャンセル時は順序を変更せず、全リスナー・タイマー・カーソルを必ず解放する。

リカバリーボタンは現在の編集状態を保存せず、`window.location.reload()`でアプリ全体を再読み込みする。ボタンの文言でデータが再初期化されることを明示する。

## エラー・境界条件

- GLASSの非有限値、負数、上限超過は安全な既定値またはrenderer limitsへ正規化する。
- 極小タイル、極端な解像度、勾配ゼロ近傍でもサンプル座標と光学方向は有限値を保つ。
- Effect Stackのドラッグ解除イベントが届かない場合も、キャンセル・アンマウントで状態を復旧する。
- 再読み込み操作はブラウザ版、Tauri版ともWebViewの通常のページ再読み込みとして扱う。

## 受け入れ条件

- AC-001: GLASSの対象スライダーを連続操作しても、高さ場の画素フットプリントが帯域制限され、高さ場、勾配、法線、光学方向、サンプル座標が有限値を保つ。Refractionの実サンプル移動量は設定上限以内である。
- AC-002: 勾配がゼロを跨ぐ操作で、屈折・色収差・粗さ・ハイライトの方向ベクトルが連続に変化し、不連続な反転や局所的な明滅を起こさない。
- AC-003: GLASSのMix 0または光学項0では専用Glass描画パスと追加光学サンプルを実行せず、入力画像を安定して次段へ渡す。V2/Legacyの両パイプラインで成立する。
- AC-004: Effect Stackの確定時に対象行が上端から落下せず、目的スロットへ収束してから順序が一度だけ確定する。
- AC-005: ポインターキャンセルとアンマウント後にドラッグ状態、イベントリスナー、タイマー、カーソルが残らない。
- AC-006: Hover設定モーダルにアプリ再読み込みボタンがあり、押下で`window.location.reload()`を呼び出す。
- AC-007: プロパティモジュールの数値入力が定義済みの`min` / `max`をTweeqへ渡し、直接入力・ドラッグ・Angle入力のいずれでも範囲外の値を状態へ反映しない。既存状態が範囲外でもUI表示は範囲内へ正規化される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002, AC-003 | GLASS正規化・光学移動量テスト、シェーダー契約テスト、V2/Legacyのパス判定テスト、WebGLプレビュー | `glass.test.ts`, `effectShaderParity.test.ts`, `effectPipeline.test.ts` |
| AC-004, AC-005 | ドラッグ位置計算・確定状態テスト、手動ポインター操作 | `effectStackDrag.test.ts`, `PostprocessStackPanel.tsx` |
| AC-006 | UI手動確認、コンポーネントコードレビュー | `PropertyModulesSettingsPanel.tsx`, `App.tsx` |
| AC-007 | プロパティ入力の範囲境界とAngle入力の上下限を手動確認、コードレビュー | `SliderField.tsx`, `SlitScanPanel.tsx`, 各プロパティパネル |

## 既知の残課題（継続修正）

AC-001〜003に対する今回の実装は、非有限値・高周波の折り返し・過大な屈折移動量・ゼロ勾配近傍の不連続・不要な専用Glassパスを抑制する。しかし、GLASSの表示明滅が完全に解消したことはまだ確認できていない。明滅がGLASSによる変更領域に限定されるため、次回以降はキャンバス全体の再描画ではなく、以下のGLASS固有の経路を個別に計測・検証する。

- `Scale` / `Stretch` / `Complexity` の組み合わせごとに、高さ場・勾配・法線・最終サンプル座標を同一入力の連続フレームで比較し、`fwidth`による帯域制限後にも残る時間的な不安定要因を特定する。
- `glassNoiseHeight`を含む全ての高さ場について、極端な解像度・タイル余白・ブラウザGPU差でエイリアシングが残らないかを確認する。
- `Refraction`、`Chromatic Aberration`、`Highlight`の各サンプルについて、UI値・実UV移動量・ミラーリピート境界への到達をRealtime Statsと突き合わせる。
- WebGLプレビューでV2/Legacyを分けて、スライダー連続操作、Glassの有効状態切り替え、アニメーション中の操作、タイル出力を再現する手動受け入れテストを追加する。
- Deno経由では実行できなかったVitest・VitePress buildと、実ブラウザ上のWebGL検証をNode/npm環境で再実行し、AC-001〜003を「実装済み」から「確認済み」へ更新する。

したがって、この仕様の`implemented`はコード変更が完了した状態を示し、GLASSの視覚的な完全解消を保証するものではない。上記の検証が終わるまで、AC-001〜003は継続確認中として扱う。

## 未決定事項

なし（上記の残課題は次回修正・検証の作業項目として管理する）。
