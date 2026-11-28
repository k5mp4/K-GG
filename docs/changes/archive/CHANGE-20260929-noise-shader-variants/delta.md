# Delta

Current Specへ統合済みの差分を記録します。

## ADDED Requirements

なし

## MODIFIED Requirements

### PERF-010 操作手順と比較

追加: Noiseを評価するProgram（`generator`、`noiseStack`、`noiseDiffuseStack`）は現在のNoise種別だけを含むvariantとしてコンパイルし、Noise依存Programごとに最近使った3個まで保持する。Noiseを評価しないGeneratorは初期化時のbootstrap Programを使う。V2のanalytic prefixがNoiseを取り込むシーンでGenerator variantが未準備の間はNoiseをStack passで描画し、準備後にanalytic pathへ戻す。Exportはこの代替を使わない。

変更理由: 全Noise種別を含むShaderのコンパイルがANGLE/Direct3Dで1分を超え、直列キューを占有してEffectの有効化が反映されなかったため。

### PERF-011 Shaderの事前準備と優先順位

変更前: warmup順は`generator`、`stackCore`、`noiseStack`、`stretch`、`noiseDiffuseStack`、`blur`、`normalMap`、`glassTile`、`glassV2`。

変更後: 現在のシーンに必要なShaderは、Generator variantが未準備でもNoiseをStack passで表示できる構成で求める。warmup順は`stackCore`、`noiseStack`、`stretch`、`noiseDiffuseStack`、`blur`、`normalMap`、`glassTile`、`glassV2`、`generator`とし、Noise依存Programは現在のNoise種別のvariantだけを準備する。Noise行のprefetchはStack pass用Shaderを準備する。

変更理由: GeneratorのNoise variantは最も長いコンパイルの一つであり、実行中のコンパイルは中断できないため。

### STARTUP-003 表示終了の条件

追加: 「現在のシーンに必要なShader」は、GeneratorのNoise variantを待たずにNoiseをStack passで表示できる構成で求める。

## REMOVED Requirements

なし
