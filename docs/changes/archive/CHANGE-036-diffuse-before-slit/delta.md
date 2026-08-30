# Delta

## ADDED Requirements

### EFFECT-025 Diffuse直後のSlitにおける出力座標評価

Effect Stack V2で有効な`Diffuse`の直後に有効な`Slit`がある場合、DiffuseはAnalytic PrefixとしてGenerator側へ消費せず、Texture StackのSlit出力座標側で一度だけ評価する。これによりSlitが生成する延長領域にもDiffuseが反映され、Diffuse済みの画像をSlitが再サンプリングしてセルを縞状に引き延ばすことを避ける。無効レイヤーは正規化後の有効レイヤー順から除外して隣接性を判定する。

この例外は`Diffuse → Slit`に限定し、SlitがDiffuseの直後にない場合は既存のAnalytic Prefix境界と消費範囲を維持する。Slit Motionのduration時計、Diffuseの保存形式、各Diffuseモードの計算式は変更しない。

## MODIFIED Requirements

なし。

## REMOVED Requirements

なし。
