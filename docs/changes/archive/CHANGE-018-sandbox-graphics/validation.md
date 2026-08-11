# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 SANDBOXがTOPバーに一つ表示され、Normalが独立表示されない | source review / manual | `src/App.tsx`、ブラウザー通常画面・モバイル幅 | pass: `LEFT_TABS`でSANDBOXへ置換済み。通常幅のDOM確認でSANDBOXを確認し、モバイル幅でも入口が1件であることを確認 |
| AC-002 SANDBOXからNormal／Prism／ParticlesのON／OFFと既存パラメータ編集ができる | typecheck / unit / source review / manual | `src/components/SandboxPanel.tsx`、関連コントロール | partial: `tsc -b`とテストはpass。各モジュールのON／OFFと詳細パラメータ編集までは未実施 |
| AC-003 Effect StackとPostprocessにPrism／Particlesの重複入口がない | source review | `src/components/PostprocessStackPanel.tsx`、`src/components/PostprocessPanel.tsx` | pass: 固定段トグルと主スタック選択肢をSANDBOXへ集約 |
| AC-004 描画順と既存のrender planが変わらない | unit / typecheck / source review | `src/lib/effectPipeline.test.ts`、`src/lib/effectPipeline.ts`、`src/components/SandboxPanel.tsx` | pass: 53 files / 270 tests、TypeScript build pass |
| AC-005 既存Preset、Preview、Thumbnail、Exportが設定を維持する | unit / source review / manual | 既存Preset／renderテスト、ブラウザー出力確認 | partial: 保存モデルとrender planは未変更。Preset／出力の目視は未実施 |
| AC-006 SANDBOXの選択要素でNormal／Prism／Particlesを切り替えられる | source review / manual | `SandboxPanel.tsx`、Postprocess `Edit Layer`、ブラウザー通常幅・モバイル幅 | pass: 通常幅でNormal→Prism→Particlesを選択し、各モジュールだけが表示されることを確認。モバイル幅でも選択要素とSANDBOXパネルの存在を確認 |
| AC-007 TOPバーのDistortがなく、Postprocess Distortが唯一の編集・描画源になる | source review / unit / preset compatibility / manual | `App.tsx`、`PostprocessPanel.tsx`、store／preset normalization、V2 render path、ブラウザー | pass: トップバーの独立入口と旧Overlayを削除し、旧`manualDistort`のPreset移行、V2の暗黙上書き防止、Store回帰テストを確認。通常幅でトップDistortが存在せず、Effect StackのDistort選択がPostprocessのDistort編集へ遷移することを確認 |
| AC-008 Normal MapがLegacy V1／V2で同一の入力・向き・エンコード結果になる | shader contract / unit / manual WebGL | `normalmap.frag.glsl`、`src/lib/normalMap.ts`、`webgl.ts`、Legacy／V2代表ケース | partial: 共通のDiffuse除外判定、Normal shaderの輝度／中心差分／向き／RGBA契約テストはpass。実WebGLのLegacy／V2画素比較は未実施 |
| AC-009 TOPバーの順序、Postprocessの表示内容、SANDBOXの文字色が仕様どおりになる | source review / typecheck / manual | `src/App.tsx`、`src/components/PostprocessPanel.tsx`、ブラウザー通常幅 | pass: TOPバーをDiffuse→Noise→Slit→Postprocess→SANDBOX→Export→Presetへ整理。PostprocessはON／OFFとEdit Layer、選択中レイヤーの詳細プロパティを表示し、Stretchを表示しない。SANDBOXはPostprocessと同じ文字色クラスを使用し、ブラウザーのDOMとクラスを確認 |
| AC-010 Postprocessの全体ON／OFFが内部レイヤーの有効状態と同期し、個別ON／OFFを表示しない | unit / source review / manual | `src/lib/effectPipeline.ts`、`src/store/gradientStore.ts`、`src/components/PostprocessPanel.tsx`、Effect Stack | pass: Stretch／Distort／Mirror／Kaleidoscope／Voronoi／Glassの有効状態からPostprocess全体を導出し、Postprocess詳細のDistort個別トグルを非表示化。Store回帰テストで内部レイヤーON→全体ON、全レイヤーOFF→全体OFF、全体操作がDistortレイヤーを暗黙変更しないことを確認 |

## Commands

- `deno run --allow-all node_modules\typescript\bin\tsc -b` — pass
- `deno run --allow-all node_modules\vitest\vitest.mjs run` — pass: 53 files / 270 tests
- `deno run --allow-all node_modules\eslint\bin\eslint.js .` — pass: 0 errors / 24 existing warnings
- `deno run --allow-all node_modules\vite\bin\vite.js build` — pass: existing chunk-size warningあり
- `deno run --allow-all node_modules\vitepress\bin\vitepress.js build docs` — pass
- `deno run --allow-all tools\check-docs.mjs` — fail: 既存の空ディレクトリCHANGE-016／017がproposal・delta・index未整備のため失敗。CHANGE-018由来のエラーはなし
- `git diff --check` — pass

## 未確認事項

- ブラウザーでSANDBOXの選択要素とDistortの遷移は確認済みだが、各モジュールのON／OFF、既存パラメータ編集、SANDBOXホバー表示までは確認していない。
- 旧`manualDistort`からPostprocess Distortへの読み込み互換は自動テストとコード確認済みだが、実Presetを使ったブラウザー確認は未実施である。
- NormalのLegacy／V2画素一致は未検証であり、shader契約とrender planの自動確認までを実施している。実WebGLで同一Gradient・同一設定を比較していない。
- 既存Presetを読み込み、Normal／Prism／Particlesを含む静止画・連番・動画出力を実機で確認していない。
- Node/npm本体が環境にないため、`npm run`形式ではなく、同梱パッケージのエントリーポイントをDeno経由で実行した。

## 完了確認

- 2026-08-11: 利用者確認により、記録作成後に残っていた受け入れ条件・手動確認は完了済みであり、文書のArchive移動だけが未反映だったことを確認した。

| 完了判定 | 結果 |
| --- | --- |
| 全受け入れ条件 | pass |
