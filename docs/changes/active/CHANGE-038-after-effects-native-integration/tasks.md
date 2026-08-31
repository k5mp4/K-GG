---
type: tasks
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: approved
---

# Tasks

- [x] 現行仕様、既存Bridge、Tauriの外部プロセス・一時ファイル境界、関連ADRを調査する
- [x] `proposal.md`、`delta.md`、`design.md`の範囲と段階導入方針を承認する
- [x] P0のTauri/Rust After Effects接続、プロセス検出、固定JSX、完了結果、作業領域を実装する
- [x] P0の画像・MOV・MP4送信と保存先選択をTauri Adapterへ接続する
- [ ] P0のAE未起動、JSX失敗、保存失敗、対象コンポジション不在を検証する
- [ ] P1の選択コンポジション・選択レイヤーDTOと読み込みUIを追加する
- [ ] P2のFootage元ファイルとレンダー結果の取り込みを追加する
- [ ] P3のKagaribi対応パラメータ変換と非対応項目の表示を追加する
- [ ] `validation.md`へ受け入れ条件ごとの自動テスト・実機確認結果を記録する
- [ ] deltaをcurrent specへ統合し、関連index・利用者向け文書を同期する
- [ ] 全受け入れ条件を確認後、CHANGE-038をArchiveへ移動する
