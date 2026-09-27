# Delta

## ADDED Requirements

### DATAMOSH-001 Datamosh Effect Stack layer

Datamoshは主スタックの通常レイヤーで、配置位置の前段textureへ前フレームの履歴を重ねる。drag、randomize、solo、選択の対象で、有効状態は`effectStack`、設定は`datamosh`へ保存する。設定はPostprocessのEdit Layerで編集する。タイル描画では適用しない。

### DATAMOSH-002 motion field and partitions

motion sourceは`Animation Flow`（既定、レイヤー入力の前後フレームからLucas–Kanadeで推定）、`Procedural`（curl noise + drift）、`Video Motion`。motion vectorはマクロブロック中心で評価して共有し、Block Lockで画素ごとのvectorと混ぜる。Block Varianceで結合・x／y分割した不規則パーティションにする。Neighbor Mix、Strength、Motion Scale、Motion Speedを持つ。

### DATAMOSH-003 history feedback, stretch, and refresh

前フレームの出力をmotion分ずらして予測画像とする。ずらし量は画素ごとに履歴の輝度（Luma Stretch）と彩度（Saturation Stretch）で0〜4倍に変わる。Feedbackで現在フレームと合成し、Refreshの割合のブロックだけを現在フレームで置き換える。Freeze、Mix Mode（Mix／Lighten／Difference／Ramp Lock）、Color Driftを持つ。

### DATAMOSH-004 corruption

Glitch Thresholdを超えるブロックへ、Glitch Amountの強さでvectorの0化、隣接vectorの流用、更新停止、参照位置のずらしを適用する。Jitterは参照UVをブロック単位で乱す。

### DATAMOSH-005 history lifecycle and compatibility

履歴は論理フレームが変わったときだけ進み、同じフレームの再描画は冪等。解像度・session・source変更と動画resetで初期化する。旧`videoMotion`レイヤーは同じ位置の`datamosh`レイヤーへ、旧`videoMotion`設定はDatamosh設定（Video Motion source、Ramp Lock、量子化・stretch・破損なし）へ移行する。

## MODIFIED Requirements

### EFFECT-001／EFFECT-002／EFFECT-014 主スタック

変更前: 12種類の一つが`Video Motion`。変更後: `Video Motion`の位置に`Datamosh`を置いた12種類。既定順は`… Diffuse → Datamosh → Cone`。

### VIDEO-MOTION-001〜004

変更前: 独立したEffect StackレイヤーでMotion Feedbackを適用。変更後: Datamoshレイヤーのmotion sourceとして操作し、Gradient Ramp投影はMix Mode `Ramp Lock`として提供する。fieldの推定、timeline同期、Export時のreset契約は維持する。

### PRESET-018

変更前: `videoMotion`を保存。変更後: `datamosh`と`effectStack`を保存し、`videoMotion`は読み込み時の移行だけに使う。

### UI-026

変更前: PostprocessのEdit LayerとEffect Stackに`Video Motion`。変更後: `Datamosh`（`Motion Field`／`History`／`Corruption`／`Look`グループ）。

## REMOVED Requirements

なし（Video Motionの機能はDatamoshのmotion sourceとして存続する）。
