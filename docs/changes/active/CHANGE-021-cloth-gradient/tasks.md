# CHANGE-021-cloth-gradient Tasks

- [x] パッケージ依存関係 (`three`, `@types/three`) のインストール
- [x] ドキュメント (`proposal.md`, `design.md`, `delta.md`, `tasks.md`, `validation.md`) の作成
- [x] 型定義 `src/types/clothGradient.ts` の作成および `normalizeClothGradientConfig()` の実装
- [x] レンダラー `src/lib/clothGradientRenderer.ts` の実装 (Three.js PlaneGeometry + Custom ShaderMaterial)
- [x] ストア `src/store/gradientStore.ts` と `src/lib/presetModel.ts` への組み込み
- [x] WebGL レンダリングパイプライン `src/lib/webgl.ts` への組み込み
- [x] UI コンポーネント `src/components/ClothGradientPanel.tsx` および `src/components/SandboxPanel.tsx` の追加・更新
- [x] 自動テスト `tests/clothGradient.test.ts` の作成と実行
- [x] 全検証スクリプトの実行と確認

## 備考

- current spec (`docs/specs/current/effect-stack.md`) への CLOTH-001〜003 / SANDBOX-001 統合は完了済み（2026-08-05）。
