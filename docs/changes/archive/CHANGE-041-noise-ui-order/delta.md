---
type: delta
id: CHANGE-041
title: Noise UI共通プロパティとタイプ順序
status: approved
---

# Delta

## ADDED Requirements

### UI-023 — Noise共通プロパティとType順序

NoiseパネルでNoiseが有効な場合、Type選択の直後に`Amount`、`Scale`、`Seed`をこの順序で表示する。`Seed`には既存のShuffle操作を併設し、Noise Typeに応じた既存の保存キーと値域を維持する。

Noise Typeの候補は、次の順序で表示する。

1. `Fast Curl`
2. `Curl (Legacy)`
3. `Simplex`
4. `fBm`
5. `Aura Ridges`
6. `Fractal Drift`
7. `Domain Warp`
8. `Seamless`
9. `Voronoi`
10. `Caustics`
11. `Phasor Lines`

この順序は、Flow、Base / Fractal、Warp / Periodic、Structured Fieldの性質の近い候補を隣接させ、Flow系を先頭へ置く。候補の内部値、選択結果、タイプ別初期値は変更しない。

Type-specificプロパティは共通プロパティの後ろへ表示し、既存のTypeごとの表示条件、コントロール、入力範囲、Reset、Preset、Undo/Redo、描画結果を維持する。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
