# Design

## 採用する実装方針

既存のWebGL2パイプライン（`src/lib/webgl.ts`の生WebGL + lazy program）へ、Datamoshと同じ方式で主スタックのレイヤーを追加する。専用programを`LazyProgramKey`に加え、Render Planの`programs.texture`が有効なレイヤーから必要なprogramを決める。当初はSANDBOXの固定段（Main Stackの後）として実装し、並べ替えの要望でレイヤーへ変更した。長期の判断はADR-20260929-sandbox-texture-material-stageを参照する。

## データモデル

`src/types/texture.ts`の`TextureConfig`を一次情報とし、数値の範囲と既定値は`packages/kgg-control`のパラメータ制約（`texture.*`）に置く。列挙（`source`／`preset`／`imageFit`）も同じ場所の`ENUM_PARAMETER_LIMITS`にある。`normalizeTextureConfig`は数値を範囲へ収め、角度を折り返し、未知の列挙値を既定値へ戻す。プリセットを選んだときの見た目は`TEXTURE_PRESET_LOOKS`と`getTexturePresetPatch`に閉じ込め、`enabled`／`source`／`imageFit`／グレイン配置は変えない。

## 描画

- `drawTexturePass`: 入力texture（unit 3）と画像texture（unit 4、`REPEAT`）を読み、`postprocessFbo`のping-pongのうち入力と異なる側へ描く。戻り値のtextureを後段の入力にする。画像は`ctx.textureImageSource`の参照が変わったときだけ再アップロードする。
- V2の主ループ内で、Textureレイヤーの位置で実行する。Legacy V1では実行しない。レイヤーが有効なら`direct`にならず（Diffuse以外の有効レイヤーと同じ）、`stackCore`をfinal presentのために要求する。Image Gradient保護中も、`mainLayerEntries`へTextureを含めて適用する。
- shader `texture.frag.glsl`: `heightAt(p)`（手続き型または画像）を3点評価して傾きを求め、法線`n`、接線`t`（`grainDirection`）、従接線`b`から`hT`／`hB`のWard lobeを計算する。ハイライトは金属度で着色し、凹凸の陰影は`dot(n, l) - l.z`で元画像へ乗算する。回折は`spectrum(across * spread * 1.6 + (h - 0.5) * 0.25)`を加算する。
- 座標は`(gl_FragCoord + u_tileOffset) / u_fullResolution.y`、光源はキャンバス中心から半径0.4、高さ`lightHeight`。傾きは0.0008単位で測るため、出力解像度に依存しない。画像は約1.5 texel離れた点で傾きを測る。
- 光の角度は`resolveTextureLightAngle`（純粋関数）で`lightAngle + lightSweep * 360 * normalizedTime`とし、正規化時刻はscene evaluationの値を`render()`へ渡す。

## 状態管理

`texture`は`DocumentState`に追加し、`setTexture`は`normalizeTextureConfig`を通す。Datamoshと同じく、`setTexture({ enabled })`はEffect Stackレイヤーの有効状態を更新し、`setEffectPipeline`はレイヤーの有効状態を`texture.enabled`へ反映する。レイヤーがなく`texture.enabled`だけが有効な旧文書（SANDBOX時代の保存）では、レイヤーを有効にする。読み込んだ画像は`useWorkspaceController`のReact stateで保持し、`GradientCanvas`の`latestRef`（`LatestState.textureImageSource`）と書き出し用スナップショットへ渡す。Presetと履歴に画像は保存しない。

## 検証済みの挙動

- タイル分割（300px）と単一タイルの差は、`brushedMetal`／`cdGroove`／`paper`で最大1（8bit）。
- Image Gradient Sourceを読み込んだ保護経路でも、Textureが最終画像へ反映される（固定段時代に確認）。
- Noiseの前後にTextureを置くと見た目が大きく変わる（後ろなら質感がノイズ像へ乗り、前ならノイズが質感を歪める）。

## 代替案とトレードオフ

ADR-20260929-sandbox-texture-material-stageを参照。

## 移行方法

旧Presetは`texture`を持たないため、読み込み時に`normalizeTextureConfig(undefined)`（無効の既定値）を適用する。

## ロールバック方法

このPRをrevertする。revert後は`texture`で保存されたPresetの設定が無視され、Textureは適用されない。
