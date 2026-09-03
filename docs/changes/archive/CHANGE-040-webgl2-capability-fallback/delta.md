---
type: delta
id: CHANGE-040
title: WebGL2 Capability Gate for SANDBOX 3D Fallback
status: approved
---

# Delta

## ADDED Requirements

### GRAD-023 — WebGL2能力不足時の3D viewフォールバック

WebGL2コンテキストを作成できない実行環境では、メインのGradient Canvas、SANDBOXのCloth、SANDBOXのConeは、非対応を想定済みの能力状態として扱う。2D Canvasを表示・編集可能な状態で継続し、同じページ内の再マウントで同じコンテキスト作成を繰り返さない。Three.js Rendererは、能力確認に成功した作成済みWebGL2コンテキストを受け取れる場合だけ初期化する。WebGL2が利用可能な環境のPreview、Export、context lost／restored動作は変更しない。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
