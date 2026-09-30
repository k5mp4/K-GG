# Delta

## ADDED Requirements

### DATAMOSH-006 Pixel Stretch motion source

motion sourceの`Pixel Stretch`は、`Angle`（0〜360°、既定0°。0°は右、90°は上、反時計回り）の向きを基準にしたmotion vector（`Curl`が0の既定では全画素で一定方向、`Curl`を上げると場所ごとに向きが変わる）を使い、大きさは`Procedural`と同じ基準（Strength 1で1フレーム当たりフレーム高さの1.2%）とする。輝度（Rec.709係数）が`Threshold`（0〜1、既定0.6）以上の画素を起点とし、各画素の出力を次の順で決める。

1. 現在フレームの入力が起点なら入力をそのまま出す。
2. motion vector 1ステップ後ろの履歴がThreshold以上で、かつ後方`Length`（1〜2048px、既定240px）以内に現在入力の起点があれば、その履歴を出す（1フレームに1ステップ伸びる）。
3. 自身の履歴がThreshold以上なら履歴をそのまま出す（伸びた描画が残る）。
4. それ以外は現在入力と自身の履歴を`Feedback`と`Mix Mode`で合成する。

`Length Variance`（0〜1、既定0.5）は`Block Size`幅の帯ごとにLengthを短くする。`Curl`（0〜1、既定0）と`Curl Scale`（0.25〜8、既定1.5）は、curl noiseの力場で伸びる向きを場所ごとに変える（`normalize(mix(Angle方向, curl方向, Curl))`）。`Curl Loops`（0〜8の整数、既定1）はタイムライン1ループで力場が展開して元へ戻る回数（0で固定）。Curl 0は一定方向のままで、起点探索は向きの場に沿って後方へ辿る。Luma／Saturation Stretchは引き込む側の色に掛かり、伸びる速さを変える。Refreshで選ばれたブロックは作り直され、Refresh 0では伸びた描画は消えない。

## MODIFIED Requirements

### DATAMOSH-002 motion field and partitions

変更前: motion sourceは`Animation Flow`、`Procedural`、`Video Motion`。

変更後: `Pixel Stretch`（DATAMOSH-006）を追加する。

### UI-026 Effect Stack Datamosh

変更前: Sourceは`Animation Flow`／`Procedural (Curl Noise)`／`Video Motion`。

変更後: `Pixel Stretch`を追加し、選択時に説明とAngle、Length、Threshold、Length Variance、Curl、Curl Scale、Curl Loops（Curl 0より大きいときだけ）を表示する。

### PRESET-018 Datamosh設定とVideo Motionの保存互換

本文変更なし。`pixelStretch` sourceとPixel Stretchの7項目は「motion source、各パラメータ」として`datamosh`へ保存・復元・正規化される。Pixel Stretch設定を持たない既存Presetは既定値で補完され、選択中のsourceは変わらない。

## REMOVED Requirements

なし。
