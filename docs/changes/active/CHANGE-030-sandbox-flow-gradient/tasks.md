---
type: tasks
id: CHANGE-030
title: SANDBOX Flow Gradient Phase A の実装タスク
status: approved
---

# CHANGE-030 実装タスク

## レビュー前の調査

- [x] current spec、関連ADR、既存Particles、Gradient Ramp、Render/Export/Tile/Thumbnail経路を確認する。
- [x] Phase AとPhase Bの境界、固定ステージ位置、Loop設定の再利用方針をproposal、delta、designへ記録する。
- [x] proposal、delta、designを人間レビューへ提出する。
- [x] proposalのstatusをapproved、human_reviewをcompletedへ更新する。承認前に実装へ進まない。
- [x] 3Dエミッタ、透視投影、深度合成、再生ループの追加要求をproposal、delta、designへ反映し、人間レビューへ再提出する。
- [x] 再承認後にproposalのstatusをapproved、human_reviewをcompletedへ更新する。再承認前に3D実装へ進まない。

## 実装

- [x] FlowGradientConfig、Effect PipelineのflowGradientEnabled、既定値、normalizer、parameterLimitsを追加する。
- [x] Store、Latest State、Preset SnapshotへFlow設定を接続し、旧プリセットを安全に正規化する。
- [x] Seed、正規化時刻、周期的Loop Phase、粒子位相、Curl Noise移流を決定的に評価する共有ロジックを実装する。
- [x] FlowのSplat、Density、Temporal Trail、Gradient CompositeのWebGL Programとshader sourceを追加する。
- [x] Density FBOとTrail Ping-Pong FBOを作成し、RGBA8経路、Framebuffer確認、resize、context再初期化への入口を実装する。FP16必須化は行わない。
- [x] SANDBOXへFlow GradientモジュールとFlowGradientPanelを追加し、既存AnimationのLoopとDurationを参照する。
- [x] 描画順をBase → Surface → Main Stack → Prism → Flow Gradient → Particlesへ拡張し、Flow無効時の既存経路を保つ。
- [x] Render Session、論理フレームキー、reset、prewarm、重複フレーム抑止をrenderSceneAtTime、Export、Tile、Thumbnailへ接続する。
- [x] 設定変更、Seek、再生再開、Loop境界、リサイズ、Export開始、Thumbnail開始の状態リセット入口を実装する。

## 追加要求: 3D Curl Emitter / Depth-aware Density

- [x] 共通3Dエミッタ原点、決定的な球面方向、spawn phase、lifetimeを設計し、既存のSeedとLoop Phaseから再現可能にする。
- [x] 3D Curl Noise場を周期化し、固定ステップ積分で粒子の位置・速度・深度を評価する。画面上の2D座標だけの配置に依存しない。
- [x] 固定view/projectionで3D粒子を投影し、near/far・カメラ後方のクリップ、深度に応じたsplatサイズとDensity寄与、全画面基準のTile Renderを実装する。
- [x] 投影後の速度方向Gaussian/capsuleをDensity FBOへ加算し、Trail後にスクリーン相当の飽和応答へ変換して重なりの濃度を連続Fieldへ反映する。
- [x] Flow RGBから元画像RGBの加算と粒子単位の固定色を除き、既存Gradient Rampのスカラー入力だけで最終色を決定する。
- [x] 既存Animationの`previewLoop`、`duration`、`fps`、normalized timeへFlow再生を同期し、Loop有効時に再生を停止せず位相0へ戻す。
- [x] `0..N-1`の表示フレーム規則を実装し、終端フレームの重複表示・重複出力を防ぐ。
- [x] 再生開始、Restart、Pause/Resume、逆方向Seek、Loop境界でFlowのreset/prewarmとTrail履歴を同期する。
- [x] 3D座標、projection、depth-aware splat、density saturationのshader sourceテストを追加する。
- [x] normalized loop phase、終端フレーム、再生再開、Loop境界prewarmのテストを追加する。
- [x] MCPの実GPUで、共通原点からの放射、奥行き投影、流線の重なりによる濃度差、粒状表示の抑制、正方形出力を確認する。
- [x] MCPの実GPUで複数周期を再生し、1周期目と2周期目の境界に停止・フラッシュ・濁り・ジャンプがなく、同じ位相が再現されることを確認する。

## テストと確認

- [x] Flow SimulationのSeed、Loop Phase、設定シグネチャ、同一フレーム再評価の純粋関数テストを追加する。
- [x] Flow設定のnormalizer、Preset round-trip、旧プリセット読み込みのテストを追加する。
- [ ] Render Session、Transition、Tile Render、Export、ThumbnailでFlowが一度だけ進むことを検証する。
- [ ] WebGL Program登録、FBO再利用、RGBA8フォールバック、dispose、Context Lost/Restoredの実機検査を完了する。
- [ ] SANDBOXでFlowのWidth、Stretch、Density、Trail、Gradient Ramp変更を個別比較する。
- [ ] Seed変更、逆方向Seek、設定変更、Preview/Export/Thumbnailの画素一致を手動確認する。
- [ ] Flow無効時と既存Particles、Prism、Glass、Glass V2、Seamless Tilingの回帰を手動確認する。

## 文書と完了

- [x] 自動テストと手動確認のコマンド、結果、未確認事項をvalidationへ記録する。
- [x] deltaをcurrent specへ統合し、関連する利用者向け文書とindexを同期する。
- [ ] 実装、テスト、文書、validationを同一変更パッケージとして最終確認する。
- [ ] 完了後にstatusをarchivedへ更新し、Archiveへ移動する。
