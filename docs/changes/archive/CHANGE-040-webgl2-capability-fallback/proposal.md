---
type: change
id: CHANGE-040
title: WebGL2 Capability Gate for SANDBOX 3D Fallback
status: archived
change_kind: B
owners: [maintainer]
created: 2026-08-31
updated: 2026-09-03
current_specs: [CURRENT-GRADIENT]
related_adrs: []
related_code: [src/lib/webglCapability.ts, src/lib/webgl.ts, src/hooks/useWebGL.ts, src/lib/coneViewRenderer.ts, src/lib/clothGradientRenderer.ts, src/components/ConeCanvas.tsx, src/components/ClothCanvas.tsx]
related_tests: [src/lib/webglCapability.test.ts, src/lib/coneViewRenderer.test.ts]
human_review: completed
outcome: follow-up
migration: historical
follow_up: "issue-needed: WebGL対応環境のPreview/Export/context復旧を実GPUで確認する"
---

# CHANGE-040 WebGL2 Capability Gate for SANDBOX 3D Fallback

## 背景・問題

WebGL2がWebViewのサンドボックスやGPU設定で無効な環境では、メインのGradient CanvasとSANDBOXの3D viewがそれぞれWebGLコンテキスト作成を試みる。現在は非対応を通常の例外として扱うため、`useWebGL`のエラーとThree.jsのコンテキスト作成エラーが重複し、Coneを再マウントするたびに同じログが出る。2D Canvasへ戻る既存フォールバックはあるが、能力不足を一度で判定する経路がない。

## 変更理由

WebGL2が利用できない実行環境でも、既存の2D Canvas編集を安定して継続できるようにする。Three.jsへコンテキスト作成を委ねる前に同じWebGL2能力を確認し、非対応を想定されたフォールバックとして扱うことで、コンソールの連続エラーと不要なGPU初期化をなくす。

## ゴール・成功条件

- WebGL2が利用できない場合、メインの初期化失敗は想定済みの能力不足として扱い、`console.error`を出さず2D Canvasを継続する。
- Cone／Clothの3D Rendererは、WebGL2コンテキストを作成できない場合にThree.jsの内部生成を呼ばず、既存の`onUnavailable`経路を一度だけ実行する。
- 同一ページ内の再マウントやStrictMode相当の再実行で、失敗したWebGL2／Three.jsコンテキストを繰り返し作成しない。
- WebGL2が利用できる環境では、作成済みコンテキストを既存のRendererへ渡し、Preview／Exportとコンテキスト復旧の動作を維持する。

## 対象

- WebGL2能力状態の共有、明示的なコンテキスト作成、想定済み失敗の分類。
- `useWebGL`、Cone／ClothのThree.js Renderer、各Canvasのフォールバック処理。
- 能力不足時の再試行抑止と、成功時の既存描画経路の回帰テスト。
- Gradient Systemの3D viewフォールバック仕様とchange validationの同期。

## 対象外

- WebView、ブラウザ、OSのGPU設定をアプリから有効化すること。
- WebGL1、Canvas2Dによる新しい3DソフトウェアRenderer、別のGPUバックエンドの追加。
- Coneのシーム方式、Preset保存、表示UI、出力フォーマットの変更。
- ブラウザ自身が出す画像lazy-load等のInterventionメッセージの変更。

## 影響を受ける現行仕様

- [Gradient System](../../../specs/current/gradient-system)

## 関連ADR

- なし。既存の2Dフォールバック契約を明確化する局所修正であり、主要依存や保存形式は変更しない。

## 主なリスク

- 能力状態を長くキャッシュしすぎると、同一ページ内でGPU設定が復旧した際の再試行を遅らせる可能性がある。context restored時に状態を未知へ戻す。
- Rendererへ明示的なコンテキストを渡す実装がThree.jsの既存ライフサイクルとずれると、成功環境の描画へ影響する可能性がある。既存のcontext lost／restoredテストを維持する。
- WebGLが一時的にコンテキスト上限へ達した場合も非対応と同様にフォールバックする可能性がある。ページの再読み込みで状態を初期化できる範囲に限定する。

## 未決定事項

なし。今回の修正依頼により、WebGL2非対応時は既存2D Canvasへ戻し、WebGL1への代替は行わない方針を確定した。

## Finalization

- Finalized: 2026-09-03
- Outcome: `follow-up`
- Mode: historical migration; this move does not claim that every acceptance criterion passed.
- Follow-up: issue-needed: WebGL対応環境のPreview/Export/context復旧を実GPUで確認する
