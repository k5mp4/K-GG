---
type: delta
id: CHANGE-030
title: SANDBOX Flow Gradient Phase A の仕様差分
status: approved
---

# Delta

## ADDED Requirements

### FLOW-001 SANDBOX Flow Gradient module

SANDBOXは、既存のNormal、Prism、Particles、Seamlessなどと同じ選択方式でFlow Gradientを表示する。Flow Gradientは固定ステージであり、Main Stackの自由な並べ替え対象にはしない。

### FLOW-003 Phase A temporal trail

Phase Aは密度FBOとTrail用Ping-Pong FBOを持つ。各論理フレームで、現在密度と前フレームTrailを減衰合成し、次のTrailへ書き込む。Trail値は有限範囲へクランプし、無効時は履歴を残さない。

Directional Diffusion、異方性拡散、速度場に沿った追加の拡散はPhase Aの要件に含めない。

### FLOW-004 scalar gradient mapping

Trailまたは現在密度から得た0から1のスカラー値を、既存Gradient Rampへ入力して色へ変換する。Flow Gradient専用の固定色を最終出力として使用してはならない。

### FLOW-005 loop and lifecycle

Loopが有効な場合、既存Animationの正規化時刻とDurationから周期的なloop phaseを算出する。Curl Noiseの入力と粒子位相は周期境界を持つ。Loop開始、Seek、再生再開、パラメータ変更、解像度変更、Export開始、Thumbnail開始ではFlow履歴をリセットする。

Exportでは必要なprewarmを行ってから対象フレームを描画し、実時間やperformance.nowをFlowの結果に使用しない。

### FLOW-006 logical-frame idempotence

Transitionの複数描画、Tile Render、同一フレームの再描画がFlow状態を複数回進めてはならない。同一Render Sessionの同一論理フレームは、同じFlow出力と同じTrail状態を再利用する。

### FLOW-007 resource and capability fallback

FlowのProgram、Texture、FBO、VAO、Bufferはフレームごとに作成・破棄せず、解像度またはFlow解像度スケールが変わったときだけ再構成する。FP16 Render Targetが利用できない場合は、Framebuffer完整性を確認したRGBA8経路へフォールバックする。

Context Lost/Restored後はFlowリソースを再生成し、復元前のWebGLオブジェクトを参照しない。Flowが初期化できない場合はFlowだけを無効化し、既存の描画を継続する。

### FLOW-008 3D radial emitter and periodic curl integration

Flow Gradientの粒子は、共通の3Dエミッタ原点から決定的な球面方向へ放射する。方向、初期半径、spawn phase、lifetimeは`Seed`と粒子IDから整数ハッシュで生成し、毎フレームに新しい乱数を生成しない。

粒子位置と速度は、周期座標を入力とする3D Curl Noise場を固定ステップで積分して求める。3Dの位置・速度・深度を経由せず、画面上の2Dレーン配置だけでRibbonを構成してはならない。Loop境界では場の入力、粒子位相、lifetimeの評価が一致する。

### FLOW-009 deterministic perspective projection

3D粒子は、Flow内部で固定されたview/projection基準を使って画面へ投影する。深度は投影位置だけでなく、splatの画面上の大きさ、alphaまたはDensity寄与へ反映し、near/far範囲外またはカメラ後方の粒子は安全にクリップする。

投影は画面全体の正規化座標を基準に評価する。Tile Renderではタイルごとにカメラを再配置せず、同じ全画面投影結果からタイル領域を切り出す。固定カメラの内部値はPresetや新しいUI設定へ公開しない。

### FLOW-010 depth-aware density compositing

投影後の粒子は最終色のスプライトとして出力せず、速度方向Gaussian/capsuleの寄与をDensity FBOへ加算する。Trailを通過したDensityは指数型または同等のスクリーン相当の飽和応答で有限範囲へ再構成し、重なりが多い領域ほど高いスカラー値になる。

FlowのRGBはそのスカラー値を既存Gradient Rampへ入力して決定する。Flow Passが元画像RGBを背景として加算したり、粒子単位の固定色を最終出力したりしてはならない。低密度部は個別粒子の点や短線ではなく、平滑化された連続Fieldとして出力する。

### FLOW-011 3D render parity

Preview、Thumbnail、静止画、連番、動画、Transition、Tile Renderは、同じ3Dエミッタ、Curl積分、view/projection、論理フレームキーを共有する。同一論理フレームを複数回評価しても、深度、投影、Density、Trailの結果を余分に進めたり再乱数化したりしてはならない。

### FLOW-012 playback loop continuity

Animationの再生が有効で既存AnimationのLoop（`previewLoop`）が有効な場合、Flowは既存の`duration`、`fps`、normalized timeを使って周期再生する。再生時間は`fract(elapsed / duration)`相当で先頭へ戻り、終端フレームを重複して表示・出力しない。

Loop境界では、粒子のspawn phase、3D Curl場、view/projection、Density、Trailが同じ論理周期へ戻る。保持中のTrailを無条件に先頭へ持ち越さず、先頭位相を決定的にreset/prewarmしてから表示することで、フラッシュ、濁り、停止、視認できるジャンプを発生させない。再生開始、再開、Restart、逆方向Seekでは同じreset/prewarm規則を使う。

`previewLoop`を無効にした場合は既存Animationの非ループ挙動に従い、Flow専用のLoop Duration、FPS、時計、UIトグルは追加しない。

### UI-021 Flow controls

Flow Gradientには次の設定を表示する。数値の範囲、丸め、既定値はparameterLimitsと共通normalizerで管理する。

- Seed: 0から9999の整数
- Particle Count: 10000から500000、1000刻み
- Curl Scale: 0.1から20
- Curl Strength: 0から2
- Speed: 0から2
- Ribbon Width: 0.5から128px
- Stretch: 0から8
- Density: 0から4
- Trail: 0から1
- Contrast: 0.1から4

LoopとLoop Durationは既存Animation設定の状態を表示・参照する。Flow設定に別のLoop Durationを保存してはならない。Diffusionは表示しない。

### PRESET-016 Flow configuration persistence

プリセットはEffect PipelineのflowGradientEnabledとFlowGradientConfigを保存する。旧プリセットにFlow設定がない場合は、Flowを無効かつ安全な既定値へ正規化する。既存Particlesの設定と保存形式は変更しない。

Thumbnailの独立WebGLコンテキストでは、Flowをresetして必要なprewarmを行った後に1フレームを描画する。

### EXPORT-021 Flow parity

Preview、静止画、連番、動画、Thumbnailは同じ正規化入力と論理フレーム規則でFlowを評価する。タイル数や書き出し方式の違いによってTrailの長さ、色、位相が変わってはならない。

## MODIFIED Requirements

### FLOW-002 deterministic velocity-oriented density

Flow Gradientは、Seedと正規化時刻から決定的に生成した3D Curl Noise移流サンプルを、3Dエミッタ原点からの放射方向、速度、深度を保持したまま評価する。各サンプルを透視投影した後、速度方向を持つGaussianまたはcapsule形状のsplatとして低解像度密度FBOへ蓄積する。CPU側の粒子間近傍探索、隣接線分生成、2Dレーンだけに依存する配置は行わない。

同一のSeed、設定、正規化時刻、描画順、入力ソース、固定view/projectionから同一の論理フレームを再現できなければならない。

### EFFECT-003 fixed stage order

固定ステージの描画順を次へ拡張する。

Base → Surface → Main Stack → Prism → Flow Gradient → Particles

Normal、Prism、Particlesの既存意味論と順序は維持する。Flow GradientをMain Stackの自由な並べ替え可能レイヤーへ変更することは、この差分の対象外とする。

### SANDBOX-001 module extension

SANDBOXのモジュール一覧へFlow Gradientを追加する。Flow Gradientの選択状態は既存SANDBOX選択と同じく永続設定そのものではなく、Flowの有効フラグとパラメータはプリセット対象として扱う。

### RENDER-012 normalized render pipeline

Flowのシミュレーション状態をRender Sessionと論理フレームへ紐付ける。renderSceneAtTime、Transition、Tile Render、Exportの各入口が同じフレームを重複して進めないよう、reset、prewarm、frame deduplicationの責務を共有する。

## REMOVED Requirements

なし。
