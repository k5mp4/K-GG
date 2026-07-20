---
id: ADR-0005
title: Unified Effect Stack V2を段階別ping-pong FBOで描画する
status: accepted
date: 2026-07-11
deciders: [maintainer]
related_specs: [SPEC-012, SPEC-013, SPEC-014, SPEC-015, SPEC-018]
supersedes: [ADR-0004]
---

# ADR-0005: Unified Effect Stack V2を段階別ping-pong FBOで描画する

## コンテキスト

主スタックへ素材処理と画像Postprocessを統合するには、生成UV用シェーダーに閉じていた処理も前段画像を入力として適用できる必要がある。一方、Normal/Matcap、Prism、Particlesは処理目的と複数パス要件が異なる。

## 決定

V2はベース画像を生成後、10種類（Noise、Slit、Stretch、Distort、Mirror、Kaleidoscope、Voronoi、Glass、Glass V2、Diffuse）の順序可変スタックをping-pong FBOで描画する。Diffuseは既存のDiffuseパネル設定を使うMain Stackレイヤーとして、指定位置で一度だけ適用する。固定順は`Base -> Surface -> Main Stack -> Prism -> Particles`とする。旧プリセットは既存Legacy経路を維持する。GlassとGlass V2は同じシェーダーモジュールとパラメータ群を共有するが、GPUドライバーが両モードの大きい呼び出しグラフを同時に最適化しないよう、モード別の専用programへコンパイルする。両方が必要な場合もprogramは逐次コンパイルし、異なるスタックレイヤーとして扱う。

## 理由

各効果をtexture入出力へ統一すれば、順序の意味をそのまま描画へ反映できる。特殊なSurface、Glow、overlayを主スタックから外すことで、FBOの読み書きと利用者への意味づけを単純に保てる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 生成UVシェーダーへ全順序分岐を追加する | 順序の組合せと画像入力の意味が複雑になる |
| Prism、Particles、Normalも主スタックへ入れる | Glow、overlay、法線計算の中間パスと利用者の意味が異なる |
| 旧プリセットをV2順へ自動変換する | 既存作品の見た目が大きく変わる |

## 結果

- 主スタックは10種類の任意順を表現でき、特殊効果は安定した段階で描画される。
- DiffuseはMain Stack内の指定位置で適用され、旧来の固定最終段はLegacy経路に限る。
- V2は各画像効果の参照距離を考慮したタイルガターを要する。
- Glass系はモード別programに分け、長時間コンパイル時も他のprogramと同時にGPUコンパイラーへ投入しない。
- 同種複数インスタンス、特殊効果の自由順序化は将来の別設計とする。

## 再検討条件

同種複数インスタンス、Prism/Particles/Normalの自由順序化、またはレイヤーごとの合成モードが必要になった場合。
