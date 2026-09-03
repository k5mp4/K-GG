---
type: validation
id: CHANGE-030
title: SANDBOX Flow Gradient Phase A の検証記録
status: approved
---

# CHANGE-030 検証記録

Flow Gradient Phase Aの実装結果を記録する。3Dエミッタ、透視投影、深度合成、既存Animationループ同期を実装し、最終調整後の実GPUで全画面投影、密度飽和、Full HD／400×400描画を確認した。Export／Thumbnail／Tileの画素一致、Context Lost/Restored、全パラメータの個別比較は未確認として残す。

## 受け入れ条件

| ID | 確認内容 | 証跡 | 状態 |
| --- | --- | --- | --- |
| AC-001 | SANDBOXでFlow Gradientを選択・有効化できる | `src/components/SandboxPanel.tsx`, `src/components/FlowGradientPanel.tsx`, localhost:5174手動確認 | pass（SANDBOXで選択・有効化し、Applied表示を確認） |
| AC-002 | GPU密度と速度方向splatで連続したRibbonを生成し、CPU近傍探索を使わない | `flow-splat.vert.glsl`, `flow-splat.frag.glsl`, `flow-trail.frag.glsl`, `flowGradientRenderer.ts`, shader source tests、localhost:5174手動確認 | pass（整数ハッシュで均一化した粒子を連続流線へ配置し、GPU加算密度とTrail平滑化から粒の見えないRibbon表示を実機確認） |
| AC-003 | Width、Stretch、Density等が観測可能な形状・密度変化になる | Flow uniform upload、localhost:5174手動確認 | partial（有効化によるRibbon表示変化を確認、各パラメータ個別比較は未完了） |
| AC-004 | 既存Gradient Rampでスカラー密度を着色する | `flow-gradient.frag.glsl`, `webglExportPrograms.test.ts`, localhost:5174手動確認 | pass（Rampをplasmaへ切り替えた際にFlowの低・中密度域が紫〜黄へ変化し、Ramp入力が白い粒子応答に隠れないことを確認） |
| AC-005 | Phase AのTemporal Trailだけを実装し、Directional Diffusionを公開しない | `flow-trail.frag.glsl`, `FlowGradientPanel.tsx`, shader source tests | pass（Directional DiffusionのUI・実装なし） |
| AC-006 | Seed、時刻、設定が同じ論理フレームを決定的に再現する | `src/lib/flowSimulation.test.ts`, session/frame key実装 | partial（純粋関数・キー検証済み、Preview/Export画素比較未確認） |
| AC-007 | Loop境界とprewarm後の結果が不連続にならない | `src/lib/animation.test.ts`, `src/lib/flowSimulation.test.ts`, loop phase/prewarm実装、MCP手動確認 | partial（Animation時計の0秒復帰はMCPで確認。Trail再構成の境界不連続を修正し、純粋関数テストはpass。修正後の母アプリ連続画面は再確認中） |
| AC-008 | Seek、設定変更、resize、Thumbnail、Exportで状態を初期化する | renderer reset/session実装、thumbnail/export入口 | partial（reset/prewarmのコード接続と先頭・終端Seekは確認、全入口の実機確認は未完了） |
| AC-009 | TransitionとTileで同一論理フレームを重複更新せず、終端フレームを重複しない | render session/frame key実装、tile/export手動確認 | partial（キー・session実装済み、専用テスト未追加） |
| AC-010 | 既存描画経路に回帰がない | 全Vitest 69 files / 384 tests、既存Flow無効経路 | partial（自動テストpass、実機回帰未確認） |
| AC-011 | FBO等を再利用し、能力不足とContext Lost/Restoredへ安全に対応する | Flow resources、RGBA8 FBO completeness check、context reinit入口 | partial（コード検査済み、GPU実機・dispose未確認） |
| AC-012 | docs、lint、build、自動テスト、手動確認が完了する | 下記コマンドとMCP手動確認 | partial（主要自動検証とGPU確認はpass、未確認の個別入口が残る） |
| AC-013 | 共通3Dエミッタから球面放射し、周期3D Curl場を固定ステップ積分する | `flow-splat.vert.glsl`, `webglExportPrograms.test.ts`, MCP実GPU確認 | pass（3D単位方向、周期Curl場、固定7ステップ積分を実装し、共通原点から分岐する滑らかなリボンを確認） |
| AC-014 | 固定透視投影と深度依存splat、clip、Tile Render基準を共有する | `projectFlowPoint`, depth-aware splat、`flowGradientRenderer.ts`, MCP 1920×1080／400×400確認 | pass（固定投影・near/far clip・深度寄与を実装し、両サイズで描画を確認） |
| AC-015 | 加算Densityとスクリーン相当の飽和で重なりを濃度へ変換し、粒・平坦な背景Gradientを残さない | `flow-splat.frag.glsl`, `flow-trail.frag.glsl`, `flow-gradient.frag.glsl`, shader source tests、MCP確認 | pass（Density加算、Trail平滑化、指数応答、Ramp色、透明背景を実装し、粒状表示と元背景Gradientの残留なしを確認） |
| AC-016 | Preview、Export、Thumbnail、Transition、Tileで3D Flow結果を決定的に共有する | `renderSceneAtTime.ts`, `tileRender.ts`, `flowGradientRenderer.ts`, frame-key tests | partial（共通入力・全画面投影・frame keyはコード確認、全出力経路の画素比較は未完了） |
| AC-017 | Animation再生中に既存Loop／Durationへ同期してFlowが周期再生し、終端フレームを重複しない | `src/lib/animation.test.ts`, `getFlowLoopPhase`, MCP 2周期確認 | pass（0→0.5→0の単体テスト、5秒終端と先頭の同形状、2周期目の継続を確認） |
| AC-018 | 再生開始、Restart、Pause/Resume、Seek、Loop境界でreset/prewarmし、位相0へ戻ってもTrailが破綻しない | `renderFlowGradient` reset/prewarm、MCP start/end/resume確認 | partial（開始、先頭・終端Seek、Pause/Resume、境界再開は確認、逆方向Seekと全ライフサイクル組合せは未完了） |

## 実行コマンド

実装後、リポジトリの完了条件に従って次を実行した。

    npm run docs:check
    npm run docs:build
    npm test
    npm run lint
    npm run build

今回の設計ではTauri/Rustを変更しないため、cargo testとcargo checkはN/Aとする。実装範囲がsrc-tauriへ広がった場合は、次のコマンドを追加する。

    cargo test --manifest-path src-tauri/Cargo.toml
    cargo check --manifest-path src-tauri/Cargo.toml

## 実行結果

- `npm test`: pass。69 files、384 tests。
- `npm test -- src/lib/webglExportPrograms.test.ts src/lib/flowSimulation.test.ts --run`: pass。2 files、12 tests。
- `npm run lint`: pass。エラーなし。既存のwarning 21件が残る。
- `npx tsc -b --pretty false --verbose`（`npm run build`内でも実行）: pass。TypeScriptの型検査が完了した。
- `npm run build`: pass。TypeScriptとVite build完了。既存のTauri dynamic importおよびchunk size warningが残る。
- `npm run docs:build`: pass。VitePress build完了。
- `npm run docs:check`: pass。41 legacy specs、7 current specs、21 changes、16 ADRsを検査した。

### Flow Gradient無表示の回帰検証

- 原因は、V2のDiffuse-only経路がFlow Gradient有効時もdirect描画として計画され、Flowの合成結果を画面へコピーする`stackCore`を要求していなかったことである。
- `canRenderV2Direct`、`getV2FramebufferAllocationMode`、`requiresV2StackCore`、`getV2RenderPlan`へFlow有効状態を渡し、Flow有効時は`core` FBOと`stackCore`を要求するよう修正した。
- `webgl.ts`から実際のFlow要求状態をRender Planへ渡す接続を追加した。
- `src/lib/effectPipeline.test.ts`に、Flow有効時のdirect禁止、`core` FBO、`stackCore`要求を確認する回帰テストを追加した。
- `src/lib/webglExportPrograms.test.ts`のFlowプログラム要求期待値を、画面コピーに必要な`stackCore`込みへ更新した。

### Ribbon密度場の平滑化検証

- 粒子ごとのsplatがRGBA8密度へ強く加算され、Trailも加算蓄積していたため、局所ピークが個別の点・短線として残っていた。
- 粒子は共通3D原点から決定的な3D単位方向へ放射し、周期的な解析Curl場を7ステップ固定積分して位置・速度・深度を求める方式へ変更した。
- splatは投影後の速度方向付きGaussian密度だけをDensity FBOへ出力し、深度でサイズと寄与を変化させる。Densityを25 tap、前Trailを9 tapで再構成してから、指数型の飽和応答へ変換する。
- 最終合成は元のBase RGBへの加算を廃止し、飽和DensityをGradient Rampの色と透明度へ入力する。重なりの多い部分ほど濃く、低密度部は透明な滑らかなFieldとして見えるようにした。
- shader sourceテストで整数ハッシュ、流線配置、Curl移流、密度・Trail平滑化、指数移動平均、密度応答、Ramp直接出力を固定した。

### ブラウザー手動確認

- `http://127.0.0.1:5174/`をNVIDIA GeForce RTX 3060 Ti / ANGLE D3D11（WebGL2、HIGH）で開き、SANDBOXのEdit LayerからFlow Gradientを選択・有効化した。UIが`Applied`になり、通常Gradientから透明背景の滑らかな複数リボンへ変化することを確認した。
- 共通原点から分岐した複数の曲線、Curlによる不規則な重なり、深度による投影変化、個別粒子の点・短線が視認できないDensity表示を確認した。
- Animationを5秒で再生し、先頭、0.88秒付近、終端5.00秒、終端からの再開、2周期目を確認した。終端と先頭は同じリボン形状へ戻り、再開時に停止・フラッシュ・濁り・ジャンプは見られなかった。
- キャンバスサイズをFull HD 1920×1080から400×400へ変更し、同じ固定投影基準でFlowが描画されることを確認した。最終確認時にshader compile/link、Framebuffer incomplete、Flow runtimeエラーはなかった。

### Tile投影基準の追加検証

- Density／Trail FBOをViewportではなくFull Resolution基準で確保し、Compositeだけで`tileOffset`を加えてサンプルするよう修正した。
- shader source testで`u_fullResolution`、`u_tileOffset`、全画面Trail UVを固定した。
- 実GPUでFull HDと400×400を再描画し、同じ3D投影契約でFlowが表示されることを確認した。高解像度Tileの画素比較は未確認として残した。

### 3D追加要求の検証結果

MCPの実GPUブラウザーで次を確認した。

- 共通原点から複数方向へ放射される流線と、深度依存の投影・splat寄与を1920×1080および400×400で確認した。
- 既定設定で、重なりの多いリボン中心がRamp色と密度応答で濃くなり、個別粒子や元画像RGBの平坦な背景が主表示に残らないことを確認した。
- 既存Animationの5秒Loopを2周期以上再生し、同じ位相へ戻った際の連続性を確認した。
- Preview、Thumbnail、静止画、連番、動画、Tileの画素比較、全UIパラメータ個別比較、逆方向Seekの全組合せは未確認として残した。

## 文書パッケージ作成時の検証

- npm run docs:build: pass。CHANGE-030を含むVitePressのビルドとページレンダリングが完了した。
- npm run docs:check: pass。CHANGE-030のcurrent spec統合後も文書ID、requirement heading、status整合を確認できた（41 legacy specs、7 current specs、21 changes、16 ADRs）。

### 3D追加要求追記後の再検証

- `npm run docs:check`: pass。`status: approved`、`human_review: completed`、追加されたFLOW/ACとactive indexの整合を確認した（41 legacy specs、7 current specs、21 changes、16 ADRs）。
- `npm run docs:build`: pass。3D追加要求を含むCHANGE-030のVitePressビルドとページレンダリングが完了した。
- `git diff --check`: pass。追記した文書に空白・改行エラーはない。
- 再生ループ要件追記後も `npm run docs:check` と `npm run docs:build` はpass。Loop仕様、受け入れ条件、検証計画の文書整合を確認した。

### 全画面投影・密度レンジの最終調整（2026-08-13）

- `flow-splat.vert.glsl`の固定カメラを`CAMERA_Z=32`、`FIELD_SPREAD=vec2(1.8, 1.35)`、`SCREEN_FIELD_SCALE=3.2`、球面方向数を2048へ固定し、共通原点からの3D流線が画面全体の正規化座標へ分布することを確認した。流線は64サンプル単位で束ね、速度方向カプセルを長く・細く投影している。
- `flow-splat.frag.glsl`は単色粒子の寄与だけをDensity FBOへ`ONE/ONE`で加算し、`flow-gradient.frag.glsl`は`1-exp(-trail * response)`と単色スクリーン相当応答で重なりを白へ飽和させる。元画像RGBを背景として加算する経路はない。
- Full HD・既定粒子数100000で、中心の高密度領域から左右・奥行き方向へ伸びる細い流線、重なり部分の白いハイライト、透明な低密度外周をRTX 3060 Ti / ANGLE D3D11 / WebGL2で確認した。
- 400×400では、内部FBOの面積に応じてDensity寄与を補正する処理を追加し、同じ100000粒子でも全面白飛びせず、中心の飽和と外周の低密度ストランドを維持することを確認した。
- 最終GPUログにはFlow固有のshader compile/link、Framebuffer incomplete、runtime errorはなかった。残った`THREE.WebGLProgram`の警告は既存Cloth系の`f_flowDisplacement`未初期化警告で、Flowシェーダー由来ではない。
- 画像例との完全な画素一致や、Export／Thumbnail／Tileの出力画素比較は未確認である。見た目の最終調整は、粒子数、Ribbon Width、Trail、Densityで変わるため、全UI組合せの比較は別途必要である。

### MCP再測定：Ramp可視化・全画面占有・UIレイアウト（2026-08-13）

- MCPで取得した最終ベースラインは、Seed 42、Particle Count 100000、Curl Scale 2.5、Curl Strength 1.00、Speed 0.60、Ribbon Width 8px、Stretch 8.00、Density 1.00、Trail 85%、Contrast 1.20、Loop ON、Duration 5.00秒である。
- `flow-gradient.frag.glsl`の`particleColorMix`を低い固定白寄りから、Densityに応じた`0.10–0.65`の範囲へ変更した。Ramp色を低・中密度域へ残し、重なりが多い領域だけを白へ寄せることで、plasma Ramp選択時に紫〜黄のFlowが画面上で確認できた。
- Stretchを8へ設定したMCP手動確認では、Flow canvas 624×351pxのほぼ全高と大部分の横幅へ連続したDensity Fieldが広がり、中心の局所的な4割表示から改善した。低密度外周は透明チェッカーを残した。
- `FlowGradientPanel`の`sm:grid-cols-2`を1列グリッドへ変更し、MCPでパネル幅219px・高さ840pxの縦長表示を確認した。10個の操作項目が横方向に押し潰されず、Gradient Rampの現在値プレビューと編集案内も表示される。
- この検証はCHANGE-030の承認済み範囲内の視認性・レイアウト修正である。粒子寿命／再spawnモデルの撤去、Curl Scale 0.01–3.00、Ribbon Width 1–5px、Stretch 0–16への変更は、別候補CHANGE-032としてレビュー待ちであり、未実装である。

## 手動確認

- SANDBOXでFlow Gradientを有効化し、Ribbon Width、Stretch、Density、Trail、Contrastを個別比較する（未確認）。
- Gradient Rampの色を変更し、Flowの色がRampに追従することを確認する（MCPでplasmaへ変更して確認済み）。
- Seedを同じ値へ戻し、同じLoop Durationと時刻で同じ画面になることを確認する（純粋関数キーのみ確認済み）。
- Loopの先頭と終端、再生再開、Seekの前後、設定変更後のTrail初期化を確認する（先頭・終端・再開は確認済み、逆方向Seekは未確認）。
- Preview、Thumbnail、静止画、連番、動画の同一フレームを比較し、Tile数でTrailが変化しないことを確認する。
- Flowを無効化した状態でParticles、Prism、Glass、Glass V2、Seamless Tilingの既存結果を確認する。
- ウィンドウサイズ変更、Context Lost/Restored相当の再初期化、FP16非対応またはRGBA8フォールバック環境で黒画面・リークがないことを確認する。

## 未確認事項

- Preview/Export/Thumbnail/Tileの画素比較、全UIパラメータの個別比較は未確認である。Gradient Ramp変更のPreview反映はMCPで確認済みだが、各出力経路の画素比較は未確認である。
- GPUごとのContext Lost/Restored、最大Particle Count時の性能、FBO disposeの実機確認は未確認である。
- Phase AでDirectional Diffusionを実装しないことは仕様上の対象外であり、Phase Bの採否は別CHANGEでレビューする。
- 3Dエミッタ、3D Curl積分、固定view/projection、深度依存splat、スクリーン相当のDensity飽和は実装・MCP確認済みである。
- Animation時計の周期再生、終端フレーム重複防止、Pause/Resumeは確認済み。Loop境界の最終画面連続性は、reset前位相を保持するprewarm修正をテスト済みだが、100000粒子のmother画面での再確認は未確認である。逆方向Seek、Restartと全設定変更の組合せも未確認である。

### Loop境界・Density平滑化の再現と修正（2026-08-13）

- ローカルmotherアプリ（`http://127.0.0.1:5173/`）で、Loop ON・Duration 5.00秒・Particle Count 100000・Stretch 8の状態を再現した。Animation表示時刻は4.50秒から0.04秒へ戻り、Animation時計そのものはループしていた。
- 旧`renderFlowGradient`は、位相が巻き戻った直後にTrailをresetしたあと、先頭位相から現在位相までの1ステップだけを評価していた。このため、画面上の時計はループしてもFlowのTrailが薄くなり、ユーザーからは非ループに見える状態だった。
- `getFlowResetPhases`を追加し、初回／Loop境界では24ステップの1周期prewarmを行い、巻き戻り後は現在位相まで追い付く追加ステップを実行するよう変更した。reset前の位相を保持して計画へ渡すことを`src/lib/flowSimulation.test.ts`で検証した。
- 粒子ごとに揺れていた隠れたアルファを既定の単色寄与へ揃え、流線の先頭・末尾に寿命由来のフェードを入れず、Density FBOの作業解像度を0.4倍へ集約した。Density／Trailの近傍再構成を広げ、Compositeではサブテクセルの孤立値を透明側へ落とした。
- motherアプリではFlowの白い高密度核と赤い低密度帯が連続したFieldへ近づくことを確認した。Loop境界修正後の100000粒子での連続画面は、アプリ負荷が高く再取得できなかったため未確認として残す。Particle Opacity／Size／Flow OpacityのUI追加は未実装で、レビュー待ちのCHANGE-032へ分離している。

### UI/Ramp修正後の自動検証（2026-08-13）

- `npm test`: pass。69 files、384 tests。
- `npm run lint`: pass。エラーなし。既存warning 21件が残る。
- `npm run build`: pass。TypeScriptとVite build完了。既存のTauri dynamic importおよびchunk size warningが残る。
- `npm run docs:check`: pass。41 legacy specs、7 current specs、22 changes、16 ADRs。
- `npm run docs:build`: pass。VitePress buildとページレンダリング完了。
- `git diff --check`: pass。
