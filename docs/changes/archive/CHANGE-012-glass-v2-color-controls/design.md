# Design

## 設定モデル

既存の`PostprocessConfig`へGLASS V2専用値を追加する。

| 設定 | 型 | 範囲／形式 | 既定値 |
| --- | --- | --- | --- |
| `glassV2ChromaticHue` | number | `-180..180` degrees | `0` |
| `glassV2ChromaticSaturation` | number | `0..2` | `1` |
| `glassV2TransmissionTint` | string | `#RRGGBB` | `#FFFFFF` |
| `glassV2HighlightTint` | string | `#RRGGBB` | `#FFFFFF` |

設定はGLASS V2だけが参照する。GLASSとGLASS V2が共有しているSurface／Opticsの既存値は分離しない。

## 色収差成分の変換

GLASS V2の既存5波長サンプルとチャンネル合成を`spectralColor`、緑波長の基準透過を`baseTransmission`とする。

`chromaticResidual = spectralColor - baseTransmission`を求め、Hue回転とSaturation倍率はこの残差だけへ適用する。最終値は`baseTransmission + adjustedResidual`とし、既定値では変換行列をidentityにする。

これにより、色収差のない領域や入力Gradient本体へグローバルHue回転をかけず、既存の屈折位置とCauchy分散を維持する。

## Tint

- Transmission Tintは色収差調整後の透過色へ乗算する。`#FFFFFF`はidentity。
- Highlight Tintは既存のscreen合成で白として使っていたhighlight色を置き換える。`#FFFFFF`は現在の式と一致する。
- shaderへ渡す前にHEXを有限な`vec3 [0,1]`へ変換し、変換不能な値は白へ戻す。

## UI

GLASS V2選択時のOptics内に`Color`グループを追加する。Hue／Saturationは既存の`SliderField`、Tintは既存Stretchの色入力と同じ`input[type=color]`表現を再利用する。

初回実装ではキーフレームUIを付けない。アニメーション対応は別変更とする。

## 互換性

- 旧Presetの欠落値はidentity既定値で補完する。
- GLASS V2を使わない描画計画では新uniformが結果へ影響しない。
- GLASS専用programへ新uniformと色変換を追加しない。
- 既定値のshader parityと実画素比較を回帰条件にする。
