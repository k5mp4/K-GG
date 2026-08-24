# Tasks

- [x] `docs/development/index.md`、`change-workflow.md`、`docdd.md`、リモート同期後のCURRENT-EFFECT-STACK、ADR-0004／0005／0010／0013、CHANGE-026／027／030／032、関連コードとテストを調査する
- [x] リモートmainの既存`glass-compact.glsl`、Flow Gradient固定段、Seamless最終境界処理、`getV2RenderPlan`の`seamlessEnabled`／`flowGradientEnabled`入力を確認し、今回の境界を固定する
- [x] `proposal.md` と `delta.md` のWhy／What／対象外／ACを人間レビューへ出し、承認を得る
- [x] `design.md`の解析prefix境界、Noise allowlist、Mesh除外、rollback方針を確定する
- [x] ADR-0017の採否を人間レビューで決め、採用する場合だけacceptedへ更新する
- [x] AC-001／AC-002のpure Render Plan、正規化stack、fallback reasonテストを追加する
- [x] AC-003／AC-004のGenerator出力先、first texture boundary、consumed layer skip、Glass入力連鎖を実装する。既存のGlass specialized source assemblyは再利用する
- [x] AC-005／AC-006の順序・protected input・Flow／Seamless disabled gate・legacy／Stipple fallbackを実装して回帰テストを追加する
- [x] AC-007のNoise／Diffuse shader parity、座標、seed、grain、scatter、tile、resolution検証を追加する
- [x] AC-008のPreview、Thumbnail、still／sequence／video Export program selection parityを検証する。Export側へ`flowGradientEnabled`を渡す
- [ ] AC-009の1920x1080 lossless PNG比較とブラウザ4経路を実施し、Console errorを確認する
- [x] AC-010の既存Effect Stack、Diffuse 6モード、Stipple、Image Gradient、Cloth、Mesh、Flow、Seamless、legacy preset回帰を実行する
- [x] `validation.md`へACごとの結果、Commands、未確認事項を記録する
- [ ] deltaをCURRENT-EFFECT-STACKへ統合し、related_code／related_tests、ADR index、current indexを同期する
- [ ] 全ACが確認済みであることを確認し、tasksを完了状態にして変更仕様をArchiveへ移動する
