---
id: SPEC-021
title: Tweeqによるパラメータ入力コントロール
status: implemented
owners: [maintainer]
created: 2026-07-15
updated: 2026-07-15
depends_on: []
related_adrs: [ADR-0006]
related_code: [package.json, package-lock.json, vendor/tweeq/package.json, vendor/tweeq/index.es.js, vendor/tweeq/index.cjs, vendor/tweeq/style.css, src/main.tsx, src/App.css, src/components/SliderField.tsx, src/components/ColorPicker.tsx, src/lib/tweeqNumberFormat.ts, src/lib/tweeqNumberPosition.ts]
related_tests: [src/lib/tweeqNumberFormat.test.ts, src/lib/tweeqNumberPosition.test.ts]
human_review: completed
---

# SPEC-021: Tweeqによるパラメータ入力コントロール

## 背景・問題

K-GGのパラメータ編集UIは、独自の`SliderField`、HTMLの数値入力、`react-colorful`のカラーピッカーに分かれている。入力のドラッグ、数値の直接編集、色の選択で操作モデルと見た目が揃っておらず、クリエイティブツール向けの微調整操作を共通化しにくい。

ユーザーが指定した[Tweeq](https://github.com/arcatdmz/tweeq)のReact版には、数値のドラッグ／直接入力と、色面・色相スライダー・HEX入力・カラープリセットを一体化したコンポーネントがあるため、K-GGの共通入力境界へ組み込む。

## ゴール・成功条件

- 既存のパラメータスライダーをTweeqの`InputNumber`で操作できる。
- 既存の数値入力と同じZustand更新・キーフレーム更新経路を維持しながら、ドラッグ、直接入力、キーボード増減をTweeqの操作モデルで行える。
- グラデーションストップとStretchの色入力をTweeqの`InputColor`で操作でき、色面、色相、HEX入力、プリセット選択を利用できる。
- TweeqのスタイルをK-GGのダークな作業領域内に適用し、既存のキャンバス・パネル・タイムラインのレイアウトを壊さない。
- Tweeqの導入後も、プリセット形式、シーン評価、WebGL描画、書き出しのデータ契約を変更しない。

## スコープ

### 対象

- `SliderField`をTweeq`InputNumber`へ置き換える共通アダプター。
- `ColorPicker`をTweeq`InputColor`へ置き換える共通アダプター。
- アプリルートへのTweeq初期化、Viewport、スタイル導入。
- TweeqのGitHubリポジトリをコミット固定した依存として管理するための設定。
- 上記アダプターの数値更新、境界値、HEX更新の回帰テスト。

### 対象外

- Tweeqのコンポーネント本体の改変やK-GGへの全面移植。
- K-GGのプリセットJSON、Zustand状態、キーフレーム形式の変更。
- Effect Stack、タイムライン、キャンバス操作など、数値・色入力以外のUI刷新。
- 新しいパラメータ、色空間、カラーパレット生成アルゴリズムの追加。

## 方針

- TweeqのReact版を`d859beddb0228b56d7ea5dbd1a5f904f559b81fa`へ固定する。指定リポジトリの最新取得時点で、Reactコンポーネントの公開ソースと型が存在するためである。
- GitHub版は生成済み`lib`をコミットしていないため、指定コミットから生成した最小の`lib`（`index.es.js`、`index.cjs`、`index.d.ts`、`style.css`）を`vendor/tweeq`へ固定する。ビルド済みのJSはReact以外の実行時依存を内包する。
- `SliderField`の公開Propsと、キーフレーム追加・更新、デフォルト値リセット、現在時刻の扱いは維持する。Tweeqから通知された値を既存の`handleValueChange`へ渡す。
- 数値の範囲、step、精度、接尾辞は既存の意味を維持できる範囲でTweeqの`InputNumber`へ渡す。既存の表示フォーマットだけでは表現できない値は、入力値の意味を変えず、ラベル行の表示で補う。
- `ColorPicker`は現在のHEX文字列をControlled valueとして渡し、Tweeqの変更を既存の`onChange`へ転送する。アルファ値は現行UIと同じく無効化し、カラープリセットはTweeqの既定プリセットを利用する。
- Tweeqの`Viewport`はアプリ全体を包み、`TweeqProvider`または同等の色入力プロバイダーを一度だけ初期化する。React StrictModeでストアやオーバーレイを二重初期化しない。
- Tweeqのテーマ変数は`Viewport`配下でK-GGのデザイントークンへ上書きし、炭色の入力面、生成りの境界、篝火レッドのアクセントとフォーカスを共通化する。上流のvendor CSS本体は変更しない。

## 代替案

| 案 | 採否 | 理由 |
| --- | --- | --- |
| TweeqのGitHubソースを固定し、K-GGからReact入口を解決する | 採用候補 | 指定された最新版のReact APIを使える。生成物未コミットというリポジトリの制約を明示的に扱える。 |
| npm公開版の`tweeq`をそのまま使う | 不採用 | npm公開版は古いVue系APIであり、指定リポジトリの現行React版と一致しない。 |
| K-GG内で同等の操作UIを再実装する | 不採用 | 指定ライブラリの操作モデルを利用できず、保守対象が増える。 |

## エラー・境界条件

- Tweeqから非有限値が通知された場合は既存の数値更新へ渡さず、現在値を維持する。
- 範囲外の直接入力は、既存仕様で許容される範囲を確認したうえで、Tweeqのclamp設定とアダプターの正規化を一致させる。
- 空、短縮形、`#`なしを含むHEX入力は、Tweeqのバリデーション結果だけを既存の色更新へ通知し、不正な入力で状態を壊さない。
- WebGL描画、Tauriコマンド、プリセット読込がTweeqに依存しないようにし、TweeqのUIが利用できない場合でも既存状態の型契約を維持する。
- 既存の色入力ポップオーバーやドラッグ操作がキャンバスのポインターイベントを奪わないことを手動確認する。

## 受け入れ条件

- AC-001: 任意の既存`SliderField`について、Tweeqの数値フィールドをドラッグすると既存の`onChange`と同じ状態更新・キーフレーム更新が発生する。
- AC-002: 数値フィールドをフォーカスして直接入力、Enter確定、上下キー増減、Alt微調整したとき、値が範囲・step・精度の契約に従い、表示中のキャンバスへ反映される。
- AC-003: 数値フィールドのデフォルトリセットを実行したとき、既存のデフォルト値へ戻り、キーフレーム経路を不正に二重実行しない。
- AC-004: グラデーションストップまたはStretchの色入力を開き、色面・色相・HEX入力・プリセットを操作すると、既存の色更新経路へ有効なHEX値が渡る。
- AC-005: 不正なHEX入力または非有限な数値通知では、最後の有効値とプレビューが維持される。
- AC-006: ブラウザ版とTauri版でアプリを起動したとき、Tweeqのスタイルが表示され、既存のパネル・キャンバス・タイムラインの配置とWebGL描画が壊れない。
- AC-007: 既存プリセットを読み込み、Tweeqの入力で変更して保存・再読込したとき、Tweeq導入前と同じ状態形式で復元される。
- AC-008: `InputNumber`をフォーカスまたはドラッグしている間、現在値に対応する点線ガイドが表示され、値の変更に合わせて同じ位置へ追従する。フォーカスが外れた状態ではガイドを表示しない。

## 検証計画

| 受け入れ条件 | 検証方法 | 場所 |
| --- | --- | --- |
| AC-001, AC-002 | アダプターのユニットテスト、既存のキーフレームテスト、ブラウザ手動操作 | `src/components/SliderField.tsx`, `src/components/SliderField.test.tsx`、対象パネル |
| AC-003 | デフォルト値リセットのユニットテスト、手動操作 | `src/components/SliderField.test.tsx` |
| AC-004, AC-005 | HEX更新・無効値維持のユニットテスト、色面・プリセットの手動操作 | `src/components/ColorPicker.tsx`, `src/components/ColorPicker.test.tsx` |
| AC-006 | `npm run build`、ブラウザ版とTauri版の手動確認 | `src/main.tsx`, `src/index.css` |
| AC-007 | 既存プリセットテスト、手動で読込・変更・保存・再読込 | `src/lib/presetModel.ts`, 対象アダプター |
| AC-008 | 値位置ヘルパーのユニットテスト、ブラウザでフォーカス・ドラッグ中の表示と追従を確認 | `src/lib/tweeqNumberPosition.test.ts`, `src/components/SliderField.tsx`, `src/App.css` |

## 移行・互換性

プリセットJSON、Zustand状態、キーフレーム形式、WebGL評価、エクスポート形式は変更しない。既存の入力コンポーネント名とPropsもアダプター内部で維持し、各パネルの呼び出し側を大きく変更しない。依存追加により開発時・配布時のバンドルサイズとCSS適用範囲は増える。

## 未決定事項

- GitHubコミット固定とReactソースエイリアスによる導入方針を承認済み。
- Tweeqの既定カラープリセットを採用する。
