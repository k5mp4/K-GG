# Design

## 保存モデル

`DiffuseConfig`へ次の値を追加する。旧Presetは`STORE_DEFAULTS.diffuse`とのマージで補完し、既存の`mode`値はそのまま保持する。

- `halftoneShape`: `circle | square`
- `halftoneSize`: 0〜1のセル内占有率
- `asciiCharset`: ASCII描画に使う非空の文字列
- `adaptiveChannel`: `luminance | hue | saturation`
- `grainAdaptiveEnabled`: 粒度Bezierを使うか
- `grainAdaptiveAmount`: 粒度カーブの影響量
- `grainBezier`: 粒度適応用Bezier

Diffuseの既存`luminanceBezier`は拡散量カーブとして維持し、名前とPreset互換性を壊さない。描画時の適応入力はRGBから次のように求める。

- luminance: `dot(rgb, vec3(0.299, 0.587, 0.114))`
- saturation: HSVのS
- hue: HSVのH。彩度がほぼ0の場合は0

## WebGL描画

通常描画シェーダーとStack描画シェーダーへ同じDiffuse uniformを追加する。Halftoneはフラグメント色をサンプルし、適応入力の値を形状の占有率へ変換する。ASCIIは`asciiCharset`からCanvas 2Dで生成した小さなグリフアトラスをWebGL textureへアップロードし、フラグメント濃度を文字インデックスへ、セル内座標を固定アトラスグリッドのグリフ座標へ変換する。アトラスは文字列変更時だけ再生成する。Ditherだけは従来どおりセル中心サンプリングを使う。Halftone／ASCIIの空セルには暗部の可視色を残し、セル出力を不透明にしてキャンバスの黒い裏面が見えないようにする。

既存のDiffuse適応曲線テクスチャは拡散量用として維持し、粒度用に別の1行LUTを追加する。新しいモードで必要なuniform／textureが存在しない旧プログラムでは、既存モードのフォールバック値を使う。

## Slitの時間

Scene evaluationでSlitへ渡すアニメーション時計を`autoTime * animation.speed * animation.duration`の秒値へ統一し、キャンバスと書き出しで同じLoop／PingPong位相を使う。Slitの速度は`offsetSpeed`と`phaseSpeed`をそのまま使い、Timeline Loopによる速度1への上書きは行わない。旧Presetに残る`autoLoop`は読み込み時に破棄し、現在の保存値へ再出力しない。明示的なキー設定または`affectSlit`がある場合は既存のAnimationトラックを優先する。

## UI

Diffuseのモードは5値のInputDrumへ変更する。Halftone／ASCIIに必要な項目は選択モード時だけ表示し、適応カーブは対象選択・有効トグル・Bezier入力を1〜2行のコンパクトなブロックで表示する。DiffuseCurveEditorは履歴ヒストグラムと大きなSVGを持たず、InputCubicBezierの薄いラッパーにする。

Stretchは`InputColor`、Distort Brush Modeは`InputRadio`へ置き換え、既存の保存値・ラベル・描画契約は変えない。
