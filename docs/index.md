---
layout: doc
title: K-GG 使い方ガイド
---
# はじめに
<CldImage publicId="windows_1_kjsus7" />
- K-GG は[フタガミ ハルキミ氏](https://x.com/FTGMHRKM)による篝火#15キービジュアルの背景パターンを模倣し、篝火#15に関連した様々なデザインに活用できるよう[ke-go](https://x.com/ke_goWorks)によって作成されたグラデーション生成ツールです。静的なグラデーション、連番 PNG、Tauri デスクトップ版での MOV/MP4 動画書き出しに対応しており、グラフィックデザインとモーションデザインの両方で活用できます。
開発にあたり、Codexを活用しました。

- Web 版では PNG / JPG / WebP / スリット PNG / 連番 PNG ZIP を書き出せます。Tauri デスクトップ版では、外部 FFmpeg を利用して MOV と H.264 MP4 を書き出せます。
- MOV / MP4 書き出しには、K-GG専用FFmpegフォルダへ`ffmpeg.exe`を配置するか、`ffmpeg`コマンドをPATHから実行できる状態にする必要があります。ffmpeg.wasmは使用していません。
- 2026/06/20 現在更新中です。不明瞭な点や質問事項等がありましたら、公開リポジトリの Issue から連絡してください。
## 基本操作
- **Undo**: Ctrl+Z
- **Redo**: Ctrl+Shift+Z,Ctrl+Y
### キャンバス操作
blenderのショートカットキーに寄せた操作感にしています。
- **ポイントの追加**: 左クリック
- **ポイントの削除**: ダブルクリック
- **ポイントの挿入**: パス上をクリック
- **ハンドルの延伸**: Alt + ドラッグ
- **範囲選択**: 右クリック + ドラッグ
- **選択した点の削除**: Delete / Backspace / Xキー
- **ハンドルの回転**: Rキー
- **ハンドル・複数ポイントのスケール**: Sキー
- **ポイントを全選択**: Aキー
- **ポイントを移動**: Gキー(+X/Yキーで軸の制限)
## クイックスタート
built-inプリセットを利用することで素早く違いを把握することができます。

<CldImage publicId="kagaribi_prestes_jnb8ns" />
---

# パネル名称

- 後ほど画像を追加
---

# Gradient Panel(右サイドバー)
## Canvas Size
出力解像度を設定します。
- **800x800 / 1920x1080**: プリセットボタンで素早く切り替えることができま。
- **W / H**: 直接数値を入力可能。マウスホイールで±1、Shift+ホイールで±10の調整が可能です。
- **南京錠アイコン**: アスペクト比を固定します。
  - 任意のアスペクト比に変更可能です。最大解像度は3840×3840pxです。
  
<div class= "image-grid-2">
    <div class="image-item">
      <CldImage publicId="size_variable_l9z7ed" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
    <CldImage publicId="canvas_variable_ciljpe" />
    <p class = "image-caption"></p>
  </div>
</div>

## Image Overlay
画像を重畳させることができます。
::: tip TIPS
既存のデザインにスリットの幅を調整する時に役立ちます。
:::
## Image Gradient Source
画像の輝度またはRGBチャンネルを、現在のGradient Rampで再配色します。画像は中央基準のCoverで固定し、歪みはアンカー配色フィールドにのみ適用されます。
- **Channel**: Luminance / Red / Green / Blue から再配色の基準を選択します。
- **Anchor Influence**: 画像チャンネル値とアンカー配色値の混合率を0〜100%で調整します。0%では画像の明暗、100%では歪んだアンカー配色が優先されます。
- 画像本体はプリセットに保存されないため、再起動または別環境では再読み込みが必要です。
## Gradient Ramp
グラデーションの各ポイントの色や位置を調整できます。
### Gradient type
Linear/Radial/4-color/Diamond/Angleの5種類のグラデーションタイプを選択可能です。

<div class= "image-grid-2">
     <div class="image-item">
      <CldImage publicId="kagaribi_prestes_jnb8ns" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
      <CldImage publicId="linear_ffrn6z" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
      <CldImage publicId="radial_nr8fgn" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
      <CldImage publicId="4-color_jkx5pg" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
      <CldImage publicId="diamond_xksxwk" />
      <p class = "image-caption"></p>
    </div>
    <div class="image-item">
      <CldImage publicId="angle_fvmfz1" />
      <p class = "image-caption"></p>
    </div>
</div>

### INTERP
グラデーションの補間方式を調整できます。
### グラデーションストップ
- グラデーションの色を細かく調整することができます。
# ウインドウパネル
## キャンバス操作
- **マウスホイール回転**: キャンバスの拡大/縮小
- **ミドルクリック+ドラッグ**: キャンバスの移動
## REALTIME STATS
- キャンバスのヒストグラムがリアルタイムで表示されます。

# プロパティパネル (左パネル)
トップバーの項目をマウスホバーするとその項目が左側のエフェクト設定パネルに反映されます。
## Diffuse (拡散/ブロックノイズ)
- グラデーションに拡散効果を加えます。
- SmoothはKV背景と同じ拡散方式です。
- `Scatter` 拡散の大きさ
- `Grain` ノイズ粒子の細かさ

## Noise (ノイズ歪み)
- 各種ノイズを用いて、グラデーションを複雑に歪ませます
- `Type`
  - Curl/Domain Warp Anim/Seamless/Voronoiの4種類のノイズタイプがあります。
- `Seed`
  - 各ノイズタイプではseed値を変更可能です。

::: tip
Diceボタンを押すことでランダムなノイズを生成することができます。
:::
  
::: tip
各ノイズタイプの推奨設定はPRESETパネルを参照してください。
プリセットは順次追加予定です。
:::

## Postprocess Effect Stack
- V2ではキャンバス左上の `Effect Stack` パネルで、Noise / Slit / Stretch / Distort / Mirror / Kaleidoscope / Voronoi / Glass / Diffuse の順序を変更できます。Diffuseは初期状態では最後尾です。
- 行のグリップをドラッグすると、行が目的位置へ収束してから描画順序が確定します。
- 各行のスイッチで、その主スタックレイヤーのON/OFFを切り替えられます。Texture / Transform / Structure のカテゴリ表示は順序を制限しません。
- Normal/Matcapは主スタック前のSurface、Prismは主スタック後、Particlesは最終オーバーレイとして `Surface → Main Stack → Prism → Particles` の固定順で描画されます。DiffuseはMain Stack内の位置で一度だけ適用されます。
- 画面やGPU描画が壊れた場合は、トップバーの設定（Hover / Click only）モーダルにある `Refresh app` でアプリを再読み込みできます。未保存の編集状態は破棄されます。

## Slit (スリットスキャン)
- 特定の軸方向にピクセルを引き伸ばすエフェクトを適用します。
- Animateを有効にすることでアニメーション可能です
- PingPongは仕組み上動きの破綻がないです

## Normal (ノーマルマップ)
- グラデーションの輝度勾配から法線マップを生成します。
- `Height` で凹凸の強調具合を調整できます。
- 有効時にモノクロのグラデーションを適用しています。
  - 無効時は改めてグラデーション適用をお願いします。

# Anim (アニメーション)
- プロパティごとに `Static / Auto / Keys` を選び、静止・自動ループ・キーフレームを切り替えます。
- 再生・停止・Preview Loop・フレーム移動・現在フレームのシークが可能です。
- KeysトラックはタイムラインとGraph Editorで編集でき、Autoへ戻してもキーフレームは保持されます。

## Export (書き出し)
- **Save PNG / JPG / WebP**: 現在の表示内容を画像として書き出します。
- **スリット書き出し**
  - 各スリット毎に画像を書き出します。
  - 初期設定ではアルファ付き・キャンバス解像度で書き出されます。
  - トリムモードを指定することで、各スリットの解像度に合わせて書き出しが行われます。
- **Export MOV**: Tauri デスクトップ版で、外部 FFmpeg を使って QuickTime Animation(qtrle) の MOV を生成します。
- **Export MP4 (H.264 RGB)**: Tauri デスクトップ版で、外部 FFmpeg を使って H.264 MP4 を生成します。
- **Export ZIP PNG**: Web 版 / Tauri 版の両方で利用できる連番 PNG ZIP 書き出しです。FFmpeg は不要です。
- デスクトップ版の起動時にK-GG専用FFmpegフォルダが作成されます。Exportタブの`Open K-GG FFmpeg folder`から開き、Windows x64版の`ffmpeg.exe`を直接配置できます。
- K-GGは専用フォルダを先に確認し、利用できない場合はPATH上の`ffmpeg`を確認します。MOVには`qtrle`、MP4には`libx264rgb`エンコーダーが必要です。
- どちらにも利用可能なFFmpegがない場合、Exportタブに導入案内が表示されます。[gyan.devのFFmpeg Builds](https://www.gyan.dev/ffmpeg/builds/#release-builds)から`release essentials` ZIPを取得して展開してください。
- K-GGはFFmpegのダウンロード、コピー、削除、PATH変更を行いません。

## Preset (プリセット)
- 現在の設定を一時的に保存・読み込みできます。
- JSON形式でローカルにプリセットを保存することができます。デスクトップ版では実行ファイルと同じディレクトリの `presets/presets.json` に保存されます。

---

# ライセンス / 利用規約

K-GG のソースコードは Apache License 2.0 の下で配布されます。
© 2026 ke-go.

本アプリケーションを使用して生成された画像、動画、その他の素材は、個人利用・非商用利用・商用利用を問わず利用できます。

本アプリケーション自体の利用、複製、改変、再配布は Apache License 2.0 に従って行うことができます。詳細はリポジトリの `LICENSE` を参照してください。

生成物の利用にあたって、第三者の著作権、商標権、イベントロゴ、キャラクター、その他の権利を侵害しないよう、利用者自身の責任で確認してください。

## 第三者ソフトウェア

K-GGのTauriデスクトップ版は、MOV / MP4動画書き出し時に利用者がK-GG専用フォルダへ配置したFFmpeg、またはPATH上の外部FFmpegを別プロセスとして呼び出します。K-GGはFFmpegを同梱・配布しておらず、ffmpeg.wasmも使用していません。

FFmpegは主にGNU Lesser General Public License version 2.1 or laterの下でライセンスされています。ただし、利用するビルドにGPLコンポーネントが含まれる場合はGPLが適用されます。案内先のgyan.devによる推奨ビルドはGPLv3です。FFmpegのライセンスはFFmpegおよび関連コンポーネントに適用され、K-GGのApache License 2.0とは別に扱われます。

- FFmpeg: https://ffmpeg.org
- FFmpeg Windows builds: https://www.gyan.dev/ffmpeg/builds/
- FFmpeg license information: https://ffmpeg.org/legal.html
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- LGPL v2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
