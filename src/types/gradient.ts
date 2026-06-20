export type RampColorMode =
  | 'rgb'
  | 'linearrgb'
  | 'hsv'
  | 'hsl'
  | 'lab'
  | 'lch'
  | 'xyz'
  | 'oklab'
  | 'oklch';

export type RampInterpolation =
  | 'ease'
  | 'cardinal'
  | 'linear'
  | 'b-spline'
  | 'constant'
  | 'variable'
  | 'near'
  | 'far'
  | 'clockwise'
  | 'counterclockwise'
  // Legacy values kept so older presets/localStorage can be migrated safely.
  | 'srgb'
  | 'linearrgb'
  | 'hsl'
  | 'hsv'
  | 'lab'
  | 'lch'
  | 'xyz'
  | 'oklab'
  | 'oklch';

export type ColorStop = {
  stopId?: string;   // アニメーション用の安定した一意ID
  position: number;  // 0.0–1.0
  color: string;     // hex
};

export type OpacityStop = {
  stopId?: string;   // アニメーション用の安定した一意ID
  position: number;  // 0.0–1.0
  opacity: number;   // 0.0–1.0
};

export type GradientType = 'linear' | 'radial' | 'fourcolor' | 'diamond' | 'angle' | 'bezier';

export type GradientConfig = {
  angle: number;     // degrees 0–360
  stops: ColorStop[];
  opacityStops?: OpacityStop[];
  rampColorMode?: RampColorMode;
  rampInterpolation: RampInterpolation;
  rampVariable?: number; // -1.0..1.0, 0=Ease, +/-1=Constant寄り
  rampRepeat?: number; // 1–20, グラデーションランプの繰り返し回数
  gradientType: GradientType;
  /** グラデーションのアンカーポイント（UV空間: y=0が底辺）。常に4点保持し、fourcolor以外は0,1のみ使用 */
  anchors?: [[number,number],[number,number],[number,number],[number,number]];
  /** Bezier Gradient用の制御点（UV空間）。0=A側ハンドル、1=B側ハンドル */
  bezierControls?: [[number, number], [number, number]];
  rampMirror?: boolean;  // mirrorモード：ストップ範囲を0–0.5に制限し左右対称にレンダリング
};
