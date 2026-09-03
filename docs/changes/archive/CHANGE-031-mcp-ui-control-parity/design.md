# Design

## 1. 基本方針

MCPがUIのDOMを再生するのではなく、UIが利用しているStore、正規化、描画更新、Export adapterの手前にSemantic Control層を置く。外部契約は内部Storeの形をそのまま返さず、安定したoperation idとschemaで表現する。

```text
UI controls ─┐
             ├─ Semantic Control Registry ─ Store/normalizer/history ─ Renderer
MCP tools ───┘                         └─ optional native capability callbacks
```

## 2. 操作台帳

第一段階の台帳は次の領域を必須とする。

| 領域 | 代表操作 | 既存経路 |
| --- | --- | --- |
| Gradient | type、angle、stops、opacity、ramp、anchor、Bezier、Mesh | `setGradient`、Mesh setter、GradientRamp |
| Effect | enable、reorder、reset、stack layer | `setEffectPipeline`、effect normalizer |
| Modules | Noise、Diffuse、Slit、Stretch、Postprocess、Normal、Radon、Iridescence | 各`set*` setter |
| SANDBOX | Cloth、Cone、Flow、Seamless、Manual Distort | 各`set*` setter、canvas interaction |
| Animation | play/pause、seek、duration、speed、easing、track/keyframe | `AnimationLoop`、keyframe setter |
| Project | preset、palette、canvas size、view mode | Preset library、App state、canvas hooks |
| Output | preview capture、image/video export、import | renderBridge、Export adapter、Tauri |

`UI-CTRL-001`の台帳は、コンポーネントの`onChange`、`onClick`、pointer interactionとStore setterを照合した。全Store groupは`set_group`のtop-level field一覧として発見でき、Stop/Anchor/Mesh/Keyframe/Transport/UIは専用operationとして公開する。Help、Feedback、source File選択などの一時UI・File境界は直接のDOM再生を公開せず、`kgg_list_controls`のcapability状態と構造化エラーで扱う。

実装済みの対応表は次のとおり。

| UI領域 | Semantic operation / group | 境界 |
| --- | --- | --- |
| Gradient Ramp | `set_gradient_stops`、`set_opacity_stops`、`set_selected_stops` | Stop数、位置、hex、opacityを検証し`setGradient`へ渡す |
| Anchor / Mesh | `set_gradient_anchor`、`set_mesh_corner`、`set_mesh_handle`、`set_mesh_color_position`、reset/straighten | 座標クリックではなくUV tupleを検証 |
| 全描画設定 | `set_group` + 19 store group | 未知top-level fieldとkeyframeTracks直書きを拒否 |
| Animation / Timeline | `set_animation_transport`、`set_track_mode`、`add_keyframe`、`set_keyframe`、`remove_keyframe` | AnimationLoop/renderBridgeと既存keyframe normalizerを使用 |
| Canvas / View | `set_ui_state`、`reset_viewport` | AppのUI adapter経由、範囲とenumを検証 |
| Preset / Palette | `list_*`、`apply_*`、`save_*`、確認付きdelete、確認付きpackage export | 接続済みrepository callback以外へ越境しない |
| File / media / native | Capability metadataのみ、または既存preview | 任意path、File import、image/video保存、FFmpeg/Tauri dialogは未実装のまま成功扱いしない |

## 3. API構成の候補

推奨は、既存の安定した頻出Toolを維持しつつ、網羅的な操作をCapability-driven commandへ集約する方式である。

- `kgg_list_controls`: 操作台帳と入力schemaを返す。
- `kgg_get_control_state`: group/field単位の現在値を返す。
- `kgg_execute_control`: allowlist済みoperation idとdiscriminated inputを実行する。
- 頻出で説明価値が高い操作（Gradient colors、Effect、Snapshot、Preview）は既存の専用Toolを維持する。網羅的な操作は3つのSemantic Toolへ集約し、Tool discoveryの増加を3件に抑える。

`kgg_execute_control`は任意path setterや任意関数呼び出しではなく、Registryに登録されたoperation handlerへdispatchする。operationごとに`readOnly`、`scenarioSafe`、`requiresApproval`、`requiresNativeCapability`を持たせる。

## 4. 履歴・同期

Semantic mutationはUIと同じStore setter・履歴subscription・描画更新境界を使う。単一のMCP commandを一つの変更単位として扱い、複合commandは開始時snapshotと中間errorを記録する。Bridgeの応答は、適用後のcanonical stateと変更されたoperation idを返す。

## 5. Native capability

MCP ServerはFilesystem、FFmpeg、Tauriを直接importしない。WebView側に登録されたcapability callbackだけを呼び、path、mime、size、cancel、timeoutを検証する。現段階ではpreview/image contentと、明示的`confirm: true`で接続済みPreset repositoryへ委譲するpackage exportだけを実装し、File import・画像/動画保存・FFmpeg/Tauri dialogは未対応 capabilityとして返す。

## 6. 互換性と失敗

既存20 Toolは互換維持する。未対応操作には`unsupported_control`、Capability不足には`capability_required`、入力不正には既存の構造化validation errorを返す。Bridge未接続、Renderer未準備、native cancelは、Storeを部分適用したまま成功扱いしない。

## 7. 段階実装

1. 台帳・Capability schema・全Store group mutation（実装済み）。
2. Gradient/Stop/Mesh/Keyframe/AnimationのSemantic interaction（実装済み）。
3. Preset/Palette/Canvas/View（adapter接続済み、file importは対象外）。
4. Preview/Export/Import/native capabilityとBrowser/Tauri parity（Previewと確認付きPreset package export以外は別実装単位）。

段階を分けてもTool契約は最初から未対応状態を表現し、MCP Clientが存在しないoperationを推測して実行しないようにする。
