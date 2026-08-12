---
type: validation
id: CHANGE-027
title: SANDBOX Seamless Tiling
status: approved
---

# Validation

実装後の自動検証とブラウザ確認を記録する。高解像度の実タイル書き出しだけは、この環境では未実施として残す。

| Acceptance criterion | Evidence | Status |
| --- | --- | --- |
| AC-001 SANDBOX操作 | `http://127.0.0.1:5174/` をブラウザで確認。SANDBOXにSeamlessが表示され、ON/OFF、`Blend Width`（25%→40%）、日本語ラベル・説明、`Applied`表示を確認した。 | pass |
| AC-002 四辺の連続性 | `npm test -- --testTimeout=15000` が58 files / 325 tests pass。`src/lib/seamless.test.ts` と Deno の in-place canvas edge check で、左右・上下の最外周画素一致を確認した。 | pass |
| AC-003 既存動作の保全 | Seamless OFF時にブラウザ表示が`Off`、active countが`0/6`へ戻ることを確認。既存テストを含む全325テスト、lint、production buildが成功した。 | pass |
| AC-004 保存と互換性 | `presetModel.diffuse.test.ts`、`presetThumbnail.test.ts`、`videoExportFrames.test.ts`を含む全テストが成功。旧stateのSeamless欠落値はnormalizerで無効・既定幅へ補完される。実ファイルの静止画／動画書き出し操作は未実施。 | partial |
| AC-005 フルフレームとタイル出力 | `tileRender.ts` はタイル結合後に一度だけCPU処理し、通常のCPU基準式と同じ関数を使用。GPUの通常フレームはブラウザで`Applied`を確認した。高解像度の実タイル書き出しと3×3反復のピクセル比較は未実施。 | partial |
| AC-006 ライセンス境界 | `package.json`の依存追加なし。`design.md`にCC0資料、OpenCV Apache-2.0、GIMP GPL資料を採用しなかった理由と、実装を新規TypeScript/GLSLで行ったことを記録した。 | pass |

実行コマンド:

```text
deno eval --unstable-sloppy-imports --no-config --no-lock "import { applySeamlessToCanvas } from './src/lib/seamless.ts'; const w = 7, h = 5, d = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < d.length; i += 4) { d[i] = i; d[i + 3] = 255; } const c = { width: w, height: h, getContext: () => ({ getImageData: () => ({ data: d }), putImageData() {} }) }; applySeamlessToCanvas(c as unknown as HTMLCanvasElement, { enabled: true, blendWidth: 0.25 }); const p = (x, y) => (y * w + x) * 4; if (d[p(0, 2)] !== d[p(6, 2)] || d[p(3, 0)] !== d[p(3, 4)]) throw new Error('edge mismatch'); console.log('canvas seamless edge check: pass');"
npm test -- --testTimeout=15000
npm run lint
npm run build
npm run docs:check
npm run docs:build
```

`npm test`の初回標準5秒タイムアウトでは、既存の`videoExportFrames.test.ts`が環境負荷でタイムアウトし、後続テストへセッション状態が残った。同テスト単体を15秒設定で再実行後、全体を同設定で再実行し、58 files / 325 tests passを確認した。lintは0 errors / 21 warnings（既存警告）、build、docs:check、docs:buildは成功した。
