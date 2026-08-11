# Tasks

- [x] 現行仕様、ADR、CHANGE-011、CHANGE-012、Glass関連コードとテストを確認する
- [x] `proposal.md`と`delta.md`をレビュー・承認する
- [x] Legacy V1互換方針と色収差上限を確定する
- [x] Effect StackのGlass／Glass V2型・既定値・正規化・選択状態を一つへ統合する
- [x] 統合後のGlassをGLASS V2 programへ接続し、旧GLASSのEffect Stack経路を除去する
- [x] Glass UI、色調整UI、ヘルプ、Preset互換処理を更新する
- [x] 色収差上限をUI・正規化・shader・tile paddingへ反映する
- [x] 既存Presetの統合、重複、順序、有効状態、旧値の回帰テストを追加する
- [x] Postprocessプロパティモジュールの旧Glass選択肢を削除し、GLASS V2をGlassとして一つにする
- [x] 旧Postprocess `glass` mode/layerを`glassV2`へ読み込み正規化する
- [x] Transmission Tint／Highlight TintをTweeq InputColorへ置換し、回帰テストを追加する
- [x] Transmission Tint／Highlight TintのInputColor幅を共通化する
- [x] `validation.md`へ受け入れ条件ごとの結果と未確認事項を記録する
- [x] current spec、利用者向け文書、active/archive indexを同期する
- [x] 全受け入れ条件を確認後、changeをArchiveへ移動する
