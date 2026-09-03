---
type: tasks
id: CHANGE-040
title: WebGL2 Capability Gate for SANDBOX 3D Fallback
status: approved
---

# Tasks

- [x] `proposal.md`、`delta.md`、対象current spec、関連コードを確認する
- [x] WebGL2能力状態と明示的なコンテキスト作成の回帰テストを追加する
- [x] `useWebGL`の想定済み能力不足を静かに2Dフォールバックへ渡す
- [x] Cone／ClothのThree.js生成前に能力を確認し、作成済みコンテキストを渡す
- [x] 再マウント時の再試行抑止と成功時の既存ライフサイクルを検証する
- [x] current spec、validation、利用者向けフォールバック説明を同期する
- [x] 受け入れ条件ごとの検証結果と実GPU未確認事項を記録する
- [ ] すべての検証完了後にchangeをArchiveへ移動する
