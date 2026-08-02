---
title: GLASS／GLASS V2書き出し決定性修正計画
---

# GLASS／GLASS V2書き出し決定性修正計画

作成日: 2026-07-31  
変更区分: B（不具合修正）  
変更パッケージ候補: `CHANGE-011-deterministic-glass-export`

## 目的

Effect StackのGLASS／GLASS V2を含むアニメーション書き出しで、一部フレームだけ描画結果が大きく変化する問題を、GLASSレンダリング、WebGL状態、shader program準備、Canvas競合の順に切り分け、根本原因を修正する。

添付された`frame_0000.png`〜`frame_0071.png`の72フレームZIPを基準データとして使用する。

## 実装開始条件

DocDDのB変更として、次の文書を変更パッケージに作成する。

- `proposal.md`
- `delta.md`
- `design.md`
- `tasks.md`
- `validation.md`

`proposal.md`が`status: approved`かつ`human_review: completed`となり、`delta.md`がレビュー済みになるまで、観測可能な本実装は開始しない。

現状、`docs/changes/active/`には既存の該当changeがない。動画出力のcurrent specも未整備のため、Effect Stackのcurrent specと動画出力のcurrent specを変更パッケージと同期する。

## 現状確認

現在の実装では、次の点を調査対象とする。

- `src/adapters/browser/videoExportService.ts`と`src/adapters/tauri/videoExportService.ts`がフレーム時刻計算・描画・captureを重複実装している。
- 通常のCanvas captureは`renderBridge.renderAtTime()`後に`requestAnimationFrame`を2回待っている。
- PNG ZIP経路では5フレームごとに`setTimeout(0)`でevent loopへ制御を返している。
- `src/lib/webgl.ts`ではrenderごとにV2 render planとlazy program状態が評価され、program準備中はレイヤーをスキップし、失敗後はfallbackへ切り替える経路がある。
- `renderBridge`はAnimationLoopを停止できるが、static scheduler、seek、lazy program完了イベント、直接のpreview描画をexport session単位で排他していない。
- `GradientCanvas`のReact更新と`LatestFrameScheduler`が、export中にも通常描画要求を生成し得る。

これらは原因候補であり、GLASS固有のFBO汚染を含めて実測後に根本原因を確定する。

## Phase 1: 再現と基準データ解析

### 1.1 前提確認

- 添付ZIPの72フレーム、画像サイズ、連番を確認する。
- 再現に必要なPresetまたはEffect Stack設定がリポジトリ、添付ファイル、作業環境に存在するか確認する。
- Presetがない場合は、同一設定を再現できるJSONまたは設定値を追加で確認する。
- Browser版とTauri版、使用GPU、ブラウザ／WebView、Canvasサイズ、FPS、durationを記録する。

### 1.2 書き出し比較

同一Preset、同一時間設定、72フレームで、次のケースを各2回実行する。

| ケース | 内容 |
| --- | --- |
| Glassなし | GLASSとGLASS V2を無効化 |
| Glassのみ | GLASSのみ有効 |
| Glass V2のみ | GLASS V2のみ有効 |
| Glass → Glass V2 | 両方有効、GLASSを先に適用 |
| Glass V2 → Glass | 両方有効、GLASS V2を先に適用 |
| Glass＋他Effect | GLASSと他の主スタックを併用 |
| Glass V2＋他Effect | GLASS V2と他の主スタックを併用 |
| Preview再生中 | Preview再生中に書き出し開始 |
| Preview停止中 | Preview停止中に書き出し開始 |

各出力について、PNG圧縮データではなくデコード後のRGBAを使い、次を記録する。

- フレームごとのRGBAピクセルハッシュ
- 前フレームとの差分
- 次フレームとの差分
- 前後フレーム平均との差分
- 中央値・MADによる孤立外れ値
- 同一条件2回のハッシュ一致
- 異常候補`6, 16, 20, 36, 46, 66`の結果

## Phase 2: 原因切り分け

### 2.1 GLASS／GLASS V2のFBO決定性

次をGLASS単体、GLASS V2単体、両方の順序ごとに調査する。

- 各フレーム開始時のFBO、texture、viewport、active texture unitを記録する。
- sourceとdestinationのtexture／framebufferが同一でないことを検証する。
- ping-pongの切り替えがレイヤー順と一致することを検証する。
- destination FBOのclear、texture filter、wrap、premultiplied alphaを確認する。
- framebuffer completenessと`gl.getError()`を確認する。
- 同じ入力・同じnormalizedTimeを、異なる描画履歴の後に描画してRGBA結果を比較する。

### 2.2 shader program readiness

- Effect Stackから必要なprogramを列挙する。
- stack core、noise、stretch、blur、prism、GLASS、GLASS V2などのpending／ready／failed／fallback遷移を記録する。
- 72フレーム中にprogram、fallback、render planが変化していないか確認する。
- 必要programがreadyになる前にexportが開始されていないか確認する。

### 2.3 時刻とuniform

- `frameIndex`から`normalizedTime`、`renderTime`への変換を追跡する。
- Glass Evolution、Motion、Seed、shader側speed、shared postprocess timeを確認する。
- `performance.now()`、乱数再生成、NaN、Infinity、time remapの二重適用を検査する。
- 同じtimeを100回描画し、time=0.1→0.8→0.3→0.8の順序でも0.8の結果が一致するか確認する。

### 2.4 render／capture競合

- AnimationLoop、LatestFrameScheduler、Reactの静止描画、seek、lazy program readyイベントを追跡する。
- export render後からcaptureまでに別のrender sequenceが実行されていないか確認する。
- `requestAnimationFrame`、`setTimeout(0)`、進捗更新相当イベントを挟んだ結果を比較する。

## Phase 3: 実装方針

### 3.1 export session

`renderBridge`を拡張し、export開始から終了まで次を管理する。

- export session ID、token、render generation
- 開始前のPreview再生状態
- 固定されたrender planと描画状態
- 通常描画の拒否または最新1件への保留
- cancellation、二重開始、二重終了時の安全な解除

export終了後は、保留された通常描画を順番に再生せず、最新状態を1回だけ描画する。

### 3.2 render planとprogramの固定

- Effect Stackの順序・enabled状態、Glass設定、animation、keyframe、Canvas／FBOサイズ、tile paddingをsnapshotする。
- 必要programをexport前にreadyにする。
- compile failure時は一部フレームを出力せず、開始前に明確なエラーで中止する。
- fallbackを使う場合はexport開始前に決定し、session中は変更しない。

### 3.3 フレーム単位のWebGL状態初期化

GLASS／GLASS V2の各pass開始時に、少なくとも次を明示設定する。

- program、framebuffer、viewport
- active textureとtexture binding
- samplerとtexture unit
- blend、scissor、clear状態
- Glass固有uniform
- source／destination ping-pong

必要なdestination FBOを適切にclearし、未初期化領域や前フレームの内容をサンプリングしないようにする。

### 3.4 atomic render-and-capture

次の責務を持つ共通関数を追加する。

```ts
renderAndCaptureExportFrame({
  frameIndex,
  normalizedTime,
  exportSession,
  canvas,
  signal,
})
```

この関数でsession有効性、固定plan、program readiness、FBO初期化、指定時刻の単一render、GPU完了、capture sequence一致、AbortSignalを保証する。

`RAF×2`や固定sleepだけを同期根拠にせず、必要に応じてGPU fence／`gl.finish()`を診断結果と性能測定に基づいて選択する。

### 3.5 Browser／Tauri共通化

共通経路へ次を移す。

- frameIndexからnormalizedTimeへの変換
- time remap
- export session
- render plan snapshot
- program readiness
- GLASS状態初期化
- render-and-capture
- AbortSignalと進捗

adapter側にはZIP追加、Tauri一時ファイル、FFmpeg encode、保存処理だけを残す。

## Phase 4: 自動テスト

Vitestで次を追加・拡張する。

- GLASS／GLASS V2のrender planとEffect Stack順序
- program readiness、compile failure、fallback固定
- FBO ping-pongのsource／destination非衝突
- 同時刻反復、異なる時刻を挟んだ再描画、event loop yield後の一致
- renderBridgeのexport排他、static render拒否、cancellation、再生状態復元
- pending RAFとlazy program readyイベントがcaptureへ混入しない競合回帰
- tile padding、full-frame／tiled path、tile cancellation

GPU上の完全なピクセルテストが困難な場合は、FBO、texture、program、uniform、描画順序の状態テストと、再現可能なRGBA解析スクリプトを組み合わせる。

## Phase 5: 検証

修正後に次を確認する。

- GLASS単体、GLASS V2単体、連続適用が安定する。
- 異常候補フレームに孤立した差分がない。
- 同一条件2回のRGBA結果が一致する。
- Preview再生中／停止中で結果が一致する。
- event loop yieldの有無で結果が変化しない。
- 高解像度tile出力のpaddingとfull-frame結果が壊れない。
- cancellationでsession、Canvas、Preview状態が復元される。
- PNG ZIP、MOV、MP4が共通フレーム生成経路を使用する。

実行コマンド:

```bash
npm test
npm run lint
npm run build
npm run docs:check
npm run docs:build
```

Tauri／Rust側を変更した場合:

```bash
cargo test --manifest-path src-tauri/Cargo.toml
cargo check --manifest-path src-tauri/Cargo.toml
```

未実行のコマンドは成功扱いにせず、`validation.md`へ理由とともに記録する。

## 対象外

根本原因と確認されない限り、次は変更しない。

- GLASSの意図した外観やパラメータ範囲
- グラデーション・ノイズ・easing・keyframe補間
- FPS／duration UI
- FFmpeg codec設定
- Preset形式
- 無関係なUIレイアウト

また、異常フレームの補間・削除、GLASS無効化、固定sleep追加、`setTimeout(0)`削除だけの対応は行わない。

## 完了時の報告項目

1. 根本原因
2. GLASS／GLASS V2との因果関係
3. 問題が発生した描画順序
4. 問題だったFBO・texture・program・uniform状態
5. 再現方法
6. 修正方針
7. 変更ファイル

