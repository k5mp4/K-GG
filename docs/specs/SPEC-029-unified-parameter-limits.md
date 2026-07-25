---
id: SPEC-029
title: エフェクトパラメータ制限の一元化
status: implemented
owners: [maintainer]
created: 2026-07-21
updated: 2026-07-22
depends_on: [SPEC-016, SPEC-021]
related_adrs: [ADR-0009]
related_code: [src/lib/parameterLimits.ts, src/lib/sliderValue.ts, src/store/gradientStore.ts, src/components/SliderField.tsx, src/components/PresetPanel.tsx, src/lib/webgl.ts]
related_tests: [src/lib/parameterLimits.test.ts, src/lib/sliderValue.test.ts, src/store/gradientStore.effectPipeline.test.ts, 'manual: preset and keyframe bounds']
human_review: completed
---

# SPEC-029: エフェクトパラメータ制限の一元化

## ゴール・成功条件

UI、ストア、プリセット・キーフレーム、WebGL uniformの全境界で、同じパラメータ制限と非有限値処理を使用する。

## 方針

既存の型コメントとUIに定義された範囲をパラメータ制限レジストリへ集約する。範囲がある値はclamp、整数値は丸め、角度はwrap、非有限値は既定値へ戻す。setterとプリセット読込は統合normalizerを通し、描画直前にも同じポリシーを適用する。GLSLのclampは最終防御とする。

## 受け入れ条件

- AC-001: 範囲外の直接setter値がストアへ残らない。
- AC-002: 範囲外・欠損・非有限のプリセットが安全に読み込める。
- AC-003: キーフレーム評価値とuniform送信値が同じ制限内になる。
- AC-004: UIの直接入力、ドラッグ、Angle入力のいずれも同じ制限を使う。
- AC-005: Tweeqの数値ドラッグが範囲外値を一時通知しても、UI表示・ストア・キーフレームにはclamp済みの値だけが残る。

## 未決定事項

なし。
