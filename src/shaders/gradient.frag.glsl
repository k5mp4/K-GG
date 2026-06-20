
  uniform int u_gradientType; // 0=linear, 1=radial, 2=fourcolor, 3=diamond, 4=angle, 5=bezier
  uniform vec2 u_gradAnchor0;
  uniform vec2 u_gradAnchor1;
  uniform vec2 u_gradAnchor2;
  uniform vec2 u_gradAnchor3;
  uniform vec2 u_gradBezierCp0;
  uniform vec2 u_gradBezierCp1;
  uniform vec2 u_gradDir; // 正規化グラデーション方向（ベジェワープ・Radon用）

  uniform bool u_noiseEnabled;
  uniform int u_noiseType;
  uniform float u_noiseAmount;
  uniform float u_noiseScale;
  uniform int u_noiseOctaves;
  uniform float u_noiseEvolution;
  uniform int u_curlSteps;
  uniform float u_curlSpeed;
  uniform float u_curlEps;
  uniform float u_curlSeed;

  uniform bool u_diffuseEnabled;
  uniform int  u_diffuseMode;
  uniform float u_diffuseScatter;
  uniform float u_diffuseGrain;
  uniform float u_diffuseSeed;
  uniform float u_diffuseDitherThreshold;

  uniform bool u_bezierEnabled;
  uniform sampler2D u_bezierDistanceMap;
  uniform float u_bezierStrength;
  uniform float u_bezierRadius;
  uniform float u_curvatureInfluence;
  uniform int u_curvatureMode;  // 0=wide(高曲率→色幅広), 1=narrow(高曲率→色幅狭)
  uniform int u_bezierSide;     // 0=both, 1=outer(bezierT>=0.5), 2=inner(bezierT<0.5)
  uniform int u_bezierBoundary;

  uniform sampler2D u_gradientRamp;
  uniform float u_rampRepeat;
  uniform bool u_sourceImageEnabled;
  uniform sampler2D u_sourceImage;
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

  uniform bool u_radonEnabled;
  uniform float u_radonStrength;
  uniform float u_radonFreq;
  uniform float u_radonRadius;
  uniform float u_radonAngle;
  uniform float u_radonBlur;
  uniform float u_radonEvolution;
  uniform float u_radonSpeed;

  // Fluid Warp
  uniform bool u_iridEnabled;
  uniform float u_iridAngle;
  uniform float u_iridSpeed;
  uniform float u_iridFreq;
  uniform float u_iridBezierStrength;
  uniform float u_iridStrength;

  // Manual Distort
  uniform bool u_manualDistortEnabled;
  uniform sampler2D u_manualDistortMap;
  uniform float u_manualDistortMaxDisplacement;
  uniform float u_manualDistortSmoothStrength;
  uniform float u_manualDistortSmoothRadius;

  // Matcap
  uniform bool u_matcapEnabled;

  // タイルレンダリング用: タイル単位で描画する際、gl_FragCoord に加算して
  // u_resolution（最終出力サイズ）空間でのグローバル座標を得る。
  // 通常レンダリングでは vec2(0.0) でデフォルト動作。
  uniform vec2 u_tileOffset;
  uniform vec2 u_tileSize;

  float computeBezierRampT(vec2 sampleUV, bool applySideMask) {
    vec4 sdfSample = texture2D(u_bezierDistanceMap, vec2(sampleUV.x, 1.0 - sampleUV.y));
    float bezierT   = sdfSample.r;
    float curvature = sdfSample.g;
    float amplifiedBezierT;
    if (u_curvatureMode == 0) {
      float effectiveRadius = u_bezierRadius * (curvature * u_curvatureInfluence * 5.0 + (1.0 - u_curvatureInfluence));
      amplifiedBezierT = clamp((bezierT - 0.5) / max(effectiveRadius, 0.001) + 0.5, 0.0, 1.0);
    } else {
      float scaledBezierT = (bezierT - 0.5) / max(u_bezierRadius, 0.01) + 0.5;
      amplifiedBezierT = clamp(0.5 + (scaledBezierT - 0.5) * (1.0 + curvature * u_curvatureInfluence * 5.0), 0.0, 1.0);
    }
    if (applySideMask) {
      vec2 gradDir = u_gradDir;
      float baseLinearT = dot(sampleUV - 0.5, gradDir) + 0.5;
      if (u_bezierSide == 1 && bezierT < 0.5)  amplifiedBezierT = baseLinearT;
      else if (u_bezierSide == 2 && bezierT >= 0.5) amplifiedBezierT = baseLinearT;
    }
    return amplifiedBezierT;
  }

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
    } else {
      // Bezier: A/Bアンカー間の三次ベジェ曲線をグラデーション軸として使う
      return computeBezierGradientBase(uv);
    }
  }

  float computeGradientT(vec2 sampleUV) {
    float t;
    if (u_bezierEnabled && u_gradientType != 5) {
      float amplifiedBezierT = computeBezierRampT(sampleUV, true);
      vec2 gradDir = u_gradDir;
      float baseLinearT = dot(sampleUV - 0.5, gradDir) + 0.5;
      vec2 warpedUV = sampleUV + (amplifiedBezierT - baseLinearT) * u_bezierStrength * gradDir;
      t = computeGradientBase(warpedUV);
    } else {
      t = computeGradientBase(sampleUV);
    }
    if (u_bezierBoundary == 1) {
      if (u_bezierEnabled || u_gradientType == 5) { t = fract(abs(t - 0.5) * 4.0); } else { t = fract(t * 2.0); }
    } else if (u_bezierBoundary == 2) {
      t = abs(t * 2.0 - 1.0);
    } else {
      t = clamp(t, 0.0, 1.0);
    }
    return t;
  }

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

  vec2 applyNoiseUV(vec2 uv) {
    if (!u_noiseEnabled) return uv;
    float evo = u_noiseEvolution + u_time;
    if (u_noiseType == 3) {
      vec2 current = applyCurlNoiseUV(uv, evo, u_time * u_curlSpeed);
      float blend = loopBlendWeight();
      if (blend <= 0.0001) return current;
      vec2 wrapped = applyCurlNoiseUV(uv, evo - u_noiseLoopPeriod, (u_time - u_noiseLoopPeriod) * u_curlSpeed);
      return mix(current, wrapped, blend);
    } else {
      vec2 offset = noiseDisplace(uv, u_noiseScale, evo, u_noiseType, u_noiseOctaves);
      return uv + offset * u_noiseAmount;
    }
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

  vec4 applyImageMask(vec4 color, vec2 globalCoord) {
    if (!u_imageMaskEnabled) return color;
    vec2 maskUv = clamp(globalCoord / u_resolution, 0.0, 1.0);
    float maskAlpha = texture2D(u_imageMask, vec2(maskUv.x, 1.0 - maskUv.y)).a;
    return vec4(color.rgb, color.a * maskAlpha);
  }

  float diffuseHash01(vec2 p) {
    return diffuseHash(p).x * 0.5 + 0.5;
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
    float amount = clamp(u_diffuseScatter / 100.0, 0.0, 1.0);
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
  // ループ変数での uniform 配列インデックスを避けた、静的展開版。
  float computeSlitIdx(float warpedCoord, float sw) {
    float cumDelta = 0.0;
    float done = 0.0;   // 0.0=未確定, 1.0=確定済み
    float result = 0.0;
    float si = 0.0; float de = 0.0; float lb = 0.0; float rb = 0.0;

    si = u_slitDelta01.x; de = u_slitDelta01.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta01.z; de = u_slitDelta01.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta23.x; de = u_slitDelta23.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta23.z; de = u_slitDelta23.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta45.x; de = u_slitDelta45.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta45.z; de = u_slitDelta45.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta67.x; de = u_slitDelta67.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta67.z; de = u_slitDelta67.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta89.x; de = u_slitDelta89.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDelta89.z; de = u_slitDelta89.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaAB.x; de = u_slitDeltaAB.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaAB.z; de = u_slitDeltaAB.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaCD.x; de = u_slitDeltaCD.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaCD.z; de = u_slitDeltaCD.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaEF.x; de = u_slitDeltaEF.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaEF.z; de = u_slitDeltaEF.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaGH.x; de = u_slitDeltaGH.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaGH.z; de = u_slitDeltaGH.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaIJ.x; de = u_slitDeltaIJ.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaIJ.z; de = u_slitDeltaIJ.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaKL.x; de = u_slitDeltaKL.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaKL.z; de = u_slitDeltaKL.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaMN.x; de = u_slitDeltaMN.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaMN.z; de = u_slitDeltaMN.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaOP.x; de = u_slitDeltaOP.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaOP.z; de = u_slitDeltaOP.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaQR.x; de = u_slitDeltaQR.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaQR.z; de = u_slitDeltaQR.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaST.x; de = u_slitDeltaST.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaST.z; de = u_slitDeltaST.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaUV.x; de = u_slitDeltaUV.y;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }
    si = u_slitDeltaUV.z; de = u_slitDeltaUV.w;
    if (done < 0.5 && si > -9000.0) { lb = si * sw + cumDelta; rb = lb + sw + de; if (warpedCoord < lb) { result = floor((warpedCoord - cumDelta) / sw); done = 1.0; } else if (warpedCoord < rb) { result = si; done = 1.0; } else { cumDelta += de; } }

    if (done < 0.5) { result = floor((warpedCoord - cumDelta) / sw); }
    return result;
  }

  void main() {
    // タイル描画時はオフセットを足して、u_resolution（最終出力）空間の座標として扱う
    vec2 globalCoord = gl_FragCoord.xy + u_tileOffset;
    bool usePatternDither = u_diffuseEnabled && u_diffuseMode == 2;
    vec2 ditherCoord = ditherCellCenter(globalCoord);
    vec2 sampleCoord = usePatternDither ? ditherCoord : globalCoord;
    vec2 uv = sampleCoord / u_resolution;
    vec2 manualDistortUV = uv;
    vec4 manualDistortSample = vec4(0.5, 0.5, 0.0, 1.0);
    float manualSmoothMask = 0.0;
    vec2 sourceStretchDir = vec2(1.0, 0.0);
    float sourceStretchAmount = 0.0;

    if (u_manualDistortEnabled && !u_sourceImageEnabled) {
      manualDistortSample = texture2D(u_manualDistortMap, vec2(manualDistortUV.x, 1.0 - manualDistortUV.y));
      manualSmoothMask = manualDistortSample.b;
      vec2 distortOffset = (manualDistortSample.rg * 2.0 - 1.0) * u_manualDistortMaxDisplacement;
      uv += distortOffset;
    }

    // Fluid Warp UV Warp (Early) - 画像全体を歪ませる
    if (u_iridEnabled && !u_sourceImageEnabled) {
      float iTime = u_time * 0.1 * u_iridSpeed;
      
      // ベジェ軸からの距離を取得
      vec4 sdfSample = texture2D(u_bezierDistanceMap, vec2(uv.x, 1.0 - uv.y));
      float dist = abs(sdfSample.r - 0.5) * 2.0;
      
      vec2 flowDir = vec2(cos(u_iridAngle), sin(u_iridAngle));
      float f = fbm(uv * u_iridFreq + flowDir * iTime, 3);
      
      // 油膜のような流動的な歪み + ベジェ軸周辺でのブースト
      float warpAmt = 0.15 * u_iridStrength;
      warpAmt += (1.0 - smoothstep(0.0, 0.5, dist)) * 0.3 * u_iridBezierStrength;
      
      uv += vec2(cos(f * 6.28), sin(f * 6.28)) * warpAmt;
    }

    if (u_radonEnabled && !u_sourceImageEnabled) {
      float rEvo = u_radonEvolution + u_time * u_radonSpeed;
      float rTheta = uv.x * u_radonFreq * 3.14159265 + u_radonAngle + rEvo;
      float rT = (uv.y - 0.5) * u_radonRadius;
      uv = mix(uv, vec2(0.5) + rT * vec2(cos(rTheta), sin(rTheta)), u_radonStrength);
    }
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
        float slitIdx = computeSlitIdx(circCoord, sw);
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
        float slitIdx = computeSlitIdx(warpedCoord, sw);
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        float offA = u_slitAngle + u_slitOffsetAngle + 1.5707963;
        sourceStretchDir = vec2(cos(offA), sin(offA));
        sourceStretchAmount = abs(sf * u_slitOffset);
        uv += snapSlitOffsetToCanvasPixel(sf * u_slitOffset * sourceStretchDir);
      }
    }
    if (!u_sourceImageEnabled) {
      uv = applyNoiseUV(uv);
    }
    if (u_diffuseEnabled && u_diffuseMode != 2) {
      vec2 seedOff = vec2(u_diffuseSeed * 31.41, u_diffuseSeed * 59.26);
      vec2 disp;
      if (u_diffuseMode == 1) {
        vec2 ci = floor(globalCoord / max(u_diffuseGrain, 0.01));
        vec2 cf = fract(globalCoord / max(u_diffuseGrain, 0.01));
        vec2 cf_s = cf * cf * (3.0 - 2.0 * cf);
        vec2 h00 = diffuseHash(ci + seedOff);
        vec2 h10 = diffuseHash(ci + vec2(1.0, 0.0) + seedOff);
        vec2 h01 = diffuseHash(ci + vec2(0.0, 1.0) + seedOff);
        vec2 h11 = diffuseHash(ci + vec2(1.0, 1.0) + seedOff);
        disp = mix(mix(h00, h10, cf_s.x), mix(h01, h11, cf_s.x), cf_s.y);
      } else {
        vec2 cell = floor(globalCoord / max(u_diffuseGrain, 0.01));
        disp = diffuseHash(cell + seedOff);
      }
      uv += disp * u_diffuseScatter / u_resolution;
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
        float slitIdx = computeSlitIdx(circCoord, sw);
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
        float slitIdx = computeSlitIdx(warpedCoord, sw);
        float h = slitHash(slitIdx + u_slitParams.y * 91.7);
        float sf = u_slitAnimEnabled ? (u_slitAnimMode == 1 ? sin((h + u_slitAnimTime) * 6.28318530718) : fract(h + u_slitAnimTime) * 2.0 - 1.0) : (h * 2.0 - 1.0);
        float offA = u_slitAngle + u_slitOffsetAngle + 1.5707963;
        sourceStretchDir = vec2(cos(offA), sin(offA));
        sourceStretchAmount = abs(sf * u_slitOffset);
        uv += snapSlitOffsetToCanvasPixel(sf * u_slitOffset * sourceStretchDir);
      }
    }

    if (u_sourceImageEnabled) {
      vec4 sourceColor = sampleSourceImageRaw(uv);
      if (usePatternDither) {
        float sourcePaletteT = dot(clamp(sourceColor.rgb, 0.0, 1.0), vec3(0.299, 0.587, 0.114));
        sourceColor.rgb = applyPatternDither(sourceColor.rgb, globalCoord, sourcePaletteT);
      }
      gl_FragColor = applyImageMask(sourceColor, globalCoord);
      return;
    }

    float t = computeGradientT(uv);
    if (u_manualDistortEnabled) {
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
    float rampT = applyRampRepeatT(t);
    vec4 rampColor = texture2D(u_gradientRamp, vec2(rampT, 0.5));
    vec3 color = rampColor.rgb;
    float rampAlpha = rampColor.a;
    if (u_radonEnabled) {
      float radonEvo = u_radonEvolution + u_time * u_radonSpeed;
      vec2 rv = globalCoord / u_resolution;
      float radonTheta = rv.x * u_radonFreq * 3.14159265 + u_radonAngle + radonEvo;
      float radonT = (rv.y - 0.5) * u_radonRadius;
      vec2 perpDir = vec2(cos(radonTheta), sin(radonTheta));
      vec2 lineDir = vec2(-sin(radonTheta), cos(radonTheta));
      vec2 foot = vec2(0.5) + radonT * perpDir;
      vec2 gradDir = u_gradDir;
      vec4 lineColor = vec4(0.0);
      float nS = 16.0;
      for (int ri = 0; ri < 16; ri++) {
        float rs = (float(ri) / (nS - 1.0) - 0.5) * u_radonBlur;
        vec2 sp = foot + rs * lineDir;
        float gt = applyRampRepeatT(dot(sp - 0.5, gradDir) + 0.5);
        vec4 sc = texture2D(u_gradientRamp, vec2(gt, 0.5));
        lineColor += sc;
      }
      lineColor /= nS;
      color = mix(color, lineColor.rgb, u_radonStrength);
      rampAlpha = mix(rampAlpha, lineColor.a, u_radonStrength);
    }
    if (usePatternDither) {
      color = applyPatternDither(color, globalCoord, rampT);
    }

    gl_FragColor = vec4(color, rampAlpha);

    // Matcap: 円形アルファマスク
    if (u_matcapEnabled) {
      vec2 centered = globalCoord / u_resolution * 2.0 - 1.0;
      float dist = length(centered);
      float alpha = 1.0 - smoothstep(0.97, 1.0, dist);
      gl_FragColor = vec4(gl_FragColor.rgb * alpha, gl_FragColor.a * alpha);
    }
    gl_FragColor = applyImageMask(gl_FragColor, globalCoord);
  }
