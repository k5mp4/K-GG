---
title: UI用語・アイコン表記ガイド
---

# UI用語・アイコン表記ガイド

この文書はK-GGの表示名称、翻訳キー、操作アイコンを追加・レビューするための規範である。実際に画面へ表示する文字列の一次情報は`src/i18n/messages.ts`、汎用パラメータ用語は`src/i18n/uiLabels.ts`とする。

## 表記規則

- 文として説明する箇所は自然な文章、短いラベルは簡潔な名詞または動詞にする。
- 英語は見出しをTitle Case、説明文をSentence caseとする。日本語の見出しには不要な空白を入れない。
- `K-GG`、`Tweeq`、RGB、FPS、BPM、PNG、MP4、FFmpeg、WebGLは両言語で同じ表記にする。
- トップバーとEffect Stackのエフェクト名・カテゴリ名・見出しは日英どちらの設定でも英語を使う。各パネル内の説明文とパラメータ名は選択言語へ翻訳する。保存キー、shader uniform、型名は変更しない。
- Diffuseのモード選択は`InputRadio`を使い、ラベルを`Block`、`Smooth`、`Dither`の英語表記に固定する。
- アイコン専用ボタンは`IconButton`を使い、同じ翻訳結果を`title`と`aria-label`へ設定する。
- 保存、書き出し、インストールなど結果が大きい主要操作はアイコンと短い文言を併記する。

## 共通操作

| 翻訳キー | English | 日本語 | `IconName` | 用途 |
| --- | --- | --- | --- | --- |
| `common.close` | Close | 閉じる | `close` | modal、popover、panel |
| `common.reset` | Reset | リセット | `restart` | parameter、anchor、viewport |
| `common.delete` | Delete | 削除 | `delete` | stop、preset、image |
| `common.duplicate` | Duplicate | 複製 | `copy` | stop、preset |
| `common.distribute` | Distribute evenly | 等間隔に配置 | `distributeHorizontal` | ramp stop |
| `common.reverse` | Reverse | 反転 | `reverse` | ramp、order |
| `common.load` | Load | 読み込む | `upload` | image、preset |
| `common.save` | Save | 保存 | `save` | persistent save |
| `common.export` | Export | 書き出す | `download` | image、video、preset |
| `common.detach` | Open in another window | 別ウィンドウで開く | `window` | Effect Stack |
| `common.shuffle` | Shuffle | シャッフル | Tweeq `InputShuffle` | Seed、ramp |

## 画面領域ごとの名称

| 領域 | 翻訳キー例 | English | 日本語 | アイコン方針 |
| --- | --- | --- | --- | --- |
| Top bar | `effect.diffuse` | Diffuse | Diffuse | status dotと短いlabel |
| Top bar | `effect.export` | Export | Export | primary actionのためlabelを残す |
| Effect Stack | `effect.stack` | Effect Stack | Effect Stack | stack headerは英語固定 |
| Effect Stack | `stack.category.*` | Texture / Transform / Structure | Texture / Transform / Structure | category chipは英語固定 |
| Settings | `settings.language` | Display language | 表示言語 | text radiogroup |
| Canvas | `canvas.lockAspect` | Lock aspect ratio | 縦横比を固定 | lock shape |
| Gradient Ramp | `gradient.deleteStop` | Delete selected stop | 選択したストップを削除 | `delete` |
| Gradient Ramp | `gradient.type.linear` | Linear | リニア | 上下2アンカー図 |
| Gradient Ramp | `gradient.type.radial` | Radial | 放射 | 中心・半径図 |
| Gradient Ramp | `gradient.type.fourcolor` | 4-color | 4色 | 四隅アンカー図 |
| Gradient Ramp | `gradient.type.diamond` | Diamond | ひし形 | 中心・ひし形図 |
| Gradient Ramp | `gradient.type.angle` | Angle | 角度 | 中心・回転方向図 |
| Gradient Ramp | `gradient.type.bezier` | Bezier | ベジェ | 端点・制御点・曲線図 |
| Gradient Ramp | `gradient.openEditor` | Open Gradient Ramp editor | Open Gradient Ramp editor | expand icon + tooltip |
| Gradient Ramp | `gradient.importImage` | Import image | Import image | image drop zone / file picker |
| Gradient Ramp | `gradient.importOverlay` | Import Overlay | Import Overlay | Overlay/Mask source |
| Animation | `animation.loopTiming` | Loop Timing | ループタイミング | Bezier preview |
| Help | `help.title` | K-GG Guide | K-GG 使い方ガイド | `help` |

## 新しい表記の追加手順

1. 既存キーと`uiLabels.ts`を検索し、意味が同じ用語を再利用する。
2. `messages.ts`の英語辞書へ意味的なキーを追加し、日本語辞書へ同じキーとプレースホルダーを追加する。
3. 共通操作なら`Icon.tsx`の既存`IconName`を選び、なければ24×24、2px strokeの内蔵SVGパスを追加する。
4. アイコン専用操作は`IconButton`へ現在言語のラベルを渡す。独自の`title`と`aria-label`を別々に書かない。
5. UIへ組み込み、日本語・英語、keyboard、focus、disabled、分離ウィンドウを確認する。
6. 辞書キー・placeholder整合テストと、この用語集の該当表を更新する。

## 全UIキーの台帳

以下は、現在表示されている画面だけでなく、条件付き表示、ダイアログ、通知、更新UI、分離Effect Stackで使用する全メッセージキーの領域別台帳である。各キーの実際の英語名・日本語名は`src/i18n/messages.ts`の同名辞書を一次情報とし、キーを追加した場合はこの台帳にも追加する。

| 領域 | 収録キー |
| --- | --- |
| 共通操作 | `common.close`, `common.open`, `common.reset`, `common.delete`, `common.duplicate`, `common.distribute`, `common.reverse`, `common.load`, `common.save`, `common.saving`, `common.export`, `common.import`, `common.expand`, `common.detach`, `common.settings`, `common.help`, `common.undo`, `common.redo`, `common.enabled`, `common.disabled`, `common.on`, `common.off`, `common.preview`, `common.shuffle`, `common.shuffleHint`, `common.restoreShuffle`, `common.refreshApp`, `common.checkUpdates`, `common.checking`, `common.onlineDocs`, `common.version`, `common.webBuild`, `common.none`, `common.custom`, `common.output`, `common.feedback`, `common.cancel`, `common.later`, `common.retry`, `common.notNow`, `common.checkAgain` |
| 入力・パネル | `input.*`, `section.*`, `panel.toggle`, `settings.*`, `help.*` |
| Gradient Ramp | `gradient.title`, `gradient.type`, `gradient.type.*`, `gradient.colorStop`, `gradient.opacityStop`, `gradient.colorMode`, `gradient.interpolation`, `gradient.mirror`, `gradient.paletteGenerator`, `gradient.paletteGeneratorDescription`, `gradient.importImage`, `gradient.importOverlay`, `gradient.paletteDropHint`, `gradient.paletteName`, `gradient.builtInPresets`, `gradient.userPalettes`, `gradient.repeat`, `gradient.addStop`, `gradient.deleteStop`, `gradient.duplicateStop`, `gradient.distributeStops`, `gradient.reverseStops`, `gradient.openEditor`, `gradient.closeEditor`, `gradient.pipUnsupported`, `gradient.recordColorKeyframe`, `gradient.recordOpacityKeyframe`, `gradient.mirrorDescription`, `gradient.editInstructions`, `gradient.editInstructionsCompact` |
| Effect Stack / Workspace | `effect.*`, `workspace.*`, `stack.swapHistogram`, `stack.restore`, `stack.detach`, `stack.version`, `stack.fixed`, `stack.drag`, `stack.category.*`, `stack.status.*`, `histogram.*` |
| Canvas / Animation / Diffuse | `canvas.*`, `animation.*`, `diffuse.*`, `beta.experimental` |
| Export / Update / FFmpeg | `export.*`, `update.*`, `ffmpeg.*`, `feedback.*` |
| Preset Library | `preset.library`, `preset.folders`, `preset.root`, `preset.builtIn`, `preset.saved`, `preset.destination`, `preset.deleteNamed`, `preset.folderPreview`, `preset.loadFailed`, `preset.saveFailed`, `preset.createFolderFailed`, `preset.renameFolderFailed`, `preset.deleteFolderFailed`, `preset.moveFailed`, `preset.deleteFailed`, `preset.exportFailed`, `preset.importFailed`, `preset.selectForExport`, `preset.folderName`, `preset.deleteFolderConfirm`, `preset.itemCount`, `preset.folderTree`, `preset.newFolder`, `preset.createFolder`, `preset.renameFolder`, `preset.folderCount`, `preset.empty`, `preset.saveTo`, `preset.exportSelected`, `preset.exportFolder`, `preset.exportLibrary`, `preset.select`, `preset.importTo`, `preset.gridView`, `preset.listView` |

`src/i18n/uiLabels.ts`には、パネルが条件付きで表示するパラメータ名、エフェクト名、Gradient Type、補間方式、回転方向を含む153組の英日別名を登録している。新しいパラメータを追加するときは、まずこの配列へ英語名・日本語名を追加し、同じ文字列をコンポーネントへ直書きしない。

## 非表示・条件付き領域の命名

| 領域 | 代表的な非表示条件 | 命名の扱い |
| --- | --- | --- |
| Noise | TypeがDomain Warp / Voronoi / AE Fractalのときだけ表示 | `uiLabels.ts`のパラメータ名を使用し、英語名を保存キーに合わせる |
| Postprocess | Effect Stackで選択したレイヤーだけ表示 | stackの効果名は英語固定、説明と状態は辞書で切替 |
| Effect Stack | workspace、PiP、Tauri分離ウィンドウ | `effect.*`と`stack.*`を同じ辞書キーから解決 |
| Export / FFmpeg | Tauriまたは動画出力時だけ表示 | `export.*`、`ffmpeg.*`を使用し、固有名は共通表記 |
| Preset Library | フォルダ選択、空状態、インポート失敗時 | `preset.*`の確認文・エラーを省略しない |
| Help / Update | モーダルを開いたときだけ表示 | `help.*`、`update.*`の見出しと本文を翻訳 |

## 変更レビュー用チェックリスト

- [ ] 新しい表示文字列に英語・日本語の辞書キーがある。
- [ ] トップバーまたはEffect Stackの名称を日本語へ翻訳していない。
- [ ] 条件付き表示・エラー・通知・ツールチップ・`aria-label`も台帳のキーを使っている。
- [ ] アイコン専用操作は`IconButton`、主要操作はアイコン＋短い文言になっている。
- [ ] `uiLabels.ts`、この用語集、辞書キー整合テストを同じ変更で更新している。
