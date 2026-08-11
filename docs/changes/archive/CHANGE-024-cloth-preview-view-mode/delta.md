# CHANGE-024 Delta

## ADDED Requirements

### CURRENT-GRADIENT

### GRAD-015 Preview表示モード

Previewは既定の2D Canvasと、処理済みCanvasを表示する3D Clothを切り替えられる。モードは一時的な表示状態であり、GradientやCanvasサイズとは独立しPresetへ保存しない。

### GRAD-016 処理済みCanvasのClothマッピング

3D Clothは既存のGradient／Effect Stack／SANDBOX描画結果をCanvasTextureとして読み込み、独立したThree.jsクロスメッシュへマッピングする。Cloth表示のために既存処理を二重実行しない。

### GRAD-017 2D互換とフォールバック

CanvasはCloth初期化中も描画を継続する。Cloth Rendererが利用できない場合は2D Canvasへ戻り、既存のアンカー・オーバーレイ・編集UIを利用できる。

### GRAD-018 Preview表示面の書き出し

Previewの表示面を出力対象として扱う。2Dモードでは従来のGradientCanvasを使用し、3Dモードでは処理済みCanvasをCanvasTextureとしてマッピングしたClothのWebGL CanvasをPNG／JPG／WebP、連番PNG ZIP、MOV／MP4へ渡す。

### CURRENT-EFFECT-STACK

### EFFECT-020 Cloth表示アダプター

Cloth表示はEffect Stackの新しい段階ではなく、処理済みCanvasを受け取る後段の表示アダプターとする。Effect Stackの有効状態・順序・処理結果はCanvas表示とCloth表示で共通とする。

### CURRENT-VIDEO-EXPORT

### EXPORT-007 Preview表示面のフレームキャプチャ

3Dモードの動画・連番フレーム出力は、export sessionで生成した処理済み2Dフレームを3D Clothへマッピングし、マッピング後の表示Canvasをキャプチャする。2Dモードのフレーム生成とタイル出力は既存の経路を維持する。

### CURRENT-PRESET

### PRESET-012 表示モードの非永続性

Canvas／Clothの選択状態、Three.js Renderer、メッシュ、カメラはPresetの保存対象に含めない。Presetの保存・読込・Thumbnailは既存契約を維持する。Exportは保存された表示モードではなく、現在Previewで選択されている表示面を使用する。

## MODIFIED Requirements

既存のGradient、Effect Stack、Presetの描画・保存要件に対して、Preview表示アダプターの入力境界と非永続性を追記する。

## REMOVED Requirements

なし。
