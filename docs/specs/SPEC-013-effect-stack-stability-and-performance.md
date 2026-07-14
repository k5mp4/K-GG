---
id: SPEC-013
title: Effect Stackの折りたたみと描画安定化・軽量化
status: implemented
owners: [maintainer]
created: 2026-07-12
updated: 2026-07-13
depends_on: [SPEC-003, SPEC-011, SPEC-012]
related_adrs: [ADR-0005]
related_code: [src/App.tsx, src/components/PostprocessStackPanel.tsx, src/lib/effectPipeline.ts, src/lib/webgl.ts, src/lib/webglShaderSources.ts, src/lib/glass.ts, src/shaders/postprocess.frag.glsl, src/types/distortion.ts]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/webglShaderSources.test.ts, src/lib/glass.test.ts, src/lib/postprocessStack.test.ts]
human_review: completed
---

# SPEC-013: Effect Stackの折りたたみと描画安定化・軽量化

## 背景・問題

Unified Effect Stackパネルはキャンバス左上に常時表示され、作業領域を圧迫する。描画側では、V2の各レイヤーがping-pong FBOを介して順に描画される一方、GLASSの高さ場・法線・光学サンプルが1フレーム内で重複評価される。GLASSの高いComplexity、色収差、粗さを組み合わせた場合に描画負荷が急増し、タイル境界や極端な入力値で表示が不安定になる可能性がある。DISTORTも編集中に変位マップのGPUテクスチャ更新が過剰にならないよう、更新条件を明確化する必要がある。

## ゴール・成功条件

- Effect Stackパネルを利用者が折りたたみ、キャンバス上の小さな開閉ボタンから再表示できる。
- パネルの折りたたみ状態は同一セッション内で保持し、Effect Pipelineのプリセット状態とは分離する。
- V2で無効レイヤーを描画せず、不要なprogram・FBO・uniform更新を要求しない。
- GLASSの法線・屈折サンプルを有限値に保ち、タイル境界、Mix 0、極端な設定、Motion 0で白画面・NaN・ちらつきを発生させない。
- GLASSの視覚的な設定意味と既存の0%/100%端点を維持したまま、重複する高さ場計算と不要な光学サンプルを削減する。
- DISTORTの変位マップは入力データまたは解像度が変化した場合だけ再アップロードする。
- 変更前後で、同じ設定における主要エフェクトの出力契約、プリセット互換、タイルガター計算を維持する。
- 遅延コンパイル中もベース描画を最新の編集状態へ追従させ、アンカー移動やパラメータ変更を画面へ反映する。
- 各Effect Stack要素について、読み込み中・適用済み・利用不可をUI上で明示する。

## スコープ

### 対象

- `PostprocessStackPanel`の開閉UI、アクセシビリティ、セッション内状態
- V2描画パスの有効レイヤー事前正規化と不要パス回避
- GLASSの高さ場・法線・サンプル座標の有限値化、サンプル回数削減、タイル境界安定化
- DISTORT変位テクスチャの更新判定と関連する描画診断
- 遅延programの状態イベントとEffect StackのLoading/Applied表示
- GLASS専用program失敗時の汎用postprocess programフォールバック
- GLASS/DISTORTを含むユニットテスト、描画パス分類テスト、仕様・利用者向け説明

### 対象外

- GLASSの見た目を別アルゴリズムへ置き換えること
- Effect Stackの永続化形式やレイヤー順の変更
- 同種エフェクトの複数インスタンス化
- 新しい描画バックエンド、WebGPU対応
- プリセットへパネル開閉状態を保存すること

## 方針

パネルの開閉状態はUIローカル状態として扱い、既存のEffect Pipeline状態やプリセットには含めない。閉じた状態でも、Stack V2であることと再表示操作を識別できる最小限のトグルを表示する。キーボード操作、`aria-expanded`、`aria-controls`を提供する。

V2描画では、正規化済みの有効レイヤー列を一度だけ生成し、Direct/Core/Fullの割当をその列から決定する。GLASSとPrismが無効な場合は専用programを要求せず、無効レイヤーに対応するuniform・texture upload・FBO passを実行しない。既存の遅延コンパイル中の直前フレーム維持は変更しない。

GLASSでは、入力値をCPU側・uniform設定側・GLSL側の各境界で有限値化する。法線用の高さ場評価は同一フラグメント内で共有できる中間値を使い、Mixが0または光学効果が実質無効な場合はサンプルを省略する。中心差分のステップと屈折ベクトルはタイル解像度に対して有界にし、色収差・粗さのサンプル座標をsource textureの有効領域へ安全にマッピングする。勾配がほぼゼロの領域では、色収差・粗さのサンプル方向を連続的に減衰させ、アンカー操作中にサンプル位置が飛ばないようにする。最適化は既存の端点、ガター、安全な直前フレーム維持を壊さない範囲に限る。

DISTORTは変位配列の参照同一性、Smooth Mask、解像度を更新キーとして扱い、同じ入力に対する再アップロードを避ける。診断ログはprogram名、パス種別、FBOモード、GLエラー分類を識別できる粒度に保つ。

遅延コンパイル中は直前フレームを単に固定せず、現在のグラデーション状態を使ったベース描画を毎回提示する。programの要求・完了・失敗を状態イベントとして通知し、Effect Stack UIは対象program単位で`Loading…`、`Applied`、`Unavailable`を表示する。

GLASS専用programがコンパイルまたはlinkに失敗した場合は、GLASSレイヤーだけを一時的にスキップし、他のreadyなレイヤーを描画する。同時に汎用postprocess programを遅延要求し、成功した場合はGLASSをフォールバック経路で適用する。UIでは専用program利用時と区別して`Applied (Fallback)`を表示する。

## エラー・境界条件

- パネル状態が未初期化または保存値が不正な場合は開いた状態から開始する。
- 折りたたみ中も選択レイヤー、ON/OFF、ドラッグ順、詳細パネルの状態は変更しない。
- GLASSのMix 0、Refraction/Chromatic Aberration/Roughness 0では対応するサンプルを実行しない。
- GLASSのNaN、Infinity、負数、上限超過は既存のrenderer limitsへ安全に正規化する。
- 極小解像度、タイル端、非整数のガターを含む描画でもサンプル座標は有限値で、出力は白画面にならない。
- WebGL context loss、compile/link失敗、FBO不完全時は既存の直前フレーム維持契約を優先する。

## 受け入れ条件

- AC-001: Effect Stackを閉じると行・固定段の一覧が非表示になり、開閉ボタンだけが残る。ボタンで再表示できる。
- AC-002: 開閉操作はキーボードと支援技術から状態を判別でき、開閉状態はプリセット保存データへ混入しない。
- AC-003: V2で無効なレイヤーは描画パス、不要なprogram要求、不要なFBO割当の対象にならない。
- AC-004: GLASSのMix 0、光学パラメータ0、Motion 0、極端な有限値・非有限値で描画出力が有限値を保ち、白画面・NaN・明滅を起こさない。勾配がほぼゼロになるアンカー移動中も、色収差・粗さのサンプル方向が連続する。
- AC-005: GLASSの0%/100% Noise Distortion端点、既存のガター計算、プリセット読込結果を維持する。
- AC-006: 同一入力のDISTORT変位マップは再アップロードされず、入力配列または解像度の変更時だけ更新される。
- AC-007: 既存のEffect Pipeline正規化、スタック順、Legacy/V2互換テストと、GLASS/DISTORTの回帰テストが成功する。
- AC-008: GLASSを含む遅延コンパイル中にグラデーションアンカーを動かすと、最新のベース描画が反映され、コンパイル完了後に対象エフェクトが自動適用される。
- AC-009: Noise、Slit、Stretch、Distort、Mirror、Kaleidoscope、Voronoi、Glass、Prism、Particles、Diffuseについて、適用状態をLoading/Applied/Unavailable/Offのいずれかで識別できる。
- AC-010: GLASS専用programが失敗しても他のreadyなEffect Stackレイヤーは描画され、汎用postprocess programが成功した場合はGLASSがフォールバック適用される。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | UI手動確認、Reactテスト、アクセシビリティ属性確認 | `PostprocessStackPanel.tsx` |
| AC-003 | 有効レイヤー分類、program要求、FBO allocationのユニットテスト | `effectPipeline.test.ts`, WebGLプレビュー |
| AC-004, AC-005 | GLASS境界値・有限値・サンプル条件テスト、WebGLプレビュー、タイル出力 | `glass.test.ts`, `tileRender.test.ts` |
| AC-006 | 変位マップ更新キーのコードレビューとWebGLプレビュー | `webgl.ts` |
| AC-007, AC-008, AC-009, AC-010 | ドキュメント検査、`npm test`, `npm run lint`, `npm run build`、遅延コンパイル中・GLSL失敗注入時の手動確認 | CI相当のローカル検証 |

## 決定事項

- パネルは初回表示時に開き、以後は`sessionStorage`で同一セッション内の開閉状態を保持する。
- GLASSのサンプル削減は、Mix 0・光学パラメータ0での早期終了と、既存の有界な中心差分・サンプル座標クランプを維持する範囲に限定する。代表プリセットで大きな見た目差分を生じさせない。
