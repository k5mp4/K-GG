# Delta

## ADDED Requirements

### EFFECT-008 GLASSの決定性

GLASSおよびGLASS V2は、同一入力texture、同一パラメータ、同一normalizedTime、同一Effect Stack順序に対して、直前の描画履歴やevent loop状態に依存しないRGBA結果を返す。連続適用時は各レイヤーのsourceとdestinationを別のFBO／textureとする。

### EXPORT-001 フレーム時刻の決定性

PNG ZIP、MOV、MP4の出力フレームはframeIndexからnormalizedTimeとrenderTimeを計算し、実時間、Preview再生位置、処理時間に依存しない。

### EXPORT-002 export sessionの排他

export中は通常Preview描画、AnimationLoop、static scheduler、seek、lazy program再描画、UI更新由来のrenderを出力Canvasと中間FBOへ混入させない。終了後はPreview状態を復元する。

### EXPORT-003 render planとprogramの固定

export開始時にEffect Stack順序・enabled状態、Glass設定、animation、keyframe、Canvas／FBOサイズ、tile padding、必要program、fallback方針をsnapshotする。必要programが準備できない場合はフレーム出力開始前に失敗し、session中のprogram／fallback／render plan変更を許可しない。

### EXPORT-004 原子的なrender-and-capture

指定時刻の描画、GPU完了、capture、render sequence確認を一つのexportフレーム処理として実行し、描画後からcaptureまでに別のrenderを許可しない。

### EXPORT-005 共通フレーム生成

PNG ZIP、MOV、MP4は共通の時刻計算、scene evaluation、render plan、GLASS状態初期化、capture、AbortSignal、進捗処理を使用し、adapter固有処理を保存・encodeに限定する。

### EXPORT-006 tileとcancellationの互換性

GLASSの単層・連続適用に必要なtile paddingを維持し、full-frame pathとtiled pathで同じフレーム生成規則を使う。cancellationまたは失敗時は途中出力を成功扱いせず、sessionとPreviewを復元する。

## MODIFIED Requirements

### EFFECT-007 Preview、Thumbnail、Export

Preview、Preset thumbnail、静止画・連番・動画のレンダリングは、同じ正規化されたEffect Pipelineとscene evaluationを共有する。動画出力では、これに加えてexport session中の固定render planと原子的なcapture規則を共有し、出力形式ごとのadapterが別のフレーム時刻・描画経路を持たない。

## REMOVED Requirements

なし。

