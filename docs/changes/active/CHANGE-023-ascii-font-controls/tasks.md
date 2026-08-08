# Tasks

- [x] `DiffuseConfig`と`PostprocessConfig`へ`asciiFont`／`asciiFontSize`／`asciiRotation`を追加する
- [x] ストアの既定値と正規化、パラメータ制限を追加する
- [x] ASCIIグリフアトラスの生成をフォント・文字サイズ対応にし、グリフセルを動的に拡大する
- [x] フォント名をCSSクォートで囲み、`document.fonts.load`でロードしてからアトラスを描画する（フォントの実際の適用）
- [x] シェーダーの`applyDiffuseAscii`でセルフラクションを維持し、回転角でグリフを回転する
- [x] Tauriコマンド`list_system_fonts`（ディレクトリスキャン＋Windowsレジストリ）とフォント名推測を実装する
- [x] DiffuseパネルのASCIIセクションにフォント選択（InputDropdown）、サイズスライダー、回転（InputAngle）を追加する
- [x] テスト（shader parity、presetThumbnail互換、Rustフォント列挙）を更新・追加する
- [ ] 受け入れ条件の実機確認（WebGLキャンバス上のフォント・サイズ・回転反映、システムフォント列挙とInputDropdown）
- [ ] deltaをcurrent specへ統合し、Archiveへ移動する
