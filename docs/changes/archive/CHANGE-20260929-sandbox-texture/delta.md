# Delta

## ADDED Requirements

### TEXTURE-001 Texture Effect Stackレイヤー

Textureは主スタックの通常レイヤーで、配置位置の前段textureへ高さ場でライティングして後段へ出力する。drag、randomize、solo、選択、永続化、render planの対象で、有効状態と順序は`effectStack`、設定は`texture`へ保存する。既定順は最後で既定は無効。Effect Stack V2だけで動作し、タイル書き出しでもフル描画と一致する。

### TEXTURE-002 高さ場・異方性反射・回折

手続き型プリセット（`brushedMetal`／`spunMetal`／`cdGroove`／`paper`）または画像の輝度を高さ場とし、法線とWard異方性反射で照明する。`diffraction`が溝直交方向のライト成分から虹色を加算する。`lightSweep`は整数回転で、Animationのループに合わせてライトを回す。

### TEXTURE-003 Texture設定の保存と外部画像

`texture`はPreset・履歴・storeへ保存し、旧Presetは無効の既定値で補完する。読み込んだ画像はセッション内だけで保持し、Preset・Thumbnailへ含めない。

### PRESET-019 Texture設定の保存互換

`texture`と`effectStack`内のTextureレイヤーを正規化して保存・復元する。画像は保存せず、未読込時は選択中の手続き型プリセットで描画する。

### UI-030 Effect Stack Texture

Textureレイヤーを選択するとPostprocessのプロパティモジュールにMaterial／Surface／Reflection／Light／Diffractionを表示する。SANDBOXには置かない。

## MODIFIED Requirements

### EFFECT-001／EFFECT-002／EFFECT-014 主スタック

変更前: 12種類、既定順は`… Diffuse → Datamosh → Cone`。変更後: 末尾に`Texture`を加えた13種類、既定順は`… Datamosh → Cone → Texture`。Postprocess全体の有効状態の判定にも`Texture`を含める。

### EFFECT-003 固定段と描画順

変更前後で固定段の順序（`Base → Surface → Main Stack → Prism → Flow Gradient → Particles`）は変わらない。Textureは固定段ではなく、主スタックの通常レイヤーとして扱う。

## REMOVED Requirements

なし。
