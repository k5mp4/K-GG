# CHANGE-022-cloth-ramp-last-shading Tasks

- [x] 型定義 `src/types/clothGradient.ts` から廃止キー (lightWeight, heightWeight, fresnelWeight, flowWeight, rampLow, rampHigh, shadingMix) を削除し、DEFAULT と normalize を更新
- [x] レンダラー `src/lib/clothGradientRenderer.ts` のフラグメントシェーダーを「白黒シェーディング → ランプ適用」順序へ変更し、不要 uniform を削除
- [x] UI `src/components/ClothGradientPanel.tsx` の Ramp Mapping グループを整理 (重み・Ramp Low/High・Shading Mix を削除、Ramp Offset のみ残す)
- [x] 自動テスト `tests/clothGradient.test.ts` に廃止キー検証を追加
- [x] `docs/changes/active/index.md` へ CHANGE-022 を追記
- [x] 全検証スクリプトの実行と確認 (`npm test`, `npm run lint`, `npm run build`, `npm run docs:check`, `npm run docs:build`)
