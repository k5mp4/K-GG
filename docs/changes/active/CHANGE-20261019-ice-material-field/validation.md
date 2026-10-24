# Validation

計画書のAC（AE1〜AE7）を、実行したテストまたは再現可能な手動確認へ対応付ける。WebGL2の検証は同じ環境・同じ寸法でのRGBA比較で、GPU間のbit一致は要求しない。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AE1 吸収0でも粗い部分の白い曇りが残り、亀裂の模様はIceに出ない | e2e (WebGL2) | `tests/e2e/ice.spec.ts`「frosted haze stays white…」 | pass |
| AE1 厚み0で吸収が消える／Mix 0は入力のまま | e2e (WebGL2) | 同上 | pass |
| 表面ノイズの展開・流れ・成長が整数周期で閉じ、3つとも0なら止まる | e2e (WebGL2) / unit | `tests/e2e/ice.spec.ts`「the surface noise evolves…」、`src/lib/sceneEvaluation.ice.test.ts` | pass |
| AE2 厚み・亀裂をRamp入力に選び、色を変えても構造が変わらない | e2e (WebGL2) | `tests/e2e/ice.spec.ts` ramp invariance | pass |
| AE2 Iceの有無に依存せず配色が保持される | unit | `src/lib/sceneRenderPlan.materialField.test.ts`、`src/lib/sceneEvaluation.ice.test.ts` | pass |
| AE3 固定入力・線形時間で順序を変えても同じ。整数周期で時刻0と1が一致 | e2e (WebGL2) / unit | `tests/e2e/ice.spec.ts`、`src/lib/materialField.test.ts`、`src/lib/sceneEvaluation.ice.test.ts` | pass |
| AE3 境界前後の有限差分速度 | — | 未実施。RGBA8の全画面差分からC1連続性を断定しない。位相は整数調波だけで作る実装で担保 | not run |
| AE4 始終が違うキーを含む構成はループを保証しない | spec | ICE-003、GRAD-028、UIのループ説明（`materialField.loopHint`、`ice.loopHint`） | documented |
| AE5 場：全画面と強制タイル（2×2）で構造が切れない | e2e (WebGL2) | `tests/e2e/ice.spec.ts` tiles（各channel最大差1/255以内） | pass |
| AE5 Ice：余白付きタイルが画面端・継ぎ目とも全画面と一致 | e2e (WebGL2) | `tests/e2e/ice.spec.ts`「padded tiles reproduce…」（最大差1/255以内） | pass |
| AE5 余白不足と遠隔参照併用は開始前に失敗 | unit | `src/lib/ice.test.ts` | pass |
| AE6 Iceは元座標のalphaを保持し、透明画素の隠れた色を混ぜない | e2e (WebGL2) | `tests/e2e/ice.spec.ts`「Ice keeps the input alpha…」 | pass |
| AE6 Image Gradient Source有効時は場の入力とIceを使わない（設定は保持） | unit / component | `src/lib/materialField.test.ts`、`src/lib/sceneEvaluation.ice.test.ts`、`MaterialFieldControls.test.tsx`、`IcePanel.test.tsx` | pass |
| AE7 新設定がない旧Presetは場の入力なし・Ice無効で読み込む | unit | `src/lib/presetModel.materialField.test.ts`、`src/lib/presetModel.ice.test.ts` | pass |
| AE7 場・Iceを使わない描画経路が変わらない | unit / e2e | bootstrap source不変（`sceneRenderPlan.materialField.test.ts`）、Mesh色fieldのHEAD比較（一時テストでbyte一致を確認）、全program compile（`tests/e2e/shaders.spec.ts`） | pass |
| R12 UI・kgg-control・Preset・VJが同じ正規化とcommandを通る | unit | `packages/kgg-control/src/parameters.test.ts`、`src/lib/kggControlRuntime.test.ts`、`src/features/vj/vjDocument.test.ts` | pass |
| R14 Mesh lookupは色・Seed・時刻で再uploadされない | unit | `src/lib/webglMaterialField.test.ts` | pass |
| 表面：平らで光源のない設定は入力のまま、隆起は像を曲げ、粗さのムラは曇りの濃淡を作り、ハイライトは有効時だけ出る | e2e (WebGL2) | `tests/e2e/ice.spec.ts`「the surface noise drives…」 | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Change structure | `npm run change:check` | pass |
| Fast validation | `npm run check:merge` | pass（unit 1171 pass / 1 skip、lint、build、docs） |
| Shader compile (WebGL2) | `npm run check:render` | pass（場付きGenerator variantとIceを含む全74 program） |
| Field / Ice fixture (WebGL2) | `npx playwright test --project=ice` | pass（10 tests、模様の削除と表面ノイズの動きの追加後） |
| Render / export e2e | `npm run check:e2e` | ノイズ表面への変更前の結果。11 pass / 4 fail。失敗はworkspace-layout 1件とvj-performance 3件。うち3件はmain（734c63d）でも同じく失敗。残る`vj-performance.spec.ts:28`は単独再実行でpass（全体実行時の負荷によるtimeoutと判断）。Ice・Material Field関連のe2eはすべてpass |

## Release Gate

- 代表GPUでの氷らしさ（亀裂がセル線に見えないか、白濁で全体が平坦にならないか、細い亀裂と気泡のちらつき）。
- 1080p・8秒・1周期・単純Gradient＋Iceでの描画時間（暫定目標16.7ms/frame）。GPU名・driver・backendを記録する。
- 代表Preset（Clear／Cracked／Frosted Ice、Crack Ramp）の作成と目視確認。
- Tauri出力、FFmpeg動画、After Effectsでのalpha合成。自動テストからpassを推測しない。

## Observation

- 2026-10-19、ANGLE（Direct3D）上のdev Previewで、場付きGenerator variantのコンパイルに約8秒、Ice programに約3秒。warmup中の他variantの後ろに並ぶと、初回表示まで十数秒かかる場合がある。
- 2026-10-20、同じ環境で960×540の合成入力に対しClear／Cracked／Frostedの3設定を描画して目視。初版は環境光の帯が凹凸の等高線として見えたため、帯を位置主体の広い明暗へ変え、表面の凹凸を低周波にした。調整後は亀裂の網目・気泡・ゆるい屈折・青みのある母材を確認。
- Previewで亀裂入力のRamp配色とMeshの影響量50%、Effect StackからのIceのON／Edit Layer表示を目視で確認。
- 2026-10-24、利用者の依頼でIceの表面を「模様の重ね合わせ」からノイズテクスチャー駆動へ変更（ADRの決定9）。1280×720のK-GG風グラデーションと縦線・文字の入力で、既定・ツヤ多め・曇り混在の3設定を描画して目視。調整の経緯：隆起の傾きが小さすぎて見えなかったため高さと屈折の利得を上げ、縁の逆光が太い白帯になったため細く弱くし、迷路状の隆起を丸い斑へ変え、亀裂と気泡の散乱の比重を下げた。調整後は角の丸い部分的な隆起、縁に乗る鋭いハイライト、ツヤと曇りの混在、隆起で曲がる背景を確認。Ice programのコンパイルはANGLEで約9秒（以前は約3秒）。
- 2026-10-24、Iceから亀裂・霜・気泡の模様を外し（霜・気泡の設定は削除、亀裂はGradientの構造入力用に残す）、表面ノイズの動き（展開・流れ・隆起の成長）を追加。光の回転は既定0。1280×720で表面位相0／0.25／0.5を描画し、光を止めたまま隆起と粗さの斑が別の形へ移り変わることを目視で確認。

## Commands

- `npm run change:check`
- `npm run check:merge`
- `npm run check:render`
- `npx playwright test --config=playwright.config.ts --project=ice`
- `npm run check:e2e`
