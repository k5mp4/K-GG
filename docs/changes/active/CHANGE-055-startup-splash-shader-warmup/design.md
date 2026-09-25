# Design

## 構成

```text
表示層  SplashScreen（オーバーレイ、表示時間・終了・スキップ）
          └ SplashVisualAdapter（static / media / lottie / rive）
進捗層  shaderWarmup snapshot（waiting → critical → background → done / unavailable）
準備層  lazyProgramCompileQueue（demand > prefetch > warmup、直列）
```

- `src/lib/webgl.ts`: `createSerialAsyncQueue`に優先度と`promote`を追加。`requestLazyProgram`は既存要求を引き上げる。`settleLazyProgram`は失敗でもrejectせず結果を返す。
- `src/lib/shaderWarmup.ts`: WebGLに依存しないスケジューラとsnapshot。`ShaderWarmupHost`経由でcontextを操作する。
- `src/lib/shaderWarmupHost.ts`: Preview contextと最新シーンを`getRequiredSceneProgramKeys`へ結び付ける。prefetchは対象行を有効にしたシーンで同じ関数を使う。
- `src/features/splash/`: `splashPolicy.ts`（純粋関数）、`splashVisual.ts`（アダプター契約・レジストリ・フォールバック）、`staticSplashVisual.ts`（`index.html`のポスターを引き継ぐ）、`mediaSplashVisual.ts`（同梱の画像・動画）、`SplashScreen.tsx`。
- `src/branding/brand.ts`: 製品名、演出の種類、表示時間。

## 画像・動画の演出

`{ kind: 'media', sources, poster?, fit?, finishOnExit? }`で指定します。

- `planSplashMedia`（純粋関数）が候補の順序を決めます。`type`が`video/`または`image/`で始まればその要素を使い、`type`がなければ拡張子で判定します（`mp4`、`m4v`、`mov`、`webm`、`ogv`は動画、それ以外は画像）。`type`を宣言した動画は`canPlayType`が空なら読み込みません。`poster`は常に最後の候補です。
- reduced motionでは`poster`だけを使います。`poster`がなければ動画を最初のフレームで停止して表示し、停止できないアニメーション画像は候補から外します。
- 画像は`HTMLImageElement.decode()`、動画は`loadeddata`（最初のフレームがデコード済み）で成功とし、その時点で初めて`host`へ追加します。失敗した動画は`src`を外してデコーダーを解放します。
- 動画は`muted`・`playsinline`・`loop`で自動再生します。自動再生が拒否されても最初のフレームは表示されます。`finishOnExit`では退場時にループを止め、`ended`まで待ちます（`exitTimeoutMs`で打ち切り）。
- 全候補が失敗するとrejectし、`mountSplashVisual`が静的ポスターへ戻します。読み込み全体に`visualLoadTimeoutMs`（1.5秒）の上限があります。

素材を差し替える手順:

1. ファイルを`src/assets/splash/`などに置き、`brand.ts`で`import`する（Viteがハッシュ付きURLで同梱する）。`public/`に置いて`/splash/...`で参照してもよい。
2. `splash.visual.sources`へ効率のよい順に並べる。例: AV1のMP4 → H.264のMP4 → アニメーションAVIF → GIF。動画にはコーデック付きの`type`を書くと、再生できない環境で読み込みを省ける。
3. reduced motion用と最後の手段として`poster`へ静止画を指定する。

CSPは`img-src 'self' data: blob:`と`media-src 'self' blob:`で同梱ファイルを許可済みのため、変更は不要です。

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
