# Spec Delta

## ADDED Requirements

なし。既存のGradient Generator要件を変更します。

## MODIFIED Requirements

### GRAD-011 Color Palette Generatorの対象

Color Palette GeneratorにはGradient Generatorだけを表示します。画像からの色抽出と、類似色・補色・トライアドなどの配色補助は提供しません。Gradient Rampにある既存パレットの保存・読み込みと、Image Overlay／Mask機能には影響しません。

### GRAD-012 Gradient Generatorのプレビューと操作位置

Base / Start Colorの次にGradient Previewと生成色ストップを表示し、その直後にAlgorithmを配置します。「Shuffle」と「Apply to Gradient」はAlgorithmの直後に固定表示し、Familyや可変設定の数によって位置が変わりません。

### GRAD-014 生成ストップの編集

Generator上の各色ストップを選ぶとTweeqのColor Pickerで個別に編集できます。編集はGeneratorのGradient Previewへ即時反映し、「Apply to Gradient」を押すまで現在のGradient状態を変更しません。生成値へ戻す操作も用意します。生成条件を変えると手動色編集と選択状態をリセットし、新しい生成結果を表示します。

### GRAD-026 連続軌道にもとづくGradient Generator

Gradient Generatorは選択したBase / Start Colorから色相を取得し、既存の多色生成ロジックで連続した色軌道からGradient stopを生成します。Base Colorそのものを最初のstopへ固定しません。Hue Travel入力は表示しませんが、従来の既定値0.5を内部で維持します。Color Intensity、Brightness、Contrastは既存アルゴリズムのマッピングを使い、PerceptualではBase ColorのHueから180°の色相移動を行います。stop数は3〜10です。

## REMOVED Requirements

なし。Preset形式、Gradient Ramp補間、Image Overlay／Maskの要件は変更しません。
