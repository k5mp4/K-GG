### ライセンス / 利用規約

K-GG のソースコードは Apache License 2.0 の下で配布されます。
© 2026 ke-go.

本アプリケーションを使用して生成された画像、動画、その他の素材は、個人利用・非商用利用・商用利用を問わず利用できます。

本アプリケーション自体の利用、複製、改変、再配布は Apache License 2.0 に従って行うことができます。詳細はリポジトリの `LICENSE` を参照してください。

生成物の利用にあたって、第三者の著作権、商標権、イベントロゴ、キャラクター、その他の権利を侵害しないよう、利用者自身の責任で確認してください。

#### 第三者ソフトウェア

K-GGのTauriデスクトップ版は、MOV / MP4動画書き出し時に利用者がK-GG専用フォルダへ配置したFFmpeg、またはPATH上の外部FFmpegを別プロセスとして呼び出します。K-GGはFFmpegを同梱・配布しておらず、ffmpeg.wasmも使用していません。

FFmpegは主にGNU Lesser General Public License version 2.1 or laterの下でライセンスされています。ただし、利用するビルドにGPLコンポーネントが含まれる場合はGPLが適用されます。案内先のgyan.devによる推奨ビルドはGPLv3です。FFmpegのライセンスはFFmpegおよび関連コンポーネントに適用され、K-GGのApache License 2.0とは別に扱われます。

K-GG は React、Tauri、fflate、ogl、tweeq、zustand、react-markdown などの第三者ライブラリを使用しています。現在の依存関係は MIT、Apache-2.0、BSD、ISC 系が中心で、Tauri/Rust 依存ツリーには MPL-2.0 のコンポーネントが含まれます。第三者ライセンスの要点はリポジトリの `NOTICE` に記載しています。


Web 版は `index.html` で Google Fonts から Noto Sans JP、Open Sans を読み込んでいます。オフライン配布やプライバシー要件を重視する配布では、フォントをセルフホストし、該当フォントのライセンスファイルを同梱してください。

- FFmpeg: https://ffmpeg.org
- FFmpeg Windows builds: https://www.gyan.dev/ffmpeg/builds/
- FFmpeg license information: https://ffmpeg.org/legal.html
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- LGPL v2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html

## K-GG 使い方ガイド

## 基本設定 (右パネル)
- **Canvas Size**: 出力解像度を設定します。
  - **Full HD / HD / 400x400 / 800x800**: セレクトから切り替え。初期値はFull HD（1920x1080）です。
  - **W / H**: 直接数値を入力。マウスホイールで±1、Shift+ホイールで±10の調整が可能です。
  - **南京錠アイコン**: アスペクト比を固定します。
- **Gradient Ramp**: 解像度の直下にある主要編集領域です。グラデーションの各ポイントの色と位置、不透明度を調整できます。
  - Ramp内の「Color Palette Generator」から、画像の色をグラデーションストップとして抽出・適用できます。
- **Image Overlay / Mask**: 折りたたみセクションから画像の重畳またはアルファマスクを設定します。
- **Gradient type**
  -Linear/Radial/4-color/Diamond/Angle/Bezier/Mesh Gradationのグラデーションタイプを選択可能です。
  - **Mesh Gradation** はN×Mの格子点を持つCoons Patchグリッドです。外側とキャンバス内部の全格子点をドラッグして変形し、各セルの共有エッジをダイヤモンド型のハンドルで曲げられます。色は右サイドバーのMeshセクションで2モードを切り替えられます: **Ramp（既定）** はメッシュ全体を共有グラデーションランプで下→上に塗り、ランプ編集が全体へ追従します。**Direct** は点をクリック→色スウォッチ→カラーピッカーで各点のHexを個別編集できます。行・列の点数（2〜8）も同じ場所で変更できます。previewとexportは同じWebGLテクスチャ経路を使います。自己交差した形状の結果は保証されません。
  - Kagaribi-15-BGはKV背景に極力寄せたグラデになっています
- **Image Gradient Source**: 折りたたみセクションから、画像の輝度またはRGBチャンネルを現在のGradient Rampで再配色します。画像はCoverで配置され、画像本体はプリセットへ保存されません。
    - **Sキー**: ハンドル・複数ポイントのスケール
    - **Aキー**: ポイントを全選択
    - **Gキー**: キャンバス上を移動(+X/Yキーで軸の制限)

## エフェクト設定 (左パネル)

### Diffuse (拡散/ブロックノイズ)
- グラデーションへ決定的な拡散を加え、V2では画像系処理の最終段に固定されます。
- **SmoothはKV背景を基準にした、格子感を抑えた拡散方式です。**
- `Scatter` で拡散量、`Grain` で粒の細かさ、`Seed` で分布を調整します。
- Block/Smoothでは `Apply` でNoiseとの関係を選べます。`Noise Linked`（既定）はNoiseと合成され、Noiseより後ろのどこに置いても同じ見た目です。`Uniform` はStack上の位置でそれまでの画像を均一に散らします。

### Noise (ノイズ歪み)
- 各種ノイズを用いて、グラデーションを複雑に歪ませる
- `Strength` で歪みの強さを、`Scale` でノイズの細かさを調整
- **Curl/Domain Warp辺りがいい感じの質感になります**
- Seamless は極座標で切れ目のないテクスチャが生成される
  - Radial(Expand)は中央から外側に広がる形でオススメ

### Postprocess Effect Stack
- キャンバス左上の `Effect Stack` パネルで、Noise / Slit / Stretch / Distort / Mirror / Kaleidoscope / Voronoi / Glass / GlassTile / Diffuse の順序を変更できます。Diffuseは初期状態では最後尾です。
- GlassはGLASS V2による滑らかな勾配ノイズとRGB別屈折率を使う画面空間の光学近似です。PostprocessのプロパティにはGlassを一つだけ表示し、色収差は最大80px、Transmission TintとHighlight Tintはカラー入力から調整できます。
- GlassTileはGlassとは別のエフェクトで、KG_Glassのタイル表面モデルを使います。Pattern、タイルサイズ、表面形状、屈折・分散、粗さ、Mix、Edge Mode、Seedを調整できます。
- 行のグリップをドラッグすると、行が目的位置へ収束してから描画順序が確定します。各行のスイッチでレイヤーをON/OFFできます。
- 手描きの`Distort`はPostprocessの`Edit Layer`から編集します。旧Presetの`manualDistort`は読み込み時にPostprocessへ移行されます。
- Postprocessの全体ON／OFFは、Effect Stack内のStretch／Distort／Mirror／Kaleidoscope／Voronoi／Glass／GlassTile／Datamosh／Coneの有効状態を反映します。
- DatamoshはEffect Stackのレイヤーで、前フレームの出力を不規則なブロックに分けたモーション場（前段のNoiseなどのアニメーションから推定したAnimation Flow、Curl Noise、または読み込んだ動画のVideo Motion）に沿ってずらして再利用します。Block Lockを下げると、ブロック単位ではなく画素ごとにアニメーションの流れへ沿って引き伸ばします。Luma／Saturation Stretchで明るい・鮮やかな画素ほど長く引き伸ばし、Refreshを下げるほど履歴が残ります。SourceをPixel Stretchにすると、Threshold以上の明るい画素がフレームごとにAngleの方向へ伸び（明るい画素からLengthまで）、伸びた画素はそのまま描画に残ります。Curlを上げると伸びる向きがcurlノイズの力場に沿って場所ごとに変わり、渦を巻くように伸びます。Curl Loopsで、タイムライン1ループの間に力場が変化して元へ戻る回数を決めます。Refreshを0にすると残し続けます。設定はPostprocessのEdit Layerで`Datamosh`を選んで編集します。履歴はアニメーションのフレームごとに進むため、タイムラインを再生して確認します。各レイヤーの個別ON／OFFはEffect Stackで操作し、Postprocessプロパティでは選択レイヤーの詳細を編集します。
- Effect Stackヘッダーのシャッフル操作で主スタックの順序をランダム化できます。現在の見た目から新しい順序へ滑らかに遷移します。行またはオンオフToggleをAltクリックすると、そのレイヤーだけを有効にするソロ操作になり、ソロ化で一時的に非表示になったレイヤーは黄色の`STAY`で示されます。同じ対象をもう一度Altクリックすると元の有効状態へ戻ります。
- Effect Stackは別ウィンドウへ切り離せます。別ウィンドウを閉じるとインライン表示へ戻ります。
- 固定段は `Surface → Main Stack → Prism → Particles` です。ConeとDatamoshはMain Stack内の通常レイヤーとして前段textureを処理し、出力を後続レイヤーへ渡します。Normal、Prism、Particlesはトップバーの`SANDBOX`から編集し、DiffuseはMain Stack内の位置で一度だけ適用されます。
- 画面やGPU描画が壊れた場合は、トップバーの設定モーダル（Hover / Click only）にある `Refresh app` でアプリを再読み込みできます。未保存の編集状態は破棄されます。


### Slit (スリットスキャン)
- 特定の軸方向にピクセルを引き伸ばすエフェクトを適用します。
- Animateを有効にすることでアニメーション可能です
- **PingPongは仕組み上動きの破綻がないです**

### SANDBOX
- トップバーは `Diffuse → Noise → Slit → Postprocess → SANDBOX → Export → Preset` の順で、Stretchは独立項目およびPostprocessのプロパティモジュールに表示しません。PostprocessではEdit Layerを選択し、その詳細プロパティを操作できます。SANDBOXの文字色はPostprocessと同じです。
- グラデーションの主スタックとは別に、Cloth、Normal、Prism、Particles、Flow Gradient、Seamless、Shapesの7モジュールを一つのパネルから編集できます。ConeはSANDBOXに含めず、Effect Stackの通常レイヤーとして扱います。
- `Shapes` はSVGの形状を連続した輝度の場に変え、右サイドバーのGradient Rampで着色する最終段です（サーモグラフィやdepthパスのような見た目）。`Source`で円・星・文字のアウトラインか、`SVGを読み込む`で読み込んだSVGを選びます。SVGは形状（アルファ）だけを使い、色やスタイルは無視します。`Edge`のSoftnessで輪郭をなめらかにし、Inner Shadowで縁へ向かって暗くなる奥行きを作ります。`Fill`でフロー（流体のようなノイズ）、リップル（奥行きに沿って進む帯）、ストライプ、K-GGの描画の輝度のいずれかを内部で動かし（Fill CyclesはAnimation 1ループの周期数）、`Gradient`でオーラ・Contrast・Grainを調整します。`Show / Hide Loop`の`Mode`（フェード＋発光、ワイプ、ネオン点滅、常に表示）で、Animationの各ループ内に表示・非表示を`Cycles`回繰り返します。読み込んだSVGはPresetへ保存されず、未読込のときは星で描画します。

- `Texture` はEffect Stackのレイヤーで、それより上のレイヤーの結果へ高さ場でライティングし、異方性反射の質感を重ねます。`Source`は手続き型（ヘアライン金属、旋盤仕上げ金属、CDの溝、紙）または読み込んだ画像の輝度で、画像は`Cover`／`Tile`で配置します。`Roughness`と`Anisotropy`でハイライトの広がりと伸びを、`Metallic`で色の付き方を、`Light Angle`・`Light Height`・`Light Sweep`（Animation 1ループでライトが回る回数）でライトを、`Diffraction`でCDの虹色を調整します。読み込んだ画像はPresetへ保存されず、未読込のときは選択中のプリセットで描画します。
- `Normal` はグラデーションの輝度勾配から法線マップを生成します。`Strength`、`Blur`、`Angle`、`Bevel Size`で表面の凹凸を調整します。
- `Prism` は主スタック後段の光線・グロー、`Particles` は最終オーバーレイのパーティクルを調整します。
- `Edit Layer`の選択要素から各モジュールを一つずつ表示して編集します。選択を変更しても描画順は変わりません。
- ConeはEffect Stackで選択・ON/OFFでき、他レイヤーと同じdrag、randomize、soloに対応します。Cone passは直前のstack textureを円錐面へ投影して色場を保ち、その描画結果を後続レイヤーへ渡します。ApexはCanvas上の単一シアン円形ハンドルをドラッグして編集でき、正規化位置は-2..2に制限されます。補助リング・十字線・内側マーカーは表示せず、リセットボタンで中央へ戻せます。グラデーションアンカー非表示ボタンはConeの頂点ハンドルにも適用されます。Mapping（Flow／Direct Projection）、Depth（最大30）、Rotation、`Twist`（開口部から頂点へ向かうtextureのねじれ。Flowと組み合わさって渦に吸い込まれる見た目になります）、Texture Repeat、Seam Mode、Seam Blend、Flow Cycles（±30）を調整できます。ConeでもCameraの`Projection`、`FOV`、`Lens Distortion`、`Dolly`、`Camera Yaw`／`Camera Pitch`、`Camera Position`、`Camera Wiggle`を使えます。FOVを変えても開口部の大きさは変わらず画角だけが変わり、頂点ハンドルは頂点の上に留まります。画角を広げると開口部の手前へ続く円錐面が見えるため、黒い縁は出ません。ConeのRotationはtextureの回転なので`Camera Roll`は表示しませんが、Wiggleのロールは適用されます。Surface Mapping／Shade／FogはConeでは使いません。既定のSeam ModeはMirror Repeatです。Direct ProjectionではFlowを止めます。Gradient Rampは前段textureに適用され、Coneはその色を維持します。Seam Modeの表示名は英語の`Mirror Repeat`／`Edge Weld`／`Gradient Reapply`に固定され、Gradient ReapplyはRGB色場を補正して中心サンプルのalphaを保持します。Texture FlowはAnimationタイムラインと書き出しへ同期し、Cone設定、レイヤー順、ON/OFF状態はPresetへ保存されます。
- Effect Stackでの表示名は`3D`です。`Shape`で`Cone`（円錐）と`Torus · Tunnel`（トーラス）を切り替えます。Torusはドーナツ型チューブの内面に前段textureを巻き付け、カメラがチューブの中心線に沿って進み、トンネルを進むループ映像になります。`Bend`で曲がり具合、`Ring Repeat`でリング一周のタイル数、`Camera Roll`で視線軸まわりの回転（曲がる方向）、`Camera Yaw`／`Camera Pitch`で視線の向き、`Camera Position`（2DパッドのInputPosition）でチューブ内のカメラ位置、`Camera Wiggle`でカメラの揺れ（Drift／Handheld／Float／Orbit／Sway／Look Around。Look AroundはYawがループごとに360°回転し、回転量はAmountの影響を受けません）、`Wiggle Amount`で揺れの大きさ、`Wiggle Speed`でループ内の揺れの回数、`Texture Repeat`でチューブ一周のタイル数、`Twist`でリングに沿ったtextureのねじれ（カメラの移動と組み合わさって台風に吸い込まれるような渦）、`Spin`でループごとのチューブ周方向の回転数を調整します。回転系はダイヤル（InputAngle）で操作し、0〜360°で循環します。Flow Cycles 1につきループごとにカメラがリングを1周するため、整数値でシームレスにループします。Torusでは頂点ハンドルとDepthを使いません。Cone以外の形状では`Surface Mapping`（Surface UV／Triplanar／Matcap）、`Shade`（カメラからの光）、`Fog`（遠方を黒へ減衰）と、Camera Roll／Yaw／Pitch／Position／Wiggleを共通で使えます（ConeはRoll以外のCamera設定を使えます）。`Lattice · Gyroid tunnel`は無限に続くGyroid／Schwarz P格子の通路を進み（`Scale`で周期、`Thickness`で壁の厚み、Flow Cycles 1につき1周期前進）。Cameraの`Projection`でPerspective／Fisheye（180°ドームマスター）／Equirect（360°パノラマ）を選べるため、ドーム投影やVR用の素材も書き出せます。Cameraでは`FOV`（画角）、`Lens Distortion`（たる型／糸巻き型の歪み）、`Fisheye Angle`（魚眼の画角、180°がドームマスター）、`Dolly`（視線方向への前後移動）、Torusの`Aim Into Bend`（曲がりの内側へ向ける強さ）も調整でき、Wiggleには画角が脈打つ`Zoom Pulse`と、画角と前後移動を連動させたドリーズームの`Vertigo`があります。`Terrain · Heightfield flyover`はキャンバスの明るさを高さにした地形の上を飛び（`Height`で起伏、`Altitude`でカメラの高さ、Flow Cycles 1につき1タイル前進）。`Ribbons · Growing bands`は見えないチューブの中に複数の帯を並べ、帯が前方へ伸び続けるのをカメラがチューブの軸に沿って追いかける形状です。`Ribbons`で本数、`Radius`で軸からの距離、`Width`で帯の幅、`Stagger`で帯の先端位置の前後のばらつき、`Loop Length`で繰り返しの長さ、`Twist`でLoop Lengthあたりのらせんの回転数、`Band Twist`でLoop Lengthあたりの各帯のねじれ（半回転数）、`Spin`でループごとの全体の回転数、`Ring Repeat`でLoop Lengthあたりのtextureタイル数を調整します。Flow Cycles 1につきLoop Length 1つ分進み（Band Twistが奇数の場合は同じ面へ戻るため2つ分）、シームレスにループします。`Camera Position`でカメラを軸から外し、`Dolly`で先端との距離を変えます。`Square Rings · Frame tunnel`はキャンバスを貼った四角いフレームの間をカメラが突き進むVJ向けの形状で、`Pattern`で`Corridor`（まっすぐな回廊）、`Serpent`（うねる経路をバンクしながら進む。`Curve`で曲がり具合）、`Tumble`（散らばって回転するフレームがカメラの前で整列する。`Scatter`で散らばり）を選びます。`Ring Mapping`の`Wrap`はキャンバスをフレームの周方向へ巻き付け、`Picture`は各フレームにキャンバス全体を貼ります。`Rings per Tile`でFlow Cycles 1につき通過するフレーム数、`Spacing`で間隔、`Thickness`で枠の太さ、`Frame Depth`で奥行き、`Twist`で1枚ごとの回転（通過するにつれて渦を巻く）、`Spin`でループごとの回転数、`Pulse`でフレームの大きさの波、`Beats`でループごとの波の進みを調整します。`Geometry Field · Scattered flythrough`は空間に散らばった球・立方体・三角柱・正八面体・トーラスの間を進む形状で、各ジオメトリにキャンバスがテクスチャとして貼られます。`Geometry`で形状（単一または`Mix`）、`Render`で`Solid`／`Wireframe`／`Mixed`（物体ごとにランダム）、`Wire Width`で線の太さを選びます。配置は`Loop Length`セルごとに繰り返し、Flow Cycles 1につき1周期ぶん進むためシームレスにループします。`Density`で物体の数、`Size`で大きさ、`Clearance`で進路周りの空き、`Spread`で群れの広がり、`Spin`でループごとの自転数、`Variation`で物体ごとに表示するキャンバスの位置のばらつきを調整します。Surface MappingをMatcapにするとキャンバスを材質として使えます。`Arms`を1以上にすると物体がらせん状の腕に並び、`Twist`でLoop Lengthあたりの腕の回転数、`Arm Width`で腕からのばらつきを決めます（`Spread`を`Clearance` + 1程度まで狭めるとらせんがはっきり見えます）。`GLB読み込み`で任意の.glbモデルを読み込むとGeometryが`Model`になり、各物体がそのモデルになります。モデルは実行中だけ保持され、Presetには保存されません。ワイヤーフレームは低ポリゴンのモデルで最もきれいに描画されます。`Discs · Slit rings in 3D`はSlitのサークルを立体にした形状で、キャンバスを同心円のリングに切り分けて厚みのある円盤にし、画面中央を軸に回しながら視線方向へ動かします。`Form`の`Rings`はスリットのサークルと同じ穴の空いたリング、`Discs`は全てを中心まで埋めた円盤にします。円盤は小さいものを手前にして1本の軸に積み重ね、Z Spreadの波は円盤同士の隙間を開閉させるので、円盤が重なり合うことはありません（Tiltは積み重ね全体を揺らします）。`Rings`でリング数、`Gap`で隙間、`Thickness`で厚み、`Z Spread`で手前・奥へ動くSin波の振幅、`Waves`でリング全体に並ぶ波の周期数、`Scatter`でリングごとの位相のばらつきを決めます。波はFlow Cycles 1につきループごとに1周期進みます。`Spin Pattern`は`Together`（全て同じ速さ）、`Alternate`（1つおきに逆回転）、`Stagger`（中心から外側へ順に動くイーズ付きの段階回転）から選び、`Spin`でループごとの回転数、`Twist`で内側のリングとの角度差、`Offset`でSlitのサークルと同じリングごとのランダムな角度を加えます。`Tilt`と`Tilt Turns`でコインが回るような傾きの揺れ、`View Angle`でカメラを軸から傾けて奥行きを見せる角度（傾けるほどカメラが下がって全体を収めます）、`Orbit`でループごとにカメラが中心を注視したまま縦軸のまわりを公転する回数（既定1。側面や背面へ回り込み、公転中は全体が収まる距離を保ちます）を調整します。全ての動きは整数周期で閉じるためシームレスにループし、View Angle・Orbit・Z Spread・Tilt・Spin・Offsetを0にするとキャンバスをそのまま映します。
- ConeはメインCanvasと同じWebGL stack経路を使います。WebGL2を利用できないブラウザ／WebViewではCone passを描画できず、通常の2D Canvas表示で編集を継続します。ページを再読み込みするとWebGL2の再検出を行います。

### Normal (ノーマルマップ)
- グラデーションの輝度勾配から法線マップを生成します。
- `Height` で凹凸の強調具合を調整できます。
- 有効時にモノクロのグラデーションを適用しています
  - 無効時は改めてグラデ適用をお願いします
- Diffuseが有効な間は、従来どおりNormal Mapを描画しません。Normalを確認するときはDiffuseをOFFにしてください。

### Anim (アニメーション)
- 各プロパティを `Static`（静止）、`Auto`（自動ループ）、`Keys`（キーフレーム）の3状態で管理します。
- `Auto`から`Keys`へ切り替えると現在時刻の値が記録され、`Auto`へ戻しても作成済みキーは保持されます。
- Animation Workspaceでは再生・停止・フレーム移動・Preview Loop・Duration・FPS・Loop Timingを操作できます。
- `Moving / Selected / All`で表示トラックを絞り込み、KeysトラックはGraph Editorで補間を編集できます。

### Export (書き出し)
- **Image**: 現在の表示内容を PNG / JPG / WebP 画像として書き出します。
- **Slit PNGs**: スリットごとに個別 PNG を書き出します。
- **MOV**: Tauri デスクトップ版で、外部 FFmpeg を使って QuickTime Animation(qtrle) の MOV を生成します。
- **MP4 (H.264)**: Tauri デスクトップ版で、外部 FFmpeg を使って標準的なYUV 4:2:0 / BT.709のMP4を生成します。High（CRF 18）、Balanced（CRF 22）、Small（CRF 27）を選択でき、Highが既定値です。
- **ZIP PNG**: Web 版 / Tauri 版の両方で利用できる連番 PNG ZIP 書き出しです。FFmpeg は不要です。
- MP4は、GPUエンコーダー（NVIDIA NVENC / Intel Quick Sync / AMD AMF / Apple VideoToolbox）が使えるFFmpegとGPUを検出した場合、既定でGPUで書き出します。ExportタブのGPUエンコードで切り替えられ、GPUが失敗した場合は自動でCPU（x264）へ切り替わります。画質はx264と多少異なる場合があります。
- FFmpegはアプリ起動時に自動検出します。導入後にウィンドウへ戻ると再検出され、Exportタブの`Check`でも手動で再確認できます。
- MOV / MP4書き出しには、K-GG専用FFmpegフォルダへ`ffmpeg.exe`を配置するか、`ffmpeg`コマンドをPATHから実行できる状態にする必要があります。
- K-GG専用フォルダはExportタブの`Open K-GG FFmpeg folder`から開けます。専用フォルダが優先され、利用できない場合はPATH上のFFmpegを確認します。
- 未導入の場合はExportタブの案内からgyan.devを開き、Windows x64用`release essentials` ZIPを取得して展開してください。K-GG自身はFFmpegをダウンロードしません。

### Preset (プリセット)
- 現在の全設定を保存・読み込みできます。デスクトップ版では実行ファイルと同じディレクトリの `presets/presets.json` に保存されます。
- 初期状態に戻すリセット機能も備えています。

## プレビュー操作

- **マウスホイール**: 拡大・縮小 (カーソル位置基準)
- **マウスホイール押し込み (中クリック) + ドラッグ**: パン (画面の移動)
- **スペースキー**: アニメーションの再生 / 一時停止
- **Ctrl + Z**: 元に戻す (Undo)
- **Ctrl + Y / Ctrl + Shift + Z**: やり直し (Redo)
