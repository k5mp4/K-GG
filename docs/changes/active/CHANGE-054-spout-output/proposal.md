---
type: change
id: CHANGE-054
title: Windows Desktop版のSpout出力
status: review
change_kind: F
owners: [maintainer]
created: 2026-09-25
updated: 2026-09-25
current_specs: [CURRENT-REALTIME-OUTPUT]
related_adrs: [ADR-0022]
human_review: required
---

# Windows Desktop版のSpout出力

Request source: Direct request（Spout2によるリアルタイム映像出力の実装依頼）。

## 変更理由

K-GGの最終描画を、VJ・ライブ・配信のツール（TouchDesigner、Resolume、OBS）へリアルタイムに渡す手段がない。今は動画を書き出してから読み込む必要がある。Spoutは、これらのツールが共通して対応するWindowsのtexture共有方式である。

## 変更内容と受け入れ条件

- Windows Desktop版で、ExportパネルからSpout Senderを作成・解放できる（RTOUT-001, RTOUT-003, RTOUT-008）。
- 送信する画像は、Effect Stack適用後の2D Preview canvasとする。上下反転やR/B入れ替えはしない（RTOUT-002）。
- アニメーションと静止中の再描画が送信される。30/60 fpsを選べ、Preview FPSとは独立している（RTOUT-005）。
- latest-frame-winsのbackpressureを持ち、フレームはraw binary IPCで渡す（RTOUT-006）。
- 解像度変更、context lost、動画書き出し中もクラッシュしない。Spoutの失敗でPreview描画を止めない（RTOUT-007, RTOUT-008）。
- Spout2（BSD-2-Clause）のライセンス表示をNOTICEとHelp > Third-party licensesに含める。
- Web版とWindows以外の`npm run build` / `cargo check`を壊さない。

## 対象外

WebGL/WebView2 textureのD3D11共有、`SendTexture`によるゼロコピー送信、DirectComposition連携、Cloth/Cone 3D表示の送信、Spout Receiver、macOS Syphon、NDI。commit・push・Pull Request・GitHub Issueの作成も含まない。

## 互換性

Preset形式、描画結果、既存の書き出しは変更しない。Spout出力は既定で無効で、Desktop起動時にも自動では有効にならない。

設計は[design](./design.md)、仕様差分は[delta](./delta.md)、検証と未確認事項は[validation](./validation.md)に記録する。
