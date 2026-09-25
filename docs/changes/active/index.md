---
title: 進行中の変更
---

# 進行中の変更

Active ChangeはDesigned ChangeのPR中だけに置きます。mainへマージする前にCurrent Spec/ADRを同期し、`npm run change:finalize <CHANGE-ID>`でArchiveへ移動してください。Quick ChangeにはChange directoryを作りません。

この一覧は各`proposal.md`のfrontmatterからドキュメントのビルド時に生成します。並列PRの衝突を避けるため、このファイルへ行を追記しません。

<ChangeIndex bucket="active" />
