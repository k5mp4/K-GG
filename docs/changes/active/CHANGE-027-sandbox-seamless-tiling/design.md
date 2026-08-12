---
type: design
id: CHANGE-027
title: SANDBOX Seamless Tiling
status: approved
---

# Design

## Algorithm

採用するのは、対向する辺をなじませるクロスフェード方式である。各軸について、画像の端から `blendWidth` の帯域を取り出し、反対側の対応位置の画素と重み付きで混ぜる。重みには線形補間ではなく、端点で急変しないraised-cosine窓を使う。

概念的には、正規化座標 `u` の左右処理を次のように行う。

```text
t = smooth raised-cosine weight from 0 to 1 across the blend band
leftBand  = sample(u + 1 - blendWidth)
rightBand = sample(u - 1 + blendWidth)
result    = mix(original, oppositeEdgeSample, t)
```

実装では、左右方向を処理した結果へ上下方向を適用する。対向辺の参照はrepeat後に同じ位置へ対応するように行い、最外周の左右端・上下端の値を一致させる。Blend Widthを広げるほど境界の色差を広い領域へ分散できる一方、幅が大きすぎると大きな形状が二重に見えたり、ぼけたりするため、UIでは安全な範囲へ制限する。

プレビューと通常のフルフレーム出力はGLSLの専用パスを使う。タイル出力は、タイルを通常どおり結合した後、同じ式を使うCPU基準実装を最終キャンバスへ一度だけ適用する。これにより、処理対象がタイルの局所範囲になることを防ぐ。CPU実装は自動テストの基準実装としても使う。

## Render placement

既存の固定エフェクト順序は維持する。SeamlessはMain Stack、Prism、Particlesの2D合成が完成した後に最終境界処理として適用する。Particlesを含むフルフレームとタイル出力の入力を一致させるため、Particles有効時は中間テクスチャへ合成してからSeamlessへ渡す。Seamless無効時の既存描画経路は変えない。

Cloth/Coneは既存どおり処理済み2Dキャンバスを参照するため、Seamless済みの画像を入力として表示する。GPUパスが利用できない場合でも、既存のWebGL fallback契約を壊さず、機能状態を明示する。

## Data model

```ts
type SeamlessConfig = {
  enabled: boolean;
  blendWidth: number; // normalized 0.02..0.5, default 0.25
};
```

`SeamlessConfig`はstore、`LatestState`、プリセットsnapshot、サムネイル用state、WebGL render stateへ同じ形で渡す。読み込み時には専用normalizerを通し、旧形式・欠損・NaN・範囲外の値を安全な既定値へ戻す。

## License and provenance review

- 採用する実装は、外部ライブラリを追加しない新規のTypeScript/GLSLコードとする。したがって、実行時にOpenCVやGIMPのコードを同梱しない。
- 方式の検討では、CC0と明記された [TimSCのseamless.py gist](https://gist.github.com/TimSC/52190fca6b1fb223e952ebf3118bde97) の「水平・垂直の対向辺をアルファ合成する」考え方を参照する。ただし、そのコードをコピーせず、型・データ経路・GPU/CPU parityをこのリポジトリ向けに独自実装する。
- OpenCVは公式にApache-2.0（4.5以降）またはBSD系のライセンスを案内しているが、今回の単純な処理に依存を追加する必要がないため採用しない。[OpenCVの公式ライセンス説明](https://opencv.org/license/)
- GIMPのMake Seamlessは目的に近いが、GIMP本体はGPLv3であるため、実装やソースを取り込まない。[GIMP Make Seamless documentation](https://docs.gimp.org/2.4/en/plug-in-make-seamless.html)、[GIMP FAQ](https://www.gimp.org/docs/faq/)
- Web上の操作説明はアルゴリズムのトレードオフ確認にのみ使い、コードや画像資産は取り込まない。[Texturize Make Seamless](https://texturize.app/tools/make-seamless)

これは法的判断ではなく、依存追加を避け、参照資料のライセンスと由来を明示するためのリポジトリ上の採用記録である。最終的な配布ライセンス確認は、通常の人間レビューで行う。

## Failure and fallback

- Seamless無効時は処理パスを完全にバイパスする。
- GPU専用プログラムがreadyでない場合は、既存のlazy program/fallback状態に従い、既存描画を壊さない。
- タイル出力のCPU処理は全体キャンバスのメモリ上限を既存のexport制約内で扱う。処理不能な場合の新しい自動縮小や品質変更は行わず、既存exportエラーとして返す。

## Validation strategy

- 純粋なCPU関数で、無効時の恒等性、左右・上下の境界一致、四隅、幅の正規化をテストする。
- WebGL shader sourceの登録とlazy program keyをテストする。
- プリセットの旧データ読み込み、保存・復元、サムネイルstateへの伝播をテストする。
- tileRenderの結合後処理が一度だけ実行され、タイルサイズによって結果が変わらないことをテストする。
- ブラウザで3×3反復表示を行い、通常画像、斜め線、四隅、幅変更、無効化、Cloth/Coneの各表示を手動確認する。
