# MOVコーデックと品質の仕様差分

対象: [CURRENT-VIDEO-EXPORT](../../../specs/current/video-export.md)のEXPORT-012／013。

## ADDED Requirements

新しいRequirement IDは追加しない。

## MODIFIED Requirements

### EXPORT-012／013 MOVコーデックと品質

MOVはQuickTime Animation（qtrle／rgb24）のロスレスに固定され、コーデック・品質を指定できない。

変更後:

MOVはH.264／ProRes 422／Animationを選択できる。H.264／Balancedを既定にし、H.264はCRF 18／22／27、ProResはHQ／422／LTの3段階に対応する。Animationは既存のロスレス出力を維持し、品質指定を表示しない。

FFmpeg状態に利用可能な`movCodecs`を追加する。UIとRustは検出結果に従い、未対応指定を拒否する。未報告の旧バックエンドではAnimationのみを表示する。MP4／WebMの既定品質、MOVの保存ファイル名、成果物の解放、After Effects連携、パス検証は維持する。

H.264／ProResでは圧縮と色サブサンプリングにより従来RGBロスレスと出力が変わる。透明出力と容量の上限保証は対象外。

## REMOVED Requirements

なし。
