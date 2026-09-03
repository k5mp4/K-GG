---
id: CHANGE-032
status: draft
---

# CHANGE-032 実装タスク

- [ ] 粒子のage/spawn phase依存を外し、render session単位の固定粒子群と3D Curl移流へ設計を更新する
- [ ] reset、prewarm、Seek、Loop、Preview/Exportの決定性を実装・テストする
- [ ] Curl Scale、Curl Strength、Ribbon Width、Stretchの共通limit、UI、保存・旧値正規化を更新する
- [x] Flow Opacity、Particle Opacity、Particle Sizeの共通limit、UI、保存・旧値正規化を追加する（2026-08-13、ユーザー指示によるUI-CONT-002の限定実装）
- [x] Particle OpacityがDensity加算前、Particle Sizeが速度方向Ribbonの長さ・幅、Flow Opacityが最終alphaへ適用されることを確認する（2026-08-13、focused testで確認）
- [ ] Stretch最大値での全画面占有と、1–5px Ribbon Widthの低解像度FBO表示をGPUで確認する
- [ ] 既存Gradient Rampの低・中密度域への色反映とExport parityを回帰テストする
- [ ] 旧プリセット移行方針をレビューで確定する
- [x] `npm test`、`npm run lint`、`npm run build`、`npm run docs:check`、`npm run docs:build`を実行する（2026-08-13）
- [ ] 人間の承認後にproposal、delta、tasks、validationの状態を更新する
