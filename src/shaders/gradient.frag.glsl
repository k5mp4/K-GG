
  uniform int u_gradientType; // 0=linear, 1=radial, 2=fourcolor, 3=diamond, 4=angle, 5=bezier, 6=mesh
  uniform vec2 u_gradAnchor0;
  uniform vec2 u_gradAnchor1;
  uniform vec2 u_gradAnchor2;
  uniform vec2 u_gradAnchor3;
  uniform vec2 u_gradBezierCp0;
  uniform vec2 u_gradBezierCp1;
  uniform vec2 u_meshCorner0;
  uniform vec2 u_meshCorner1;
  uniform vec2 u_meshCorner2;
  uniform vec2 u_meshCorner3;
  uniform vec2 u_meshBottomCp0;
  uniform vec2 u_meshBottomCp1;
  uniform vec2 u_meshRightCp0;
  uniform vec2 u_meshRightCp1;
  uniform vec2 u_meshTopCp0;
  uniform vec2 u_meshTopCp1;
  uniform vec2 u_meshLeftCp0;
  uniform vec2 u_meshLeftCp1;
  uniform vec4 u_meshColorPositions;

  uniform bool u_noiseEnabled;
  uniform int u_noiseType;
  uniform float u_noiseAmount;
  uniform float u_noiseScale;
  uniform int u_noiseOctaves;
  uniform float u_noiseEvolution;
  uniform bool u_diffuseEnabled;
  uniform int  u_diffuseMode;
  uniform float u_diffuseScatter;
  uniform float u_diffuseGrain;
  uniform float u_diffuseSeed;
  uniform float u_diffuseDitherThreshold;
  uniform bool u_diffuseAdaptiveEnabled;
  uniform int u_diffuseAdaptiveChannel; // 0=luminance, 1=hue, 2=saturation
  uniform bool u_diffuseGrainAdaptiveEnabled;
  uniform float u_diffuseGrainAdaptiveAmount;
  uniform int u_diffuseHalftoneShape; // 0=circle, 1=square
  uniform float u_diffuseHalftoneSize;
  uniform vec3 u_diffuseBackgroundColor;
  uniform sampler2D u_diffuseAsciiAtlas;
  uniform float u_diffuseAsciiCount;
  uniform float u_diffuseAsciiColumns;
  uniform float u_diffuseAsciiRows;
  uniform float u_diffuseAsciiRotation;
  uniform sampler2D u_diffuseCurve;

  uniform sampler2D u_gradientRamp;
  uniform sampler2D u_meshGradient;
  uniform float u_rampRepeat;
  uniform bool u_sourceImageEnabled;
  uniform sampler2D u_sourceImage;
  uniform bool u_imageGradientEnabled;
  uniform sampler2D u_imageGradient;
  uniform vec2 u_imageGradientSize;
  uniform int u_imageGradientChannel;
  uniform float u_imageGradientAnchorInfluence;
  uniform bool u_imageMaskEnabled;
  uniform sampler2D u_imageMask;

  uniform bool u_slitEnabled;
  uniform int u_slitMode;
  uniform float u_slitAngle;
  uniform int u_slitWaveType; // 0=sine, 1=sawtooth, 2=semicircle
  uniform float u_slitWaveHeight;
  uniform int u_slitPolygonSides;
  uniform float u_slitOffsetAngle; // スリットオフセット方向（u_slitAngle からの相対ラジアン）
  uniform float u_slitWidth;
  uniform float u_slitOffset;
  uniform float u_slitVariance;
  uniform vec2 u_slitParams;   // .x = slitPhase (px offset), .y = slitSeed
  // 複数スリットの幅オフセット（スリットインデックス昇順にソート済み、最大32エントリ）
  // 各 vec4 の .xy = (slitIdx, delta), .zw = 次エントリ。slitIdx = -9999 は空エントリ。
  uniform vec4 u_slitDelta01;
  uniform vec4 u_slitDelta23;
  uniform vec4 u_slitDelta45;
  uniform vec4 u_slitDelta67;
  uniform vec4 u_slitDelta89;
  uniform vec4 u_slitDeltaAB;
  uniform vec4 u_slitDeltaCD;
  uniform vec4 u_slitDeltaEF;
  uniform vec4 u_slitDeltaGH;
  uniform vec4 u_slitDeltaIJ;
  uniform vec4 u_slitDeltaKL;
  uniform vec4 u_slitDeltaMN;
  uniform vec4 u_slitDeltaOP;
  uniform vec4 u_slitDeltaQR;
  uniform vec4 u_slitDeltaST;
  uniform vec4 u_slitDeltaUV;
  uniform bool u_slitAnimEnabled;
  uniform float u_slitAnimTime;
  uniform int u_slitAnimMode;  // 0=unidirectional(fract), 1=pingpong(sin)
  uniform bool u_slitNoiseAfter; // false=Slit -> Noise, true=Noise -> Slit
  uniform bool u_slitPixelPerfect; // true=スリット位置・サンプル移動をキャンバス1px単位に丸める
  uniform vec3 u_slitEdge; // .x = コーナー半径(px), .y = 角丸にする端(0=none,1=start,2=end,3=both,4=random), .z = 形状(0=round,1=bevel)
  uniform vec3 u_slitEdgeBar; // .x = バー長（帯方向のキャンバス長に対する比）, .y = 長さのばらつき, .z = 模様が繰り返すバーの本数

  // Manual Distort
  uniform bool u_manualDistortEnabled;
  uniform sampler2D u_manualDistortMap;
  uniform float u_manualDistortMaxDisplacement;
  uniform float u_manualDistortSmoothStrength;
  uniform float u_manualDistortSmoothRadius;

  // タイルレンダリング用: タイル単位で描画する際、gl_FragCoord に加算して
  // u_resolution（最終出力サイズ）空間でのグローバル座標を得る。
  // 通常レンダリングでは vec2(0.0) でデフォルト動作。
  uniform vec2 u_tileOffset;
  uniform vec2 u_tileSize;

  vec2 cubicBezierPoint(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float mt = 1.0 - t;
    return mt * mt * mt * p0 + 3.0 * mt * mt * t * p1 + 3.0 * mt * t * t * p2 + t * t * t * p3;
  }

  vec2 cubicBezierDerivative(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    float mt = 1.0 - t;
    return 3.0 * mt * mt * (p1 - p0) + 6.0 * mt * t * (p2 - p1) + 3.0 * t * t * (p3 - p2);
  }

  vec2 cubicBezierSecondDerivative(vec2 p0, vec2 p1, vec2 p2, vec2 p3, float t) {
    return 6.0 * (1.0 - t) * (p2 - 2.0 * p1 + p0) + 6.0 * t * (p3 - 2.0 * p2 + p1);
  }

  vec2 safeNormalize2(vec2 v, vec2 fallback) {
    float len = length(v);
    if (len < 1.0e-5) {
      float fallbackLen = length(fallback);
      return fallbackLen < 1.0e-5 ? vec2(0.0, 1.0) : fallback / fallbackLen;
    }
    return v / len;
  }

  float computeBezierGradientBase(vec2 uv) {
    vec2 p0 = u_gradAnchor0 * u_resolution;
    vec2 p1 = u_gradBezierCp0 * u_resolution;
    vec2 p2 = u_gradBezierCp1 * u_resolution;
    vec2 p3 = u_gradAnchor1 * u_resolution;
    vec2 target = uv * u_resolution;
    float axisLen = max(
      length(p1 - p0) + length(p2 - p1) + length(p3 - p2),
      max(length(p3 - p0), 1.0)
    );
    float bestT = 0.0;
    float bestD = 1.0e20;

    for (int i = 0; i <= 24; i++) {
      float t = float(i) / 24.0;
      vec2 p = cubicBezierPoint(p0, p1, p2, p3, t);
      vec2 d = target - p;
      float dist2 = dot(d, d);
      if (dist2 < bestD) {
        bestD = dist2;
        bestT = t;
      }
    }

    float t = bestT;
    for (int i = 0; i < 6; i++) {
      vec2 p = cubicBezierPoint(p0, p1, p2, p3, t);
      vec2 d1 = cubicBezierDerivative(p0, p1, p2, p3, t);
      vec2 d2 = cubicBezierSecondDerivative(p0, p1, p2, p3, t);
      vec2 r = p - target;
      float denom = dot(d1, d1) + dot(r, d2);
      if (abs(denom) > 1.0e-5) {
        t = clamp(t - dot(r, d1) / denom, 0.0, 1.0);
      }
    }

    vec2 curvePoint = cubicBezierPoint(p0, p1, p2, p3, t);
    bestD = dot(target - curvePoint, target - curvePoint);
    bestT = t;

    vec2 startDir = safeNormalize2(cubicBezierDerivative(p0, p1, p2, p3, 0.0), p3 - p0);
    float startS = dot(target - p0, startDir);
    if (startS < 0.0) {
      vec2 startRayPoint = p0 + startDir * startS;
      float startD = dot(target - startRayPoint, target - startRayPoint);
      if (startD < bestD) {
        bestD = startD;
        bestT = startS / axisLen;
      }
    }

    vec2 endDir = safeNormalize2(cubicBezierDerivative(p0, p1, p2, p3, 1.0), p3 - p0);
    float endS = dot(target - p3, endDir);
    if (endS > 0.0) {
      vec2 endRayPoint = p3 + endDir * endS;
      float endD = dot(target - endRayPoint, target - endRayPoint);
      if (endD < bestD) {
        bestD = endD;
        bestT = 1.0 + endS / axisLen;
      }
    }

    if (bestT != bestT) bestT = 0.0;
    return bestT;
  }

  float computeGradientBase(vec2 uv) {
    if (u_gradientType == 0) {
      // Linear: UVをanchor0→anchor1の線に射影
      vec2 d = u_gradAnchor1 - u_gradAnchor0;
      float len2 = dot(d, d);
      if (len2 < 0.00001) return 0.0;
      return dot(uv - u_gradAnchor0, d) / len2;
    } else if (u_gradientType == 1) {
      // Radial: ピクセル空間で計算して縦横比に関わらず正円を保証
      vec2 c = (uv - u_gradAnchor0) * u_resolution;
      vec2 refVec = (u_gradAnchor1 - u_gradAnchor0) * u_resolution;
      return length(c) / max(length(refVec), 0.001);
    } else if (u_gradientType == 2) {
      // 4-color: 4アンカーへの逆距離重み付けブレンド
      float w0 = 1.0 / max(dot(uv - u_gradAnchor0, uv - u_gradAnchor0), 0.0001);
      float w1 = 1.0 / max(dot(uv - u_gradAnchor1, uv - u_gradAnchor1), 0.0001);
      float w2 = 1.0 / max(dot(uv - u_gradAnchor2, uv - u_gradAnchor2), 0.0001);
      float w3 = 1.0 / max(dot(uv - u_gradAnchor3, uv - u_gradAnchor3), 0.0001);
      float totalW = w0 + w1 + w2 + w3;
      // anchor0=t0, anchor1=t1/3, anchor2=t2/3, anchor3=t1
      return (w1 * (1.0/3.0) + w2 * (2.0/3.0) + w3) / totalW;
    } else if (u_gradientType == 3) {
      // Diamond: anchor0中心、anchor0→anchor1の方向が頂点方向、L1距離を半径
      vec2 ref = u_gradAnchor1 - u_gradAnchor0;
      float refLen = length(ref);
      if (refLen < 0.00001) return 0.0;
      vec2 refN = ref / refLen;
      vec2 c = uv - u_gradAnchor0;
      // anchor0→anchor1方向を(1,0)に揃える回転
      vec2 cRot = vec2(dot(c, refN), dot(c, vec2(-refN.y, refN.x)));
      float radius = refLen;
      return (abs(cRot.x) + abs(cRot.y)) / max(radius, 0.001);
    } else if (u_gradientType == 4) {
      // Angle (conical): anchor0中心、anchor1方向を開始角
      vec2 ref = u_gradAnchor1 - u_gradAnchor0;
      float startAngle = atan(ref.y, ref.x);
      vec2 c = uv - u_gradAnchor0;
      if (dot(c, c) < 0.00001) return 0.0;
      return fract((atan(c.y, c.x) - startAngle) / 6.28318530718 + 0.5);
    } else if (u_gradientType == 5) {
      // Bezier: A/Bアンカー間の三次ベジェ曲線をグラデーション軸として使う
      return computeBezierGradientBase(uv);
    }
    return 0.0;
  }

  float computeGradientT(vec2 sampleUV) {
    return clamp(computeGradientBase(sampleUV), 0.0, 1.0);
  }

  vec4 sampleMeshGradient(vec2 sampleUV) {
    return texture2D(u_meshGradient, clamp(sampleUV, 0.0, 1.0));
  }

  float applyRampRepeatT(float t);

  vec4 sampleStandardGradient(vec2 sampleUV) {
    float t = applyRampRepeatT(computeGradientT(sampleUV));
    return texture2D(u_gradientRamp, vec2(t, 0.5));
  }

  vec4 sampleGradientColor(vec2 sampleUV) {
    if (u_gradientType == 6) return sampleMeshGradient(sampleUV);
    return sampleStandardGradient(sampleUV);
  }

#if !defined(KGG_BOOTSTRAP)
  vec2 applyCurlNoiseUV(vec2 uv, float evo, float curlTime) {
      float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
      vec3 seedOffset = vec3(u_curlSeed, u_curlSeed * 1.37, u_curlSeed * 0.71);
      for (int s = 0; s < 8; s++) {
        if (s >= u_curlSteps) break;
        vec3 p = vec3(uv * u_noiseScale + evo * u_animDir, curlTime) + seedOffset;
        float eps = max(u_curlEps, 0.0001);
        float phi_r = fbm3D(p + vec3( eps, 0.0, 0.0), u_noiseOctaves);
        float phi_l = fbm3D(p + vec3(-eps, 0.0, 0.0), u_noiseOctaves);
        float phi_u = fbm3D(p + vec3(0.0,  eps, 0.0), u_noiseOctaves);
        float phi_d = fbm3D(p + vec3(0.0, -eps, 0.0), u_noiseOctaves);
        vec2 curlVec = vec2(phi_u - phi_d, -(phi_r - phi_l)) / (2.0 * eps);
        uv -= curlVec * dt;
      }
      return uv;
  }

  vec2 applyFastCurlNoiseUV(vec2 uv, float evo) {
      float dt = u_noiseAmount / max(float(u_curlSteps), 1.0);
      for (int s = 0; s < 8; s++) {
        if (s >= u_curlSteps) break;
        uv -= fastCurlField(uv, u_noiseScale, evo, u_noiseOctaves) * dt;
      }
      return uv;
  }
#endif

  vec2 applyNoiseUV(vec2 uv) {
#if defined(KGG_BOOTSTRAP)
    return uv;
#else
    if (!u_noiseEnabled) return uv;
    float evo = u_noiseEvolution + u_time;
#if KGG_NOISE_VARIANT < 0 || KGG_NOISE_VARIANT == 3
    if (KGG_NOISE_TYPE == 3) {
      vec2 current = applyCurlNoiseUV(uv, evo, u_time * u_curlSpeed);
      float blend = loopBlendWeight();
      if (blend <= 0.0001) return current;
      vec2 wrapped = applyCurlNoiseUV(uv, evo - u_noiseLoopPeriod, (u_time - u_noiseLoopPeriod) * u_curlSpeed);
      return mix(current, wrapped, blend);
    }
#endif
#if KGG_NOISE_VARIANT < 0 || KGG_NOISE_VARIANT == 8
    if (KGG_NOISE_TYPE == 8) {
      return applyFastCurlNoiseUV(uv, evo);
    }
#endif
    if ((KGG_NOISE_TYPE == CAUSTICS_NOISE_TYPE && u_noiseAmount == 0.0)
      || (KGG_NOISE_TYPE == PHASOR_NOISE_TYPE && (u_noiseAmount == 0.0 || u_phasorWarpStrength == 0.0))
      || (KGG_NOISE_TYPE == CHLADNI_NOISE_TYPE && (u_noiseAmount == 0.0 || u_chladniWarpStrength == 0.0))) {
      return uv;
    }
    vec2 offset = noiseDisplace(uv, u_noiseScale, evo, KGG_NOISE_TYPE, u_noiseOctaves);
    return uv + offset * u_noiseAmount;
#endif
  }

  float slitHash(float n) {
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
  }

  vec2 snapSlitUVToCanvasPixel(vec2 sampleUV) {
    if (!u_slitPixelPerfect) return sampleUV;
    return (floor(sampleUV * u_resolution) + 0.5) / u_resolution;
  }

  vec2 snapSlitOffsetToCanvasPixel(vec2 offsetUV) {
    if (!u_slitPixelPerfect) return offsetUV;
    return floor(offsetUV * u_resolution + 0.5) / u_resolution;
  }

  float regularPolygonCoord(vec2 p) {
    float sides = max(float(u_slitPolygonSides), 3.0);
    float sector = 6.28318530718 / sides;
    float localAngle = abs(mod(atan(p.y, p.x) + u_slitAngle + sector * 0.5, sector) - sector * 0.5);
    return length(p) * cos(localAngle) / max(cos(3.14159265359 / sides), 0.001);
  }

  // 実座標へ戻す: Variance で歪めたスリット座標 warped から、元のスリット座標を求める（ニュートン法）。
  // バーの形を歪み補正前の実ピクセルで測るために使う。
  float slitUnwarpCoord(float target, float sw) {
    if (u_slitVariance <= 0.0) return target;
    float x = target;
    for (int i = 0; i < 6; i++) {
      float phase = x / (sw * 4.0) * 6.2832 + u_slitParams.y * 37.4;
      float fx = x + sin(phase) * u_slitVariance * sw - target;
      float dfx = max(1.0 + cos(phase) * u_slitVariance * 1.5708, 0.2);
      x -= fx / dfx;
    }
    return x;
  }

  // バー端のコーナー（Round=円弧 / Bevel=45度の面取り）までの符号付き距離（px、正=バーの外側）。
  // a=帯の側縁までの距離、b=バー端までの距離、r=コーナー半径。
  float slitBarCapDist(float a, float b, float r) {
    if (a >= r || b >= r) return -b;
    vec2 q = vec2(r - a, r - b);
    return u_slitEdge.z > 0.5 ? (q.x + q.y - r) * 0.70710678 : length(q) - r;
  }

  // 帯 idx 上で k 番目のバーが始まる帯方向の位置。長さ len の格子を amp の割合でずらす。
  // 模様は cells 本のバーごとに繰り返す（アニメーションで1周期ぶん流すとループが継ぎ目なくつながる）。
  float slitBarCut(float k, float idx, float len, float amp, float phase, float cells) {
    return (k + phase + (slitHash(idx * 1.37 + mod(k, cells) * 5.31 + u_slitParams.y * 53.1 + 4.2) - 0.5) * amp) * len;
  }

  float slitBarFactor(float h) {
    return u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
  }

  // k 番目のバーの (カバレッジ, ずらし係数, 重なり順)。端は隣のバーの上へ半径 r だけはみ出す。
  // カバレッジは 0/1 の二値。ずらし係数を境界で混ぜると、離れた位置の色を拾った線がちらつくため。
  vec3 slitBarLayer(float k, float idx, float len, float amp, float phase, float cells, float a, float r, float t) {
    float side = u_slitEdge.y;
    float key = mod(k, cells);
    float pick = slitHash(idx * 2.7 + key * 3.3 + u_slitParams.y * 11.1 + 1.7);
    bool capLow = side > 3.5 ? pick < 0.5 : mod(side, 2.0) > 0.5;
    bool capHigh = side > 3.5 ? pick >= 0.5 : side > 1.5;
    float z = side < 1.5 ? k : (side < 2.5 ? -k : slitHash(idx * 4.1 + key * 1.9 + u_slitParams.y * 7.7 + 5.3));
    float lo = slitBarCut(k, idx, len, amp, phase, cells);
    float hi = slitBarCut(k + 1.0, idx, len, amp, phase, cells);
    float dLow = capLow ? slitBarCapDist(a, t - (lo - r), r) : lo - t;
    float dHigh = capHigh ? slitBarCapDist(a, (hi + r) - t, r) : t - hi;
    float h = slitHash(idx + u_slitParams.y * 91.7 + key * 7.13);
    return vec3(step(max(dLow, dHigh), 0.0), slitBarFactor(h), z);
  }

  // Linear の帯を帯方向に複数の角丸／面取りバーへ分け、その位置の画素に重なるバーのずらし係数を返す。
  // slitCoord=歪み補正前のスリット座標、band=(index, 左端, 右端)、t=キャンバス中心からの帯方向の位置、span=キャンバスの帯方向の長さ。
  float slitBarShift(float slitCoord, vec3 band, float t, float span, float sw) {
    float len = max(u_slitEdgeBar.x * span, 4.0);
    float amp = u_slitEdgeBar.y * 0.8;
    float cells = max(u_slitEdgeBar.z, 1.0);
    float travel = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin(u_slitAnimTime * 6.28318530718) * len : u_slitAnimTime * cells * len) : 0.0;
    float tt = t - travel;
    float idx = band.x;
    float phase = slitHash(idx * 2.11 + u_slitParams.y * 17.3 + 9.5);
    float xl = slitUnwarpCoord(band.y, sw);
    float xr = slitUnwarpCoord(band.z, sw);
    float a = max(min(slitCoord - xl, xr - slitCoord), 0.0);
    float r = min(u_slitEdge.x, min((xr - xl) * 0.5, 0.5 * len * (1.0 - amp)));
    float k0 = floor(tt / len - phase + 0.5);
    if (tt < slitBarCut(k0, idx, len, amp, phase, cells)) k0 -= 1.0;
    else if (tt >= slitBarCut(k0 + 1.0, idx, len, amp, phase, cells)) k0 += 1.0;
    vec3 la = slitBarLayer(k0 - 1.0, idx, len, amp, phase, cells, a, r, tt);
    vec3 lb = slitBarLayer(k0, idx, len, amp, phase, cells, a, r, tt);
    vec3 lc = slitBarLayer(k0 + 1.0, idx, len, amp, phase, cells, a, r, tt);
    float shift = lb.y;
    vec3 tmp;
    if (la.z > lb.z) { tmp = la; la = lb; lb = tmp; }
    if (lb.z > lc.z) { tmp = lb; lb = lc; lc = tmp; }
    if (la.z > lb.z) { tmp = la; la = lb; lb = tmp; }
    shift = mix(shift, la.y, la.x);
    shift = mix(shift, lb.y, lb.x);
    shift = mix(shift, lc.y, lc.x);
    return shift;
  }

  float slitWaveShape(float t) {
    float p = fract(t);
    if (u_slitWaveType == 1) {
      return p * 2.0 - 1.0;
    }
    if (u_slitWaveType == 2) {
      float x = p * 2.0 - 1.0;
      return sqrt(max(1.0 - x * x, 0.0)) * 2.0 - 1.0;
    }
    return sin(p * 6.28318530718);
  }

  vec2 applyWaveSlitUV(vec2 uv, vec2 globalCoord, float sw) {
    vec2 dir = vec2(cos(u_slitAngle), sin(u_slitAngle));
    vec2 waveAxis = vec2(-dir.y, dir.x);
    float coord = dot(globalCoord, waveAxis) + u_slitParams.x;
    float bandIdx = floor(coord / max(sw, 1.0));
    float localPhase = fract(coord / max(sw, 1.0));
    float phase = (bandIdx + localPhase) + u_slitParams.y * 0.137;
    if (u_slitAnimEnabled) {
      phase += u_slitAnimTime;
    }
    float bandGate = smoothstep(0.0, 0.08, localPhase) * (1.0 - smoothstep(0.92, 1.0, localPhase));
    float offsetPx = slitWaveShape(phase) * u_slitWaveHeight * bandGate;
    vec2 offsetUV = dir * offsetPx / u_resolution;
    return snapSlitUVToCanvasPixel(uv + offsetUV);
  }

  vec4 sampleSourceImageRaw(vec2 sampleUV) {
    vec2 suv = clamp(sampleUV, 0.0, 1.0);
    return texture2D(u_sourceImage, vec2(suv.x, 1.0 - suv.y));
  }

  vec4 sampleImageGradient(vec2 sampleUV) {
    float imageAspect = u_imageGradientSize.x / max(u_imageGradientSize.y, 1.0);
    float outputAspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 coverUv = sampleUV;
    if (imageAspect > outputAspect) {
      coverUv.x = 0.5 + (sampleUV.x - 0.5) * outputAspect / imageAspect;
    } else {
      coverUv.y = 0.5 + (sampleUV.y - 0.5) * imageAspect / outputAspect;
    }
    return texture2D(u_imageGradient, vec2(clamp(coverUv.x, 0.0, 1.0), 1.0 - clamp(coverUv.y, 0.0, 1.0)));
  }

  float imageGradientT(vec2 sampleUV) {
    vec3 rgb = clamp(sampleImageGradient(sampleUV).rgb, 0.0, 1.0);
    if (u_imageGradientChannel == 1) return rgb.r;
    if (u_imageGradientChannel == 2) return rgb.g;
    if (u_imageGradientChannel == 3) return rgb.b;
    return dot(rgb, vec3(0.299, 0.587, 0.114));
  }

  vec4 applyImageMask(vec4 color, vec2 globalCoord) {
    if (!u_imageMaskEnabled) return color;
    vec2 maskUv = clamp(globalCoord / u_resolution, 0.0, 1.0);
    float maskAlpha = texture2D(u_imageMask, vec2(maskUv.x, 1.0 - maskUv.y)).a;
    return vec4(color.rgb, color.a * maskAlpha);
  }

  float diffuseHash01(vec2 p) {
    return diffuseHash(p).x * 0.5 + 0.5;
  }

  vec3 diffuseRgbToHsv(vec3 c) {
    vec4 k = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, k.wz), vec4(c.gb, k.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(d < 0.00001 ? 0.0 : abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  float diffuseAdaptiveInput(vec3 rgb) {
    vec3 hsv = diffuseRgbToHsv(clamp(rgb, 0.0, 1.0));
    if (u_diffuseAdaptiveChannel == 1) return hsv.x;
    if (u_diffuseAdaptiveChannel == 2) return hsv.y;
    return dot(clamp(rgb, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
  }

  float diffuseCurveValue(float inputValue, bool grainCurve) {
    vec4 curve = texture2D(u_diffuseCurve, vec2(clamp(inputValue, 0.0, 1.0), 0.5));
    return grainCurve ? curve.g : curve.r;
  }

  float diffuseCellSize(float inputValue) {
    float baseSize = max(u_diffuseGrain, 0.01);
    if (!u_diffuseGrainAdaptiveEnabled) return baseSize;
    float response = diffuseCurveValue(inputValue, true);
    float scale = mix(1.0, mix(0.55, 1.55, response), clamp(u_diffuseGrainAdaptiveAmount, 0.0, 1.0));
    return max(baseSize * scale, 0.01);
  }

  vec2 diffuseCellFraction(vec2 coord, float cellSize) {
    float baseSize = max(u_diffuseGrain, 0.01);
    vec2 baseCellCenter = (floor(coord / baseSize) + 0.5) * baseSize;
    return clamp((coord - baseCellCenter) / max(baseSize, 0.01) + 0.5, 0.0, 1.0);
  }

  float diffuseCellSizeAtCoord(vec2 coord, vec3 fallbackColor) {
    float baseSize = max(u_diffuseGrain, 0.01);
    if (!u_diffuseGrainAdaptiveEnabled) return baseSize;
    vec2 baseCellCenter = (floor(coord / baseSize) + 0.5) * baseSize;
    vec2 centerUv = clamp(baseCellCenter / max(u_resolution, vec2(1.0)), 0.0, 1.0);
    vec3 representativeColor = fallbackColor;
    if (u_imageGradientEnabled) {
      representativeColor = sampleImageGradient(centerUv).rgb;
    } else if (u_sourceImageEnabled) {
      representativeColor = sampleSourceImageRaw(centerUv).rgb;
    } else {
      representativeColor = sampleGradientColor(centerUv).rgb;
    }
    return diffuseCellSize(diffuseAdaptiveInput(representativeColor));
  }

  vec3 diffusePatternBackground(vec3 cellColor) {
    return u_diffuseBackgroundColor;
  }

  float diffuseShapeMask(vec2 cellFraction, float radius) {
    vec2 centered = cellFraction - 0.5;
    float edge = 0.035;
    if (u_diffuseHalftoneShape == 1) {
      float distanceToEdge = max(abs(centered.x), abs(centered.y));
      return 1.0 - smoothstep(radius, radius + edge, distanceToEdge);
    }
    return 1.0 - smoothstep(radius, radius + edge, length(centered));
  }

  vec3 applyDiffuseHalftone(vec3 cellColor, vec2 coord, float cellSize) {
    float luminance = dot(clamp(cellColor, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
    float radius = 0.5 * clamp(u_diffuseHalftoneSize, 0.05, 1.0) * sqrt(clamp(luminance, 0.0, 1.0));
    float mask = diffuseShapeMask(diffuseCellFraction(coord, cellSize), radius);
    vec3 patternColor = mix(diffusePatternBackground(cellColor), cellColor, mask);
    float amount = u_diffuseAdaptiveEnabled
      ? diffuseCurveValue(diffuseAdaptiveInput(cellColor), false)
      : 1.0;
    return mix(cellColor, patternColor, amount);
  }

  vec3 applyDiffuseAscii(vec3 cellColor, vec2 coord, float cellSize) {
    float luminance = dot(clamp(cellColor, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
    float glyphIndex = floor(clamp(luminance, 0.0, 1.0) * max(u_diffuseAsciiCount - 1.0, 0.0) + 0.5);
    float column = mod(glyphIndex, max(u_diffuseAsciiColumns, 1.0));
    float row = floor(glyphIndex / max(u_diffuseAsciiColumns, 1.0));
    // The cell fraction is already clamped to [0, 1]. Keeping it unscaled means
    // the glyph fills its own cell even when the adaptive grain or font size
    // changes, so it never bleeds into the neighboring atlas glyph. A nonzero
    // rotation spins the glyph around the cell center before sampling. UV space
    // has a downward Y axis, so the sign of sin is flipped to keep the visual
    // rotation counter-clockwise (readable text at 0°).
    vec2 local = diffuseCellFraction(coord, cellSize) - 0.5;
    if (abs(u_diffuseAsciiRotation) > 0.0001) {
      float cosR = cos(u_diffuseAsciiRotation);
      float sinR = sin(u_diffuseAsciiRotation);
      local = vec2(local.x * cosR + local.y * sinR, -local.x * sinR + local.y * cosR);
    }
    local += 0.5;
    vec2 atlasUv = vec2((column + local.x) / max(u_diffuseAsciiColumns, 1.0), (row + local.y) / max(u_diffuseAsciiRows, 1.0));
    // Canvas text is white in RGB; sampling red keeps the mask visible even
    // on browsers that premultiply the transparent atlas alpha during upload.
    float glyph = texture2D(u_diffuseAsciiAtlas, atlasUv).r;
    vec3 patternColor = mix(diffusePatternBackground(cellColor), cellColor, glyph);
    float amount = u_diffuseAdaptiveEnabled
      ? diffuseCurveValue(diffuseAdaptiveInput(cellColor), false)
      : 1.0;
    return mix(cellColor, patternColor, amount);
  }

  float patternDither8x8(vec2 p) {
    vec2 m = mod(p, 8.0);
    float x = m.x;
    float y = m.y;
    float rank = 0.0;
    if (y < 1.0) {
      if (x < 1.0) rank = 0.0;
      else if (x < 2.0) rank = 48.0;
      else if (x < 3.0) rank = 12.0;
      else if (x < 4.0) rank = 60.0;
      else if (x < 5.0) rank = 3.0;
      else if (x < 6.0) rank = 51.0;
      else if (x < 7.0) rank = 15.0;
      else rank = 63.0;
    } else if (y < 2.0) {
      if (x < 1.0) rank = 32.0;
      else if (x < 2.0) rank = 16.0;
      else if (x < 3.0) rank = 44.0;
      else if (x < 4.0) rank = 28.0;
      else if (x < 5.0) rank = 35.0;
      else if (x < 6.0) rank = 19.0;
      else if (x < 7.0) rank = 47.0;
      else rank = 31.0;
    } else if (y < 3.0) {
      if (x < 1.0) rank = 8.0;
      else if (x < 2.0) rank = 56.0;
      else if (x < 3.0) rank = 4.0;
      else if (x < 4.0) rank = 52.0;
      else if (x < 5.0) rank = 11.0;
      else if (x < 6.0) rank = 59.0;
      else if (x < 7.0) rank = 7.0;
      else rank = 55.0;
    } else if (y < 4.0) {
      if (x < 1.0) rank = 40.0;
      else if (x < 2.0) rank = 24.0;
      else if (x < 3.0) rank = 36.0;
      else if (x < 4.0) rank = 20.0;
      else if (x < 5.0) rank = 43.0;
      else if (x < 6.0) rank = 27.0;
      else if (x < 7.0) rank = 39.0;
      else rank = 23.0;
    } else if (y < 5.0) {
      if (x < 1.0) rank = 2.0;
      else if (x < 2.0) rank = 50.0;
      else if (x < 3.0) rank = 14.0;
      else if (x < 4.0) rank = 62.0;
      else if (x < 5.0) rank = 1.0;
      else if (x < 6.0) rank = 49.0;
      else if (x < 7.0) rank = 13.0;
      else rank = 61.0;
    } else if (y < 6.0) {
      if (x < 1.0) rank = 34.0;
      else if (x < 2.0) rank = 18.0;
      else if (x < 3.0) rank = 46.0;
      else if (x < 4.0) rank = 30.0;
      else if (x < 5.0) rank = 33.0;
      else if (x < 6.0) rank = 17.0;
      else if (x < 7.0) rank = 45.0;
      else rank = 29.0;
    } else if (y < 7.0) {
      if (x < 1.0) rank = 10.0;
      else if (x < 2.0) rank = 58.0;
      else if (x < 3.0) rank = 6.0;
      else if (x < 4.0) rank = 54.0;
      else if (x < 5.0) rank = 9.0;
      else if (x < 6.0) rank = 57.0;
      else if (x < 7.0) rank = 5.0;
      else rank = 53.0;
    } else {
      if (x < 1.0) rank = 42.0;
      else if (x < 2.0) rank = 26.0;
      else if (x < 3.0) rank = 38.0;
      else if (x < 4.0) rank = 22.0;
      else if (x < 5.0) rank = 41.0;
      else if (x < 6.0) rank = 25.0;
      else if (x < 7.0) rank = 37.0;
      else rank = 21.0;
    }
    return (rank + 0.5) / 64.0;
  }

  float ditherCellSize() {
    return max(floor(u_diffuseGrain + 0.5), 1.0);
  }

  vec2 ditherCellIndex(vec2 coord) {
    float size = ditherCellSize();
    return floor(floor(coord) / size);
  }

  vec2 ditherCellCenter(vec2 coord) {
    float size = ditherCellSize();
    return (ditherCellIndex(coord) + 0.5) * size;
  }

  vec3 applyPatternDither(vec3 color, vec2 coord, float paletteT) {
    const float paletteSteps = 16.0;
    vec2 seedOff = floor(vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26));
    vec2 cell = ditherCellIndex(coord) + seedOff;
    float threshold = clamp(patternDither8x8(cell) + (u_diffuseDitherThreshold - 0.5), 0.0, 1.0);
    float scaledT = clamp(paletteT, 0.0, 1.0) * (paletteSteps - 1.0);
    float lower = floor(scaledT);
    float upperMix = step(threshold, fract(scaledT));
    float ditherT = (lower + upperMix) / (paletteSteps - 1.0);
    vec3 paletteColor = texture2D(u_gradientRamp, vec2(clamp(ditherT, 0.0, 1.0), 0.5)).rgb;
    float adaptiveFactor = u_diffuseAdaptiveEnabled
      ? diffuseCurveValue(diffuseAdaptiveInput(color), false)
      : 1.0;
    float amount = clamp(u_diffuseScatter / 100.0, 0.0, 1.0) * adaptiveFactor;
    return mix(color, paletteColor, amount);
  }

  float applyRampRepeatT(float t) {
    float tc = clamp(t, 0.0, 1.0);
    float repeats = clamp(floor(u_rampRepeat + 0.5), 1.0, 20.0);
    if (repeats <= 1.0) return tc;
    if (tc >= 1.0) return 1.0;
    return fract(tc * repeats);
  }

  // 複数スリットの幅オフセットを考慮したスリットインデックスを計算。
  // u_slitDelta** の各 vec4 は (.xy, .zw) の2エントリを保持。slitIdx=-1 は空エントリ。
  // uniform 配列ではなくローカル配列へ写してから引く。32エントリの静的展開は
  // ANGLE/Direct3D での Generator コンパイル時間の大きな割合を占めていた。
  // 戻り値は (スリット index, 左端, 右端)。左端・右端はスリット座標上の帯の境界。
  vec3 computeSlitBand(float warpedCoord, float sw) {
    vec4 deltas[16];
    deltas[0] = u_slitDelta01;
    deltas[1] = u_slitDelta23;
    deltas[2] = u_slitDelta45;
    deltas[3] = u_slitDelta67;
    deltas[4] = u_slitDelta89;
    deltas[5] = u_slitDeltaAB;
    deltas[6] = u_slitDeltaCD;
    deltas[7] = u_slitDeltaEF;
    deltas[8] = u_slitDeltaGH;
    deltas[9] = u_slitDeltaIJ;
    deltas[10] = u_slitDeltaKL;
    deltas[11] = u_slitDeltaMN;
    deltas[12] = u_slitDeltaOP;
    deltas[13] = u_slitDeltaQR;
    deltas[14] = u_slitDeltaST;
    deltas[15] = u_slitDeltaUV;
    float cumDelta = 0.0;
    for (int index = 0; index < 32; index++) {
      vec4 pair = deltas[index / 2];
      vec2 entry = index - (index / 2) * 2 == 0 ? pair.xy : pair.zw;
      if (entry.x <= -9000.0) continue;
      float lb = entry.x * sw + cumDelta;
      float rb = lb + sw + entry.y;
      if (warpedCoord < lb) break;
      if (warpedCoord < rb) return vec3(entry.x, lb, rb);
      cumDelta += entry.y;
    }
    float idx = floor((warpedCoord - cumDelta) / sw);
    float left = idx * sw + cumDelta;
    return vec3(idx, left, left + sw);
  }

  void main() {
    // タイル描画時はオフセットを足して、u_resolution（最終出力）空間の座標として扱う
    vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
    bool usePatternDither = u_diffuseEnabled && u_diffuseMode == 2;
    bool useCellPattern = u_diffuseEnabled && (u_diffuseMode == 3 || u_diffuseMode == 4);
    vec2 ditherCoord = ditherCellCenter(globalCoord);
    // Halftone/ASCII are spatial masks, so sampling at the fixed Dither cell
    // center hides their dots/glyphs. Only ordered Dither uses that snap.
    vec2 sampleCoord = usePatternDither ? ditherCoord : globalCoord;
    // imageUVは画像そのものを固定する。以降に変形されるuvはアンカー配色だけに使う。
    vec2 imageUV = globalCoord / u_resolution;
    vec2 uv = sampleCoord / u_resolution;
    vec2 manualDistortUV = uv;
    vec4 manualDistortSample = vec4(0.5, 0.5, 0.0, 1.0);
    float manualSmoothMask = 0.0;
    vec2 sourceStretchDir = vec2(1.0, 0.0);
    float sourceStretchAmount = 0.0;
    bool rawSourceActive = u_sourceImageEnabled && !u_imageGradientEnabled;

    // The bootstrap program doubles as the Noise-free V2 Generator, where
    // Manual Distort never runs. Its nine-tap smoothing is a large share of
    // the driver compile, so frames that need it use a full Generator variant.
#if !defined(KGG_BOOTSTRAP)
    if (u_manualDistortEnabled && !rawSourceActive) {
      manualDistortSample = texture2D(u_manualDistortMap, vec2(manualDistortUV.x, 1.0 - manualDistortUV.y));
      manualSmoothMask = manualDistortSample.b;
      vec2 distortOffset = (manualDistortSample.rg * 2.0 - 1.0) * u_manualDistortMaxDisplacement;
      uv += distortOffset;
    }
#endif

    // ── Slit scan (新動作: Noise 前) ──────────────────────────────────────────
    // u_slitNoiseAfter=false のとき: スリット UV シフトを先に行い、
    // 各スリット内に一貫したノイズ質感が乗るようにする。
    if (u_slitEnabled && !u_slitNoiseAfter) {
      float sw = max(u_slitWidth, 1.0);
      if (u_slitMode == 3) {
        uv = applyWaveSlitUV(uv, globalCoord, sw);
        sourceStretchDir = vec2(cos(u_slitAngle), sin(u_slitAngle));
        sourceStretchAmount = abs(u_slitWaveHeight) / max(min(u_resolution.x, u_resolution.y), 1.0);
      } else if (u_slitMode == 1 || u_slitMode == 2) {
        vec2 fragC = globalCoord - u_resolution * 0.5;
        float r_px = u_slitMode == 2 ? regularPolygonCoord(fragC) : length(fragC);
        float circCoord = r_px + u_slitParams.x;
        float slitIdx = computeSlitBand(circCoord, sw).x;
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        float delta = sf * u_slitOffset * 3.14159265 + slitIdx * u_slitAngle;
        float cosD = cos(delta); float sinD = sin(delta);
        vec2 uvC = uv - 0.5;
        uv = snapSlitUVToCanvasPixel(0.5 + vec2(uvC.x * cosD - uvC.y * sinD, uvC.x * sinD + uvC.y * cosD));
        sourceStretchDir = vec2(-uvC.y, uvC.x);
        sourceStretchAmount = abs(sf * u_slitOffset);
      } else {
        float cosA = cos(u_slitAngle); float sinA = sin(u_slitAngle);
        float centerProj = dot(u_resolution * 0.5, vec2(cosA, sinA));
        float slitCoord = dot(globalCoord, vec2(cosA, sinA)) - centerProj + u_slitParams.x;
        float warpedCoord = slitCoord + sin(slitCoord / (sw * 4.0) * 6.2832 + u_slitParams.y * 37.4) * u_slitVariance * sw;
        vec3 slitBand = computeSlitBand(warpedCoord, sw);
        float slitIdx = slitBand.x;
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        if (u_slitEdge.x > 0.0 && u_slitEdge.y > 0.5) {
          sf = slitBarShift(slitCoord, slitBand, dot(globalCoord - u_resolution * 0.5, vec2(-sinA, cosA)), abs(sinA) * u_resolution.x + abs(cosA) * u_resolution.y, sw);
        }
        float offA = u_slitAngle + u_slitOffsetAngle + 1.5707963;
        sourceStretchDir = vec2(cos(offA), sin(offA));
        sourceStretchAmount = abs(sf * u_slitOffset);
        uv += snapSlitOffsetToCanvasPixel(sf * u_slitOffset * sourceStretchDir);
      }
    }
    if (!rawSourceActive) {
      uv = applyNoiseUV(uv);
    }
    if (u_diffuseEnabled && (u_diffuseMode <= 1 || u_diffuseMode == 5)) {
      vec2 seedOff = vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26);
      bool isLegacyStipple = u_diffuseMode == 5;
      float cellSize = isLegacyStipple
        ? max(u_diffuseGrain, 0.01)
        : diffuseCellSizeAtCoord(globalCoord, vec3(0.0));
      vec2 disp;
      if (u_diffuseMode == 1) {
        vec2 ci = floor(globalCoord / max(cellSize, 0.01));
        vec2 cf = fract(globalCoord / max(cellSize, 0.01));
        vec2 cf_s = cf * cf * (3.0 - 2.0 * cf);
        vec2 h00 = diffuseHash(ci + seedOff);
        vec2 h10 = diffuseHash(ci + vec2(1.0, 0.0) + seedOff);
        vec2 h01 = diffuseHash(ci + vec2(0.0, 1.0) + seedOff);
        vec2 h11 = diffuseHash(ci + vec2(1.0, 1.0) + seedOff);
        disp = mix(mix(h00, h10, cf_s.x), mix(h01, h11, cf_s.x), cf_s.y);
      } else {
        vec2 cell = floor(globalCoord / max(cellSize, 0.01));
        disp = diffuseHash(cell + seedOff);
      }
      // Mesh color is sampled once in the final color path below. Keep the
      // adaptive displacement finite without evaluating the four-corner field twice.
      vec3 adaptiveColor = u_imageGradientEnabled
        ? texture2D(u_gradientRamp, vec2(clamp(imageGradientT(imageUV), 0.0, 1.0), 0.5)).rgb
        : sampleGradientColor(uv).rgb;
      float adaptiveFactor = !isLegacyStipple && u_diffuseAdaptiveEnabled
        ? diffuseCurveValue(diffuseAdaptiveInput(adaptiveColor), false)
        : 1.0;
      uv += disp * clamp(u_diffuseScatter, 0.0, 300.0) * adaptiveFactor / u_resolution;
    }
    // ── Slit scan (旧動作: Noise 後) ──────────────────────────────────────────
    // u_slitNoiseAfter=true のとき: 従来どおりノイズ・Diffuse 適用後にスリットを行う。
    if (u_slitEnabled && u_slitNoiseAfter) {
      float sw = max(u_slitWidth, 1.0);
      if (u_slitMode == 3) {
        uv = applyWaveSlitUV(uv, globalCoord, sw);
        sourceStretchDir = vec2(cos(u_slitAngle), sin(u_slitAngle));
        sourceStretchAmount = abs(u_slitWaveHeight) / max(min(u_resolution.x, u_resolution.y), 1.0);
      } else if (u_slitMode == 1 || u_slitMode == 2) {
        vec2 fragC = globalCoord - u_resolution * 0.5;
        float r_px = u_slitMode == 2 ? regularPolygonCoord(fragC) : length(fragC);
        float circCoord = r_px + u_slitParams.x;
        float slitIdx = computeSlitBand(circCoord, sw).x;
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        float delta = sf * u_slitOffset * 3.14159265 + slitIdx * u_slitAngle;
        float cosD = cos(delta); float sinD = sin(delta);
        vec2 uvC = uv - 0.5;
        uv = snapSlitUVToCanvasPixel(0.5 + vec2(uvC.x * cosD - uvC.y * sinD, uvC.x * sinD + uvC.y * cosD));
        sourceStretchDir = vec2(-uvC.y, uvC.x);
        sourceStretchAmount = abs(sf * u_slitOffset);
      } else {
        float cosA = cos(u_slitAngle); float sinA = sin(u_slitAngle);
        float centerProj = dot(u_resolution * 0.5, vec2(cosA, sinA));
        float slitCoord = dot(globalCoord, vec2(cosA, sinA)) - centerProj + u_slitParams.x;
        float warpedCoord = slitCoord + sin(slitCoord / (sw * 4.0) * 6.2832 + u_slitParams.y * 37.4) * u_slitVariance * sw;
        vec3 slitBand = computeSlitBand(warpedCoord, sw);
        float slitIdx = slitBand.x;
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        if (u_slitEdge.x > 0.0 && u_slitEdge.y > 0.5) {
          sf = slitBarShift(slitCoord, slitBand, dot(globalCoord - u_resolution * 0.5, vec2(-sinA, cosA)), abs(sinA) * u_resolution.x + abs(cosA) * u_resolution.y, sw);
        }
        float offA = u_slitAngle + u_slitOffsetAngle + 1.5707963;
        sourceStretchDir = vec2(cos(offA), sin(offA));
        sourceStretchAmount = abs(sf * u_slitOffset);
        uv += snapSlitOffsetToCanvasPixel(sf * u_slitOffset * sourceStretchDir);
      }
    }

    if (rawSourceActive) {
      vec4 sourceColor = sampleSourceImageRaw(uv);
      if (usePatternDither) {
        float sourcePaletteT = dot(clamp(sourceColor.rgb, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
        sourceColor.rgb = applyPatternDither(sourceColor.rgb, globalCoord, sourcePaletteT);
      } else if (useCellPattern) {
        float cellSize = diffuseCellSizeAtCoord(globalCoord, sourceColor.rgb);
        sourceColor.rgb = u_diffuseMode == 3
          ? applyDiffuseHalftone(sourceColor.rgb, globalCoord, cellSize)
          : applyDiffuseAscii(sourceColor.rgb, globalCoord, cellSize);
        sourceColor.a = 1.0;
      }
      gl_FragColor = applyImageMask(sourceColor, globalCoord);
      return;
    }

    bool meshGradient = u_gradientType == 6;
    float sourceAlpha = u_imageGradientEnabled ? sampleImageGradient(imageUV).a : 1.0;
    float t = u_imageGradientEnabled
      ? mix(imageGradientT(imageUV), computeGradientT(uv), u_imageGradientAnchorInfluence)
      : computeGradientT(uv);
#if !defined(KGG_BOOTSTRAP)
    if (u_manualDistortEnabled && !u_imageGradientEnabled && !meshGradient) {
      float smoothPasses = manualSmoothMask * 8.0;
      if (smoothPasses > 0.001) {
        vec2 px = (u_manualDistortSmoothRadius * (1.0 + smoothPasses * 0.08)) / u_resolution;
        float avgT = 0.0;
        avgT += computeGradientT(uv + vec2(-px.x, -px.y));
        avgT += computeGradientT(uv + vec2( 0.0,  -px.y));
        avgT += computeGradientT(uv + vec2( px.x, -px.y));
        avgT += computeGradientT(uv + vec2(-px.x,  0.0));
        avgT += t;
        avgT += computeGradientT(uv + vec2( px.x,  0.0));
        avgT += computeGradientT(uv + vec2(-px.x,  px.y));
        avgT += computeGradientT(uv + vec2( 0.0,   px.y));
        avgT += computeGradientT(uv + vec2( px.x,  px.y));
        avgT /= 9.0;
        float mixAmt = clamp(1.0 - pow(max(1.0 - u_manualDistortSmoothStrength, 0.001), smoothPasses), 0.0, 1.0);
        t = mix(t, avgT, mixAmt);
      }
    }
#endif
    float rampT = applyRampRepeatT(t);
    vec4 rampColor;
    if (meshGradient) {
      vec4 meshColor = sampleMeshGradient(uv);
#if !defined(KGG_BOOTSTRAP)
      if (u_manualDistortEnabled && !u_imageGradientEnabled) {
        float smoothPasses = manualSmoothMask * 8.0;
        if (smoothPasses > 0.001) {
          vec2 px = (u_manualDistortSmoothRadius * (1.0 + smoothPasses * 0.08)) / u_resolution;
          vec4 averageColor = vec4(0.0);
          averageColor += sampleMeshGradient(uv + vec2(-px.x, -px.y));
          averageColor += sampleMeshGradient(uv + vec2( 0.0,  -px.y));
          averageColor += sampleMeshGradient(uv + vec2( px.x, -px.y));
          averageColor += sampleMeshGradient(uv + vec2(-px.x,  0.0));
          averageColor += meshColor;
          averageColor += sampleMeshGradient(uv + vec2( px.x,  0.0));
          averageColor += sampleMeshGradient(uv + vec2(-px.x,  px.y));
          averageColor += sampleMeshGradient(uv + vec2( 0.0,   px.y));
          averageColor += sampleMeshGradient(uv + vec2( px.x,  px.y));
          averageColor /= 9.0;
          float mixAmount = clamp(1.0 - pow(max(1.0 - u_manualDistortSmoothStrength, 0.001), smoothPasses), 0.0, 1.0);
          meshColor = mix(meshColor, averageColor, mixAmount);
        }
      }
#endif
      if (u_imageGradientEnabled) {
        vec4 imageGradientColor = texture2D(u_gradientRamp, vec2(applyRampRepeatT(imageGradientT(imageUV)), 0.5));
        rampColor = mix(imageGradientColor, meshColor, clamp(u_imageGradientAnchorInfluence, 0.0, 1.0));
      } else {
        rampColor = meshColor;
      }
    } else {
      rampColor = texture2D(u_gradientRamp, vec2(rampT, 0.5));
    }
    vec3 color = rampColor.rgb;
    float rampAlpha = rampColor.a;
    if (usePatternDither) {
      float paletteT = meshGradient
        ? dot(clamp(color, 0.0, 1.0), vec3(0.299, 0.587, 0.114))
        : rampT;
      color = applyPatternDither(color, globalCoord, paletteT);
    } else if (useCellPattern) {
      float cellSize = diffuseCellSizeAtCoord(globalCoord, color);
      color = u_diffuseMode == 3
        ? applyDiffuseHalftone(color, globalCoord, cellSize)
        : applyDiffuseAscii(color, globalCoord, cellSize);
    }

    gl_FragColor = vec4(color, useCellPattern ? 1.0 : rampAlpha * sourceAlpha);
    gl_FragColor = applyImageMask(gl_FragColor, globalCoord);
  }
