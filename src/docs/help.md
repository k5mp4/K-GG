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

GSAP は UI アニメーション用途で使用しています。GSAP は MIT ではなく GSAP Standard License です。K-GG をアニメーション制作サービスや Webflow 系のビジュアルアニメーション制作ツールと競合する形で公開・販売する場合は、公開前に GSAP ライセンスを確認するか、GSAP 依存を外してください。

Web 版は `index.html` で Google Fonts から Noto Sans JP、Open Sans を読み込んでいます。オフライン配布やプライバシー要件を重視する配布では、フォントをセルフホストし、該当フォントのライセンスファイルを同梱してください。

- FFmpeg: https://ffmpeg.org
- FFmpeg Windows builds: https://www.gyan.dev/ffmpeg/builds/
- FFmpeg license information: https://ffmpeg.org/legal.html
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- LGPL v2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
- GSAP Standard License: https://gsap.com/standard-license/

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
  -Linear/Radial/4-color/Diamond/Angleの5種類のグラデーションタイプを選択可能です。
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

### Noise (ノイズ歪み)
- 各種ノイズを用いて、グラデーションを複雑に歪ませる
- `Strength` で歪みの強さを、`Scale` でノイズの細かさを調整
- **Curl/Domain Warp辺りがいい感じの質感になります**
- Seamless は極座標で切れ目のないテクスチャが生成される
  - Radial(Expand)は中央から外側に広がる形でオススメ

### Postprocess Effect Stack
- キャンバス左上の `Effect Stack` パネルで、Noise / Slit / Stretch / Distort / Mirror / Kaleidoscope / Voronoi / Glass / Glass V2 / Diffuse の順序を変更できます。Diffuseは初期状態では最後尾です。
- Glassは有機的なリッジ高さ場、Glass V2は滑らかな勾配ノイズとRGB別屈折率を使う画面空間の光学近似です。両方とも同じGlassパラメータを使い、独立したレイヤーとして比較・併用できます。
- 行のグリップをドラッグすると、行が目的位置へ収束してから描画順序が確定します。各行のスイッチでレイヤーをON/OFFできます。
- 固定順は `Surface → Main Stack → Prism → Particles` です。DiffuseはMain Stack内の位置で一度だけ適用されます。
- 画面やGPU描画が壊れた場合は、トップバーの設定モーダル（Hover / Click only）にある `Refresh app` でアプリを再読み込みできます。未保存の編集状態は破棄されます。


### Slit (スリットスキャン)
- 特定の軸方向にピクセルを引き伸ばすエフェクトを適用します。
- Animateを有効にすることでアニメーション可能です
- **PingPongは仕組み上動きの破綻がないです**

### Normal (ノーマルマップ)
- グラデーションの輝度勾配から法線マップを生成します。
- `Height` で凹凸の強調具合を調整できます。
- 有効時にモノクロのグラデーションを適用しています
  - 無効時は改めてグラデ適用をお願いします

### Anim (アニメーション)
- 各プロパティを `Static`（静止）、`Auto`（自動ループ）、`Keys`（キーフレーム）の3状態で管理します。
- `Auto`から`Keys`へ切り替えると現在時刻の値が記録され、`Auto`へ戻しても作成済みキーは保持されます。
- Animation Workspaceでは再生・停止・フレーム移動・Preview Loop・Duration・FPS・Loop Timingを操作できます。
- `Moving / Selected / All`で表示トラックを絞り込み、KeysトラックはGraph Editorで補間を編集できます。

### Export (書き出し)
- **Image**: 現在の表示内容を PNG / JPG / WebP 画像として書き出します。
- **Slit PNGs**: スリットごとに個別 PNG を書き出します。
- **MOV**: Tauri デスクトップ版で、外部 FFmpeg を使って QuickTime Animation(qtrle) の MOV を生成します。
- **MP4 (H.264 RGB)**: Tauri デスクトップ版で、外部 FFmpeg を使って MP4 を生成します。
- **ZIP PNG**: Web 版 / Tauri 版の両方で利用できる連番 PNG ZIP 書き出しです。FFmpeg は不要です。
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
