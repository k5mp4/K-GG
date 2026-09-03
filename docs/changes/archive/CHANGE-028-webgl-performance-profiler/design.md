# Design

## 採用する実装方針

`src/lib/webgl.ts`の既存WebGL2 contextとrender境界に、Development時だけ生成する`WebGLPerformanceProfiler`を任意参照で接続する。Profilerが存在しない場合は各計測呼び出しをno-opにし、Productionでは外部debug依存をdynamic importしない。既存の描画関数、Effectの順序、Uniform、入力stateは変更しない。

GPU時間は`EXT_disjoint_timer_query_webgl2`のqueryを最大64件の循環プールで管理する。`beginQuery`/`endQuery`は描画コマンドの前後に置き、後続フレームで`QUERY_RESULT_AVAILABLE`をポーリングする。結果を読める時だけ集計し、`GPU_DISJOINT`なら全pending queryを破棄する。queryの入れ子は作らず、Effect単位のpass境界を1 queryとする。

フレームのCPU時間、Draw Call、Render Passは既存描画呼び出しの前後で集計する。主スタックは`effectMode`引数をそのまま名前として使用し、固定のEffect一覧に依存しない。固定段は`Base`、`Normal`、`Stretch`、`Prism`、`Particles`、`Seamless`など描画実体のラベルで記録する。

`stats-gl`は既存Canvasへattachし、FPS/CPU/GPUの小型overlayを表示する。K-GGのDebug UIは集計済みデータ、Resource、Validation、Capture、Benchmarkの操作を提供する。Spector.jsはCapture操作までinstantiateせず、Capture時に既存Canvasだけを渡す。`webgl-memory`と`webgl-lint`はcontext生成前のDevelopment dynamic importで副作用を有効化する。`EXT_disjoint_timer_query_webgl2`が利用できる場合は、EffectごとのK-GG queryをGPU計測の単一オーナーとし、`stats-gl`のGPU queryを無効化する。これにより同じ`TIME_ELAPSED_EXT`ターゲットのquery入れ子を防ぎ、FPS/CPUはstats-gl、GPUはK-GGのProfilerから取得する。

## データモデル

```ts
type EffectPerformanceSample = {
  currentMs: number | null;
  averageMs: number | null;
  peakMs: number;
  ratio: number | null;
  drawCalls: number;
  renderPasses: number;
};

type PerformanceSnapshot = {
  fps: number | null;
  cpuFrameMs: number | null;
  gpuFrameMs: number | null;
  drawCalls: number;
  renderPasses: number;
  effects: Record<string, EffectPerformanceSample>;
  resources: Record<string, number | null>;
  timerQuerySupported: boolean;
  validationEnabled: boolean;
  benchmark: BenchmarkResult | null;
};
```

Moving AverageはEffectごとに直近60件の有効GPU query結果から計算し、PeakはProfilerの有効期間中の最大値とする。Snapshotはsubscriberへ通知し、React UIはProfilerのsnapshotだけを購読する。

## 状態管理

Profiler設定は永続化せず、`enabled`、active tab、Validation、Benchmark状態をメモリ内に保持する。Benchmarkは現在のWebGL render callbackを使い、Preview stateを複製・変更せず、各反復を現行のnormalizedTimeで描画する。Benchmark後はStats/Validationの状態を開始前へ復元する。

## UI構成

Canvas右上に開閉ボタンを置き、開いた時だけ小型panelを表示する。Performance/GPU ProfilerはMetricsとEffect table、Resourcesはwebgl-memory snapshot、Validationはtoggleとエラー表示、Capture FrameはSpector起動、Benchmarkは300-frame実行とJSON downloadを持つ。狭いviewportではpanelをCanvas内幅へ収め、tableは横スクロール可能にする。

## 描画・外部プロセス・Tauri側の変更

Tauri/Rustは変更しない。Export rendererの`finishGpu`は既存の`gl.finish()`を維持する。Profiler側は`gl.finish()`を呼ばない。`webgl-memory`と`webgl-lint`はcontext生成より前に読み込み、`stats-gl`はcontext生成後に既存Canvasへattachする。

## 変更対象の主要ファイル

コード:

- `src/lib/webglPerformance.ts`
- `src/lib/webgl.ts`
- `src/hooks/useWebGL.ts`
- `src/components/WebGLPerformancePanel.tsx`
- `src/components/GradientCanvas.tsx`
- `src/types/webglPerformance.ts`
- `src/types/webglDebugTools.d.ts`
- `package.json`, `package-lock.json`

テスト:

- `src/lib/webglPerformance.test.ts`
- `src/lib/webglPerformanceBenchmark.test.ts`

文書:

- `docs/specs/current/webgl-performance.md`
- `docs/specs/current/index.md`
- `docs/development/development-guide.md`
- `docs/adr/0015-development-webgl-observability.md`

## 代替案とトレードオフ

| 案 | 判断 |
| --- | --- |
| Canvasを複製してProfiler専用loopを作る | 描画結果・負荷・Export経路が変わるため不採用 |
| 全WebGL APIを常時Proxyで包む | Production overheadと既存contextへの副作用が大きいため不採用 |
| query結果を同期的に読む | GPU stallを作るため不採用 |
| Effect名を固定配列にする | Stack拡張時に計測漏れが出るため不採用 |
| 外部ツールだけで全指標を賄う | Effect境界、Benchmark、Export非干渉の保証をK-GG側で持てないため併用 |

## 移行方法

既存Presetや保存形式は変更しない。新規依存は開発時dynamic importでのみ利用し、既存のProduction bundleでは実行しない。Profilerが利用できないブラウザでも、描画と既存Fallbackはそのまま継続する。

## ロールバック方法

Profiler参照、Debug UI、開発依存、change文書を同時に削除すれば既存描画へ戻る。保存形式・Tauri command・shaderは変更しないため、既存Presetの移行は不要である。
