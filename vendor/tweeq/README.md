# Tweeq vendor

このディレクトリは、[arcatdmz/tweeq](https://github.com/arcatdmz/tweeq) のReact実装を
`75542380032f3429b737cea3840d719cdbc5f7f8`へ固定し、K-GG専用の最小エントリから生成した配布物です。
K-GGはnpm版Tweeqを使用せず、`file:vendor/tweeq`だけを参照します。

## 公開API

- `InputNumber`、`InputAngle`、`InputColor`、`InputButton`、`InputButtonToggle`
- `InputCheckbox`、`InputDropdown`、`InputDrum`、`InputPosition`、`InputRadio`
- `InputSize`、`InputString`、`InputSwitch`、`InputTime`、`InputTranslate`、`InputVec`、`Viewport`
- `CubicBezierValue`、`InputCubicBezier`、`InputCubicBezierPicker`
- `InputShuffle`、`fromNumber`、`fromEnum`、`fromString`

ReactとReact DOMはpeer dependencyです。それ以外の実行時依存は`index.es.js`と`index.cjs`へ内包しています。
K-GG用安全化パッチにより、上流の動的式評価は有限数または不活性な文字列の解析へ置換し、
Iconifyの外部APIローダーはローカルSVGへ置換しています。

## 再生成

1. 上流リポジトリを上記コミットへcheckoutする。
2. K-GGルートで`pwsh -File tools/update-tweeq-vendor.ps1 -SourceRoot <上流checkout>`を実行する。
3. `npm install`でローカル`file:`依存を更新し、`npm run build`で確認する。

スクリプトはcheckoutのHEAD、tracked差分、staged差分を検査し、固定コミットからclean worktreeを作成します。
その中で固定lockfileによるfresh installを行い、安全化パッチを適用してから生成します。成果物は一時領域で
外部依存、公開export、危険な実行時コード、ライセンスを検査した後に置換します。エントリ、ビルド設定、
安全化パッチは`tools/tweeq-vendor/`が一次情報です。

## ライセンス

TweeqはMIT Licenseです。同梱の`LICENSE`に上流の著作権表示とライセンス全文を保持しています。
