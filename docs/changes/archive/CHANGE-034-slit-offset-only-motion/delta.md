---
id: CHANGE-034
status: archived
---

# Delta

## ADDED Requirements

なし。

## MODIFIED Requirements

### UI-003 Slitの選択コントロール

変更前はMotionにUnidirectional（Loop）／PingPong、Offset Speed、Phase Speedを表示し、Source Image UIをSlit設定の途中（Mode直後）に表示する。変更後はLoop／PingPongとOffset Speedだけを表示し、Phase Speedの入力を廃止する。Source Image UIはSlitプロパティモジュールの一番下へ移動する。Mode、その他のSlit入力、Timeline Loop切替を持たない契約は維持する。Source Imageの読み込み・削除・エラー表示の動作は維持する。

### UI-012 Slitのモーション速度

変更前はSlitのMotionをOffset SpeedとPhase Speedで調整する。変更後はOffset Speedだけで調整する。Loop／PingPong、Animationの既存Duration・Speed、およびキャンバスと書き出しで同じ秒ベースのSlit時計を使う契約は維持する。

### EFFECT-017 Slitのduration基準ループ

変更前はSlitが`animMode`、`offsetSpeed`、`phaseSpeed`で連続アニメーションし、スリット帯域全体の位相移動を別速度で進める。変更後は`animMode`と`offsetSpeed`だけで連続アニメーションし、位相速度による追加移動を行わない。速度0またはModeが`off`のときはOffsetの動きを停止する。Preview、Thumbnail、静止画、連番、動画でこの同じ時計を使う。

### EFFECT-005 旧Presetとの互換性

Slitの旧Presetに残る`phaseSpeed`と`phaseAnimEnabled`は読み込み時に無視し、位相移動なしとして扱う。旧Presetの`slitScan.slitPhase`に紐づくPhase Motion用キーフレームトラックも適用せず破棄する。静的な`slitPhase`値、`animMode`、`offsetSpeed`は保持する。新規保存では廃止キーを再出力しない。

## REMOVED Requirements

### EFFECT-017-PHASE SlitのPhase Speedによる自動移動

`phaseSpeed`／`phaseAnimEnabled`を使って`slitPhase`へ時間ベースのオフセットを加える動作を廃止する。代替は`offsetSpeed`のみのSlitループであり、手動で設定した静的な`slitPhase`は廃止しない。
