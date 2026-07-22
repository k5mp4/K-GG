---
id: ADR-0010
title: Image Gradient Sourceは画像テクスチャと色場を分離して描画する
status: accepted
date: 2026-07-21
deciders: [maintainer]
related_specs: [SPEC-009, SPEC-030]
supersedes: []
---

# ADR-0010: Image Gradient Sourceは画像テクスチャと色場を分離して描画する

## コンテキスト

V2のテクスチャスタックは色付け済み画像を再サンプリングするため、Image Gradient SourceへSlitやGlassを適用すると元画像の形状まで歪む。

## 決定

Image Gradient Source有効時は、元画像を固定UVで保持し、色場を別バッファで処理してから最終合成する。画像形状を再サンプリングするV2レイヤーはこの経路ではスキップする。

## 理由

画像本体の形状・アルファを保証しながら、色場に対するNoise、Diffuse、Slit等の表現を維持できる。

## 代替案

| 案 | 採用しなかった理由 |
| --- | --- |
| 色付け済み画像を従来どおりスタックへ渡す | 元画像の形状が歪む。 |
| 全V2レイヤーを色変換へ再定義する | 各レイヤーの意味と実装範囲が過度に拡大する。 |

## 結果

形状変形系レイヤーはImage Gradient時に適用対象外となり、保護動作をUIへ表示する必要がある。

## 再検討条件

全V2レイヤーを色場演算として再設計し、画像形状を変えずに同等の効果を定義できるようになった場合。
