# Delta

## ADDED Requirements

### SANDBOX-001 TOPバーのSANDBOX入口

TOPバーに`SANDBOX`（仮称）の項目を一つ表示する。既存のTOPバーと同じホバー／クリック切り替え設定、キーボードフォーカス、モバイル左パネルの開閉を利用できる。`Normal`はTOPバー上の独立項目として表示しない。

### SANDBOX-002 SANDBOXのモジュール編集

SANDBOXを選択すると、一つの左プロパティパネル内に`Normal`、`Prism`、`Particles`の3モジュールを候補とする選択要素を表示する。選択要素はPostprocessの`Edit Layer`と同じ操作・アクセシビリティモデルを使用し、選択中のモジュールの詳細パラメータだけを表示する。各モジュールは既存の有効／無効状態、既存パラメータ、描画準備状態を編集・確認できる。選択状態は一時的なUI状態でありPresetへ保存しない。

### SANDBOX-003 Effect Stackとの責務分離

Effect StackはGradientへ順番に適用する主スタックの並べ替え、選択、ON／OFF、ランダム化、ソロ操作を提供する。Prism／Particlesの固定段トグルはEffect Stack内に表示しない。Postprocessの主スタック編集UIにもPrism／Particlesの重複した編集入口を表示せず、これらの編集はSANDBOXから行う。

### SANDBOX-004 描画契約の維持

SANDBOXへの移動後も、描画上の順序は`Base → Surface（Normal／Matcap）→ Main Stack → Prism → Particles`を維持する。SANDBOXの選択、セクションの開閉、パラメータ編集以外の操作で描画経路を変更しない。Normal、Prism、Particlesが無効な場合の既存の直接描画・中間バッファ選択も維持する。

### SANDBOX-005 保存・出力互換性

SANDBOXの選択中モジュールや開閉状態は新しいPreset保存キーを持たない。既存の`normalMap`、`effectPipeline.prismEnabled`、`effectPipeline.particlesEnabled`と各モジュールのパラメータを引き続き正規化・保存・読込する。既存Presetは設定を失わず、Preview、Thumbnail、静止画、連番、動画出力へ同じ設定を反映する。

### SANDBOX-006 Distort入口の統合

TOPバーの独立`Distort`項目を削除し、Postprocessの`Distort`を手描きDistortの唯一の編集入口とする。V2描画ではPostprocessのDistort設定を正規の入力として使用し、`manualDistort`の値が暗黙にPostprocess値を上書きしないようにする。旧Presetに保存された`manualDistort`は読み込み時にPostprocessのDistort設定へ安全に引き継ぎ、旧データの描画結果を失わない。新しい編集状態の保存では同じDistort設定を二重に正規情報として扱わない。

### SANDBOX-007 トップバーの配置

TOPバーは左から`Diffuse`、`Noise`、`Slit`、`Postprocess`、`SANDBOX`、`Export`、`Preset`の順に表示する。`Stretch`は独立項目を持たず、Postprocessのプロパティモジュールにも表示しない。PostprocessのプロパティモジュールはON／OFFと`Edit Layer`を表示し、選択したEdit Layerの詳細プロパティをその下で操作できる。SANDBOXの文字色はPostprocessと同じ通常色を使用する。

### EFFECT-014 Postprocess全体と内部レイヤーの状態

`Stretch`、`Distort`、`Mirror`、`Kaleidoscope`、`Voronoi`、`Glass`の内部レイヤーに個別ON／OFFを表示しない。内部レイヤーの有効状態はEffect Stackで管理し、一つ以上が有効ならPostprocess全体をON、一つも有効でなければOFFとして同期する。Postprocessの全体ON／OFFと選択中レイヤーの詳細プロパティは、Postprocessプロパティモジュールで表示する。

### EFFECT-013 Normal Map描画の旧経路互換

Normal Mapは、Effect Stack V2で導入された別実装によって入力画像、サンプリング解像度、RGBA法線エンコード、画面上の上下方向が変わらないようにする。代表的な同一Gradient・同一Normal設定について、Legacy V1とV2のNormal出力が同じ向き・強度・反転・角度・ベベル・ブラー結果になることを、シェーダー契約テストと実WebGL確認で検証する。Normalの出力はOpenGL形式（R=右、G=上、B=手前）を維持し、通常の色画像や後段のDistort設定で法線計算用入力を置き換えない。

## MODIFIED Requirements

### EFFECT-003 固定段と描画順

描画順の固定段契約は維持する。変更後は、固定段の有効状態とパラメータ編集のUI所有先をSANDBOXへ移し、Effect Stack UIの固定段表示を削除する。Normal／MatcapをSurface、Prismを主スタック後、Particlesを最終オーバーレイとして扱う点は変更しない。

Normalの有効化判定とSurface描画は、Legacy V1とV2で同じNormal設定を同じ法線生成処理へ渡す。V2の主スタックを導入したことだけを理由に、Normalの法線生成を別の色源・別の座標系へ変更しない。

### UI-008 Effect Stack探索操作

主スタックのランダム化、Altソロ、ドラッグ並べ替えは維持する。ランダム化・ソロ操作がSANDBOXのNormal／Prism／Particlesの状態を変更しないことを明記する。

## REMOVED Requirements

### UI-010 既存の分散した固定段入口

今回の変更で追加する要件により、TOPバーの独立`Normal`入口、TOPバーの独立`Distort`入口、Effect Stack内のPrism／Particles固定段トグル、PostprocessのPrism／Particles重複編集入口を廃止する。Normal／Prism／ParticlesはSANDBOXの選択要素へ、DistortはPostprocessの`Edit Layer`へ集約する。保存データ上の設定や描画段そのものは、互換処理を除いて廃止しない。
