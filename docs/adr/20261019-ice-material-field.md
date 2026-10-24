---
id: ADR-20261019-ice-material-field
title: 共有Material Fieldを一つの保存値として持ち、解析評価してGradientとIceから参照する
status: proposed
date: 2026-10-19
deciders: [owner]
related_specs: []
supersedes: []
---

# ADR-20261019-ice-material-field: 共有Material Fieldを一つの保存値として持ち、解析評価してGradientとIceから参照する

## コンテキスト

画面全体の氷（厚み、亀裂、白濁、反射）を作り、その構造をグラデーションの配色にも使いたい。既存のGlassは屈折とFresnel風ハイライトを持つが、厚みに依存する吸収や内部の白濁を持たず、その模様を配色へ渡す経路もない。模様をIce shaderの中に閉じると、厚みや亀裂を配色へ使うたびに別実装が必要になる。

時間面では、シークと書き出しが同じ結果を返すこと、整数周期でループがつながることが必要である。タイル書き出しでは分割境界で構造が切れてはならない。描画面では、既存のGenerator variantとanalytic prefixの最適化、ANGLEでのShaderコンパイル時間を壊せない。

計画書は[Ice Material Field - Plan](../plans/2026-10-18-0201-feat-ice-material-field-plan.md)。共有場による配色（U1〜U3）とIce光学レイヤー（U4〜U6）を実装した。

## 決定

1. **保存の所有**: 共有構造はrootの`materialField`に一つだけ保存する。配色への接続は`gradient.fieldInput`（`source`と`influence`）に保存し、Iceの光学設定は後続で`ice`に保存する。`materialField`には有効フラグを持たせず、消費側（Gradientの入力、後続のIce）の実効状態から描画の必要性を決める。Gradient側やIce側に別のSeed・Scaleのコピーを持たない。
2. **解析評価**: 場は全出力の画素位置（画面の高さで割った座標）、Seed、設定、周期位相だけの純粋なGLSL関数として、必要な消費先で毎回評価する。場全体を保持するFBOや汎用ノード評価器は作らない。hashはsinを使わず、SeedはCPUで小さな格子座標とdomain offsetへ畳み込んでから渡す。値域は固定し、フレームごとのmin/max正規化をしない。
3. **時間**: Loop Timing適用後の`autoTime`から位相`fract(fract(cycles × t) + phase)`をCPUで一度だけ作る。時間変化は位相の整数調波だけで作り、4Dノイズ、`fract(time)`を非周期ノイズへ渡す方法、フレームごとのSeed再抽選は使わない。Seedと周期数は補間しない。
4. **Generator variant**: 場の関数はbootstrap Generatorに加えた専用variant（`GENERATOR_MATERIAL_FIELD_VARIANT = -2`）にだけ組み込み、既存のNoise variant機構で遅延コンパイル・保持・解放する。場の入力が実効有効な間はanalytic prefixがNoise／Diffuseを取り込まない。これにより場の座標とNoise／DiffuseのUV変換が暗黙に混ざらず、variantがNoiseを含む必要もない。
5. **Mesh**: Meshのランプ対応モードは、論理座標`v`を既存のCoons patch tessellationと同じ三角形順でラスタライズしたR32F lookupをRendererが所有し、geometryとサイズだけをcache keyにする。合成は`mix(Mesh従来色, Ramp(mix(v, f, s)), s)`とし、影響量0の近傍で補間方式の切替えによる色の跳びを避ける。
6. **適用除外**: Image Gradient Sourceの保護中、Meshの直接色、Legacy V1 pipelineでは、保存値を消さずに場の入力を実効無効にする。
7. **Ice境界の色とalpha**: Iceは独立した1 passの通常レイヤーで、既存Glassの係数や出力を変えない。パイプライン全体を線形光へ改修せず、Iceだけが入力RGBをsRGB相当としてdecodeし、線形光で吸収・散乱・反射を合成してencodeする。実光量を持たない既存効果との近似境界である。近傍はalpha重み付きの4 texel補間で読み、alphaが0の画素の隠れたRGBを混ぜない。出力alphaは元座標のalphaのままで、反射や散乱で被覆を増やさない。透明PNGを別アプリへ重ねても、その背景が後から屈折することはない。
8. **有限参照範囲とタイル**: Iceの参照距離は出力の高さ`H`に対して屈折0.020H、分散0.002H、粗さ0.004Hを上限とし、tanの発散を避けて連続的に飽和させる。同じ上限からタイル余白`ceil(0.026H) + 2`画素を求め、export開始時のsnapshotで固定する。余白を確保できない場合と、Mirror／Kaleidoscopeのような遠隔参照とIceを同時に使う場合は、描画前に失敗させ、Iceを省いた出力や品質を落とした再試行をしない。画面外はキャンバス全体の座標でMirrorし、タイル端ではMirrorしない。
9. **Iceの表面はIce自身のノイズから作る**: 表面の凹凸と粗さは、共有場の上に模様を重ねるのではなく、Iceのノイズテクスチャー（`ice.noiseScale`）から作るバンプマップと粗さマップで表す。バンプマップは閾値で切り出した部分的な隆起、その縁の面取り（`bevel`）、全体の微細なざらつきの2段階、粗さマップはツヤと曇りの混在（`roughnessVariation`）である。これらは`ice`に保存し、共有場（`materialField`）には内部構造（厚み・亀裂・霜・気泡）だけを残す。ノイズの座標は共有場のSeed・歪み・周期変形を写して使い、Ice専用のSeedは持たない。法線は1画素幅の差分、微細なざらつきは出力の画素幅で帯域制限し、追加のtexture参照は増やさないため、KTD5の参照範囲とタイル余白は変わらない。ハイライト（GGX）と逆光は加算で、出力alphaは変えない。

## 理由

- 一つの正本にすることで、氷の質感と抽象的な配色が同じ構造・同じSeedを共有し、片方の編集がもう片方と食い違わない。
- 解析評価は時刻と位置だけの関数なので、順再生、逆順、シーク、タイルで同じ値を返し、フレーム履歴やタイル間のデータ共有が要らない。
- 専用variantにすることで、場を使わない既存Presetのshader source、コンパイル時間、FBO確保が変わらない。analytic prefixを止める範囲は場の入力が有効な場面だけである。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| GlassへIce表面を追加 | 厚み・散乱・配色入力までGlassに集まり、既存Presetの描画互換への影響が大きい |
| Three.jsの立体材質 | 画面全体の質感が対象で、別contextやメッシュ・環境素材の管理が増える |
| 場をFBOへ描いて共有 | 全チャンネルのtargetを常時確保し、タイル境界とexport時の寸法管理が増える。計測後の改善候補に留める |
| 場の関数を常にGeneratorへ含める | 全Presetのshaderが大きくなり、ANGLEのコンパイル時間が増える |
| Noise variantごとに場付きvariantを作る | variant数が倍増する。場の入力中はanalytic prefixを止めればbootstrap相当で足りる |

## 結果

### 利点

- 厚み・亀裂で配色するグラデーションを、Iceなしで制作・保存・書き出しできる。
- 同一環境では時刻の順序やタイル分割に関係なく同じRGBAになり、整数周期の時刻0と1が一致する（`tests/e2e/ice.spec.ts`）。
- Iceはalphaを変えず、余白付きタイルでも全画面と同じ結果になる（同上）。
- 場を使わないPresetは従来と同じsource・描画経路のまま。

### 欠点・コスト

- 場の入力中はNoise／Diffuseのanalytic prefix最適化が効かず、Stack passの分だけ処理が増える。
- 場付きvariantは初回にコンパイル待ちがある（ANGLEで数秒）。Previewはその間、場なしのBaseを表示する。
- Meshの途中の影響量は、通常6方式と同じ補間曲線にならない。
- 場より前に画像を歪める効果を置いても、場の座標には伝わらない（Effect Stackの順序の意味として扱う）。
- Iceは線形光での合成を自分のpassの中だけで行う。前後の効果はsRGBのまま処理するため、物理的に一貫した光量の連鎖にはならない。
- Iceを含むタイル出力では、Mirror／Kaleidoscopeとの併用と、余白を確保できない小さなタイルが非対応になる。

## 再検討条件

- 1080pで場の評価が支配的になり、暫定目標16.7ms/frameを満たせない場合（FBOキャッシュや帯域制限の再設計）。
- 複数の共有場や、任意のノード接続が必要になった場合。
- パイプライン全体を線形光や浮動小数点targetへ移行する場合（Iceのdecode／encode境界を見直す）。
- 遠隔参照するレイヤーと組み合わせたタイル出力が必要になった場合。
