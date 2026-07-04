### ライセンス / 利用規約

K-GG のソースコードは Apache License 2.0 の下で配布されます。
© 2026 ke-go.

本アプリケーションを使用して生成された画像、動画、その他の素材は、個人利用・非商用利用・商用利用を問わず利用できます。

本アプリケーション自体の利用、複製、改変、再配布は Apache License 2.0 に従って行うことができます。詳細はリポジトリの `LICENSE` を参照してください。

生成物の利用にあたって、第三者の著作権、商標権、イベントロゴ、キャラクター、その他の権利を侵害しないよう、利用者自身の責任で確認してください。

#### 第三者ソフトウェア

K-GG の Tauri デスクトップ版は、MOV / MP4 動画書き出し時に利用者の環境にインストールされた外部 FFmpeg バイナリを `ffmpeg` コマンドとして呼び出します。K-GG は FFmpeg を同梱しておらず、ffmpeg.wasm も現在使用していません。

FFmpeg は GNU Lesser General Public License version 2.1 or later の下でライセンスされています。ただし、利用する FFmpeg ビルドに GPL オプションが含まれる場合は GPL が適用されます。FFmpeg のライセンスは FFmpeg および関連コンポーネントに適用され、K-GG の Apache License 2.0 とは別に扱われます。

K-GG は React、Tauri、fflate、ogl、zustand、react-colorful、react-markdown などの第三者ライブラリを使用しています。現在の依存関係は MIT、Apache-2.0、BSD、ISC 系が中心で、Tauri/Rust 依存ツリーには MPL-2.0 のコンポーネントが含まれます。第三者ライセンスの要点はリポジトリの `NOTICE` に記載しています。

GSAP は UI アニメーション用途で使用しています。GSAP は MIT ではなく GSAP Standard License です。K-GG をアニメーション制作サービスや Webflow 系のビジュアルアニメーション制作ツールと競合する形で公開・販売する場合は、公開前に GSAP ライセンスを確認するか、GSAP 依存を外してください。

Web 版は `index.html` で Google Fonts から Noto Sans JP、Open Sans を読み込んでいます。オフライン配布やプライバシー要件を重視する配布では、フォントをセルフホストし、該当フォントのライセンスファイルを同梱してください。

- FFmpeg: https://ffmpeg.org
- FFmpeg license information: https://ffmpeg.org/legal.html
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- LGPL v2.1: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
- GSAP Standard License: https://gsap.com/standard-license/

## K-GG 使い方ガイド

## 基本設定 (右パネル)
- **Canvas Size**: 出力解像度を設定します。
  - **800x800 / 1920x1080**: プリセットボタンで素早く切り替え。
  - **W / H**: 直接数値を入力。マウスホイールで±1、Shift+ホイールで±10の調整が可能です。
  - **南京錠アイコン**: アスペクト比を固定します。
- **Gradient type**
  -Linear/Radial/4-color/Diamond/Angleの5種類のグラデーションタイプを選択可能です。
- **Gradient Ramp**: グラデーションの各ポイントの色と位置、不透明度を調整できます。
  - Kagaribi-15-BGはKV背景に極力寄せたグラデになっています
- **Bezier Distortion (ベジェ歪み)**:
  - グラデーションを湾曲させるための軸を編集します。
  - `enabled` をオンにすると、プレビュー上にベジェ曲線が表示されます。
  - **Strength**: 湾曲の強さを調整します。
  - **Radius**: 効果の及ぶ範囲（太さ）を調整します。
  - **Curvature**: 曲線に沿った色の引き伸ばし具合を調整します。
  - **Boundary (境界処理)**:
    - `clamp`: 範囲外を端の色で埋めます。
    - `repeat`: パターンを繰り返します。
    - `mirror`: 反転しながら繰り返します。
  - **操作方法**:
    - **クリック**: 点の追加
    - **パス上をクリック**: 点の挿入
    - **ダブルクリック**: 点の削除
    - **Alt + ドラッグ**: ハンドルの延伸
    - **右クリック + ドラッグ**: 範囲選択
    - **Delete / Backspace / Xキー**: 選択した点の削除
    - **Rキー**: ハンドルの回転
    - **Sキー**: ハンドル・複数ポイントのスケール
    - **Aキー**: ポイントを全選択
    - **Gキー**: キャンバス上を移動(+X/Yキーで軸の制限)

## エフェクト設定 (左パネル)

### Diffuse (拡散/ブロックノイズ)
- セル状のノイズパターンを生成します。
- **SmoothはKV背景と同じ拡散方式(のはず)**
- `Density` でセルの細かさを、`Contrast` で明暗の差を調整します。
- `Time Speed` でアニメーションの速度を変化させられます。

### Noise (ノイズ歪み)
- 各種ノイズを用いて、グラデーションを複雑に歪ませる
- `Strength` で歪みの強さを、`Scale` でノイズの細かさを調整
- **Curl/Domain Warp辺りがいい感じの質感になります**
- Seamless は極座標で切れ目のないテクスチャが生成される
  - Radial(Expand)は中央から外側に広がる形でオススメ



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
- MOV / MP4 書き出しには、`ffmpeg` コマンドが PATH から実行できる状態でインストールされている必要があります。

### Preset (プリセット)
- 現在の全設定を保存・読み込みできます。デスクトップ版では実行ファイルと同じディレクトリの `presets/presets.json` に保存されます。
- 初期状態に戻すリセット機能も備えています。

## プレビュー操作

- **マウスホイール**: 拡大・縮小 (カーソル位置基準)
- **マウスホイール押し込み (中クリック) + ドラッグ**: パン (画面の移動)
- **スペースキー**: アニメーションの再生 / 一時停止
- **Ctrl + Z**: 元に戻す (Undo)
- **Ctrl + Y / Ctrl + Shift + Z**: やり直し (Redo)
