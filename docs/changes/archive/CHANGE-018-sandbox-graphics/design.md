# Design

## UI構成

TOPバーは左から`Diffuse`、`Noise`、`Slit`、`Postprocess`、`SANDBOX`、`Export`、`Preset`の順に固定する。`Stretch`はトップバーとPostprocessのプロパティモジュールから外す。PostprocessのプロパティモジュールはON／OFFと`Edit Layer`を表示し、選択したレイヤーの詳細プロパティをその下へ表示する。SANDBOXは既存の左パネルスライド機構を利用し、専用の`SandboxPanel`から3つのモジュールを描画する。SANDBOXのトップバー文字色はPostprocessと同じ通常色にする。

レイアウトは、Postprocessの`Edit Layer`と同じ`CustomSelect`形式の選択要素を上部に置き、その下に選択中モジュールの短い説明・ON／OFF・描画準備状態・詳細コントロールを表示する。選択肢は`Normal`、`Prism`、`Particles`の3つで、初期選択はNormalとする。狭い画面では既存の左パネル／モバイルドロワーのスクロールを利用する。

## コントロールの再利用

- Normalの既存コントロールはSANDBOXのNormalセクションへ移す。
- PostprocessPanelにSANDBOX埋め込みモードを追加し、既存のPrism／Particlesパラメータ編集分岐をSANDBOXから再利用する。主スタック表示時はそれらの選択肢を除き、同じパラメータへ重複した入口を残さない。
- 有効化はNormalが`normalMap.enabled`、Prism／Particlesが`effectPipeline.prismEnabled`／`effectPipeline.particlesEnabled`を引き続き使用する。
- Prism／Particlesの詳細設定は`postprocess`の既存パラメータを使用し、別の状態や変換層を作らない。
- SANDBOXの選択はUI状態だけで、描画順やPreset状態へ影響させない。

## 既存UIの整理

`PostprocessPanel`は主スタックから選択されたDistort、Mirror、Kaleidoscope、Voronoi、Glassなどの編集を担当する。Prism／Particlesを編集する選択肢と専用分岐をSANDBOXへ移し、同じパラメータへ複数の入口が残らないようにする。TOPバーのDistortは削除し、手描きDistortの編集・描画源をPostprocessのDistortへ集約する。

`PostprocessStackPanel`の`Fixed`領域からPrism／Particlesの行を削除する。Effect Stackの描画計画、状態表示、別ウィンドウの仕組みは主スタック用として維持する。

## 描画修正

V2の`Base → Surface → Main Stack`経路で、Normalの法線生成用入力を旧Legacy経路と比較できる共通の入力契約へ揃える。Normal Mapの高さサンプルは同じ輝度係数、画面座標、ベベル幅、Strength、Invert、Angleを使い、Blurは法線テクスチャへの既存のGaussian処理として適用する。法線生成用の入力と、後段の色画像処理用の入力を混同しない。実装後はLegacy／V2の代表ケースを比較し、NormalのRGBA向きと画素結果を確認する。

## Distortの状態と互換性

PostprocessのDistort設定を新しい正規の編集・描画源とする。`manualDistort`を持つ旧Presetは、Postprocess側のDistort設定が欠落している場合に限り同値へ補完し、旧作品の手描きマップを失わない。V2の描画では`manualDistort`をPostprocessへ無条件にspreadして上書きしない。Legacy V1を読むために必要な旧フィールドは互換入力として保持し、新規編集時の二重更新や二重保存を避ける。

## 状態と互換性

SANDBOX内の選択中モジュールはReactの一時UI状態とし、Presetへ保存しない。描画計画は既存の`normalMap`と`effectPipeline`を参照する。Distortの正規化では旧`manualDistort`入力を読み込み互換に限定して扱い、既存Presetの手描きマップを失わず、PostprocessのDistortを正規の編集状態として出力する。

## 代替案

- 3つを別々のTOPバー項目にする案は、今回解決したい入口の分散を残すため採用しない。
- Effect Stackの固定段を可動レイヤーとして主スタックへ混ぜる案は、描画順と既存のEffect Stack契約を変えるため採用しない。
- PostprocessPanelをSANDBOXの名前だけに置き換える案は、Normalが別入口のまま残り、固定段UIの重複も解消しないため採用しない。
