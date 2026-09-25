# Design

## 採用する実装方針

Coneを通常の`EffectStackKind`としてMain Stackの順序付きレイヤーへ追加します。render planはConeの位置に通常のstack passを生成し、前段の描画textureをCone投影に使います。Coneは独立表示面やSANDBOXモジュールではありません。

Cone passは画素ごとに仮想カメラからのレイと円錐面の交点を計算し、その位置から円周Uと高さVを得ます。既存のCone mapping／seam座標ロジックで前段textureを参照し、結果を通常のping-pong destinationへ書き込みます。`u_gradientRamp`をConeの色源に使わず、直前のtextureのRGB／alphaを投影結果として維持します。Gradient Reapplyは既存のshared seam shaderでRGBを補正し、中心サンプルのalphaを保持します。

## データモデルと正規化

`EffectStackKind`へ`cone`を追加し、Coneを有効状態・並べ替え・randomize・solo・render planの通常対象とします。設定値は既存の`coneView`、レイヤー順・有効状態は`effectPipeline.effectStack`に保存します。専用のCone有効状態や別のselection unionは追加しません。`selectedKind`は`EffectStackKind`を使います。

`KggControlRuntime`のeffects一覧・enable／reorder／resetは同じ正規化済みEffect Stackを参照し、`kgg-control`の型とscenario allowlistにもConeを含めます。

既存SnapshotにConeレイヤーがない場合は、正規化時に無効なConeレイヤーを補完します。これにより旧Presetの見た目を維持しつつ、Coneを明示的に有効化できます。

## UIと状態管理

ConeはPostprocess Stackの通常rowとして表示し、他レイヤーと同じdrag／randomize／solo／選択／toggleを使います。Cone設定はそのレイヤー選択時にPostprocessパネルへ表示します。Apex編集は既存のCanvas上のCone Apex handleで行います。SANDBOXのEdit Layer一覧とアクティブ数からはConeを除外します。

旧`renderViewMode: 'cone'`入力が存在する場合は、ConeをMain Stackで選択・有効化する互換変換を行い、Main Stack外への切替は行いません。Cloth表示アダプターと既存の一時的なCanvas／Cloth選択は維持します。

## 描画・Preview／Export

Main WebGL rendererの通常のstack loopがCone用`stackCore` shader programを選び、`u_sourceTex`として直前のlayer outputを渡します。Cone投影はそのtextureをUV変換後にサンプルします。Coneのping-pong outputをcurrent textureとして更新するため、後続レイヤーもConeの結果を受け取ります。

PreviewとExportはどちらも同じEffect Stack render plan、WebGL pass、Cone設定を使用します。Flow Mappingへ対象フレームのnormalized timeを渡し、Direct ProjectionではV offsetを固定します。スタンドアロンのCone rendererコードは参照／既存テスト用に残しますが、主Preview／Export出力経路には接続しません。

## 変更対象の主要ファイル

コード:
- `src/types/distortion.ts`
- `src/lib/effectPipeline.ts`
- `src/lib/webgl.ts`
- `src/lib/webglShaderSources.ts`
- `src/shaders/postprocess/main.glsl`
- `src/shaders/postprocess/uniforms.glsl`
- `src/components/PostprocessStackPanel.tsx`
- `src/components/PostprocessPanel.tsx`
- `src/features/workspace/CanvasWorkspace.tsx`
- `src/features/workspace/useWorkspaceController.ts`

テスト:
- `src/lib/effectPipeline.test.ts`
- `src/lib/webglShaderSources.test.ts`
- `src/lib/renderFrame.test.ts`
- `src/store/gradientStore.effectPipeline.test.ts`
- `src/components/PostprocessStackPanel.test.tsx`
- `src/components/PostprocessPanel.test.tsx`
- `src/components/SandboxPanel.test.tsx`

## 代替案とトレードオフ

- ConeをMain Stackから分離する案は、ユーザーが求めるstack内の順序変更・後段への出力を実現できないため採りません。
- Cone用Gradient Rampを再サンプルする案は、前段textureの色場を失うため採りません。Cone表面UVで入力textureをサンプルし、既存seam補正だけを適用します。
- 既存Cone geometry rendererをstack passとして再実装せず、ray-cone intersectionによるWebGL passを使います。通常のstack ping-pongとPreview／Export共通経路を保つ一方、GPUでの目視確認を要します。

## 移行方法

Preset schemaに新しい専用フラグを追加しません。既存`effectPipeline.effectStack`正規化でCone layerを補完します。Coneが欠落する旧snapshotの補完レイヤーは無効、選択状態は既存の安全な既定値へ正規化します。既存Cone設定オブジェクトは引き続き`coneView`として読み込みます。

## ロールバック方法

この変更とCurrent Spec更新をまとめて戻せば、Cone layer追加前のEffect Stackへ戻せます。新しいPresetに保存された`kind: 'cone'` layerは旧normalizerで破棄または無視される可能性があるため、ロールバック後に再保存するとConeの有効状態・順序情報を保持できない場合があります。Current SpecとCapsuleを同時に戻し、active indexの参照を外します。
