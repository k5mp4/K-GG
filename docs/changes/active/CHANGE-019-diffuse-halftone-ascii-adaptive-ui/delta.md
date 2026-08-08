# Delta

## ADDED Requirements

### EFFECT-015 DiffuseのHalftoneとASCII

DiffuseはBlock、Smooth、Ditherに加えてHalftoneとASCIIを提供する。Halftoneは円形または四角形のセルを選択でき、セルサイズと形状サイズを持ち、入力色の濃度に応じて形状の占有率を変える。ASCIIは保存された文字セットを濃度順に割り当て、セルごとに対応文字を描画する。HalftoneとASCIIの空白部分は保存された背景色（既定値`#000000`）で塗り、通常描画とEffect Stack描画は同じ設定値を使う。

ASCIIアトラスはCanvasの行順を維持してアップロードし、シェーダーはアトラス座標をそのままサンプリングする。アトラスのrow 0（先頭の文字）がキャンバス上で正しく表示される。

### EFFECT-016 Diffuseの適応ソースと粒度

Diffuseの適応ソースは輝度、色相、彩度から選択できる。選択した値をX軸として拡散量Bezierを評価する。粒度適応を有効にした場合は独立した粒度Bezierをベースセル単位の代表色へ評価し、ベースセル内の座標を固定したまま形状サイズをセルサイズ比（`cellSize / baseSize`）でスケールする。これによりHalftoneの円形・四角形とASCII文字がセルサイズに応じて拡大縮小し、フラグメント境界で崩れない。無効時は既存の輝度カーブと固定粒度の挙動を維持する。

### EFFECT-017 Slitの速度同期

AnimationとSlitが有効な場合、Slitは`animMode`、`offsetSpeed`、`phaseSpeed`で動作する。キャンバス再生と書き出しはEasing・Animation Speed・Durationを反映した同じ秒ベースのアニメーション時計を使い、旧Presetに残る`autoLoop`は読み込み時に破棄する。

### UI-011 Diffuseのモードと適応カーブ

DiffuseのモードはTweeqのInputDrumでBlock、Smooth、Dither、Halftone、ASCIIから選択する。Halftoneの形状はInputRadio、ASCII文字セットはInputString、Halftone／ASCIIの背景色はInputColorで編集し、適応カーブはTweeq InputCubicBezierを中心としたコンパクトな行で表示する。

### UI-012 Slitのモーション速度

SlitはLoop／PingPongのMode、Offset Speed、Phase Speedだけを表示する。Timeline Loop切替と、それに伴うAnimation durationへの自動同期・速度上書きは表示・動作ともに持たない。

### UI-013 共通Tweeq入力への統一

StretchのGlow TintはTweeq InputColor、Postprocess DistortのBrush ModeはTweeq InputRadioで編集する。保存値と描画上の意味は変更しない。

## MODIFIED Requirements

### EFFECT-001 主スタックの効果

Diffuse自体のレイヤー数・順序モデルは変更しない。ただしDiffuseレイヤーが参照する保存設定にHalftone、ASCII、適応ソース、粒度カーブの項目を追加する。

### EFFECT-005 旧Presetとの互換性

旧Presetに新しいDiffuse項目がない場合は、既定値（既存の3モード、円形Halftone、提案されたASCII文字セット、背景色`#000000`、適応無効、粒度適応無効）で補完する。既存のDiffuseモード値は変更せず読み込む。

### UI-003 Slitの選択コントロール

SlitのModeとMotionのInputDrum／InputRadio表示は維持する。Timeline Loop切替は削除し、Loop／PingPongの速度はOffset Speed／Phase Speedで調整する。

## REMOVED Requirements

### UI-007 Diffuseの大きなカーブプレビュー

Diffuse適応カーブに付随する大きなSVGプレビューとヒストグラム表示を廃止する。TweeqのInputCubicBezierと適応対象・有効状態をコンパクトに表示するUIへ置き換える。保存データとカーブ編集機能は廃止しない。

### UI-008 ネイティブ色入力

StretchのGlow Tintで使っているネイティブ`input type="color"`を廃止し、Tweeq InputColorへ置き換える。色の保存形式は`#RRGGBB`を維持する。

### UI-009 Distort Brush Modeの独自ボタン

Postprocess DistortのBrush Modeで使っている3個の独自ボタンを廃止し、同じ3値をTweeq InputRadioで表示する。
