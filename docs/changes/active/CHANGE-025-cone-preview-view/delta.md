# CHANGE-025 Delta

## ADDED Requirements

### CURRENT-GRADIENT

### GRAD-019 3D Cone表示面

Previewは処理済みCanvasを円錐内面へCanvasTextureとして割り当てる3D Cone表示面を選択できる。Canvasの横方向は円周、縦方向は頂点から開口部へ対応する。キャンバス上の頂点ハンドルで開口部を中央に保ったまま頂点をCanvas外まで移動でき、Apex X／Apex Yは正規化値-2..2（Canvasの幅・高さに対して最大50%外側）へ制限する。リセット操作で中央へ戻せる。開口部は表示領域の対角線を覆うため、Canvas外に背景を露出しない。

### GRAD-020 Cone Texture Flow

ConeのTexture Flowは共通のnormalizedTimeと整数Flow Cycles（-30..30）から位相を決める。停止、シーク、正逆方向、Preview、静止画、連番、動画で同じ設定と時刻を使い、ループ境界は整数テクスチャオフセットへ戻る。円周方向と高さ方向の反復境界は0..0.5のSeam Blend幅とSeam Modeで連続化し、絵柄全体の反転・引き延ばしサンプルを無条件に重ねないため、Flow中の移動方向を維持し、硬い直線または円形の切れ目を表示しない。Mirror Repeatは反復座標を鏡面反射して値の不連続をなくし、Edge Weldは継ぎ目近傍の両端色を不透明な色サンプルとして連続的に溶接する。2方式はモードとして切り替えられる。Mapping設定を変更した場合も、直近の処理済みCanvasを同じ時刻で即時再マッピングする。

### CURRENT-EFFECT-STACK

### EFFECT-021 Cone表示アダプター

Cone表示はEffect Stackの段ではなく、処理済みCanvasを受け取る後段の表示アダプターとする。既存のCloth Baseを含む有効なGradient／Effect Stack／SANDBOX結果を一度だけCanvasTextureとして読み込み、unlitな円錐内面へ表示する。

### CURRENT-PRESET

### PRESET-013 Cone設定の永続化

ConeのDepth、Rotation、Apex X、Apex Y、Texture Repeat、Seam Blend、Seam Mode、Flow Cycles、MappingはPresetへ保存する。Depthは2..30、Apex X／Apex Yは-2..2、Flow Cyclesは-30..30へ正規化し、PerspectiveとWrapped Smoothは旧Presetに残っていても無視してEdge Weldへ戻す。値がない旧Presetは既定値を使用し、不正値は安全な範囲へ正規化する。Cone Renderer、Geometry、Camera、Cloth／Coneの表示状態は保存しない。

### CURRENT-VIDEO-EXPORT

### EXPORT-008 Cone表示面のフレームキャプチャ

Coneモードの動画・連番出力は、export sessionで処理済み2Dフレームを生成してから同じnormalizedTimeでCone CanvasTextureを更新し、Cone表示Canvasをキャプチャする。Preview RAFによる上書きや元の2D Canvasだけの出力を許可しない。

### CURRENT-UI-CONTROLS

### UI-019 SANDBOX Edit LayerとCone設定

SANDBOXは専用のPreview Surface選択を表示せず、Edit LayerでCloth／Coneを同じ粒度のモジュールとして選択する。Cloth／ConeのON/OFFで対応する3D表示と2D Canvasを切り替える。Cone編集モジュールではMappingとCone設定に加えて、Mirror Repeat／Edge Weldを切り替えるSeam Modeを表示する。頂点位置はプレビュー面上のハンドルで変更し、リセットUIを提供する。Gradient Rampは右サイドバーのみで表示し、グラデーションアンカー非表示操作はCone頂点ハンドルにも適用する。表示状態はPresetへ保存しない。

## MODIFIED Requirements

### GRAD-015 Preview表示モード

Canvas／Clothの2択をCanvas／Cloth／Coneの3表示へ維持しつつ、専用の切り替えUIを削除する。Cloth／ConeモジュールのON/OFFから対応する表示面を切り替え、既定値とPreset読込後の表示は2D Canvasを維持する。

### EFFECT-020 Cloth表示アダプター

Cloth固有の表示面切替UIの所有を解除し、ClothモジュールのON/OFFで表示を切り替える。ClothのCanvasTexture、変形、ライティング、フォールバック契約は変更しない。

### PRESET-012 Preview表示モードの非永続性

非永続の表示状態へConeを追加する。Cloth／ConeのON/OFF状態は保存せず、Cone固有パラメータはPRESET-013に従って保存する。

### EXPORT-007 Preview表示面のフレームキャプチャ

2DとClothの分岐を任意の選択中表示アダプターへ一般化し、ConeはEXPORT-008の同期マッピング後Canvasを使用する。

## REMOVED Requirements

なし。
