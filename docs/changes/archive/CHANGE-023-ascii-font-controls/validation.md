# Validation

| AC | 検証方法 | テスト・確認場所 | 結果 |
| --- | --- | --- | --- |
| AC-001 | unit / manual | `src/types/distortion.ts`, Diffuseパネルのフォント選択（InputDropdown） | partial |
| AC-002 | unit / shader parity / manual | `src/lib/effectShaderParity.test.ts`, WebGLキャンバスの文字サイズ | partial |
| AC-003 | shader parity / manual | フォント・文字サイズ変更後のWebGLキャンバス（隣セル混入なし） | partial |
| AC-004 | preset / unit | 旧Presetの読み込みで`monospace`／29px／0°補完 | pass |
| AC-005 | unit / manual | システムフォント列挙（`list_system_fonts`、レジストリ・Adobe・森澤ディレクトリ）とInputDropdownへの反映 | partial |
| AC-006 | unit / manual | フォントの実際の適用（CSSクォート、`document.fonts.load`による事前ロード） | partial |
| AC-007 | unit / manual | 回転角（InputAngle）とシェーダーでのグリフ回転 | partial |
| AC-008 | unit / manual | Preset保存後のフォント・サイズ・回転再現 | partial |

## 実行結果

| コマンド | 結果 | 備考 |
| --- | --- | --- |
| `npx vitest run` | pass | 全54 files / 293 tests |
| `cargo test --manifest-path src-tauri/Cargo.toml` | pass | Rust 16 tests（フォント名推測・レジストリパース・ディレクトリスキャン含む） |
| `cargo check --manifest-path src-tauri/Cargo.toml` | pass | 型検査成功 |
| `npm run lint` | pass | エラーなし。既存warning 24件 |
| `npx tsc -- --noEmit --pretty false` | pass | 型検査成功 |
| `npm run build` | pass | 本番ビルド成功。既存のchunk-size warningあり |
| `npm run docs:check` | pass | 41 legacy specs、5 current specs、13 changes、14 ADRsを検査 |

自動テストは、ASCIIアトラス直接サンプリングとセルフラクション維持（隣セル混入なし）、動的グリフセル、フォントサイズ比uniformの除去、旧Presetのデフォルト補完、Rustのシステムフォント名推測を確認した。WebGLキャンバス上のフォント見た目・文字サイズ・システムフォントの実機反映は未実施のため、該当項目はpartialとして残している。

## 実装後の追加修正（フォント反映・回転方向・InputAngle）

実機確認で報告された問題を修正した。

1. **フォントが反映されない**: アトラス描画を`document.fonts.load`完了まで待つ方式にしていたが、システムフォントが`document.fonts`に認識されない環境では描画が行われなかった。同期的に現在利用可能なフォントで描画・アップロードし、`document.fonts.load`が解決したらsignatureをリセットして再描画する方式へ変更した。フォント名はCSSクォートで囲む（`cssFontShorthand`）。
2. **回転のY軸反転**: テクスチャUV空間（Y下向き）で数学的な回転行列をそのまま使うと、見た目が時計回り（Y反転）になる。シェーダーの回転行列の`sinR`符号を反転し、K-GG規約（反時計回り）で文字が回転するようにした。0°では正立したまま。
3. **InputAngleのUIと方向**: `InputAngle`はtweeqの規約（時計回り増加）に従うため、`toTweeqAngle`／`fromTweeqAngle`でK-GGのキャンバス角（反時計回り）と変換し、`SliderField`と同じ`tq-input-angle`ラッパーと`angleOffset={-90}`を適用した。

## Commands

- `npx vitest run`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --manifest-path src-tauri/Cargo.toml`
- `npm run lint`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `npm run docs:check`

## 完了確認

- 2026-08-11: 利用者確認により、記録作成後に残っていた受け入れ条件・手動確認は完了済みであり、文書のArchive移動だけが未反映だったことを確認した。
