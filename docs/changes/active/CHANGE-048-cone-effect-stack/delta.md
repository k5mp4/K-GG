# Delta

## ADDED Requirements

なし。Coneのstack参加・投影結果の伝播・色保持契約を既存要件へ追加します。

## MODIFIED Requirements

### EFFECT-003 固定段と描画順

Coneは固定段ではなく、Main Stack内の通常の順序付きレイヤーです。Coneを含むレイヤーの有効状態と順序はrender planに反映され、Cone passは前段textureを変換してping-pong outputへ書き込みます。後段レイヤーはこの結果を入力として使います。Normal/Matcap、Prism、Flow Gradient、Particlesなど他の固定段の既存順序は変わりません。

### EFFECT-014 Postprocessの全体有効状態

Cone layerが有効な場合は他のPostprocessレイヤーと同様にPostprocess全体を有効状態として表示します。Coneの有効状態を別の表示段フラグとして管理しません。

### EFFECT-021 Cone Effect Stackレイヤー

Coneを`EffectStackKind`へ追加し、選択、ON/OFF、drag、randomize、solo、Preset永続化、render planの順序変更に対応させます。Cone passは前段Main Stack textureを円錐面へ投影し、入力textureの色場を保った出力を後段へ渡します。専用Gradient Ramp再サンプリングやMain Stackと独立した描画経路は設けません。SANDBOX Edit Layerからは除外し、既存Cone設定とCanvas上のApex編集を維持します。PreviewとExportは同一WebGL stack passを使用します。

外部control APIのEffectState一覧はConeを返し、enable／reorder／resetおよびscenario commandを通常のEffect Stack layerとして扱います。

### SANDBOX-001 SANDBOX パネルモジュールの拡張

SANDBOXモジュール一覧からConeを除外し、Cloth、Normal、Prism、Particles、Flow Gradient、Seamlessの6項目とアクティブカウント`/6`を表示します。Coneは通常のMain Stack layerとしてEffect Stackから管理します。

### UI-019 Effect Stack Cone layerと設定

Coneは通常の自由順序レイヤーとして表示し、他のレイヤーと同じ選択、ON/OFF、drag、randomize、soloに対応します。Cone設定は左Postprocessパネルで編集し、Apexは既存のCanvas上ハンドルで操作します。Gradient Rampは前段textureに適用され、Cone passはその色場を保持します。

### GRAD-015 Preview表示アダプター

ConeはMain Stackのrender plan位置で通常のWebGL passとして描画されます。SANDBOXのCloth表示アダプターとCanvas表示のどちらも、同じMain Stack出力を入力として使用します。Cone専用の表示面は持ちません。

### GRAD-018 Preview表示面の書き出し

ExportはPreviewと同じrender planを使用します。Cone layerが有効な場合、その順序位置で前段textureを投影した結果と後段レイヤーを含むCanvasをキャプチャします。独立Cone Canvasは使用しません。

### GRAD-019／GRAD-020／GRAD-022 Cone projection、Texture Flow、Color Reapply

Cone passはray-cone intersectionから円周Uと頂点から開口部へのVを求め、前段textureのRGB／alphaをUVサンプルします。Flow／Direct Projection、Depth、Apex、Rotation、Texture Repeat、Mirror Repeat／Edge Weld／Gradient Reapplyを維持します。Gradient Reapplyはshared seam shaderによって前段textureのRGBを補正し、中心サンプルのalphaを保ちます。

### PRESET-012／PRESET-013／PRESET-017 Cone設定とstack順序の保存

Cone設定は既存`coneView`へ、Coneの有効状態と順序は`effectPipeline.effectStack`の`kind: cone` layerへ保存します。旧SnapshotにCone layerがない場合は無効レイヤーを補完します。専用のCone有効状態は追加しません。

### EXPORT-007／EXPORT-008 PreviewとExportの共通描画

PreviewとExportの各フレームは同じMain Stack render planを実行します。Coneは前段textureを読み、ping-pong outputへ書き込み、後続レイヤーへ結果を渡します。Flow mappingとseam処理は対象時刻で一致し、別のCone renderer/canvas同期処理を挟みません。

## REMOVED Requirements

旧SANDBOX Cone選択と独立Cone Canvasを使うmain preview／export routingを、Main Stackの通常レイヤー処理に置き換えます。
