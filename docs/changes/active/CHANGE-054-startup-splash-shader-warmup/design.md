# Design

## 構成

```text
表示層  SplashScreen（オーバーレイ、表示時間・終了・スキップ）
          └ SplashVisualAdapter（static / lottie / rive）
進捗層  shaderWarmup snapshot（waiting → critical → background → done / unavailable）
準備層  lazyProgramCompileQueue（demand > prefetch > warmup、直列）
```

- `src/lib/webgl.ts`: `createSerialAsyncQueue`に優先度と`promote`を追加。`requestLazyProgram`は既存要求を引き上げる。`settleLazyProgram`は失敗でもrejectせず結果を返す。
- `src/lib/shaderWarmup.ts`: WebGLに依存しないスケジューラとsnapshot。`ShaderWarmupHost`経由でcontextを操作する。
- `src/lib/shaderWarmupHost.ts`: Preview contextと最新シーンを`getRequiredSceneProgramKeys`へ結び付ける。prefetchは対象行を有効にしたシーンで同じ関数を使う。
- `src/features/splash/`: `splashPolicy.ts`（純粋関数）、`splashVisual.ts`（アダプター契約・レジストリ・フォールバック）、`staticSplashVisual.ts`（`index.html`のポスターを引き継ぐ）、`SplashScreen.tsx`。
- `src/branding/brand.ts`: 製品名、演出の種類、表示時間。

## Lottie／Riveを追加する手順

1. 依存を追加する（例: `lottie-web`の`lottie_light`、`@rive-app/canvas`）。Previewとcontextを奪い合わないよう、Canvas2DまたはSVG描画を選ぶ。
2. `src/features/splash/lottieSplashVisual.ts`などに`SplashVisualAdapter`を実装する。
   - `setProgress`: Riveは数値入力（0〜100）、Lottieはループ区間の再生を維持する。
   - `playExit`: Riveはtrigger入力、Lottieは`exitSegment`を再生し、完了で解決する。
   - `dispose`: ランタイム、canvas、イベントを解放する。
3. `SPLASH_VISUAL_REGISTRY`へ動的importのローダーを追加する。
4. アセットはローカルに同梱する（CSPは`'self'`）。RiveやdotLottieのWASMは自己ホストし、Tauriの`csp`／`devCsp`の`script-src`へ`'wasm-unsafe-eval'`を追加する必要があるか確認する。
5. `brand.ts`の`splash.visual`を切り替える。

## ロールバック

`BRAND.splash.enabled = false`でスプラッシュを無効にでき、静的ポスターも起動時に取り除かれます。warmupは`useWebGL`の1つのeffectで開始しているため、そこを外せば従来の要求時コンパイルだけに戻ります。優先度付きキューは全要求がdemandのとき従来のFIFOと同じ順序です。
