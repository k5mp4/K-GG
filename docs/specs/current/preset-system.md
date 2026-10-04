---
type: current
id: CURRENT-PRESET
title: Preset System
status: current
owners: [maintainer]
created: 2026-07-27
updated: 2026-10-04
requirement_ids: [PRESET-001, PRESET-002, PRESET-003, PRESET-004, PRESET-005, PRESET-006, PRESET-007, PRESET-008, PRESET-009, PRESET-011, PRESET-012, PRESET-013, PRESET-014, PRESET-016, PRESET-017, PRESET-018, PRESET-019, PRESET-020, PRESET-021, PRESET-022, PRESET-023]
related_adrs: [ADR-0007, ADR-0008, ADR-20260927-datamosh-feedback-layer, ADR-20260929-sandbox-texture-material-stage, ADR-20260930-sandbox-shapes-final-stage]
related_changes: [CHANGE-001, CHANGE-012, CHANGE-013, CHANGE-018, CHANGE-024, CHANGE-025, CHANGE-026, CHANGE-027, CHANGE-030, CHANGE-031, CHANGE-032, CHANGE-034, CHANGE-037, CHANGE-039, CHANGE-046, CHANGE-048, CHANGE-051]
related_code: [src/lib/presetModel.ts, src/lib/presetLibrary.ts, src/lib/presetLibraryActions.ts, src/lib/history.ts, src/lib/presets.ts, src/lib/presetPreview.ts, src/lib/presetThumbnail.ts, src/lib/presetLibraryCache.ts, src/lib/panelLayout.ts, src/lib/flowGradientRenderer.ts, src/types/flowGradient.ts, src/types/datamosh.ts, src/lib/effectPipeline.ts, src/lib/glass.ts, src/lib/postprocessStack.ts, src/store/gradientStore.ts, src/components/PresetPanel.tsx, src/components/PresetContextMenu.tsx, src/components/FlowGradientPanel.tsx, src/components/DatamoshPanel.tsx, src/components/PresetPreview.tsx, src/components/ClothCanvas.tsx, src/types/coneView.ts, src/adapters/types.ts, src/adapters/browser/presetRepository.ts, src/adapters/tauri/presetRepository.ts, src/lib/kggControlRuntime.ts, src-tauri/src/lib.rs, src/types/texture.ts, src/types/shapes.ts]
related_tests: [src/lib/presetLibrary.test.ts, src/lib/presetLibraryActions.test.ts, src/lib/history.test.ts, src/lib/presetModel.diffuse.test.ts, src/lib/presetModel.slit.test.ts, src/lib/presetModel.removedEffects.test.ts, src/lib/presetModel.compact.test.ts, src/lib/flowGradientPreset.test.ts, src/lib/presetPreview.test.ts, src/lib/presetThumbnail.test.ts, src/lib/presetThumbnail.lifecycle.test.ts, src/lib/presetLibraryCache.test.ts, src/lib/glass.test.ts, src/lib/postprocessStack.test.ts, src/store/gradientStore.glass.test.ts, src/store/gradientStore.postprocessStack.test.ts, src/store/gradientStore.animation.test.ts, src/types/coneView.test.ts, src/lib/effectPipeline.test.ts, src/lib/presetModel.texture.test.ts, src/lib/presetModel.shapes.test.ts]
---

# Preset System

## 目的

Preset Systemは、Gradient、Effect Stack、アニメーションなどの編集状態を名前付きで保存し、一覧から再利用・整理・交換できるようにします。保存先の違いをUIへ持ち込まず、Web版とTauri版で同じ文書モデルと正規化規則を使用します。

## 現在の要件

### PRESET-001 保存する状態

Presetの `state` には、Gradient、Noise Distortion、Diffuse、Image Gradientの設定、Slit Scan、Stretch、Animation、Normal Map、手描きDistort、Postprocess、Effect Pipeline、キーフレームトラック、Gradientに適用中のユーザーカラーパレット、解像度などの編集状態を含められます。

選択中のUI状態や互換用の任意フィールドが含まれることはありますが、Presetの読込時は描画に必要な状態を正規化してからストアへ適用します。手描きDistortはPostprocess設定を正規値とし、旧Presetの`manualDistort`だけに残る値は読込時にPostprocessへ移行します。新規保存ではPostprocessがある限り`manualDistort`を書き出さず（PRESET-020）、読込時は旧`manualDistort.enabled`をLegacy generatorの独立入力として有効化しません。Slitの新規Presetには`phaseAnimEnabled`と`phaseSpeed`を保存せず、旧Presetの同キーおよび`slitScan.slitPhase`のPhase Motionキーフレームは無視します。手動設定の静的な`slitPhase`は保存・復元します。削除済みのRadon、Iridescence、Matcapについて、旧Presetの`radon`・`iridescence`・`matcap`と`radon.*`・`iridescence.*`のキーフレームは読込時に無視し、再保存時に取り除きます。

### PRESET-002 保存しない外部入力

Image Gradient Sourceの元画像、Image Overlay/Mask、Texture画像、SANDBOX Shapesで読み込んだSVGなどの外部画像オブジェクトやファイルパスはPortableなPresetへ保存しません。読込後に外部入力が存在しない場合は、該当設定を保ったまま安全なフォールバックを表示します。

### PRESET-003 Preset文書と互換性

単一Presetは `id`、`name`、`createdAt`、`state` を必須とし、仮想フォルダの `folderId`、同階層の `order`、任意の画像データURL `thumbnail` を持ちます。旧Presetでは任意フィールドが欠落していても読み込める範囲で既定値を補完します。

フォルダを含むライブラリは `format: kgg-preset-library`、`version: 2`、`folders`、`presets` を持ちます。旧来の単純なPreset配列もライブラリのルートへ正規化できます。既存の識別値と保存済み状態を壊す自動変換は行いません。

### PRESET-004 仮想フォルダ

フォルダはOS上の実フォルダではなく、ID、名前、親ID、表示順、作成時刻を持つ仮想階層です。ルートの親IDは `null` です。空名、パス区切り文字、制御文字、長すぎる名前、重複名、存在しない親、循環階層は拒否します。

Presetは作成後に別フォルダへ移動できます。フォルダ削除時は子フォルダとPresetを親側へ付け替えます。

### PRESET-005 利用者操作

現在提供される操作は、Presetの新規保存・読込・削除・フォルダ移動、フォルダの作成・名前変更・移動・削除、Preset/フォルダ/ライブラリの書出し・読込みです。既存Presetを同じIDへ上書きする専用の更新操作は現在のRepository契約にありません。同名保存は新しいPresetとして扱われます。

内蔵Presetはアプリへ同梱された読み取り専用の初期データです。利用者が保存したPresetとは削除・移動の扱いが異なります。

### PRESET-006 Thumbnail

保存時に、可能なら低解像度（320×200）のEffect Stack描画結果を画像データURLとして1枚保存します。描画前に、そのPresetのEffect Stackが必要とするshaderの遅延コンパイル完了を待ち、有効な全レイヤー（Datamosh、Cloth、Coneを含む）を適用した結果を撮ります。コンパイルに失敗したレイヤーはプレビューと同じく省いて描画します。Datamoshのように前フレームの履歴を使うレイヤーが有効な場合は、ループ末尾から時刻0へ向かう約1秒分のフレームを先に描画して履歴を作り、キャプチャごとに新しい描画セッションで前回の履歴を持ち越しません。UIのEffect Stack切替トランジションは合成しません。描画結果はWebP（品質0.8）とPNGの両方でエンコードし、小さい方を保存します。WebPをエンコードできない環境ではPNGになります。旧PresetのPNG Thumbnailはそのまま読み込み・書出しします。保存済みThumbnailは一覧表示で再利用し、一覧表示のたびに各PresetをWebGLで描画しません。描画できない場合、旧Preset、内蔵Preset、外部画像を必要とするPresetは軽量な2Dプレビューへフォールバックします。

Thumbnailは任意フィールドで、交換用JSON/ZIPへ含められます。過大なデータや不正な形式は読込み時に拒否します。

### PRESET-007 Web版とTauri版

Web版はブラウザの `localStorage` を保存先とし、単一PresetはJSON、フォルダ/ライブラリはZIPまたはJSONのダウンロードとして交換します。Tauri版はアプリデータ領域を保存先とし、OSの保存ダイアログとファイルAPIを使います。

文書モデル、正規化、検証、ZIP展開、インポート時のID再採番と追加マージは共通です。保存先と権限エラーの表現だけが実行環境に依存します。

### PRESET-008 破損データと安全性

Presetやライブラリは読込時に構造、ID、親子関係、循環、名前、サイズ上限を検証します。破損データを現在のライブラリへ部分適用せず、エラーとして扱います。Web版で読込に失敗した場合は空ライブラリへフォールバックし、Tauri版でも保存済みデータを壊さずにエラーを通知します。

交換ファイルは読込前に32 MiB以下へ制限し、Worker内で検証・展開する。ZIPは`preset-library.json`だけを含むZIP32を受け付け、展開サイズ16 MiB以下、実サイズ、CRCを検証する。追加エントリ、ZIP64、暗号化、不正サイズは拒否する。10秒以内に完了しないimportはWorkerを終了し、保存済みライブラリを変更しない。

### PRESET-009 GLASS V2色設定の互換保存

PresetはGLASS V2のChromatic Hue、Chromatic Saturation、Transmission Tint、Highlight TintをPostprocess設定として保存・復元します。これらを持たない旧Presetは、変更前外観と同一になる`0°`、`100%`、`#FFFFFF`、`#FFFFFF`を補完します。無効なHEX、非有限値、範囲外の数値は、描画前に安全な既定値または上限へ正規化します。

### PRESET-011 Postprocess Glassの互換正規化

旧PresetのPostprocess設定にある`effectMode: glass`およびstackの`kind: glass`は、読込時に`glassV2`へ写像します。`glass`と`glassV2`が重複する場合は最初の位置を維持し、有効状態を論理和で統合します。正規化後のPostprocess設定と新規保存値には旧`glass`を残しません。

### PRESET-012 Preview表示モードの非永続性

Canvas／Clothの一時的な表示選択、GPU shaderやframebufferはPresetの保存対象に含めません。Coneの有効状態と順序はEffect Pipelineの`effectStack`構成としてPRESET-013に従い保存します。Preset読込後は保存されたMain Stack順に従ってConeが通常レイヤーとして処理されます。Thumbnailは保存されたEffect StackとCone設定を使い、現在のGPU資源は復元しません。

### PRESET-013 Cone設定の永続化

ConeのDepth、Rotation、Apex X、Apex Y、Texture Repeat、Seam Blend、Seam Mode、Flow Cycles、Mappingは`coneView`としてPresetへ保存します。ON/OFFとMain Stack内の順序は`effectPipeline.effectStack`の`kind: cone` layerに保存します。Depthは2..30、Apex X／Apex Yは-2..2、Flow Cyclesは-30..30へ正規化します。Perspectiveは保存対象ではなく、旧Presetに残っていても無視します。Seam ModeはMirror Repeat、Edge Weld、Gradient Reapplyを受け付け、欠落、削除済みのWrapped Smooth、未知・非有限・範囲外の値はMirror Repeatへ戻します。明示的に保存された有効な方式はそのまま復元します。旧Effect Stack snapshotでConeレイヤーが欠ける場合は無効な新規レイヤーとして補完します。`effectPipeline.selectedKind`は設定編集先の選択状態であり、Coneの有効状態とは独立です。

### PRESET-014 Stippleの保存互換

StippleはDiffuseの`mode: "legacy"`としてScatter、Grain、Seed、Seed Per Frameを含む既存Diffuse設定へ保存します。`mode`が欠落した旧Presetは従来どおり既定モードを補完し、Block、Smooth、Dither、Halftone、ASCIIの保存値は変換しません。

### PRESET-016 Flow Gradientの保存互換

Presetは`effectPipeline.flowGradientEnabled`と`flowGradient`のFlow設定を保存します。Flow Opacity、Particle Opacity、Particle SizeもFlow設定として保存・復元し、欠落した旧Presetはそれぞれの既定値へ正規化します。Flow設定がない旧Presetは安全な既定値へ正規化し、Flowを無効として読み込みます。Thumbnail用の独立WebGLコンテキストではFlowの履歴を前フレームから引き継がず、対象時刻へ決定的に事前評価してから描画します。既存ParticlesやEffect Stackの保存値は変更しません。

### PRESET-017 SANDBOX設定の完全保存

Preset保存時のスナップショットには、Cloth、Cone、Normal、Prism、Particles、Flow Gradient、Datamosh、Seamlessの永続化対象設定を含めます。Clothは`clothGradient`、Coneは`coneView`と`effectPipeline.effectStack`、Normal／Prism／Particlesは`normalMap`と`effectPipeline`、Flow Gradientは`flowGradient`と`effectPipeline.flowGradientEnabled`、Datamoshは`datamosh`と`effectPipeline.effectStack`、Seamlessは`seamless`として保存・復元します。Textureは`texture`と`effectPipeline.effectStack`として保存・復元します（PRESET-019）。Shapesは`shapes`として保存・復元します（PRESET-021）。旧Presetで欠落している任意設定は各normalizerの既定値へ補完します。Canvas／Clothの一時表示面、SANDBOXの選択中Edit Layer、GPU資源は保存しません。

### PRESET-018 Datamosh設定とVideo Motionの保存互換

PresetはDatamoshレイヤーのmotion source、Mix Mode、各パラメータを`datamosh`として、有効状態と順序を`effectPipeline.effectStack`として保存・復元し、範囲外の値は各パラメータの範囲へ、未知のmotion source／Mix Modeは既定値へ正規化します。動画ファイル、Object URL、HTMLVideoElement、motion field、Datamoshの履歴textureは保存しません。Effect Stackの`videoMotion`レイヤーは同じ位置の`datamosh`レイヤーへ、`datamosh`を持たない旧Presetの`videoMotion`設定は`Video Motion` source・`Ramp Lock`のDatamosh設定へ、読み込み時に移行します（CURRENT-EFFECT-STACKのDATAMOSH-005）。保存時は`videoMotion`を書き出しません。どちらも持たない旧Presetは無効な既定値へ正規化し、動画未接続時も既存のGradient描画を継続します。

## 他領域との関係

- Gradient Systemは `state.gradient`、Image Gradient設定、Meshの正規化を定義します。
- Effect Stackは `state.effectPipeline` を有効状態・順序の一次情報として使用します。
- Animationは `state.animation` と `state.keyframeTracks` に保存され、Preset読込後も同じ時刻評価へ渡されます。
- Preset読込は`animation.previewLoop`とLoop Timing（`animation.easing`、Beat Sync含む）を上書きせず、読込前の値を維持します。Duration、Speed、FPSなどそれ以外のAnimation設定はPresetの値を反映します。保存時は現在のLoop Timingを保存します。

## 変更履歴

- [SPEC-025 Preset Libraryとフォルダ](../SPEC-025-preset-library-and-folders)
- [SPEC-026 操作性と描画Thumbnail](../SPEC-026-preset-library-ux-and-rendered-thumbnails)
- [SPEC-031〜033 アニメーションと出力時刻](../index#legacy-change-specifications)
- [SPEC-040 Mesh Gradation](../SPEC-040-mesh-gradation)
- [CHANGE-012 GLASS V2色調整コントロール](../../changes/archive/CHANGE-012-glass-v2-color-controls/proposal)

Legacy SPECは保存形式が変化した経緯を追うために残します。現行の保存契約・環境差・未実装の更新操作はこの文書を確認してください。

## 未確認・今後の現行仕様化

保存先の容量上限、ブラウザのlocalStorage quota超過時の利用者向け表示、異なるGPUで生成されたThumbnailの再現性は、現行仕様として数値保証していません。Presetの専用更新操作が必要になった場合は、ID・履歴・Thumbnail更新の意味を含む別変更として定義します。

### PRESET-019 Texture設定の保存互換

`texture`と、`effectPipeline.effectStack`内の`texture`レイヤー（有効状態と順序）はPresetの永続化対象です。SANDBOX時代の保存（レイヤーがなく`texture.enabled`だけが有効）は、読み込み時にレイヤーを有効にして引き継ぎます。保存時と読み込み時に`normalizeTextureConfig`で範囲と列挙を正規化し、旧Presetにない場合は無効の既定値を使います。Texture用に読み込んだ画像はPortableなPresetへ保存せず、読込後に画像がない場合は選択中の手続き型プリセットで描画します。Thumbnailも同じ規則で、画像を使いません。

### PRESET-021 Shapes設定の保存互換

`shapes`（有効状態、形状ソース、配置、輪郭と陰影、Fill、オーラと階調、背景、表示・非表示ループ）はPreset、履歴（undo／redo）、storeの永続化対象です。保存時と読み込み時に`normalizeShapesConfig`で範囲と列挙を正規化し、旧Presetにない場合は無効の既定値を使います。`source: custom`で読み込んだSVGは保存せず、読込後にSVGがない場合とThumbnailでは内蔵の`star`で描画します。

### PRESET-020 保存データの最小化

Presetの新規保存と書出し（単一JSON、フォルダ／ライブラリZIP）では、読込時に同じ状態へ再構成できるデータと、そのPresetが使わないライブラリデータを書き出しません。

- `postprocess`がある場合の旧`manualDistort`。読込時は従来どおりPostprocessの手描きDistort設定から無効状態で補完します。`postprocess`を持たない旧Presetの`manualDistort`は残します。
- `postprocess`と、残した`manualDistort`の`displacement`／`smoothMask`のうち全要素が0のもの。読込時は`mapResolution`から空のマップを作ります。描画済みのマップは保存します。
- Gradientに適用されていないユーザーカラーパレット。パレットの適用はRampへstopsを複製する操作で参照を残さないため、stopsの位置と色がRampの`gradient.stops`と一致するもの（Mirror有効時は位置を1/2にして比較）だけを`colorPalettes`へ残し、一致するものがなければ`colorPalettes`自体を書き出しません。読込時は残ったパレットだけを利用者のパレット一覧へ追加します。Rampの色は`gradient.stops`に保存されるため、描画結果は変わりません。
- `effectPipeline.version`が`stack-v2`のPresetにおける`postprocess.effectStack`と`postprocess.diffuse*`。Stack v2は順序を`effectPipeline.effectStack`、Post Diffuseを`diffuse`から取るため、これらはLegacy v1描画だけが読むフィールドです。Legacy v1のPresetでは保存します。

保存済みライブラリ内の既存Presetは自動で書き換えず、書出し時に同じ省略を適用します。省略済みPresetは旧来の完全な形式と同じ描画状態で読み込め、正規化を経ずにストアへ適用するMCPの`apply_preset`は省略したフィールドを補完してから適用し、前の文書の値を残しません。無効な機能の設定値と既定値と同じ値は、再有効化時の復元と既定値変更時の外観維持のため省略しません。

### PRESET-022 一覧表示と起動時の一括ロード

Preset一覧は、起動時に保存済みライブラリを一度だけ読み込んでメモリへ保持し、保存済みThumbnailを先にデコードします。内蔵Presetも起動後に一度だけ正規化します。Presetの適用、一覧の再描画、フォルダ移動の表示では保存先を読み直しません。保存、削除、フォルダ操作、読込み（import）、MCP経由の保存・削除の後だけ、保存先を読み直して一覧を更新します。保存先の読込に失敗した場合は、直前の一覧を保ったままエラーを表示します。

Presetはカードをクリックした時点で適用し、専用のLoadボタンは置きません。グリッド表示ではPreset名をThumbnail画像の下端に重ねて表示し、列数は左サイドバーの幅に応じて1〜4列で増減し（カード幅の下限100px、5列以上にはならない）、フォルダーカードも同様です。左サイドバーの幅は240〜720pxの範囲でドラッグして変えられます（ウィンドウにプレビューの最小幅が残る範囲まで）。ウィンドウが狭いときのサイドバーの縮小とオーバーレイ表示はワークスペースのレイアウト規則に従います。適用中のPresetは枠で示します。保存済みPresetのフォルダ移動と削除はカード上へ重ねて表示せず、右クリックのメニューから行います（PRESET-023）。リスト表示もクリックで適用します。Presetを開くとき、そのPresetが使うShaderのコンパイルを待たなくて済むよう、起動後のアイドル時間に内蔵・保存済みの全Presetが必要とするShaderを先にコンパイルします（CURRENT-WEBGL-PERFORMANCEのPERF-011）。フォルダー移動はパネル上部のパンくずリスト（ライブラリルート › フォルダー › …）で行い、各階層をクリックするとその階層へ戻れ、階層へのPresetのドラッグ移動にも使えます。フォルダー階層のアコーディオンを開かなくても、一覧のフォルダーカードで下りて、パンくずで戻れます。Preset適用でAnimationやNoise、Slit、Stretchの設定が変わっても、下部のAnimationパネル（タイムライン）は自動では開きません（利用者が各設定を手で有効にしたときの自動表示は従来どおりです）。Presetパネルの下部には、上から順にフォルダー階層のアコーディオン、保存欄、書き出し（Export preset）のアコーディオンを置きます。フォルダー階層は既定で閉じており、開くとフォルダーの一覧、新規フォルダー欄、名前変更・削除を表示します。保存欄はPreset名の入力、Saveボタン、importボタンを1行に並べ、importは保存先と同じ現在のフォルダーへ読み込みます。書き出しも既定で閉じており、開くと書き出す範囲（選択中のPreset、現在のフォルダー、保存済み全部）をラジオボタンで選べます。選択中のPresetを書き出す場合だけPresetの選択欄を表示し、ルートを選んだ状態でフォルダーを書き出すと保存済み全部を書き出します。
Presetの適用結果、保存形式、Thumbnailの描画は変わりません。

### PRESET-023 複数選択・右クリック操作・Undo/Redo

保存済みPresetは、Shiftを押したままカードをクリックすると、最後にクリックしたカード（起点）から押したカードまでを、表示順で一括して選択できます。起点を変えずにShiftクリックを重ねると、そのつど起点からの範囲に取り直します。起点が無いときは押したカードだけを選び、そのカードを起点にします。Ctrl/Cmdを押したままクリックすると、1枚ずつ選択へ追加・解除でき、そのカードが新しい起点になります。選択したカードは枠とチェックで示し、Presetは適用しません。修飾キーなしのクリックは選択を解いてPresetを適用し、そのカードを起点にします。内蔵Presetは選択できません。選択は表示中のフォルダー内に限り、フォルダーを移ると解除します。Escapeまたは一覧の余白のクリックでも解除します。

選択中にDeleteまたはBackspaceを押すと、選択したPresetをまとめて削除します。入力欄を編集しているとき、パネルが表示されていないときは何もしません。保存先の移動と削除は、誤って押さないようカード上のボタンではなく、右クリックのメニュー（削除、保存先フォルダーへの移動）に置きます。右クリックしたPresetが選択外ならそのPresetだけを選択して開き、選択内なら選択中の全Presetが対象です。複数選択したPresetをフォルダー階層・パンくず・フォルダーカードへドラッグしたときも、選択中のPresetをまとめて移動します。

Presetの削除と保存先の移動（メニュー、Delete、ドラッグのいずれでも）は、パラメーター編集と同じUndo/Redo履歴に時系列で積み、Ctrl/Cmd+ZとCtrl/Cmd+Shift+Z（Ctrl/Cmd+Y）で戻す・やり直せます。削除のUndoは元のID・フォルダー・表示順で復元し、そのフォルダーが既に無ければルートへ戻します。フォルダー操作、Presetの新規保存、読込みはUndo/Redoの対象外です。
