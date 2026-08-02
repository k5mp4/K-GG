# Validation

## 受け入れ条件

| AC | 結果 | 確認内容 |
| --- | --- | --- |
| AC-001 | partial | 合成設定でGLASS＋Diffuse、GLASS単体、GLASS V2単体、GLASS→GLASS V2、Preview停止／再生中を400×400・24fps・3秒で書き出した。各2回または停止時との比較で72/72フレームのRGBAが一致した。元データと同一Preset、GLASS V2→GLASS、残る他レイヤー併用は未確認。 |
| AC-002 | pass | GLASS単体、GLASS V2単体、GLASS→GLASS V2の各2回の72フレームがデコード後RGBAで完全一致した。100回の同一時刻captureテストも一致した。 |
| AC-003 | pass | 実書き出しは5フレームごとの`setTimeout(0)`と進捗更新を維持したまま一致した。単体テストではcapture callbackをevent loopへ送ってPreview renderを発火させても100回同一frame IDとなった。lazy program待機中は進捗0%のまま最初のフレームを出力しなかった。 |
| AC-004 | partial | GLASS passのsource／destination衝突検出、A/B ping-pong、FBO clear、blend／scissor／color mask、viewport、samplerをコードとテストで固定した。開発診断を追加したが、全項目を有効化した実機ログの保存は未実施。 |
| AC-005 | pass | 必要program列挙、pending待機、専用GLASS program固定、compile failure時の開始前失敗を実装・テストした。実機GLASS V2ではcompile中に0%で待機し、ready後だけ72フレームを生成した。 |
| AC-006 | pass | session中の通常render、static scheduler、AnimationLoop、seekを拒否するテストが成功した。Preview停止時と再生中の両GLASS出力は72/72 RGBA一致し、終了後の再生復帰を画面で確認した。 |
| AC-007 | pass | 共通`renderAndCaptureExportFrame()`がtoken、frameIndex、`gl.finish()`、capture、sequence、AbortSignalを処理する。capture中のPreview上書きをframe IDで検出する回帰テストが成功した。 |
| AC-008 | pass | Browser ZIPとTauri MOV／MP4連番生成は同じ`videoExportFrames.ts`を使用する。TauriのFFmpeg encode自体は変更していない。 |
| AC-009 | partial | GLASS単層／2層の累積padding既存テストとsession対応tile経路は全テスト成功。高解像度の実機tiled出力とfull-frame比較は未実施。 |
| AC-010 | pass | cancellation、二重開始、stale token、二重終了、失敗時解除、Preview復元のテストが成功した。実機キャンセルでもZIPを生成せず、出力UIとPreview再生が復帰した。 |
| AC-011 | partial | 合成設定のGLASS単体、GLASS V2単体、GLASS→GLASS V2で各72フレームを2回出力しRGBA完全一致、MAD基準の孤立外れ値0件を確認した。添付元Presetがないため元データと同一条件の修正後比較は未実施。 |
| AC-012 | pass | 50 files／249 tests、lint 0 errors、app build、docs check、docs buildが成功した。lintの既存warning 24件とbuildの既存chunk-size warningは残る。 |

## 原因調査結果

コード追跡で確認した競合順序は次のとおり。

1. GLASS／GLASS V2専用programがpendingの間、V2 main stackは該当レイヤーをskipして別内容を描画する。
2. 旧export経路は`renderBridge.renderAtTime()`後にRAFを2回待ち、共有Canvasを`toBlob()`していた。
3. その待機中にprogramがreadyになると`kgg:webgl-lazy-program-state`が発火し、`GradientCanvas`のstatic schedulerが通常描画を投入できた。
4. 5フレームごとの`setTimeout(0)`がpending callbackを実行可能にし、元データの6、16、36、46、66付近と対応した。
5. その結果、要求したexport frameと、program切替後またはPreview用の別render sequenceが同じCanvas／共有FBOを競合していた。

FBO ping-pongは既存の`choosePostprocessTarget()`でA→Bへ切り替わり、直接のsource／destination同一は確認されなかった。ただし暗黙状態と未clear領域を排除するため、GLASS passの状態設定、clear、衝突検出を追加した。

元データと同一Presetがないため、上記競合が添付画像の唯一の原因であることは未確定である。異常位置とevent loop yieldの対応、GLASS系だけが持つ長時間lazy compile、修正後の競合テストと実機決定性から、最も強く支持される原因である。

## 基準データ解析

- 入力: `E:\0_Works\2026\1_works\Kyokkan15\Images\suzusi2_frames.zip`
- 72フレーム、400×400
- Neighbor-average差分上位: 66=`9.3821`、46=`8.5804`、20=`8.3896`、16=`8.3518`、36=`8.1007`、6=`6.7093`
- 5→6 mean absolute差分 `7.1212`
- 15→16 mean absolute差分 `8.5329`
- 19→20 mean absolute差分 `8.3099`
- 35→36 mean absolute差分 `8.7024`
- 45→46 mean absolute差分 `9.0167`
- 65→66 mean absolute差分 `10.4453`

## 合成設定の実機RGBA比較

環境: Windows WebView、ANGLE D3D11、NVIDIA GeForce RTX 3060 Ti、400×400、24fps、3秒、72フレーム。

| ケース | 2回のRGBA一致 | 孤立外れ値 | 備考 |
| --- | --- | ---: | --- |
| GLASS＋Diffuse | 72/72 | 未計測 | 最初に実施した併用ケース |
| GLASSのみ | 72/72 | 0 | median `3.9949`、MAD `0.4985` |
| GLASS V2のみ | 72/72 | 0 | median `0.9806`、MAD `0.1420` |
| GLASS→GLASS V2 | 72/72 | 0 | median `4.3649`、MAD `0.5431` |
| GLASS→GLASS V2、Preview再生中 | 停止時と72/72一致 | 0 | export後にPreview再生復帰 |

比較はPNG圧縮byteではなく、`System.Drawing`で32-bit pixel bufferへデコードしたSHA-256を使用した。

## GLASS追加再検証（2026-08-01）

ユーザーからGLASS側に破綻が残って見えるとの報告を受け、添付ZIPを再度目視し、FFmpegの`tblend=difference`と`signalstats.YAVG`で隣接フレーム差を測定した。修正前データでは6、16、20、36、46、66の前後に差分が対で急上昇し、5フレームごとのevent loop yield直後という既知の競合位置と一致した。

修正後ビルドでは、Built-in `Kagaribi_15`、400×400、24fps、3秒、GLASS既定設定で次を実行した。

| ケース | 72フレーム | 問題位置の差分 | 同一設定の再出力 |
| --- | ---: | --- | --- |
| GLASS＋Diffuse | 72 | 6/16/20/36/46/66で孤立上昇なし | 今回は1回 |
| GLASS単体 | 72 | 6/16/20/36/46/66で孤立上昇なし | 72/72 PNG SHA-256一致 |

GLASS＋Diffuseの問題位置に対応する隣接YAVGは`5.51/5.27`、`6.04/6.00`、`5.73/5.58`、`6.39/6.29`、`4.28/4.57`、`4.70/4.66`で、前後の連続変化から孤立していない。GLASS単体も同じ位置で`5.73/5.52`、`6.24/6.19`、`5.93/5.75`、`6.50/6.45`、`4.43/4.74`、`4.89/4.86`となり、修正前のせん断状フレームを再現しなかった。

GLASS単体の2 ZIPはcontainer byteが異なったが、展開後の`frame_0000.png`〜`frame_0071.png`は72/72でSHA-256が一致した。PNG byteが同一であるため、デコード後RGBAも同一である。

さらに、72フレームの各capture後と5フレームごとの`setTimeout(0)`後にPreview renderを要求する回帰テストを追加した。frame 6、16、36、46、66を含む全frame identityが要求した`frameIndex / 72`と一致し、Preview renderは0回だった。

## 追加した回帰テスト

- export state snapshotがUI更新からEffect Stack、GLASS、animation、keyframeを分離する。
- GLASSのみ、GLASS V2のみ、両方で必要な専用programを列挙する。
- pending readiness中はPreviewを拒否し、失敗時は最初のframe前に中止する。
- GLASS→GLASS V2／GLASS V2→GLASSのsourceとdestinationをA/Bへ交互に割り当てる。
- export中の通常render、nested session、stale token、sequence不一致、cancellationを検出する。
- event loop callbackからPreview renderを要求してもcaptureしたframe IDが100回一致する。

## 実行コマンド

Node.js／npmがPowerShellのPATHにないため、同じpackage scriptsをNode.js 24.4.1とローカルCLIへ直接渡した。

```powershell
& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' node_modules\vitest\vitest.mjs run
# 50 test files, 249 tests passed

& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' node_modules\eslint\bin\eslint.js .
# exit 0, 0 errors, 24 existing warnings

& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' node_modules\typescript\bin\tsc -b --pretty false
& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' node_modules\vite\bin\vite.js build
# success; existing chunk-size warning only

& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' tools\check-docs.mjs
# Documentation checks passed

& 'C:\Users\fjkg\AppData\Local\mise\installs\node\24.4.1\node.exe' node_modules\vitepress\bin\vitepress.js build docs
# success

& .\tools\compare-frame-zips.ps1 -FirstZip <run1.zip> -SecondZip <run2.zip>
& .\tools\analyze-frame-zip.ps1 -ZipPath <frames.zip>
```

Rust／Tauri sourceは変更していないため、`cargo test`と`cargo check`は対象外として未実行。

## 未確認事項

- 添付元と同一のPreset／Effect Stack設定による修正後72フレーム
- GLASS V2→GLASSへ並べ替えた実機出力
- GLASSなし、GLASS V2＋他レイヤーを含む残りの比較表ケース
- 高解像度tiled pathとfull-frame pathのピクセル比較
- Tauri実機MOV／MP4のdecode後RGBA比較
- 開発診断フラグを有効にした全72フレームログの保存

以上が未確認のため、changeは`approved`／activeのままとし、`implemented`またはArchiveへは移動しない。
