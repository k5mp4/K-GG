---
type: validation
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: approved
---

# Validation

受け入れ条件ごとの検証結果を実装段階ごとに記録する。After Effects実機を必要とする確認は、Windows x64 Tauri版で再現可能な手順と結果を残す。

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 Tauri版のAE接続状態判定 | unit / integration / manual | Rustのプロセス検出・非対応判定、Tauri実機でAE起動・未起動確認 | partial（Rust commandのコンパイルと単体テストは成功、AE実機は未確認） |
| AC-002 PNG送信 | integration / manual | Tauri版Export PanelからPNG送信、AEコンポジションのレイヤー確認 | partial（Tauri経路のビルド成功、AE実機でのレイヤー確認は未実施） |
| AC-003 MOV・MP4送信 | integration / manual | 動画書き出し後の自動送信と手動送信、AEコンポジションのレイヤー確認 | partial（MOV/MP4のTauri経路のビルド成功、AE実機確認は未実施） |
| AC-004 Bridge手動起動不要とWeb版互換 | manual | Bridge停止状態のTauri版確認、Web版既存経路の確認 | partial（Web版Bridge契約テスト4件成功、Tauri版Bridgeなしの実機確認は未実施） |
| AC-005 失敗処理とパス安全性 | unit / integration | JSX生成、パスエスケープ、保存失敗、AE未起動、JSX失敗、作業領域削除 | partial（固定JSX、結果JSON、パス境界、サイズ上限のRust検証は成功、実機失敗経路は未確認） |
| AC-006 レイヤーDTO読み込み | unit / manual | 選択コンポジション・選択レイヤー、空選択、非対応プロパティ確認 | pending |
| AC-007 素材・レンダー結果取り込み | integration / manual | Footage、テキスト、シェイプ、プリコンポの取り込み確認 | pending |
| AC-008 Kagaribi設定変換 | unit / manual | 対応パラメータ、未知パラメータ、式付きプロパティの変換確認 | pending |
| AC-009 文書・配布境界 | command / review | current spec、change、ADR、Tauri設定、利用者向け説明の整合確認 | pass（docs:check/docs:build成功） |

## Commands

- `npm run docs:check`
- `npm run docs:build`
- `npm test`
- `npm run lint`
- `npm run build`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`

## 実行結果

- `npm test -- --run src/lib/aftereffectsExport.test.ts`: pass（4 tests）
- `npm run lint`: pass（0 errors、既存警告21件）
- `npm run build`: pass（Viteの既存チャンク/import警告あり）
- `npm run docs:check`: pass
- `npm run docs:build`: pass
- `cargo test --manifest-path src-tauri/Cargo.toml`: pass（21 tests）
- `cargo check --manifest-path src-tauri/Cargo.toml`: pass
- `npm test`: pass（436 tests、74 files）

## 追加の3D出力安定性検証

- `npm test -- --run src/lib/coneViewRenderer.test.ts src/lib/webglPerformance.test.ts`: pass（2 files、18 tests）。入力Canvasのサイズ変更時のCanvasTexture再生成、Cone rendererの冪等dispose、context loss/restore後の再描画、失われたcontextでのoptional extension無効化を確認した。
- `npx tsc -p tsconfig.app.json --noEmit`: pass。
- ブラウザ再確認: 修正前は1920×1080から3840×2160へ変更した直後にCone用CanvasTextureの`texSubImage2D(INVALID_VALUE)`を再現した。修正後の同一手順は、検証ブラウザ側で意図的なcontext loss後にWebGL2自体が利用不能となり、実機での再確認を完了できていない。実機確認は未確認として扱う。

After Effects本体を使ったWindows x64の手動スモーク（起動中検出、アクティブコンポジションへのPNG/MOV/MP4追加、Bridge停止確認）は未実施である。P1レイヤーDTO、P2素材/レンダー、P3設定変換も未実装である。
