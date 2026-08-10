# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / source review / browser | SANDBOX Edit Layer、Cloth／Cone module、右サイドバーGradient Ramp、頂点ハンドル | partial — Preview Surface UIを削除し、Cloth／Cone moduleのON/OFF、右サイドバーのみのGradient Ramp、頂点ハンドルのアンカー表示連動を実装・型検査済み。ブラウザ操作は未確認 |
| AC-002 | unit / browser | `src/lib/coneView.test.ts`、1:1／16:9／9:16、頂点座標変換 | partial — 純粋関数で正規化範囲-2..2、Canvas外の頂点移動、CSSキャンバス座標変換を確認。既存GPU表示でApex移動時の背景漏れは確認済みだが、今回のCanvas外ハンドル操作は未確認 |
| AC-003 | source review / browser | Cone material、代表色Canvas | pass — `MeshBasicMaterial`／`BackSide`／不透明、ライトなし。背景漏れと不要な陰影なしを確認 |
| AC-004 | unit / source review / browser | Cone正規化、Texture Flow、シーク、Seam Blend、2方式のSeam Mode、Mapping、処理済みCanvas同期 | partial — focused 3 files／19 testsでDepth 30、Flow Cycles ±30、2方式の正規化、shader branch mapping、timeline保持、Preset保存、頂点座標変換を確認。ConeCanvasは設定変更時に直近の処理済みCanvasを同じ時刻で即時再マップする経路を追加。今回のMapping変更中の実ブラウザ確認は未確認 |
| AC-005 | unit | Cone設定、Preset snapshot、表示state非永続 | pass — 旧値／不正値の正規化、設定保存、表示mode非保存を確認 |
| AC-006 | source review / browser | 初回Canvas維持、Renderer失敗フォールバック | partial — 初回Canvas維持と例外時2D復帰の実装をレビュー。Renderer失敗の実機誘発は未確認 |
| AC-007 | unit / manual export | `src/lib/videoExportFrames.test.ts`、各出力形式 | partial — 同期フレームRendererと出力Canvas選択の回帰テストはpass。実ファイル出力は未確認 |

## Commands

- `deno run --allow-all tools/check-docs.mjs` — pass（41 Legacy SPEC、5 current spec、15 changes、14 ADR）
- `deno run --allow-all node_modules/vitepress/bin/vitepress.js build docs` — pass
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1` — pass（57 files、306 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run src/lib/processedCanvasClock.test.ts src/lib/coneView.test.ts src/types/coneView.test.ts src/lib/videoExportFrames.test.ts` — pass（4 files、20 tests）
- `deno run --allow-all node_modules/eslint/bin/eslint.js .` — pass（error 0、既存warning 21）
- `deno run --allow-all node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — pass
- `deno run --allow-all node_modules/typescript/bin/tsc -b` — pass
- `deno run --allow-all node_modules/vite/bin/vite.js build` — pass（既存のTauri dynamic import警告と500 kB超chunk警告あり）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1 src/types/coneView.test.ts src/lib/coneView.test.ts` — pass（2 files、17 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1` — pass（57 files、311 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1 src/types/coneView.test.ts src/lib/coneView.test.ts src/lib/processedCanvasClock.test.ts` — pass（3 files、19 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/eslint/bin/eslint.js .` — pass（error 0、warning 21。既存ファイルのReact Hooks／型／Fast Refresh警告）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — pass
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/typescript/bin/tsc -b` — pass
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vite/bin/vite.js build` — pass（既存のTauri dynamic import警告と500 kB超chunk警告あり）
- `deno run --allow-all --no-lock --node-modules-dir=manual tools/check-docs.mjs` — pass（41 Legacy SPEC、5 current spec、15 changes、14 ADR）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitepress/bin/vitepress.js build docs` — pass

## 追加検証（2026-08-10、頂点のCanvas外移動）

- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1 src/types/coneView.test.ts src/lib/coneView.test.ts` — pass（2 files、17 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1` — pass（57 files、311 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — pass
- `deno run --allow-all --no-lock --node-modules-dir=manual tools/check-docs.mjs` — pass（41 Legacy SPEC、5 current spec、15 changes、14 ADR）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/eslint/bin/eslint.js .` — pass（error 0、既存warning 21）
- `git diff --check` — pass

## 追加検証（2026-08-10、SANDBOX UI整理）

- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitest/vitest.mjs run --no-file-parallelism --maxWorkers=1` — pass（57 files、311 tests）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit` — pass
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/eslint/bin/eslint.js .` — pass（error 0、既存warning 21）
- `deno run --allow-all --no-lock --node-modules-dir=manual tools/check-docs.mjs` — pass（41 Legacy SPEC、5 current spec、15 changes、14 ADR）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vite/bin/vite.js build` — pass（既存のTauri dynamic import警告と500 kB超chunk警告あり）
- `deno run --allow-all --no-lock --node-modules-dir=manual node_modules/vitepress/bin/vitepress.js build docs` — pass
- `git diff --check` — pass

実行環境でNode/npmがPATHに存在しないため、`npm run ...`が呼ぶローカルCLIをDenoのNode互換実行で同等に検証した。

## 未確認事項

- Renderer生成失敗を実機で誘発した場合の2D Canvasフォールバックとローカライズ警告。
- Texture Flowの再生／停止／シーク／逆再生をブラウザ上で連続観察する確認。
- Animation再生中のMapping／Seam／Depth／Rotation変更、頂点ハンドルのドラッグ、Reset Positionの実ブラウザ確認。
- PNG／JPG／WebP、連番PNG ZIP、MOV／MP4の実ファイル出力。
- 簡素化レビュー後のブラウザ再接続はWebviewのattach timeoutで完了しなかった。今回のシェーダー差分は、重みが0の領域で`mix`の補間サンプルを省略し、重みが正の領域のサンプル式と結果を維持する変更であるため、関連unit test・型検査・本番buildを再実行した。

## 実GPU確認

- Windows / ANGLE / NVIDIA GeForce RTX 3060 Tiで確認。
- 16:9、1:1、9:16のCanvasでConeを表示し、外部背景やclear colorが四隅へ露出しないことを確認。
- 既存のGPU確認ではApex X/Yを中央から+80%、-84%／-84%へ移動し、カスタム縦長と400×400のCanvasでプレビュー面が欠けないことを確認。正規化±2のCanvas外ハンドル操作は未確認。
- 処理済みCanvasの色が環境光・スペキュラーなしで表示されることを確認。
- SANDBOXのCloth／Coneモジュール切替、Mapping + Cone設定8項目、右サイドバーGradient Ramp、3D Cone上のアンカー、Active表示`/5`を確認。
- Texture Repeat 1、Flow Cycles 8、Seam Blend 50%でU方向の反復境界とV方向の円形境界をGPU連続再生し、継ぎ目の両側が共通の中間値へ収束して直線・円形の切れ目が硬く見えず、絵柄全体が逆方向へ戻るゴーストが出ないことを確認（変更後の±30上限は未確認）。
- 確認中のブラウザconsoleにwarning／errorがないことを確認。
