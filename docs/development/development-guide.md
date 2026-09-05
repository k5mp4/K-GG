---
title: 開発・検証ガイド
---

# 開発・検証ガイド

Requestの分類とライフサイクルは[開発ワークフロー](./workflow.md)、Capsuleの作成・finalizeは[Change Capsule運用](./change-workflow.md)、検証の階層は[ValidationとCI](./validation.md)を参照してください。小変更に形式的なIssueやChange directoryを要求せず、必要な変更だけを追跡します。

## 必要環境

- Node.js 22.12.0以上
- npm 10.9.0以上
- デスクトップ版を扱う場合はRust stable toolchain
- MOV/MP4出力を確認する場合はFFmpeg

実機検証は、[`render-baselines.md`](./render-baselines.md)の固定GPU Release Gateと
[`native-validation.md`](./native-validation.md)のFFmpeg/Tauri境界を参照します。固定GPU runnerや
Tauri WebDriverが接続されていない環境では、未実施のRelease GateをMerge Gateのpassとして記録しません。

## セットアップ

```sh
npm ci
npm run dev:local
```

通常のVite起動は`npm run dev`、Tauriデスクトップ版は`npm run tauri:dev`を使用します。

### FFmpeg未導入状態のデバッグ

開発環境にFFmpegがインストール済みでも、次の環境変数を設定して起動すると、実際のFFmpeg探索を
使わずに未導入状態を再現できます。Viteの開発ビルドでのみ有効です。

```powershell
$env:VITE_KGG_DEBUG_FFMPEG_MISSING="1"
npm run tauri:dev
```

これによりExportパネルの`FFmpeg not found`表示、MOV／MP4の無効化、FFmpeg導入案内モーダル、
`Check again`操作を確認できます。設定を解除する場合は、環境変数を削除してから再起動します。

```powershell
Remove-Item Env:VITE_KGG_DEBUG_FFMPEG_MISSING -ErrorAction SilentlyContinue
```

## ディレクトリ

```text
.
├─ docs/                 利用者・開発者ドキュメント、仕様、ADR
├─ public/               公開する静的ファイル
├─ src/
│  ├─ adapters/          ブラウザ/Tauriの差異を吸収する境界
│  ├─ components/        React UI
│  ├─ features/          独立性の高い機能領域
│  ├─ hooks/             React hooks
│  ├─ lib/               描画、評価、出力などのロジック
│  ├─ rendering/         描画バックエンドの抽象
│  ├─ shaders/           GLSL
│  ├─ store/             Zustand store
│  └─ types/             共有型
├─ src-tauri/            Tauri/Rustアプリケーション
└─ tools/                リリース・検証用スクリプト
```

## AIと人間がレビューしやすい実装方針

K-GGは生成AIによる開発参加を歓迎するため、変更の一次情報と責務の置き場所を明確にします。

- `AGENTS.md`、関連する開発ガイド、Current Spec、accepted ADR、Requestの順に必要な範囲だけ読む。ArchiveとLegacy SPECは履歴調査時だけ読む。
- Issueの有無だけでworkflowを決めず、Quick / Tracked / Designedを変更規模と追跡必要性から判断する。
- 実装中に目的、対象外、受け入れ条件、互換性が変わる場合はRequestを再レビューし、必要ならTracked/Designedへ昇格する。
- 観測可能な挙動を変えないリファクタリングでは、既存の契約、ファイル名、保存先、エラー文言を維持する。
- 型や型ガードを複数箇所へ複製しない。プリセット永続化の型は`src/lib/presetModel.ts`を参照する。
- Canvasから画像Blobを作る共通処理は`src/lib/exportCanvas.ts`へ集約し、ブラウザ/Tauriごとの保存処理はアダプターに残す。
- RendererからTauriコマンドへ渡る値は信頼しない。ファイルパス、外部プロセス、OS機能を扱う場合はRust側で検証する。
- 大きなUIファイルを触る場合は、まず純粋関数、hook、小さな表示コンポーネントへ分けられる範囲を探す。

## 変更時の確認範囲

| 変更 | 最低限の確認 |
| --- | --- |
| 文書・workflow・template・tooling | `npm run docs:check`, `npm run docs:build`, `npm run change:check` |
| TypeScript/React | `npm run check:merge` |
| 描画・GLSL | 上記に加えて`npm run check:render`、対象機能のプレビューと代表的なエクスポート |
| プリセット形式 | 旧データ読込、新規保存、再読込、ブラウザ/Tauri差分 |
| Rust/Tauri | `npm run check:native`、対象デスクトップ操作。実FFmpegは`npm run check:ffmpeg`、Tauri UIは`native-validation.md`のWebDriver Release Gate |
| リリース/更新 | `npm run check:release`に加えてリリース設定・更新ワークフローと配布環境でのWindows版起動・更新確認 |

## GitとPull Request

Branch、PR、追加指示、finalizeの扱いは[開発ワークフロー](./workflow.md)と[Change Capsule運用](./change-workflow.md)を一次情報とします。1つのPRはレビュー可能な範囲へ保ち、Change Capsuleがある場合も必要な成果物だけを含めます。

- Pull Requestを作成する前に`git status`とステージ済み差分を確認し、依頼範囲に含まれる変更だけをコミットする。
- 既定ブランチから作業を始める場合は、目的が分かる短い作業ブランチを作成する。
- ユーザーがコミットまたは公開を明示的に依頼した場合、Codexは対象差分を確認してコミット・pushし、特に指定がなければドラフトPull Requestまで作成する。レビュー可能状態のPull Requestは、ユーザーが明示した場合だけ作成する。
- Pull Requestのタイトルと本文は日本語で書く。本文には`変更理由`、`変更内容`、`影響`、`検証`、`未確認事項`の見出しを使用し、英語のみの`Summary`、`Impact`、`Validation`の見出しは使用しない。
- 検証欄には実行したコマンドと結果を記載する。警告が残る場合は、エラーではないことと残っている警告の性質を明記する。CI結果の全文をChangeへ複製しない。
- Gitの所有者チェックなど安全設定で操作が止まった場合は、永続的なグローバル設定を変更する前に理由と影響を確認する。

## テスト方針

### WebGL Performance Debug / Profiler

#### 起動

1. `npm run dev`でDevelopmentサーバーを起動し、ブラウザでK-GGを開く。
2. WebGL Canvas右上の`Profiler`をクリックする。Productionビルドではボタン自体が表示されない。
3. 計測対象のPreset、Canvas Resolution、Seed、Time、Effect Stack順序を先に固定する。

Profilerは既存Canvasとrender loopを観測するため、計測用Canvasや二重のrender loopは作りません。初期化直後はGPU query結果がまだ非同期で返っていないため、GPU値が`—`になることがあります。Performanceタブのstats-gl小型モニターはProfiler UI内へドック表示され、独立した全画面overlayは作りません。Profilerを開いたときもCanvas描画は継続し、パネル外のCanvasやエディタ操作を遮らない構成です。GPU/Resourcesタブに表示される拡張機能の説明文は診断情報であり、Canvas描画停止を示すものではありません。表示後にCanvasが消えたりアプリを操作できなくなったりする場合は正常動作ではなく、Profilerパネルの重なり順・当たり判定または別の実行時エラーを確認してください。

#### タブの使い分け

| タブ | 使い方 | 見る値 |
| --- | --- | --- |
| Performance | 全体の状態をリアルタイムで見る。stats-glの小型モニターはこのタブ内にドック表示される。 | FPS、CPU/GPU frame time、Draw Calls、Render Passes、Timer Query対応状態 |
| GPU Profiler | Effect別の負荷を比較する。 | Current、直近60サンプルのAvg GPU、Peak、全EffectのGPU時間に対するRatio、Draw / Pass |
| Resources | Effect切替や解像度変更の前後で値を比較する。 | Texture、Buffer、Renderbuffer、Framebuffer、Shader、Program、Vertex Array、概算メモリ |
| WebGL Validation | Performanceとは独立して`webgl-lint`をON/OFFする。 | API error、unset uniform、undefined/NaN、Framebuffer等の検証エラー |
| Capture Frame | 必要な1フレームだけ`Capture WebGL Frame`をクリックする。 | Spector.jsのcommand、Shader、Uniform、Texture、Framebuffer、State、Render順序 |
| Benchmark | 条件を固定した300フレームの測定を実行する。 | 平均FPS、平均CPU/GPU、Peak、1% Low相当、Draw / Pass、Effect別GPU、Resource値 |

`Unavailable`はブラウザまたはGPU拡張が対応していない状態です。値を推測して補完せず、そのまま記録してください。GPU Profilerの結果は非同期で到着するため、GPU値の更新がCPU値より遅れるのは正常です。

`EXT_disjoint_timer_query_webgl2`対応環境では、Effect別GPU queryと`stats-gl`のGPU queryを同時に実行しません。同じWebGL query targetの入れ子を避けるため、Performanceタブ内のstats-glモニターはFPS/CPU、K-GGの`GPU Profiler`はGPU frame/effect値を担当します。

`WebGL Validation`を利用できるDevelopment環境では、`webgl-lint`のProgram情報を壊さないため、Shaderのリンクは検証と互換性のある同期経路になります。Validation中に特定のlazy ShaderがドライバまたはShader内容の都合で失敗しても、そのEffectだけをスキップして残りのEffect StackとCanvas描画を継続します。`Lazy shader compile failed`が出た場合は、失敗したEffect名とShaderログを記録し、ValidationをOFFに戻して通常描画を確認してください。

Glass/glassv2は専用のコンパクトなShaderを使います。汎用Noiseの全アルゴリズムはNoise Distortionの独立passへ残し、Glass側へはコンパイル負荷の小さい高さ場だけを渡します。Glassを単独または全Effect Stack有効状態でONにしたとき、行が`APPLIED`になりCanvasが描画され続けることが基準です。`[WebGL] Link failed`、`[WebGL context] lost`、描画ターゲット終了、Glassの`UNAVAILABLE`が発生する場合は正常動作ではなく、専用Shaderの境界またはGPUドライバ依存のコンパイル負荷を調査します。

#### 値の判定基準

以下はDevelopment環境での調査開始基準です。合否を機械的に決める製品保証値ではありません。GPU、ブラウザ、ディスプレイのリフレッシュレート、解像度、Preset、Effect Stackで値が変わるため、Before/Afterは同一条件で比較してください。60Hzを目標にする場合の1フレーム予算は`1000 / 60 = 16.67 ms`です。120Hzなら`8.33 ms`へ読み替えます。

| 対象 | 目安 | 要調査とする条件 | 読み方・注意点 |
| --- | --- | --- | --- |
| Performance / FPS | 60Hzでは55 FPS以上を安定目標、30 FPS未満は要調査 | FPSが目標リフレッシュレートを継続的に下回る | `FPS = 1000 / CPU frame ms`。stats-glのCPUはOS全体のCPU使用率(%)ではなく、1フレームのCPU処理時間(ms) |
| Performance / CPU frame | 12 ms以下を余裕あり、12–16.67 msを監視、16.67 ms超を予算超過 | CPU frameが16.67 msを継続して超える、または変更前より10%以上増える | React更新、画像処理、Shader待ち、ログ出力などMain Thread側の負荷。GPU負荷とは別に見る |
| Performance / GPU frame | 12 ms以下を余裕あり、12–16.67 msを監視、16.67 ms超を予算超過 | GPU frameが16.67 msを継続して超える、または変更前より10%以上増える | Timer Query対応時の非同期値。未対応時の`Unavailable`は異常ではない。CPUとGPUの値を単純加算しない |
| Performance / Draw Calls・Render Passes | 同一条件で変更前後の差分を比較し、増加5%以内を通常変動の目安 | 10%以上の増加、またはEffectをOFFにしてもPassが減らない | 絶対値の適正値はCanvasサイズ・Effect構成で変わる。Pass増加はGPU時間増加の候補 |
| GPU Profiler / Effect Avg GPU | Ratio 25%未満は低寄与、25–50%は監視、50%以上は最優先候補 | Avg GPUまたはRatioが最大で、全体のボトルネックと相関する | Ratioは計測できたEffectのAvg GPU合計に対する割合で、フレーム全体の割合ではない |
| GPU Profiler / Peak・Current | PeakがAvgの1.5倍未満なら安定、1.5–2倍は断続的、2倍超はスパイク候補 | Peakが繰り返し発生、CurrentがAvgを継続して上回る | 初回Shader compile、GPU disjoint、ウィンドウ移動など一時要因を分離して再測定する |
| Resources | Shader完了後、同一状態で60フレーム程度はCount/Memoryが安定 | EffectのON/OFFやPreset切替を繰り返すたびに単調増加、または変更前へ戻らない | `webgl-memory`は概算値。初回lazy Shader/FBO生成による一度だけの増加はリークと判定しない |
| WebGL Validation | Preview操作中はOFF、調査時にON。ON時のエラー0件が基準 | `attempt to set non-existent uniform`、`get*`のundefined例外、Framebuffer incomplete、context lost、Shader compile/link error | Validationの警告・エラーは描画品質と分けて記録し、Validation ONのFPS/GPU値をBenchmark比較へ使わない |
| Benchmark / 300フレーム | 同一条件で最低3回、中央値または代表値を採用。平均FPSは高いほど良い | Avg CPU/GPUが10%以上増加、Avg FPSが10%以上低下、Draw/Passが10%以上増加 | Validation OFFで実行する。`1% low frame`は遅い1%の平均フレーム時間(ms)で、低いほど良い |

最終的な判定は単一の閾値ではなく、`FPS/CPU/GPU`のフレーム予算、GPU Profilerの上位Effect、Resourcesの増加傾向、Validationエラーの有無を同時に確認します。例えばFPSが低くてもCPU frameが低い場合はGPU ProfilerとResolutionを先に確認し、CPU frameだけが高い場合はMain Threadの更新やログを確認します。

#### 記録時の最低条件

1. GPU、OS、ブラウザ/WebView、Windowサイズ、Canvas Resolution、Preset、Seed、Time、Effect Stack順序を記録する。
2. Shaderのlazy compileとResource生成が完了し、GPU値が`—`から更新された後に測定する。
3. Performance/GPU Profilerの通常観測と、Capture Frame・Validation ONの診断観測を分ける。CaptureとValidationは計測値へオーバーヘッドを加えるため、Benchmark中に有効化しない。
4. 変更前後で同じ条件を3回以上測定し、平均だけでなくPeak、1% low、Draw Calls、Render Passes、Resource Countも比較表へ残す。

#### Benchmarkの実行手順

1. 変更前のコードで対象Presetを開き、Preset、Resolution、Seed、Time、Effect Stack順序を記録する。
2. WebGL ValidationをOFFにする。Benchmark開始時にも自動OFFされるが、開始前の状態を明示しておく。
3. `Benchmark`タブの`Start 300-frame Benchmark`をクリックする。実行中はPreviewの状態を変更しない。
4. `complete`になるまで待ち、平均FPS、CPU/GPU、Peak、1% Low、Draw Calls、Render Passesを確認する。
5. `Download JSON`で`kgg-webgl-benchmark.json`を保存する。比較時は`before-<name>.json`、`after-<name>.json`のようにリネームし、同じGPU・ブラウザ・解像度条件を残す。
6. 変更後も同じ手順を繰り返し、Before/Afterの差分を記録する。初回Shader compileやバックグラウンド負荷の影響を避けるため、各条件を複数回実行して中央値または代表値を採用する。

Benchmark中はValidationを無効化し、計測ノイズを抑えます。`Cancel`した場合は開始前のValidation状態へ戻ります。Benchmarkは現在のPreview状態を使うため、PresetやEffectを切り替えながら比較しないでください。

重点比較対象はGLASS/glassv2、Diffuse、Prism、Distortion系です。各EffectについてMoving Average、Peak、Ratio、Draw Calls、Render Passesを記録し、全体値だけでは分からない複数PassやBlur由来の負荷を切り分けます。

#### ボトルネック調査の流れ

1. `Performance`で全体のFPS、CPU/GPU frame time、Draw Calls、Render Passesを記録する。
2. `GPU Profiler`をAvg GPUまたはRatioの降順で見て、上位のEffectを候補にする。
3. `Resources`でPreset切替、Effect ON/OFF、Effect順序変更、Canvas Resolution変更を数回行い、Resource数が戻るか確認する。値が増え続ける場合はResource leak候補として記録する。
4. 候補Effectの状態を固定し、`Capture Frame`で複数Pass、Blur、Texture copy、Framebuffer切替、Shader/Uniformを確認する。
5. `WebGL Validation`は必要なときだけONにし、検出されたエラーを修正候補とする。ValidationをONにした状態のFPS/GPU値はBenchmark比較へ使わない。

Capture Frameは必要な時だけSpector.jsを起動します。通常はProfilerの`Capture Frame`タブで`Capture WebGL Frame`をクリックしてください。K-GGが既存の`kgg-preview-canvas`を直接Spector.jsへ渡すため、Spectorの`Choose Canvas...`で手動選択する必要はありません。手動で選ぶ場合は、Spectorの`Choose Canvas...`を開き、一覧の`Id: kgg-preview-canvas`（現在のPreviewサイズも併記されます）を選択してから、Spector側のキャプチャ操作を行います。`Id: -`の小さいCanvasはProfilerやUI用なので選択しません。静止Previewでは通常のアニメーションRAFが存在しないため、K-GGはCapture開始時に1回だけPreviewを再描画してGLコマンドを発生させます。ステータスが`Spector capture started.`となり、Spector.jsのUIが表示されれば成功です。Spector.jsはUMD/CommonJS配布物なので、Viteのdynamic importで生じる`default`/`SPECTOR`のexport差はProfiler側で吸収します。キャプチャを止めるときはCapture Frameタブの`Cancel Spector Capture`を押してください。Capture Frameタブから別タブへ移動した場合やProfilerを閉じた場合も、Canvas上部に残る`Cancel Spector Capture`からキャンセルできます。Spector.js 0.9.xの`stopCapture()`はコマンドを取得できない場合に次のフレームを再試行するため、K-GG側でタイムアウト、context spy、再試行状態を解放します。キャンセル中はWebGL ValidationとK-GGのGPU timer queryを一時停止し、キャンセル後に開始前のValidation状態へ戻します。Spectorの操作UIが残るランタイムでも、K-GGのProfilerドックを優先して表示するため、Effect Stackの操作を続けられます。

#### Spector.js Captureの既知の問題（次回対応）

静止Previewの`no frames with gl commands detected`を避けるためのCapture開始時再描画を行っても、Spector.jsのCapture結果表示時に次のエラーが残る経路があります。

```text
TypeError: Cannot read properties of undefined (reading 'get')
  at recordSamplerValues (webgl-lint.js:2278)
  at markUniformSetAndRecordSamplerValue (webgl-lint.js:2270)
  at ctx2.<computed> [as __SPECTOR_Origin_uniform1i] (webgl-lint.js:2946)
  at WebGL2RenderingContext.uniform1i (spectorjs.js:9180)
  at render (src/lib/webgl.ts)
```

現時点の調査では、Spector.jsがWebGL APIを記録する`__SPECTOR_Origin_*` wrapperと、`webgl-lint`がsampler uniformを記録する内部Mapの連携で、programまたはuniform locationのメタデータを取得できない経路が疑われます。K-GG側には存在しないsampler uniform locationを`uniform1i`へ渡さないガードを追加済みですが、これはこのwrapper間の相互作用を根本修正したものではありません。このエラーが出た場合は、Canvas描画が続くか、SpectorのCapture結果が表示されるかを分けて記録し、Consoleのスタック全体、ValidationのON/OFF、Effect StackとAnimationの状態、`kgg-preview-canvas`を選択したかを保存してください。

次回は新しいページを開いてから、(1) webgl-lint OFF + Spector.jsのみ、(2) Spector.js OFF + webgl-lintのみ、(3) named canvasの直接Capture、(4) Spectorの`Choose Canvas...`から`kgg-preview-canvas`を選ぶCapture、の順に比較します。そのうえで`uniform1i`に渡るlocationのnull/undefined、programの識別情報、Spector/webgl-lint各wrapperの適用順を確認し、Capture結果表示までを回帰確認します。現時点ではこのエラーが残っているため、Captureの受入結果は「`no frames...`が出ない」ことと「Capture結果が表示される」ことを分けて扱います。

`Spector.js is unavailable.`が表示される場合は、(1) `npm run dev`または`npm run tauri:dev`のDevelopment起動であること、(2) `package.json`のdevDependencyが解決済みであること、(3) 開発サーバーを再起動して依存のpre-bundleを更新したことを確認し、ブラウザConsoleの`[WebGL profiler] Spector.js capture failed`を確認してください。Capture中は検査自体のオーバーヘッドがあるため、Capture結果を通常時のBenchmark値と混ぜないでください。Resourcesは`webgl-memory`が利用できるブラウザだけで概算値を表示します。

EffectStackのNoiseが`Preparing`から進まない場合は、まず通常描画が継続していることを確認してください。Noise専用lazy shaderの反射またはリンクに失敗した場合、K-GGは一般postprocess shaderへフォールバックし、行を`Fallback`として描画可能な状態にします。`Unavailable`のままCanvas全体が停止する状態は期待動作ではなく、Consoleの`[WebGL shader] compile failed`と`[WebGL] Lazy shader compile failed (noiseStack)`を添えて報告してください。

Before/Afterは次の表へ同一条件のJSON値を転記します。

| Metric | Before | After | Change |
| --- | ---: | ---: | ---: |
| FPS |  |  |  |
| CPU ms |  |  |  |
| GPU ms |  |  |  |
| Draw Calls |  |  |  |
| Render Passes |  |  |  |
| Texture |  |  |  |
| Framebuffer |  |  |  |

Timer QueryやResource拡張がUnavailableの環境では、未対応として結果へ記録し、値を推測して補完しないでください。

- 時刻評価、補間、状態遷移、ファイル変換など決定的な処理はユニットテストにする。
- 不具合修正では、可能な限り修正前に失敗する回帰テストを追加する。
- WebGLやプラットフォーム統合で自動化できない項目は、仕様の受け入れ条件に手動確認手順と期待結果を残す。
- テストは実装の内部構造ではなく、仕様の受け入れ条件を検証する。

## ドキュメント

```sh
npm run docs:dev
npm run docs:check
npm run docs:build
```

`docs:check`は仕様とADRのメタデータ、ID、依存参照を検証します。`docs:build`はVitePressの生成と内部リンクを検証します。
