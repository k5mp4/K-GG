# Spec Delta

## ADDED Requirements

なし。

## MODIFIED Requirements

### CONN-001 接続

bridgeはブラウザからの要求をFigma Plugin UI（`null` origin）、K-GG Desktopのアプリorigin、Development用のK-GG Vite originに限定する。それ以外のOriginを持つ要求は状態変更前に403で拒否し、CORS応答は許可したOriginだけに返す。同時接続数は32までとする。

### CONN-006 接続状態

接続リクエストごとに新しいリクエストIDと6桁の確認コードを発行し、リクエストIDは要求元へだけ返す。未許可のリクエストは新しいリクエストで置き換え、古いIDではsession tokenを取得できない。許可済みでtoken受け取り待ちのリクエストは置き換えず409を返す。K-GGの許可表示とFigma Pluginは同じ確認コードを表示する。

## REMOVED Requirements

なし。
