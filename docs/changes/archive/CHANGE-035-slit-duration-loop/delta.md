# Delta

## ADDED Requirements

なし。

## MODIFIED Requirements

### EFFECT-017 Slitのduration基準ループ

AnimationとSlitが有効な場合、Slitは`animMode`（Loop／PingPong）と`offsetSpeed`だけで連続アニメーションします。`phaseSpeed`および位相モーションの自動トラックは存在せず、旧Presetに残る値は無視します。キャンバス再生と書き出しは、Easing・Animation Speed・Durationを反映した同じ秒ベースのアニメーション時計を使います。Offset Speedが0またはModeが`off`のときはSlitの自動動作を停止します。旧Presetに残る`autoLoop`やTimeline Loopの状態は描画へ影響させません。

Slitのshader位相は、秒ベース時計のduration周期に対して閉じた周期として計算します。Duration周期内のサイクル数は`abs(offsetSpeed) * loopPeriod`に最も近い1以上の整数へ量子化し、Loop／PingPong／Waveの周期関数がduration境界で同じ位相になるようにします。これにより既定の5秒再生でも、5秒時点から0秒時点へ戻る際にスリット位置が不連続になりません。正負のOffset Speedは進行方向を維持し、秒ベースの`slitAnimationTime`自体は変更しません。

この変更はSlitのUI、保存形式、既存の`animMode`、Preview／Thumbnail／静止画・連番・動画Exportで共有するscene evaluationの時計、または他の効果のループ仕様を変更しません。

## REMOVED Requirements

なし。
