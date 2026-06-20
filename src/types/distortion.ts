// Phase 2 で実装。Phase 1 では型定義のみ。
export type NoiseDistortionConfig = {
  enabled: boolean;
  type: 'simplex' | 'fbm' | 'voronoi' | 'curl' | 'domain_warp_anim' | 'seamless' | 'ridged_fbm' | 'ae_fractal';
  amount: number;
  scale: number;
  octaves: number;
  evolution: number;
  speed: number;
  curlSteps: number;     // 1–8: curl 多段階アドベクションのステップ数
  curlSpeed: number;     // curl 時間進行速度
  curlEps: number;       // curl 数値微分幅 (0.001-0.1)
  curlSeed: number;      // curl 乱数シード (0-100)
  noiseSeed: number;     // 汎用乱数シード (0-100) curl 以外の全ノイズタイプに適用
  noiseLoopMode: 'legacy' | 'seamless'; // legacy=従来の直線移動, seamless=終端を始端へブレンド
  noiseLoopBlend: number; // 0.05-1.0: ループ終端補正を分散する周期割合
  // domain_warp_anim 専用パラメータ
  dwRotAngle1: number;   // 回転行列 cos 側
  dwRotAngle2: number;   // 回転行列 sin 側
  dwDist1: number;       // 第1層 (st) アニメ速度
  dwDist2: number;       // 第2層 (r) アニメ速度
  dwDist3: number;       // 第3層 (s) アニメ速度
  dwInitVal: number;     // 最終 fbm 呼び出し時の s 乗数
  dwInitAmp: number;     // q/r/s 乗数 (ワープ強度)
  dwDriftAngle: number;  // アニメーションドリフト方向 (度, 0–360)
  seamlessType: 'simplex' | 'fbm' | 'curl';
  seamlessAnimation: 'drift' | 'radial';
  seamlessTwist: number; // 渦巻きの強さ
  // Voronoi 専用パラメータ
  voronoiDistMetric: 'euclidean' | 'manhattan' | 'chebyshev' | 'minkowski';
  voronoiRandomness: number;    // 0.0–1.0: 特徴点のランダム性（0=規則格子, 1=完全ランダム）
  voronoiFeature: 'f1' | 'f2' | 'distance_to_edge'; // 出力する特徴量
  voronoiMinkowskiExp: number;  // 0.5–8.0: Minkowski 指数
  // Ridged fBm 専用パラメータ
  ridgeSharpness: number;    // 0.5–6.0: 稜線の鋭さ（大きいほど細く明るい筋に）
  ridgeGain: number;         // 0.0–4.0: カスケードゲイン（明るい稜線が次オクターブを強調）
  ridgeLacunarity: number;   // 1.1–4.0: 周波数倍率（大→各オクターブが独立, 小→重畳して複雑に）
  ridgePersistence: number;  // 0.1–1.0: 振幅倍率（大→高周波が支配的で複雑, 小→低周波が支配的）
  ridgeOffset: number;       // 0.0–2.0: 稜線位置オフセット（1.0=ゼロ交差, <1=収縮, >1=太く）
  ridgeWarp: number;         // 0.0–4.0: ドメインワープ量（simplex格子の規則性を破壊してランダムに）
  // AE Fractal Noise 専用パラメータ
  aeFractalType: 'basic' | 'turbulent'; // basic=標準fbm, turbulent=abs()で全値正化
  aeSubInfluence: number;    // 0.01–1.0: オクターブ振幅倍率 (AE: Sub Influence)
  aeSubScaling: number;      // 1.01–4.0: 周波数倍率 (AE: Sub Scaling)
  aeSubRotation: number;     // 0–360°: オクターブごとの累積回転 (AE: Sub Rotation) ← 核心
  aeContrast: number;        // 0.5–4.0: 出力コントラスト (AE: Contrast)
  aeBrightness: number;      // -1.0–1.0: 出力明度オフセット (AE: Brightness)
};

export type DiffuseDitherMode = 'pattern_dither';

export type DiffuseConfig = {
  enabled: boolean;
  mode: 'block' | 'smooth' | 'dither'; // block=矩形ノイズ, smooth=有機的ドットノイズ, dither=ディザパターン
  ditherMode: DiffuseDitherMode;
  scatter: number;  // 0–300  ピクセル単位の最大変位量
  grain: number;    // 0.01–5 グレインサイズ（px単位）
  seed: number;     // 0–99   ハッシュシード
  seedAnimEnabled?: boolean; // true=描画フレームごとに seed を進める
  ditherThreshold: number; // 0–1 ディザのしきい値バイアス（0.5=標準）
};

export type BezierAnchor = {
  x: number;
  y: number;
  cp1: [number, number];
  cp2: [number, number];
};

export type SlitScanConfig = {
  enabled: boolean;
  mode: 'linear' | 'circular' | 'polygon' | 'wave'; // wave=波形UVワープ
  angle: number;      // 0–360 deg, スリット方向 / wave 方向
  waveType: 'sine' | 'sawtooth' | 'semicircle';
  waveHeight: number; // px, wave モードの変位量
  polygonSides: number; // 3–32, polygon モードの頂点数
  slitWidth: number;  // 1–200 px, 平均スリット幅
  offset: number;       // 0–1.0, スリットごとの最大オフセット
  offsetSpeed: number;        // アニメーション速度 (0=静止, 正=順方向, 負=逆方向)
  animEnabled: boolean;       // スリットスキャン独自アニメーションの有効/無効
  animMode: 'off' | 'unidirectional' | 'pingpong'; // off=スリットごとの変化なし, unidirectional=一方向(fract), pingpong=往復(sin)
  phaseAnimEnabled: boolean;  // スリット帯域全体の移動アニメーション
  phaseSpeed: number;         // スリット帯域の移動速度（slitWidth 倍/アニメーション周期、正=左→右）
  variance: number;   // 0–1, 幅のランダム変化量
  seed: number;       // 0–99, ランダムシード
  slitPhase: number;       // スリット帯域の位置オフセット（px）
  selectedSlitIdx: number; // 選択中スリットのインデックス（-1=なし、UI ハイライト用）
  slitDeltas: Record<number, number>; // スリットごとの幅オフセット（px）。slit index → delta
  noiseAfterSlit: boolean; // false=Slit -> Noise / true=Noise -> Slit
  pixelPerfect: boolean;   // true=スリット位置・幅・移動量をキャンバス1px単位に丸める
  offsetAngle: number;     // 0–360 deg, スリットオフセット方向（スリット角度からの相対角度）
};

export type StretchConfig = {
  enabled: boolean;
  bandHeight: number;  // 1-600 px, 横方向に引き伸ばす走査ラインの高さ
  bandHeightVariance: number; // 0-1, バンド高さ自体のランダム量
  variation: number;   // 0-1, ラインごとの走査位置ランダム量
  seed: number;        // 0-99, ライン分布のシード
  glowEnabled: boolean; // Stretch 後の発光ポストプロセス
  glowIntensity: number; // 0-3, 発光の加算量
  glowRadius: number;   // 1-80 px, サンプル半径
  glowThreshold: number; // 0-1, 発光対象の明度しきい値
  glowTint: string;      // #RRGGBB, 発光色
};

export type NormalMapConfig = {
  enabled: boolean;
  strength: number;  // 0.1–10.0  バンプの強さ
  blur: number;      // 0.5–100.0  ブラー半径（ピクセル）: 大きいほど高周波成分を除去
  angle: number;     // 0–360  法線マップの回転方向（度）
  bevelSize: number; // 0.1–5.0  エッジ幅（ベベルサイズ）
  invert: boolean;   // true=凹凸反転
};

export type RadonConfig = {
  enabled: boolean;
  strength: number;   // 0.0–1.0: ベースグラデーションとのmix比率
  freq: number;       // 0.25–4.0: 投影角度の周波数（横幅でπ×freq ラジアン回転）
  radius: number;     // 0.1–3.0: サイノグラムt軸スケール（投影距離）
  angle: number;      // 0–360°: ベース角度オフセット（度）
  blur: number;       // 0–2: ライン積分幅（0=点サンプル, 1=フル積分）
  evolution: number;  // 0–10: 静的位相オフセット
  speed: number;      // 0–2: アニメーション速度
};

export type IridescenceConfig = {
  enabled: boolean;
  strength: number;      // 0.0-1.0: 歪み全体の強度
  speed: number;         // アニメーション速度
  frequency: number;     // 波の細かさ（スケール）
  angle: number;         // 歪みの方向（度）
  bezierWarpStrength: number; // 0.0-1.0: ベジェ軸周辺の追加歪み強度
};

export type ManualDistortConfig = {
  enabled: boolean;
  mode: 'warp' | 'swirl' | 'spiky';
  brushSize: number;      // px, canvas-space brush radius
  strength: number;       // drag multiplier
  falloff: number;        // influence curve exponent
  showOverlay: boolean;
  mapResolution: number;
  displacement: number[]; // normalized signed XY pairs, length = mapResolution * mapResolution * 2
  smoothMask: number[];   // 0-8 accumulated smoothing passes, length = mapResolution * mapResolution
  smoothStrength: number; // mix amount for local color averaging
  smoothRadius: number;   // px sampling radius for color averaging
  maxDisplacement: number; // max UV displacement represented by +/-1 in the map
};

export type PostprocessEffectMode = 'distort' | 'mirror' | 'kaleidoscope' | 'prism' | 'voronoi' | 'particles';
export type PostprocessMirrorMode = 'horizontal' | 'vertical' | 'quad';
export type PostprocessKaleidoscopeType = 'unfold' | 'flower' | 'starlish';
export type PostprocessParticleBlendMode = 'alpha' | 'add';
export type PostprocessParticleColorOverLifeMode = 'hue' | 'ramp';
export type PostprocessParticleEmitterType = 'field' | 'line' | 'burst' | 'point';

export type PostprocessConfig = ManualDistortConfig & {
  effectMode: PostprocessEffectMode;
  mirrorMode: PostprocessMirrorMode;
  kaleidoscopeType: PostprocessKaleidoscopeType;
  kaleidoscopeSlices: number;
  kaleidoscopeRotation: number;
  kaleidoscopeZoom: number;
  prismCenter: [number, number];
  prismRayCount: number;
  prismLength: number;
  prismLengthRandomness: number;
  prismWidth: number;
  prismRandomness: number;
  prismBlur: number;
  prismIntensity: number;
  prismGlowRadius: number;
  prismChromaticAberration: number;
  prismSeed: number;
  prismInnerRadius: number;
  voronoiScale: number;
  voronoiRandomness: number;
  voronoiAngle: number;
  voronoiGradientScale: number;
  voronoiEdgeWidth: number;
  voronoiSeed: number;
  particleCount: number;
  particleEmitterType: PostprocessParticleEmitterType;
  particleEmitterPoint: [number, number];
  particleSize: number;
  particleSizeRandomness: number;
  particleLifeCycle: number;
  particleLifeRandom: number;
  particleSizeOverLife: number;
  particleFeather: number;
  particleCore: number;
  particleBrightness: number;
  particleEdgeFade: number;
  particleSpeed: number;
  particleSpread: number;
  particleTurbulence: number;
  particleCurlScale: number;
  particleCurlStrength: number;
  particleCurlSpeed: number;
  particleCurlEvolution: number;
  particleRadialForce: number;
  particleRadialFalloff: number;
  particleDepth: number;
  particleOpacity: number;
  particleColorVariance: number;
  particleColorOverLifeMode: PostprocessParticleColorOverLifeMode;
  particleColorOverLife: number;
  particleDirection: number;
  particleSeed: number;
  particleBlendMode: PostprocessParticleBlendMode;
  diffuseEnabled: boolean;
  diffuseMode: DiffuseConfig['mode'];
  diffuseScatter: number;
  diffuseGrain: number;
  diffuseSeed: number;
  diffuseDitherThreshold: number;
};

export type MatcapConfig = {
  enabled: boolean;
};

export type HistogramConfig = {
  enabled: boolean;
  showRampDistribution: boolean;
  scale: number; // 0.5 - 2.0
};

export type BezierBoundary = 'clamp' | 'repeat' | 'mirror';

export type BezierPath = {
  id: string;              // 各パスを識別するためのユニークID
  anchors: BezierAnchor[];
  closed: boolean;
};

export type BezierAxisConfig = {
  enabled: boolean;
  paths: BezierPath[];     // anchors: BezierAnchor[] から複数のパスを持つ paths 形式に変更
  strength: number;
  boundary: BezierBoundary;
  radius: number;          // 0.01–3.0  グラデーション帯幅（1.0=SDFフル範囲）
  curvatureInfluence: number; // 0.0–1.0  曲率の影響度
  curvatureMode: 'wide' | 'narrow'; // wide=高曲率ほど色幅を広げる, narrow=高曲率ほど色幅を狭める
  bezierSide: 'both' | 'outer' | 'inner'; // both=両側, outer=外側のみ(bezierT>0.5), inner=内側のみ(bezierT<0.5)
};
