# Delta

## ADDED Requirements

### UI-CTRL-001 操作Capability

MCPは、現在のK-GG UIで利用できるSemantic操作を、operation id、対象、入力schema、read/write、必要Capability、対応状態とともに列挙する。未知のoperation id、対象外の一時UI、未対応機能を暗黙に実行しない。

### UI-CTRL-002 ドメイン状態の完全性

Gradient、Noise、Diffuse、Image Gradient、Slit Scan、Stretch、Animation、Normal Map、Cloth、Cone、Seamless、Flow Gradient、Radon、Iridescence、Manual Distort、Postprocess、Effect Pipeline、Matcap、Histogram、Keyframeを、明示されたgroup/fieldとして検証し、既存Store setter/normalizerへ渡す。

### UI-CTRL-003 Semantic interaction

MCPは、Color/Opacity Stop、Gradient Anchor、Mesh corner/handle/color position、Effect Stack layer、Keyframe、Animation transportを、DOMイベントではなくSemantic inputで操作する。結果はUI操作と同じ描画更新経路へ反映する。

### UI-CTRL-004 Preset / Palette / Canvas

Preset、Color Palette、Canvas size、Preview/View modeは、現在の保存形式と正規化を維持する型付き操作として公開する。ファイル境界を越える操作は別Capabilityとして扱う。

### UI-CTRL-005 Native operation boundary

File import、image/video export、FFmpeg、Tauri dialog、保存先指定は、明示的なapprovalと入力制約を持つCapability callbackを通す。任意path、任意process、任意network操作として公開しない。

### UI-CTRL-006 Browser/Tauri parity

同じMCP Tool/Control APIをBrowser DevelopmentとTauri DevelopmentのWebViewへ接続し、同じ入力が同じstate/preview結果になることを検証する。Bridge未接続時は通常のUI操作を阻害しない。

## MODIFIED Requirements

### MCP-002 Parameter Registry

限定されたdeveloper parameter一覧から、ユーザー操作可能なドメインfieldを網羅するRegistryへ拡張する。ただし内部実装フィールド、一時UI、native操作は自動公開せず、Capabilityの明示登録を必要とする。

### MCP-004 State / Effect

既存のState/Effect Toolは互換維持し、追加のSemantic Controlを同じControl Runtimeへ統合する。既存Toolの意味、validation、read/mutation annotationは変更しない。

### MCP-007 Safe Scenario

Scenarioは、Capabilityで`scenarioSafe`と明示されたSemantic operationだけを実行できる。File/native/Export操作は既定でScenarioへ含めない。

## REMOVED Requirements

なし。
