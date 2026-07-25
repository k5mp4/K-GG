---
id: SPEC-033
title: FPSグリッド同期プレビュー
status: implemented
owners: [maintainer]
created: 2026-07-25
updated: 2026-07-25
depends_on: [SPEC-032]
related_adrs: [ADR-0001]
related_code: [src/lib/animation.ts, src/components/GradientCanvas.tsx, src/components/TimelineBar.tsx, src/hooks/useWebGL.ts, src/adapters/browser/videoExportService.ts, src/adapters/tauri/videoExportService.ts]
related_tests: [src/lib/animation.test.ts]
human_review: completed
---

# SPEC-033: FPSグリッド同期プレビュー

## 背景・問題

タイムラインの罫線は設定FPSを基準に表示されているが、インジケーターとキャンバスプレビューがRAF周期で連続的に進行するため、フレーム罫線の間に位置することがある。プレビューで確認した映像と書き出しフレームの印象も一致しにくい。

## ゴール・成功条件

- インジケーターとシーク位置を、書き出しと同じFPSフレームグリッド上へスナップする。
- キャンバスプレビューを設定FPSのフレーム値だけ描画する。
- FPS変更後も再生中・停止中のどちらでも新しいグリッドへ同期する。
- 一時停止操作を受け付けたフレーム位置でピタッと停止し、次のRAFで1F先へ進まない。

## 方針

総フレーム数を`ceil(duration * fps)`で統一し、RAFで測った経過時間を`floor(rawTime * totalFrames) / totalFrames`へ量子化する。シーク、一時停止、プレビュー描画、タイムライン表示に同じ値を渡す。

## エラー・境界条件

- Duration×FPSが整数でない場合も、総フレーム数を切り上げる。
- Loop ONでは終端フレームを二重に再生しない。
- エクスポート中の任意時刻レンダリングは既存のサンプル値を変更しない。

## 受け入れ条件

- AC-001: インジケーターがフレーム罫線の間に留まらず、グリッド上を移動する。
- AC-002: キャンバスプレビューが設定FPSのフレーム間隔で更新される。
- AC-003: FPS変更後、停止中・再生中とも新しいフレーム間隔へ同期する。
- AC-004: プレビューとブラウザ／Tauriの書き出しが同じ総フレーム数と正規化時刻を使う。
- AC-005: 再生中に一時停止すると、インジケーターとキャンバスが停止操作時の同一フレームで止まり、1F先へ進まない。
- AC-006: 既存の再生、シーク、Loop、キーフレーム編集、エクスポートに回帰がない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001〜AC-005 | AnimationLoopユニットテスト、ブラウザ手動確認 | `src/lib/animation.test.ts`, TimelineBar, GradientCanvas |
| AC-006 | 自動検証 | `npm test`, `npm run lint`, `npm run build`, `npm run docs:check`, `npm run docs:build` |

## 移行・互換性

保存形式とFPS選択肢は変更しない。

## 未決定事項

なし。
