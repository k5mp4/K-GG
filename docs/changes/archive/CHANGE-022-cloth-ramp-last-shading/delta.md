# Delta: CHANGE-022-cloth-ramp-last-shading

## ADDED Requirements

なし

## MODIFIED Requirements

### CLOTH-001 SANDBOX 3D 布メッシュ Base Generator
ランプ適用の順序を変更する。ライティング (Hemisphere Ambient + Lambert)、スペキュラー (Blinn-Phong)、フレネルから計算した**白黒シェーディングの輝度**をグラデーションランプのインデックスとして使い、ピクセルの色は常に Gradient Ramp から決定する。

- Ramp 信号はライティング・スペキュラー・フレネルの白黒輝度のみで構成され、旧 `lightWeight` / `heightWeight` / `fresnelWeight` / `flowWeight` による加重合成は行わない。
- スペキュラー色・フレネル色は白黒輝度への加算係数としてのみ使用し、ランプ適用後の色に色相を加算しない。
- `rampOffset` は白黒輝度への加算として維持し、ランプ全体の位置をずらす操作として提供する。
- `rampLow` / `rampHigh` / `shadingMix` は廃止し、輝度 0..1 をランプ全体へ直接マッピングする。

### CLOTH-003 Preset 永続化とエラーフォールバック
廃止キー (`lightWeight`, `heightWeight`, `fresnelWeight`, `flowWeight`, `rampLow`, `rampHigh`, `shadingMix`) を含む旧 Preset を読み込んだ場合、これらは無視され、残りのパラメータは正規化される。旧 Preset の読み込みは正常に動作し、黒画面やフォールバックを発生させない。

## REMOVED Requirements

なし
