---
type: delta
id: CHANGE-038
title: K-GG単独After Effects連携と段階的レイヤー取込
status: approved
---

# Delta

## ADDED Requirements

### AE-004 After Effectsレイヤー情報の一方向読み込み

K-GGはTauri版でAfter Effectsの選択コンポジションまたは選択レイヤーを問い合わせ、レイヤーID、名前、種類、有効状態、時間範囲、変形、素材参照、対応可能なプロパティを一方向の連携DTOとして返す。未対応のプロパティは編集可能なK-GG設定として扱わない。

### AE-005 After Effects素材・レンダー結果の取り込み

K-GGはFootageレイヤーの元ファイルを素材として識別し、元ファイルを取得できないレイヤーはAfter Effectsの一時レンダー結果として識別する。取り込み後のK-GG編集可否を元ファイルとレンダー結果で区別する。

### AE-006 After Effects設定の限定的な変換

K-GGはKagaribiエフェクトのうち対応表を持つパラメータだけをK-GG設定へ変換し、非対応エフェクト、式、マスク、3D、親子関係は変換結果へ含めない。

## MODIFIED Requirements

### AE-001 画像のAfter Effects送信

Tauri版のK-GGは別途`KGG_AE_Bridge`を手動起動せず、固定されたTauri/Rust連携経路を使って現在のCanvas画像をAfter Effectsへ送信する。Web版は既存Bridge経路を維持する。

### AE-002 動画のAfter Effects送信

Tauri版のK-GGは直前に書き出したMOVまたはMP4を一時作業領域へ保存し、別途Bridgeを手動起動せずにAfter Effectsへ送信する。Web版は既存Bridge経路を維持する。

### AE-003 送信ファイル保存先

Tauri版は利用者が選択した保存先を優先し、未指定または利用できない場合はAfter Effectsプロジェクトの場所またはK-GGの一時領域へ保存する。保存先とJSXのパスは検証済みの値だけを使用する。

## REMOVED Requirements

なし。
