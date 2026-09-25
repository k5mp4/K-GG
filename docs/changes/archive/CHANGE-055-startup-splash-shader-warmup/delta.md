# Delta

## ADDED Requirements

### STARTUP-001〜STARTUP-006 起動とスプラッシュスクリーン

新しいCurrent Spec[起動とスプラッシュスクリーン](../../../specs/current/app-startup)として追加します。起動直後の静的表示、Preview contextでの準備、終了条件、演出アダプターとフォールバック、同梱の画像・動画による演出とコーデックのフォールバック、アクセシビリティ、E2E起動での無効化を定めます。

### PERF-011 Shaderの事前準備と優先順位

[WebGL Performance](../../../specs/current/webgl-performance)へ追加します。直列コンパイルを維持したまま`demand > prefetch > warmup`の優先度で開始し、起動後のアイドル時間とEffect Stack行のホバー／フォーカスでShaderを準備します。

## MODIFIED Requirements

### 同一contextのlazy Shader直列実行

変更前は要求順（FIFO）に一つずつ実行していました。変更後も一つずつ実行しますが、待機中の要求は優先度順に開始します。同じ優先度内は要求順です。

## REMOVED Requirements

- なし
