# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 TextureレイヤーがEffect Stackにあり、選択するとPostprocessで編集でき、SANDBOXには出ない | component | `src/components/PostprocessPanel.test.tsx`、`src/components/SandboxPanel.test.tsx` | pass |
| AC-002 設定が範囲・列挙・角度に正規化され、プリセットが見た目だけを置き換える | unit | `src/types/texture.test.ts`、`src/store/gradientStore.texture.test.ts` | pass |
| AC-003 旧Presetは無効の既定値で読め、画像は保存されない | unit | `src/lib/presetModel.texture.test.ts` | pass |
| AC-004 Texture有効時にtexture pathと専用programが選ばれる | unit | `src/lib/effectPipeline.test.ts`、`src/lib/webglExportPrograms.test.ts` | pass |
| AC-005 shaderが実際のWebGL2でコンパイル・リンクできる | e2e (shaders project) | `tests/e2e/shaders.spec.ts`（22 program） | pass |
| AC-006 4種の手続き型プリセットと画像が意図した見た目になる | manual（ヘッドレスChromium＋SwiftShaderで撮影） | ヘアライン金属・CD・旋盤・紙・画像（cover／tile） | pass（見た目の最終判断はhuman review） |
| AC-007 タイル書き出しがフル描画と一致する | manual（`renderTiledToCanvas2D`で300pxタイルと単一タイルを比較） | 3プリセットで最大差1 | pass |
| AC-008 Image Gradient保護中でもTextureが表示される | manual | Image Gradient Sourceを読み込み、他のレイヤーが`PROTECTED`でもTextureが`APPLIED`で反映されることを確認 | pass |
| AC-009 Textureレイヤーの順序が描画へ反映され、レイヤーとconfigの有効状態が相互に反映される | unit / manual | `src/lib/effectPipeline.test.ts`、`src/store/gradientStore.texture.test.ts`、Noiseの前後で撮影 | pass |

## Merge Gate

| Check | Command | Status |
| --- | --- | --- |
| Change構造 | `npm run change:check` | pass |
| Fast validation | `npm run check:merge` | pass（lint警告21件は既存） |
| Shader compile | `npm run check:render` | pass |

## Release Gate

- 実GPU（統合GPU／専用GPU）でのフレーム時間。Texture有効時のPreviewが目標フレームレートを保てるか。
- Tauri実機での動画・静止画の書き出しの目視確認。
- Legacy V1のPresetを読み込んだ直後にTextureを有効にした場合の挙動（V2へ昇格されるため適用される想定）。

## Observation

- 高周波の溝（`cdGroove`、`spunMetal`）を縮小表示したときのモアレの程度。
- 画像素材に写真を使ったときの凹凸の強さ（`bump`の既定値0.6が適切か）。

## Commands

- `npm run docs:check`
- `npm run change:check`
- `npm run check:render`
