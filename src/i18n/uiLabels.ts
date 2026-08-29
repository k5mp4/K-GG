import type { UiLanguage } from './language';

const uiTerms = [
  ['Amount', '量'], ['Anchor Influence', 'アンカー影響'], ['Angle', '角度'], ['Apex X', '頂点 X'], ['Apex Y', '頂点 Y'], ['Band Height', '帯の高さ'],
  ['Bevel Size', 'ベベルサイズ'], ['Blend', '合成'], ['Blend Width', '合成幅'], ['Blur', 'ぼかし'], ['Brightness', '明るさ'],
  ['Brush Size', 'ブラシサイズ'], ['Cascade Gain', 'カスケードゲイン'], ['Cell Scale', 'セルスケール'],
  ['Center Falloff', '中心減衰'], ['Center Force', '中心力'], ['Center X', '中心 X'], ['Center Y', '中心 Y'],
  ['Channel', 'チャンネル'], ['Chromatic Aberration', '色収差'], ['Color Mode', 'カラーモード'],
  ['Color Over Life', '寿命による色'], ['Color Variance', '色のばらつき'], ['Complexity', '複雑さ'],
  ['Contrast', 'コントラスト'], ['Core', 'コア'], ['Count', '個数'], ['Curl Eps', 'カール差分'],
  ['Curl Evolution', 'カール展開'], ['Curl Scale', 'カールスケール'], ['Curl Seed', 'カールシード'],
  ['Curl Speed', 'カール速度'], ['Curl Strength', 'カール強度'], ['Depth', '深度'], ['Diffuse Mode', '拡散モード'],
  ['Direction', '方向'], ['Distance Metric', '距離方式'], ['Dot Size', 'ドットサイズ'], ['Drift Angle', 'ドリフト角度'], ['Drift Speed', 'ドリフト速度'],
  ['Edge', 'エッジ'], ['Edge Crossfade', 'エッジクロスフェード'], ['Edge Fade', 'エッジ減衰'], ['Edge Weld', 'エッジ溶接'], ['Emitter Type', '放出方式'], ['Evolution', '展開'],
  ['Exponent', '指数'], ['Falloff', '減衰'], ['Feather', 'ぼかし幅'], ['Final Mix', '最終合成'],
  ['Flow Gradient', 'Flow Gradient'], ['Flow Steps', 'フローステップ'], ['Fractal Type', 'フラクタル形式'], ['Frequency', '周波数'],
  ['Glow Intensity', '発光強度'], ['Glow Radius', '発光半径'], ['Glow Threshold', '発光しきい値'], ['Grain', '粒度'],
  ['Gradient Scale', 'グラデーションスケール'], ['Gradient Type', 'グラデーション形式'],
  ['Height Variance', '高さのばらつき'], ['Highlight', 'ハイライト'], ['Inner Radius', '内側半径'],
  ['Intensity', '強度'], ['Interp', '補間'], ['Lacunarity', 'ラカナリティ'], ['Length', '長さ'],
  ['Texture Repeat', 'テクスチャ反復'], ['Flow Cycles', 'フロー周期'],
  ['Length Randomness', '長さのランダム量'], ['Life Random', '寿命のランダム量'], ['Life Time', '寿命'],
  ['Max Displacement', '最大変位'], ['Mid Speed', '中間速度'], ['Mirror Axis', 'ミラー軸'],
  ['Mirroring Type', 'ミラー形式'], ['Mix', 'ミックス'], ['Motion', '動き'], ['Noise Distortion', 'ノイズ歪み'],
  ['Octaves', 'オクターブ'], ['Offset', 'オフセット'], ['Offset Angle', 'オフセット角度'],
  ['Offset Speed', 'オフセット速度'], ['Opacity', '不透明度'], ['Outer Speed', '外側速度'],
  ['Persistence', '持続率'],
  ['Point X', '点 X'], ['Point Y', '点 Y'], ['Radius', '半径'], ['Randomness', 'ランダム量'],
  ['Particle Count', 'パーティクル数'], ['Ray Count', '光線数'], ['Refraction', '屈折'], ['Ribbon Width', 'リボン幅'], ['Rot Angle 1', '回転角 1'], ['Rot Angle 2', '回転角 2'],
  ['Rotation', '回転'], ['Roughness', '粗さ'], ['Scale', 'スケール'], ['Scan Position', '走査位置'], ['Seam Mode', 'シーム方式'],
  ['Scatter', '拡散量'], ['Seam Blend', 'シームブレンド'], ['Seamless Animation', 'シームレスアニメーション'], ['Seamless Base', 'シームレス基準'],
  ['Seed', 'シード'], ['Sharpness', '鋭さ'], ['Sides', '辺数'], ['Size', 'サイズ'], ['Trail', 'Trail'], ['Mirror Repeat', 'ミラー反復'],
  ['Size Over Life', '寿命によるサイズ'], ['Size Random', 'サイズのランダム量'], ['Slices', '分割数'],
  ['Slits', 'スリット数'], ['Speed', '速度'], ['Spiral Twist', 'らせんのねじれ'], ['Spread', '広がり'],
  ['Strength', '強度'], ['Stretch', 'ストレッチ'], ['Sub Influence', '副作用量'], ['Sub Rotation', '副回転'],
  ['Sub Scaling', '副スケール'], ['Threshold', 'しきい値'], ['Turbulence', '乱流'], ['Type', '形式'],
  ['Variance', 'ばらつき'], ['Variation', '変化量'], ['Warp', 'ワープ'], ['Warp Strength', 'ワープ強度'],
  ['Wave Height', '波の高さ'], ['Wave Type', '波形'], ['Width', '幅'], ['Zoom', 'ズーム'],
  ['Diffuse', '拡散'], ['Noise', 'ノイズ'], ['Slit', 'スリット'], ['Distort', '歪み'],
  ['Mirror', 'ミラー'], ['Kaleidoscope', '万華鏡'], ['Voronoi', 'ボロノイ'], ['Glass', 'ガラス'], ['Glass V2', 'ガラス V2'],
  ['Prism', 'プリズム'], ['Particles', 'パーティクル'], ['Cone', 'コーン'],
  ['Linear', 'リニア'], ['Radial', '放射'], ['4-color', '4色'], ['Diamond', 'ひし形'], ['Angle', '角度'],
  ['Bezier', 'ベジェ'], ['Ease', 'イーズ'], ['Cardinal', 'カーディナル'], ['Constant', '一定'],
  ['Analogous', '類似色'], ['Complementary', '補色'], ['Split-Complementary', '分割補色'], ['Triad', 'トライアド'],
  ['Square', 'スクエア'], ['Compound', '複合色'], ['Shades', 'シェード'], ['Monochromatic', 'モノクロマティック'],
  ['Ease In', 'イーズイン'], ['Ease Out', 'イーズアウト'], ['In-Out', 'イン・アウト'],
  ['Variable', '可変'], ['Near', '近い方'], ['Far', '遠い方'], ['Clockwise', '時計回り'],
  ['Counter-Clockwise', '反時計回り'], ['Point', '点'], ['Line', '線'], ['Circle', '円'],
] as const;

const aliases = new Map<string, { en: string; ja: string }>();
for (const [en, ja] of uiTerms) {
  aliases.set(en, { en, ja });
  aliases.set(ja, { en, ja });
}

export function localizeUiLabel(value: string, language: UiLanguage): string {
  return aliases.get(value)?.[language] ?? value;
}

export const uiTerminology = uiTerms;
