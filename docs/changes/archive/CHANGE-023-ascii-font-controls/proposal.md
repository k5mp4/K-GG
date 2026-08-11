---
type: change
id: CHANGE-023
title: ASCIIのフォント選択と文字サイズ
status: archived
change_kind: F
owners: [maintainer]
created: 2026-08-06
updated: 2026-08-11
current_specs: [CURRENT-EFFECT-STACK]
related_adrs: [ADR-0004]
human_review: completed
---

# CHANGE-023 ASCIIのフォント選択と文字サイズ

## 背景・問題

CHANGE-019でASCII描画モードが追加され、文字セットと背景色を編集できるようになった。しかしグリフのフォントは`monospace`固定、文字サイズはアトラスの29px固定であり、利用者は表現の幅を広げられない。フォントの太さや文字の大きさはASCIIアートの見た目を大きく左右するため、選択肢がほしい。

また、フォントサイズを大きくするとグリフがアトラスのセルからはみ出し、隣のセルの文字と混ざって描画が乱れる問題がある。さらに、選択できるフォントはアプリ内蔵の汎用フォントだけではなく、利用者のシステムにインストールされたフォントも参照できるようにしたい。

## 変更理由

ASCIIモードの視覚表現を、利用者が文字セットと同じように直感的に調整できるようにする。保存・書き出し・Effect Stack描画で同じフォントとサイズが再現されることを保証する。利用者のシステムフォントを列挙して選択肢へ載せることで、アプリ内蔵フォントに依存しない表現を可能にする。

## ゴール・成功条件

- ASCIIモードでフォント（CSS font-family）を**InputDropdown**から選択できる。選択肢にはシステムにインストールされたフォントを含む（Adobeフォント、森澤フォントなどユーザーが個別にインストールしたフォントを含む）。
- 選択したフォントが**実際にグリフへ適用される**。スペースを含むフォント名はCSSクォートで囲み、未ロードのフォントは描画前に`document.fonts.load`でロードしてからアトラスを生成する。
- ASCIIモードで文字サイズ（px）を8〜128の範囲で調整できる。
- ASCIIモードでグリフの**回転角**（度）を**InputAngle**で調整できる。
- フォントサイズを大きくしても、グリフは自分のセル内に収まり、隣のセルの文字と混ざらない。
- フォント・文字サイズ・回転角はPresetへ保存され、通常描画とEffect Stack描画、Preview、Thumbnail、書き出しで同じ見た目になる。
- 旧Presetにフォント・文字サイズ・回転角がない場合は既定値（`monospace`、29px、0°）で補完される。

## 対象

- `DiffuseConfig`へ`asciiFont`（文字列）、`asciiFontSize`（数値）、`asciiRotation`（数値、度）を追加する。
- ASCIIグリフアトラスの生成をフォント・文字サイズ対応にし、グリフセルをフォントサイズに応じて拡大する。フォント名をCSSクォートで囲み、`document.fonts.load`でフォントをロードしてからアトラスを描画する。
- シェーダーの`applyDiffuseAscii`でセルフラクションをそのまま使い、グリフが隣セルへはみ出さないようにする。回転角（`u_diffuseAsciiRotation`）でセル内座標を回転してアトラスをサンプリングする。
- DiffuseパネルのASCIIセクションに、**InputDropdown**によるフォント選択、サイズスライダー、**InputAngle**による回転コントロールを追加する。
- Tauriコマンド`list_system_fonts`で、標準フォントディレクトリ（Windowsは`SystemRoot\Fonts`、`%LOCALAPPDATA%\Microsoft\Windows\Fonts`、`ProgramFiles\Common Files\Adobe\Fonts`、`ProgramFiles\Morisawa`等）をスキャンし、さらにWindowsレジストリ（`HKLM\...\Fonts`）から正確なフォントファミリー名を取得して選択肢へ反映する。
- 旧Preset互換のデフォルト補完。

## 対象外

- フォントファイル（TTF/OTF）のインポートやカスタムフォントのアップロード。
- 文字ごとの個別レイアウト編集、文字間隔・行間の調整。
- 太字／斜体などのスタイル指定。

## 影響を受ける現行仕様

- [Effect Stack](../../../specs/current/effect-stack)

## 関連ADR

- [ADR-0004 Postprocess Stack Rendering](../../../adr/0004-postprocess-stack-rendering)

## 主なリスク

- フォント名に不正な文字列が入るとCanvasの`font`指定が失敗し、フォールバックフォントが使われる。保存時に空文字は既定値へ置き換える。
- Windowsレジストリに登録されていないフォント（Adobe App Manager管理の一部フォント等）は、ファイル名からの推測名で表示される。Canvasの`font`指定はCSSフォールバックで最も近いファミリーへ解決される。
- フォントの実体は利用者環境のシステムフォントに依存するため、同じPresetでも環境ごとに見た目が変わる可能性がある。
- グリフセルの動的拡大はフォントサイズに比例するため、極端に大きいフォントサイズではアトラステクスチャのメモリ使用量が増える。
- フォントのロードは非同期のため、ロード完了まではアトラスの再生成が続き、その間は描画が遅延する可能性がある。

## 未決定事項

なし
