---
type: tasks
id: CHANGE-037
title: SANDBOX Preset Coverage and Cone Color Reapply Seams
status: approved
---

# Tasks

実装は `proposal.md` の `status: approved` と `human_review: completed`、レビュー済みの `delta.md` を確認した後に開始する。

- [x] `proposal.md`、`delta.md`、`design.md` の未決定事項をレビュー・確定する
- [x] SANDBOX全設定を保存スナップショットへ含める回帰テストと実装を追加する
- [x] Coneに `reapply` Seam Modeの型、normalizer、Store／Preset伝播を追加する
- [x] RGB色差再適用のCPU基準関数とGPU shader分岐を追加する
- [x] Cone UI、日英メッセージ、ヘルプを更新する
- [x] 既存2方式の互換性、Preview／Export parity、新方式の境界・alpha保持をテストする
- [x] 受け入れ条件ごとの検証結果を `validation.md` へ記録する
- [x] deltaをcurrent specへ統合する
- [ ] Browser/WebGLの手動確認後にchangeをArchiveへ移動する（接続・実GPU確認待ち）
