# Design

## 採用する実装方針

既存の公開関数を互換 facade として残し、純粋な型・評価・計画生成を先に抽出する。React component、Zustand、WebGL/Three/OGL、Tauri/MCPの実行環境を同一の抽象へ押し込めず、各runtimeの所有権を維持する。

目標の依存方向は次の通り。

```text
UI → Application / Feature → Domain / State → Rendering / Services → Platform Adapters
```

## データモデル

- Document StateはPreset/History/Exportに必要な描画・animation状態を表す。
- Workspace/UI Stateは選択、panel、modal、view、progressなど保存しない状態を表す。
- `StoreSnapshot`は既存Persisted boundaryとして維持し、内部runtime型・transport DTOと直接同一視しない。
- Animationの型はStoreから中立層へ移し、Preset・Scene・AdapterがStoreを型の供給元にしない。

## 状態管理

既存の一つのZustand storeとaction名を維持しながら、責務単位のslice/selector境界を追加する。setterのnormalization、Effect Stackとの同期、historyの現在の除外項目は動作契約として保持する。

## UI構成

`App.tsx`はprovider、shell、上位orchestrationへ縮小する。Canvas、Sidebar、Timeline、Export、Native/Updater/MCPの実装は、既存のDOM階層・props・イベント順を保った薄いFeature/Hook境界へ段階的に移す。

## 描画・外部プロセス・Tauri側の変更

`evaluateSceneAtTime`と`getV2RenderPlan`を条件決定の中心に置く。`renderSceneAtTime`/`renderBridge`は既存のtransition、tile、export session、diagnosticsを維持する互換境界とする。WebGL2、Three.js Cloth/Cone、OGL Iridescenceは別ownerとして管理し、GPU resourceだけでなくlistener、singleton、hidden thumbnail contextの解放を明示する。Tauri/MCPは既存のauth、approval、再検証、固定DTOを保つ。

## 変更対象の主要ファイル

実装時に次の境界を追加・整理する。

- `src/domain/` または `src/types/`: Animation、Render、Document/UIの中立型。
- `src/app/` と `src/features/workspace/`, `src/features/export/`, `src/features/native/`: orchestration/画面責務。
- `src/store/`: slice/selectorとStore composition。
- `src/rendering/` と `src/lib/`: Scene Evaluation、Render Plan、resource owner、出力adapter。
- `src/adapters/`: Web/Tauri/Nativeの実装とinterface。
- `docs/development/architecture.md`: responsibility、dependency、public boundary、lifecycle。

## 代替案とトレードオフ

全面的な新Renderer・新Store・新MCP APIを作る案は、挙動差分と移行リスクが大きいため採用しない。既存の単一StoreとRender Bridgeを暫定compatibility facadeとして残すため、短期的には旧入口が残るが、各段階で新しい参照境界を増やせる。

## 移行方法

U1 Characterization/Golden → U2 中立型/Preset/Animation → U3 App Shell → U4 Store slice/selector → U5 Scene/Render Plan → U6 Resource lifecycle → U7 output parity → U8 Platform/MCP command → U9 feature/import/docs → U10 全Gateの順で、各段階を独立に検証する。外部挙動の変更を発見した場合は実装から外し、Follow-upとして記録する。

## ロールバック方法

各段階は既存公開関数とadapter登録を維持するため、失敗時は直前の参照入口へ戻せる。変更を統合する前にfocused test、全test、lint、build、docs checkを通し、renderer/native変更時は該当Gateを追加する。
