# Delta

## ADDED Requirements

### EFFECT-018 ASCIIのフォントと文字サイズ

ASCII描画モードは、保存されたフォント指定（CSS font-family）、文字サイズ（px）、回転角（度）を持つ。グリフアトラスはフォントと文字サイズで生成され、グリフセルはフォントサイズに応じて拡大する。フォント名はCSSクォートで囲み、`document.fonts.load`でロードしてからアトラスを描画するため、スペースを含むフォント名や未ロードのフォントも実際のグリフへ適用される。シェーダーはセルフラクションをそのまま使ってアトラスをサンプリングし、回転角でセル内座標を回転する。フォント選択肢にはシステムにインストールされたフォントが含まれる。通常描画とEffect Stack描画は同じ保存設定を使い、Presetへ保存される。旧Presetにフォント・文字サイズ・回転角がない場合は既定値（`monospace`、29px、0°）で補完する。

### EFFECT-019 システムフォント列挙

Tauriコマンド`list_system_fonts`が、OSの標準フォントディレクトリ（Windowsは`SystemRoot\Fonts`、`%LOCALAPPDATA%\Microsoft\Windows\Fonts`、`ProgramFiles\Common Files\Adobe\Fonts`、`ProgramFiles\Morisawa`等）からフォントファイル（TTF/OTF/TTC）を再帰スキャンし、Windowsではレジストリ（`HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Fonts`）から正確なフォントファミリー名も取得する。フォント選択UIはこの一覧を読み込み、汎用フォント（monospace/serif/sans-serif等）と合わせてInputDropdownの選択肢に表示する。列挙に失敗した場合は汎用フォントのみを表示する。

## MODIFIED Requirements

### EFFECT-015 DiffuseのHalftoneとASCII

ASCIIの保存項目にフォントと文字サイズが加わる。背景色・文字セットに加えて、フォントと文字サイズも通常描画とEffect Stack描画で同じ値を使う。

## REMOVED Requirements

なし
