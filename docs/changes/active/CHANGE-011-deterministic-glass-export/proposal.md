---
type: change
id: CHANGE-011
title: GLASS／GLASS V2書き出し決定性修正
status: approved
change_kind: B
owners: [maintainer]
created: 2026-07-31
updated: 2026-08-01
current_specs: [CURRENT-EFFECT-STACK, CURRENT-VIDEO-EXPORT]
related_adrs: [ADR-0004, ADR-0005]
related_code: [src/lib/webgl.ts, src/lib/effectPipeline.ts, src/lib/glass.ts, src/lib/renderBridge.ts, src/lib/exportRenderState.ts, src/lib/exportDiagnostics.ts, src/lib/videoExportFrames.ts, src/lib/tileRender.ts, src/components/GradientCanvas.tsx, src/lib/latestFrameScheduler.ts, src/adapters/browser/videoExportService.ts, src/adapters/tauri/videoExportService.ts, tools/analyze-frame-zip.ps1, tools/compare-frame-zips.ps1]
related_tests: [src/lib/effectPipeline.test.ts, src/lib/effectShaderParity.test.ts, src/lib/glass.test.ts, src/lib/renderBridge.test.ts, src/lib/latestFrameScheduler.test.ts, src/lib/exportRenderState.test.ts, src/lib/videoExportFrames.test.ts, src/lib/webglCompilePolicy.test.ts, src/lib/webglExportPrograms.test.ts, src/lib/webglPingPong.test.ts]
human_review: completed
---

# GLASS／GLASS V2書き出し決定性修正

## 背景・問題

GLASSまたはGLASS V2を含むEffect Stackのアニメーション書き出しで、一部フレームだけ描画結果が大きく飛ぶ。添付された72フレームの基準ZIPは400×400で、目視上の異常候補は`frame_0006`、`0016`、`0020`、`0036`、`0046`、`0066`である。

RGBAチャンネル順を固定した基準解析では、異常候補前後に通常より大きい差分ピークが確認できた。

| 区間 | mean absolute差分 | 変更チャンネル |
| --- | ---: | ---: |
| 5 → 6 | 7.1212 | 452,971 / 640,000 |
| 15 → 16 | 8.5329 | 451,256 / 640,000 |
| 19 → 20 | 8.3099 | 450,860 / 640,000 |
| 35 → 36 | 8.7024 | 457,570 / 640,000 |
| 45 → 46 | 9.0167 | 459,956 / 640,000 |
| 65 → 66 | 10.4453 | 460,522 / 640,000 |

これは基準画像の症状を示す測定結果であり、GLASS固有のFBO汚染、lazy program切替、time uniformの不連続、Canvas競合のいずれが根本原因かは、GLASS有無の比較と診断ログで確定する。

## 変更理由

書き出しフレームはframeIndexから決まる時刻と固定された描画計画だけで生成されるべきであり、前フレームのFBO状態、Preview描画、event loopのyield、shader準備完了イベントによって一時的に別の描画結果へ切り替わってはならない。

## 対象

- GLASS／GLASS V2のFBO、texture、program、uniform、ping-pong状態の決定性確認と修正
- export前の必要shader program準備とsession中のprogram／fallback／render plan固定
- Canvas、共有FBO、AnimationLoop、static scheduler、seek、React更新のexport排他
- renderからcaptureまでを原子的に扱う共通フレーム生成経路
- Browser版とTauri版のPNG ZIP、MOV、MP4に共通するフレーム生成処理
- タイルpadding、cancellation、Preview再生状態復元の回帰確認

## 対象外

- GLASSの意図した外観、アルゴリズム、パラメータ範囲の変更
- グラデーション、ノイズ、easing、keyframe補間の仕様変更
- FPS／duration UI、Preset形式、FFmpeg codec設定の変更
- 異常フレームの補間・削除、GLASS無効化、固定sleep追加、`setTimeout(0)`削除だけの対処
- 無関係なUIレイアウト変更

## 受け入れ条件

- AC-001: GLASS有無、GLASS V2有無、両方の順序、他Effect併用、Preview再生状態を比較し、異常範囲と2回のRGBA出力一致を記録する。
- AC-002: GLASS単体、GLASS V2単体、両方の連続適用で、同一入力・同一normalizedTimeの反復描画結果が一致する。
- AC-003: 異なるtime、requestAnimationFrame、`setTimeout(0)`、進捗更新、lazy programイベントを挟んでも同じtimeの結果が変化しない。
- AC-004: 各GLASS passのsourceとdestinationが異なり、FBO、texture、viewport、sampler、clear状態がフレームごとに適切に初期化される。
- AC-005: export開始前に必要programがreadyとなり、session中にprogram、fallback、render planが変化しない。compile failure時は最初のフレーム前に失敗する。
- AC-006: export中はPreview、AnimationLoop、static render、seek、React由来の描画が出力Canvasまたは中間FBOへ混入しない。
- AC-007: render、GPU完了、capture、render sequence確認、AbortSignal処理を共通の原子的なフレーム関数で行う。
- AC-008: PNG ZIP、MOV、MP4が同一のframeIndex、time remap、render plan、GLASS描画、capture規則を使用する。
- AC-009: full-frame path、tile path、GLASSの単層・連続適用でpadding、境界clamp、出力順序を維持する。
- AC-010: cancellation、二重開始、二重終了、export失敗時にsessionが解除され、開始前のPreview再生状態が復元される。
- AC-011: 72フレームを同一条件で2回書き出し、異常候補の孤立差分がなく、RGBAピクセルハッシュが一致する。
- AC-012: 回帰テスト、DocDD文書、関連コード・テスト参照、必須検証コマンドの結果が同期している。

## 未決定事項

- GLASS専用programのcompile failure時にexportを中止するか、事前に決めたfallbackを固定するかは、既存の互換性と実機結果を確認してdesignで確定する。
- GPU完了同期は、診断時の`gl.finish()`と本番経路のfenceまたは最小待機を性能測定後に選択する。
- 再現用Presetが添付またはリポジトリ内にない場合は、同じ設定値の提供が必要になる。
