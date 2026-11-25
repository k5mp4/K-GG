# Delta

## ADDED Requirements

なし（既存要件の変更として扱う）。

## MODIFIED Requirements

### UI-010 トップバーとSANDBOXのモジュール入口

**変更前:**

- TOPバーは`Diffuse`、`Noise`、`Slit`、`Postprocess`、`SANDBOX`、`Export`、`Preset`のタブを表示する。
- Postprocessのプロパティモジュールは、Postprocess全体のON／OFFと`Edit Layer`の選択要素を表示する。
- 各タブに、ON／OFFの副ラベルを表示する。

**変更後:**

- Effect Stackのレイヤーを編集する入口はEffect Stackだけとする。
- TOPバーは「編集中: 選択中レイヤー名」、`SANDBOX`、`Export`、`Preset`の順に表示する。
- 「編集中」項目は、レイヤーのプロパティを開いている間は選択状態になる。SANDBOX、Export、Presetを開いているときにclick（ホバー切替が有効な場合はhover）すると、選択中レイヤーのプロパティへ戻る。
- レイヤーのプロパティモジュールは、見出しにレイヤー名とそのレイヤーのON／OFF（Effect Stackの行と同じ状態）を表示する。`Edit Layer`とPostprocess全体のON／OFFは表示しない。
- `Export`と`Preset`はON／OFFの副ラベルを表示しない。
- プロパティモジュールの内部IDは、制御インターフェースから従来どおり指定できる。

**変更理由:** 入口が2系統あり、経路と階層が揃っていなかったため。

### LAYOUT-002 パネルの表示

**変更前:** overlayは「上部モジュールのclick」から操作できる。

**変更後:** overlayは、TOPバーの項目（「編集中」、SANDBOX、Export、Preset）のclickから操作できる。

**変更理由:** TOPバーの構成変更に合わせるため。

### EFFECT-012 SANDBOX固定段

**変更前:** 「Postprocessの`Edit Layer`と同じ選択要素」で選択する。

**変更後:** 「SANDBOXの`Edit Layer`選択要素」で選択する。動作は変わらない。

**変更理由:** Postprocessの`Edit Layer`を廃止したため。

## REMOVED Requirements

### Postprocess全体のON／OFF表示（UI-010の一部）

Postprocessのプロパティモジュールに表示していた全体ON／OFF（一括バイパス）を廃止する。

- 代替: 各レイヤーの見出しのON／OFF、Effect Stackの行のトグル、Altクリックのソロ。
- 既存データへの影響: なし。`postprocess.enabled`の保存値と派生ロジックは変更しない。
