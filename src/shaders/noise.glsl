
  precision mediump float;

  uniform float u_time;
  uniform float u_noiseLoopPeriod;
  uniform int u_noiseLoopMode;
  uniform float u_noiseLoopBlend;
  uniform vec2 u_animDir;
  uniform vec2 u_resolution;
  uniform float u_dwInitVal;
  uniform float u_dwInitAmp;
  uniform float u_dwRotAngle1;
  uniform float u_dwRotAngle2;
  uniform float u_dwDist1;
  uniform float u_dwDist2;
  uniform float u_dwDist3;
  uniform float u_dwDriftAngle;
  uniform int u_noiseSeamlessType;
  uniform int u_seamlessAnimation; 
  uniform float u_seamlessTwist;

  uniform int u_voronoiDistMetric;
  uniform float u_voronoiRandomness;
  uniform int u_voronoiFeature;
  uniform float u_voronoiMinkowskiExp;

  uniform float u_noiseSeed;       // 汎用シード (curl 以外)
  uniform float u_noiseSpeed;      // Causticsの時間進行速度
  uniform int u_curlSteps;
  uniform float u_curlSpeed;
  uniform float u_curlEps;
  uniform float u_curlSeed;

  uniform float u_ridgeSharpness;
  uniform float u_ridgeGain;
  uniform float u_ridgeLacunarity;
  uniform float u_ridgePersistence;
  uniform float u_ridgeOffset;
  uniform float u_ridgeWarp;

  // Perlin 3D パラメータ
  uniform float u_perlinRoughness;   // 主レイヤーのオクターブ振幅倍率 (小→なめらか, 大→細い線が増える)
  uniform float u_perlinSharpness;   // Tonality相当のカーブ強度 (大→暗部が広く線が細い)
  uniform float u_perlinLayerMix;    // 2枚目レイヤーのLighten不透明度
  uniform float u_perlinAngle;       // UVを押し出す方向 (度)
  uniform int   u_perlinDimension;   // 0=3D (XY+時間Z), 1=4D Loop (XY+時間を円周ZW)
  uniform float u_perlinLoopWobble;  // 4D Loop軌道のうねり量 (0=真円)

  // AE Fractal Noise パラメータ
  uniform int   u_aeFractalType;     // 0=Basic, 1=Turbulent
  uniform float u_aeSubInfluence;    // persistence per octave
  uniform float u_aeSubScaling;      // frequency multiplier per octave
  uniform float u_aeSubRotation;     // rotation per octave (radians)
  uniform float u_aeContrast;        // output contrast
  uniform float u_aeBrightness;      // output brightness shift

  uniform float u_causticsDepth;
  uniform float u_causticsRefraction;
  uniform float u_causticsSharpness;
  uniform int u_causticsComplexity;
  uniform float u_causticsWaveSpread;
  uniform float u_causticsBoundaryWidth;

  uniform float u_phasorFrequency;
  uniform float u_phasorBandwidth;
  uniform float u_phasorDirection;
  uniform float u_phasorDirectionSpread;
  uniform float u_phasorSharpness;
  uniform float u_phasorWarpStrength;
  uniform float u_phasorTangentMix;
  uniform float u_phasorKernelDensity;
  uniform int u_phasorDirectionMode;

  const float KG_TAU = 6.28318530718;

  vec2 noiseAnimDir() {
    float len = length(u_animDir);
    return len > 0.0001 ? u_animDir / len : vec2(0.0, -1.0);
  }

  float loopPhase() {
    return fract(u_time / max(u_noiseLoopPeriod, 0.0001));
  }

  float loopBlendWeight() {
    if (u_noiseLoopMode != 1) return 0.0;
    float blendWidth = clamp(u_noiseLoopBlend, 0.001, 1.0);
    float x = clamp((loopPhase() - (1.0 - blendWidth)) / blendWidth, 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
  }

  vec2 linearDrift(vec2 dir, float evolution, float speed) {
    vec2 d = length(dir) > 0.0001 ? normalize(dir) : vec2(0.0, -1.0);
    return d * evolution * speed;
  }

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  vec2 diffuseHash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
  }

// KGG_BOOTSTRAP_NOISE_BEGIN
#if !defined(KGG_BOOTSTRAP)

  float simplex2D(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = fract(((i.y + vec3(0.0, i1.y, 1.0)) * 34.0 + 1.0)
                 * fract((i.x + vec3(0.0, i1.x, 1.0)) * 34.0 + 1.0) / 289.0) * 289.0;
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m * m * m;
    vec3 x  = 2.0 * fract(p * C.www) - 1.0;
    vec3 h  = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x   + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // Rotating-gradient simplex noise with analytic derivatives. The returned
  // value is (noise, d/dx, d/dy); rotating the lattice gradients by alpha
  // makes the field exactly periodic in time without sampling a second field.
  vec3 psrdnoise2D(vec2 v, float alpha) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = fract(((i.y + vec3(0.0, i1.y, 1.0)) * 34.0 + 1.0)
                 * fract((i.x + vec3(0.0, i1.x, 1.0)) * 34.0 + 1.0) / 289.0) * 289.0;
    vec3 attenuation = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 gx = x - ox;
    vec3 gy = h;
    vec3 normalization = 1.79284291400159 - 0.85373472095314 * (gx * gx + gy * gy);
    gx *= normalization;
    gy *= normalization;

    float c = cos(alpha);
    float s = sin(alpha);
    vec2 g0 = vec2(gx.x * c - gy.x * s, gx.x * s + gy.x * c);
    vec2 g1 = vec2(gx.y * c - gy.y * s, gx.y * s + gy.y * c);
    vec2 g2 = vec2(gx.z * c - gy.z * s, gx.z * s + gy.z * c);
    vec3 gradients = vec3(dot(g0, x0), dot(g1, x12.xy), dot(g2, x12.zw));
    vec3 attenuation2 = attenuation * attenuation;
    vec3 attenuation3 = attenuation2 * attenuation;
    vec3 attenuation4 = attenuation2 * attenuation2;
    float value = 130.0 * dot(attenuation4, gradients);
    vec2 derivative = 130.0 * (
      attenuation4.x * g0 - 8.0 * attenuation3.x * x0 * gradients.x +
      attenuation4.y * g1 - 8.0 * attenuation3.y * x12.xy * gradients.y +
      attenuation4.z * g2 - 8.0 * attenuation3.z * x12.zw * gradients.z
    );
    return vec3(value, derivative);
  }

  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * simplex2D(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  float randDW(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  float valueNoiseDW(vec2 p) {
    vec2 ip = floor(p);
    vec2 u  = fract(p);
    u = u * u * (3.0 - 2.0 * u);
    return mix(
      mix(randDW(ip), randDW(ip + vec2(1.0, 0.0)), u.x),
      mix(randDW(ip + vec2(0.0, 1.0)), randDW(ip + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbmDW(vec2 p, int octaves, mat2 rot) {
    float f = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      f += amp * valueNoiseDW(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return f;
  }

  float voronoiScalar(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float f1 = 8.0, f2 = 8.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 nb = vec2(float(i), float(j));
        vec2 rp = hash2(ip + nb) * 0.5 + 0.5;
        rp = mix(vec2(0.5), rp, u_voronoiRandomness);
        vec2 diff = nb + rp - fp;
        float d;
        if (u_voronoiDistMetric == 1) {
          d = abs(diff.x) + abs(diff.y);
        } else if (u_voronoiDistMetric == 2) {
          d = max(abs(diff.x), abs(diff.y));
        } else if (u_voronoiDistMetric == 3) {
          float ex = max(u_voronoiMinkowskiExp, 0.5);
          d = pow(pow(abs(diff.x), ex) + pow(abs(diff.y), ex), 1.0 / ex);
        } else {
          d = length(diff);
        }
        if (d < f1) { f2 = f1; f1 = d; }
        else if (d < f2) { f2 = d; }
      }
    }
    float val;
    if (u_voronoiFeature == 1) { val = f2; }
    else if (u_voronoiFeature == 2) { val = f2 - f1; }
    else { val = f1; }
    if (u_voronoiDistMetric == 1) { val /= 1.5; }
    else if (u_voronoiDistMetric == 2) { val /= 0.5; }
    else { val /= 0.7; }
    return clamp(val, 0.0, 1.0);
  }

  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute4(vec4 x) { return mod289v4(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt4(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float simplex3D(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289v3(i);
    vec4 p = permute4(permute4(permute4(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x4 = x_ * ns.x + ns.yyyy;
    vec4 y4 = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x4) - abs(y4);
    vec4 b0 = vec4(x4.xy, y4.xy);
    vec4 b1 = vec4(x4.zw, y4.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt4(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Ridged Multi-Fractal Noise (Musgrave 1994, 修正版)
  //   octaves:     レイヤー数 — 多いほど細かいディテールが追加される
  //   sharpness:   稜線の鋭さ — 大きいほど細く明るい線に
  //   offset:      稜線の出現幅 — 1.0=標準, 大→太く淡い, 小→消える
  //   lacunarity:  周波数倍率 — 1.5→重畳して複雑, 2.0=標準, 3.0→各層が独立
  //   persistence: 振幅倍率  — 0.7→高周波が強く複雑, 0.5=標準, 0.3→低周波のみ
  //   gain:        カスケード — 0=なし(全オクターブ均等), 1=輝線が次層を強調(Musgrave式)
  float ridgedFbm(vec2 p, int octaves) {
    float sharpness   = max(u_ridgeSharpness, 0.1);
    float cascadeGain = clamp(u_ridgeGain, 0.0, 1.0);
    float lacunarity  = max(u_ridgeLacunarity, 1.1);
    float persistence = clamp(u_ridgePersistence, 0.1, 1.0);
    float offset      = max(u_ridgeOffset, 0.01);

    // Domain warp 前処理: simplex格子の六角形規則性を破壊してランダム性を付加
    // 低周波の2層fbmで座標を歪める → 計算コスト小, ランダム性大
    float warpAmt = clamp(u_ridgeWarp, 0.0, 4.0);
    if (warpAmt > 0.001) {
      vec2 wp = p * 0.7;
      float wx = simplex2D(wp + vec2(1.7, 9.2)) * 0.6
               + simplex2D(wp * 2.1 + vec2(3.4, 7.6)) * 0.4;
      float wy = simplex2D(wp + vec2(5.2, 1.3)) * 0.6
               + simplex2D(wp * 2.1 + vec2(8.3, 4.6)) * 0.4;
      p += vec2(wx, wy) * warpAmt;
    }

    float value     = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float weight    = 1.0;  // cascade multiplier: gain=0 → 常に1.0 (抑制なし)
    float totalAmp  = 0.0;  // 振幅の総和 (正規化用)

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      totalAmp += amplitude;

      float n = simplex2D(p * frequency);
      // ゼロ交差点を輝かせるリッジ生成, [0,1] に正規化
      n = clamp(offset - abs(n), 0.0, offset) / offset;
      n = pow(n, sharpness);  // 稜線を鋭く

      value += weight * n * amplitude;

      // gain=0 → weight=1 (カスケードなし, octavesがそのまま効く)
      // gain=1 → weight=n  (輝線付近は次オクターブを強調, 暗部は抑制)
      weight = mix(1.0, n, cascadeGain);

      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / max(totalAmp, 0.001);
  }

  // AE Fractal Noise 近似実装
  //   AEの特徴: 各オクターブに個別の回転(SubRotation)を累積適用することで
  //   規則的なグリッドを崩し、有機的なノイズを生成する
  //   Basic:     標準 fbm (正負のノイズを加算 → 滑らかな雲状)
  //   Turbulent: abs() で全値を正にする → 流れるような輝線・波紋
  float aeFractalNoise(vec2 p, int octaves) {
    float influence  = clamp(u_aeSubInfluence, 0.01, 1.0);
    float scaling    = max(u_aeSubScaling, 1.01);
    float subRot     = u_aeSubRotation;             // ラジアン/オクターブ
    float contrast   = max(u_aeContrast, 0.01);
    float brightness = u_aeBrightness;
    bool  turbulent  = (u_aeFractalType == 1);

    float cs = cos(subRot);
    float sn = sin(subRot);
    mat2  rotMat = mat2(cs, -sn, sn, cs);

    float value    = 0.0;
    float amplitude = 1.0;
    float totalAmp  = 0.0;

    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      totalAmp += amplitude;

      float n = simplex2D(p);
      if (turbulent) {
        // Turbulent: |n| を使う → 値がすべて正になり "さざ波/流れ" になる
        // AEは 1 - |n| ではなく abs(n) をそのまま積み重ねる
        n = abs(n);
      }
      value += n * amplitude;

      // 次のオクターブ: 回転を累積しながら周波数をスケール
      p = rotMat * p * scaling;
      amplitude *= influence;
    }

    // [0,1] に正規化してコントラスト・明度を適用
    // Basic は [-0.5, 0.5] 周辺, Turbulent は [0, 0.9] 周辺に分布
    float norm = value / max(totalAmp, 0.001);
    if (!turbulent) norm = norm * 0.5 + 0.5;  // Basic: [-1,1]→[0,1]

    // コントラスト (0.5 中心)
    norm = (norm - 0.5) * contrast + 0.5 + brightness;
    return clamp(norm, 0.0, 1.0);
  }

  const float PHASOR_EPSILON = 0.00001;
  const float PHASOR_MAX_GRADIENT = 32.0;
  const int PHASOR_NOISE_TYPE = 10;

  float phasorFinite(float value, float fallback) {
    return value == value && abs(value) < 1000000.0 ? value : fallback;
  }

  // One deterministic random position per lattice cell. The other random
  // attributes use the same hash with translated input, so a tile never
  // changes the kernel identity or phase.
  vec2 phasorKernelHash(vec2 cell, float seed) {
    return hash2(cell + vec2(seed * 0.173, seed * 0.271)) * 0.5 + 0.5;
  }

  vec2 phasorDirectionForKernel(vec2 kernelPosition, vec2 randomValue, vec2 center) {
    float baseAngle = phasorFinite(u_phasorDirection, 0.0);
    if (u_phasorDirectionMode == 1 || u_phasorDirectionMode == 2) {
      vec2 radial = kernelPosition - center;
      float radialLength = length(radial);
      if (radialLength > PHASOR_EPSILON) {
        baseAngle = atan(radial.y, radial.x);
        if (u_phasorDirectionMode == 2) baseAngle += 1.57079632679;
      }
    }
    float spread = clamp(phasorFinite(u_phasorDirectionSpread, 0.35), 0.0, 1.0);
    float angle = baseAngle + (randomValue.x - 0.5) * spread * KG_TAU;
    return vec2(cos(angle), sin(angle));
  }

  float phasorTemporalPhase(float time) {
    float speed = clamp(phasorFinite(u_noiseSpeed, 0.5), 0.0, 4.0);
    if (u_noiseLoopMode == 1) {
      float cycle = fract(time / max(phasorFinite(u_noiseLoopPeriod, 1.0), 0.0001));
      // A sinusoidal phase is periodic at both ends even when Speed is not an
      // integer. It also keeps Speed=0 exactly static.
      return sin(cycle * KG_TAU) * speed;
    }
    return time * speed;
  }

  // Evaluates the complex field and both spatial derivatives in one pass.
  // The fixed 3x3 neighborhood is the important cost boundary: every octave
  // reuses the same nine nearby cells and never scans an unbounded kernel list.
  void phasorComplexField(
    vec2 p,
    float time,
    int octaveLimit,
    out vec2 phasor,
    out vec2 derivativeX,
    out vec2 derivativeY
  ) {
    float seed = phasorFinite(u_noiseSeed, 0.0);
    float bandwidth = clamp(phasorFinite(u_phasorBandwidth, 0.8), 0.1, 2.0);
    float density = clamp(phasorFinite(u_phasorKernelDensity, 1.0), 0.25, 2.0);
    float baseFrequency = clamp(phasorFinite(u_phasorFrequency, 5.0), 0.5, 20.0);
    float timePhase = phasorTemporalPhase(time);
    int safeOctaves = octaveLimit;
    if (safeOctaves < 1) safeOctaves = 1;
    if (safeOctaves > 4) safeOctaves = 4;

    phasor = vec2(0.0);
    derivativeX = vec2(0.0);
    derivativeY = vec2(0.0);
    for (int octave = 0; octave < 4; octave++) {
      if (octave >= safeOctaves) break;
      float octaveIndex = float(octave);
      float layerScale = pow(1.72, octaveIndex);
      vec2 layerP = p * layerScale;
      vec2 baseCell = floor(layerP);
      float layerFrequency = baseFrequency * pow(1.24, octaveIndex);
      float layerAmplitude = pow(0.5, octaveIndex);
      float directionSpread = clamp(phasorFinite(u_phasorDirectionSpread, 0.35), 0.0, 1.0)
        * (1.0 + octaveIndex * 0.12);
      float sigma = (0.35 + bandwidth * 0.28) * sqrt(density) / (1.0 + octaveIndex * 0.08);
      float sigma2 = max(sigma * sigma, 0.02);

      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 cell = baseCell + vec2(float(x), float(y));
          vec2 randomValue = phasorKernelHash(
            cell + vec2(octaveIndex * 7.31, -octaveIndex * 4.17),
            seed + octaveIndex * 17.31
          );
          vec2 kernelPosition = cell + randomValue;
          vec2 delta = layerP - kernelPosition;
          float weight = exp(-dot(delta, delta) / (2.0 * sigma2)) * layerAmplitude * density;
          vec2 direction = phasorDirectionForKernel(kernelPosition, randomValue, vec2(0.0));
          float directionAngle = atan(direction.y, direction.x)
            + sin(timePhase + randomValue.y * KG_TAU + octaveIndex) * directionSpread * 0.08;
          direction = vec2(cos(directionAngle), sin(directionAngle));
          vec2 phaseGradient = direction * (KG_TAU * layerFrequency);
          float phaseRandom = phasorKernelHash(
            cell + vec2(19.1, 43.7),
            seed + octaveIndex * 23.17
          ).x;
          float phase = dot(delta, phaseGradient)
            + phaseRandom * KG_TAU
            + timePhase * (0.32 + octaveIndex * 0.09);
          float sine = sin(phase);
          float cosine = cos(phase);
          vec2 wave = vec2(cosine, sine);
          vec2 waveDerivative = vec2(-sine, cosine);
          vec2 weightDerivative = -delta * (weight / sigma2);

          phasor += weight * wave;
          derivativeX += weightDerivative.x * wave + weight * waveDerivative * phaseGradient.x;
          derivativeY += weightDerivative.y * wave + weight * waveDerivative * phaseGradient.y;
        }
      }
    }
  }

  float phasorPhase(vec2 p, float time, int octaveLimit) {
    vec2 field;
    vec2 derivativeX;
    vec2 derivativeY;
    phasorComplexField(p, time, octaveLimit, field, derivativeX, derivativeY);
    return length(field) > PHASOR_EPSILON ? atan(field.y, field.x) : 0.0;
  }

  vec2 phasorPhaseGradient(vec2 p, float time, int octaveLimit) {
    vec2 field;
    vec2 derivativeX;
    vec2 derivativeY;
    phasorComplexField(p, time, octaveLimit, field, derivativeX, derivativeY);
    float fieldLength2 = max(dot(field, field), PHASOR_EPSILON);
    return vec2(
      field.x * derivativeX.y - field.y * derivativeX.x,
      field.x * derivativeY.y - field.y * derivativeY.x
    ) / fieldLength2;
  }

  float phasorLineMask(float phase, float amplitude) {
    float wave = cos(phase * 2.0);
    float ridge = 1.0 - abs(wave);
    // Keep the shared General/Glass source free of derivative instructions.
    // The global resolution still gives a stable analytic pixel footprint for
    // both the preview and high-resolution tile renders.
    float pixelFootprint = 1.0 / max(min(u_resolution.x, u_resolution.y), 1.0);
    float antiAlias = max(pixelFootprint * clamp(phasorFinite(u_phasorFrequency, 5.0), 0.5, 20.0) * 2.0, 0.002);
    float softness = max(0.012 * clamp(phasorFinite(u_phasorSharpness, 3.0), 0.5, 10.0), antiAlias);
    float sharpLine = smoothstep(antiAlias, antiAlias + softness, ridge);
    return sharpLine * clamp(amplitude * 0.9, 0.0, 1.0);
  }

  vec2 phasorDistortion(vec2 uv, float time, float scale, int octaves) {
    float warpStrength = clamp(phasorFinite(u_phasorWarpStrength, 0.18), 0.0, 1.0);
    if (warpStrength <= 0.0) return vec2(0.0);
    float safeScale = clamp(abs(phasorFinite(scale, 2.8)), 0.001, 10.0);
    // Centered global UV keeps Radial/Swirl centered across tile renders.
    vec2 p = (uv - vec2(0.5)) * safeScale;
    vec2 field;
    vec2 derivativeX;
    vec2 derivativeY;
    phasorComplexField(p, time, octaves, field, derivativeX, derivativeY);
    float amplitude = length(field);
    if (amplitude <= PHASOR_EPSILON) return vec2(0.0);

    float fieldLength2 = max(dot(field, field), PHASOR_EPSILON);
    vec2 phaseGradient = vec2(
      field.x * derivativeX.y - field.y * derivativeX.x,
      field.x * derivativeY.y - field.y * derivativeY.x
    ) / fieldLength2;
    float gradientLength = length(phaseGradient);
    if (gradientLength > PHASOR_MAX_GRADIENT) {
      phaseGradient *= PHASOR_MAX_GRADIENT / gradientLength;
      gradientLength = PHASOR_MAX_GRADIENT;
    }
    vec2 fallback = vec2(cos(phasorFinite(u_phasorDirection, 0.0)), sin(phasorFinite(u_phasorDirection, 0.0)));
    vec2 normalDirection = gradientLength > PHASOR_EPSILON ? phaseGradient / gradientLength : fallback;
    vec2 tangentDirection = vec2(-normalDirection.y, normalDirection.x);
    float tangentMix = clamp(phasorFinite(u_phasorTangentMix, 0.65), 0.0, 1.0);
    vec2 flowDirection = normalDirection + tangentDirection * tangentMix;
    float flowLength = length(flowDirection);
    flowDirection = flowLength > PHASOR_EPSILON ? flowDirection / flowLength : fallback;

    float phase = atan(field.y, field.x);
    float lineMask = phasorLineMask(phase, amplitude);
    float signedLine = sin(phase * 2.0) * lineMask;
    float amplitudeMask = clamp(amplitude * 0.72, 0.0, 1.0);
    return flowDirection * signedLine * amplitudeMask * warpStrength * 0.28;
  }

  const float CAUSTICS_EPSILON = 0.0001;
  const float CAUSTICS_HESSIAN_SCALE = 0.006;
  const float CAUSTICS_MAX_CONCENTRATION = 24.0;
  const int CAUSTICS_NOISE_TYPE = 9;

  float causticsFinite(float value, float fallback) {
    return value == value && abs(value) < 1000000.0 ? value : fallback;
  }

  vec2 causticsBaseWave(int index) {
    if (index == 1) return vec2(-2.0, 4.0);
    if (index == 2) return vec2(5.0, -3.0);
    if (index == 3) return vec2(4.0, 5.0);
    if (index == 4) return vec2(-6.0, -1.0);
    if (index == 5) return vec2(7.0, 3.0);
    if (index == 6) return vec2(-5.0, 6.0);
    if (index == 7) return vec2(8.0, -4.0);
    return vec2(3.0, 1.0);
  }

  // The returned Hessian is ordered as (hxx, hxy, hyy).
  void causticsField(
    vec2 p,
    float time,
    float seed,
    int octaveLimit,
    out float height,
    out vec2 gradient,
    out vec3 hessian
  ) {
    highp float safeSeed = causticsFinite(seed, 0.0);
    highp float safeTime = causticsFinite(time, 0.0);
    highp float spread = clamp(causticsFinite(u_causticsWaveSpread, 0.75), 0.0, 1.0);
    // Some WebGL2/GLSL ES drivers do not expose integer overloads for
    // clamp/min/max. Keep these bounds branch-based so the shader compiles
    // consistently across the supported implementations.
    int complexity = u_causticsComplexity;
    if (complexity < 2) complexity = 2;
    if (complexity > 8) complexity = 8;
    int safeOctaveLimit = octaveLimit;
    if (safeOctaveLimit < 1) safeOctaveLimit = 1;
    if (safeOctaveLimit > 8) safeOctaveLimit = 8;
    int waveCount = complexity;
    int octaveWaveLimit = safeOctaveLimit * 2;
    if (waveCount > octaveWaveLimit) waveCount = octaveWaveLimit;

    height = 0.0;
    gradient = vec2(0.0);
    hessian = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      if (i >= waveCount) break;
      highp float octave = floor(float(i) * 0.5);
      highp float frequency = 0.82 + octave * (0.58 + spread * 0.18);
      highp float amplitude = (i < 2 ? 0.42 : 0.28) * pow(0.56, octave);
      highp vec2 baseWave = causticsBaseWave(i);
      highp vec2 tangentWave = vec2(-baseWave.y, baseWave.x);
      highp float directionJitter = sin(safeSeed * 12.9898 + float(i) * 78.233);
      highp vec2 wave = (baseWave + tangentWave * directionJitter * spread * 0.18) * frequency;
      highp float phase = dot(p, wave) * KG_TAU
        + safeTime * (0.42 + float(i) * 0.071)
        + safeSeed * (0.37 + float(i) * 1.17);
      highp float sine = sin(phase);
      highp float cosine = cos(phase);
      highp vec2 phaseGradient = wave * KG_TAU;
      highp float waveAmplitude = amplitude / (1.0 + frequency * frequency * 0.24);

      height += waveAmplitude * sine;
      gradient += waveAmplitude * cosine * phaseGradient;
      hessian.x += -waveAmplitude * sine * phaseGradient.x * phaseGradient.x;
      hessian.y += -waveAmplitude * sine * phaseGradient.x * phaseGradient.y;
      hessian.z += -waveAmplitude * sine * phaseGradient.y * phaseGradient.y;
    }
    hessian *= CAUSTICS_HESSIAN_SCALE;
  }

  float causticsHeightField(vec2 p, float time, float seed, int octaveLimit) {
    float height;
    vec2 gradient;
    vec3 hessian;
    causticsField(p, time, seed, octaveLimit, height, gradient, hessian);
    return height;
  }

  vec2 causticsHeightGradient(vec2 p, float time, float seed, int octaveLimit) {
    float height;
    vec2 gradient;
    vec3 hessian;
    causticsField(p, time, seed, octaveLimit, height, gradient, hessian);
    return gradient;
  }

  // Returns (hxx, hxy, hyy) for the analytic water height field.
  vec3 causticsHessian(vec2 p, float time, float seed, int octaveLimit) {
    float height;
    vec2 gradient;
    vec3 hessian;
    causticsField(p, time, seed, octaveLimit, height, gradient, hessian);
    return hessian;
  }

  vec2 causticsDistortion(vec2 uv, float time, float scale, int octaves) {
    highp float depth = clamp(causticsFinite(u_causticsDepth, 0.65), 0.05, 3.0);
    highp float refraction = clamp(causticsFinite(u_causticsRefraction, 0.18), 0.0, 1.0);
    highp float sharpness = clamp(causticsFinite(u_causticsSharpness, 2.5), 0.5, 8.0);
    highp float boundaryWidth = clamp(causticsFinite(u_causticsBoundaryWidth, 0.75), 0.05, 1.0);
    if (refraction <= 0.0) return vec2(0.0);
    highp float safeScale = max(clamp(abs(causticsFinite(scale, 1.0)), 0.0, 3.0), 0.001);
    highp float seed = causticsFinite(u_noiseSeed, 0.0);
    highp vec2 p = uv * safeScale + vec2(seed * 17.3, seed * 7.1);
    float height;
    highp vec2 gradient;
    highp vec3 hessian;
    causticsField(p, time, seed, octaves, height, gradient, hessian);

    highp float j00 = 1.0 + depth * hessian.x;
    highp float j01 = depth * hessian.y;
    highp float j10 = j01;
    highp float j11 = 1.0 + depth * hessian.z;
    highp float detJ = j00 * j11 - j01 * j10;
    detJ = causticsFinite(detJ, 1.0);
    highp float concentration = min(1.0 / max(abs(detJ), CAUSTICS_EPSILON), CAUSTICS_MAX_CONCENTRATION);
    highp float mappedConcentration = 1.0 - exp(-max(concentration - 1.0, 0.0) * 0.42);
    // Concentration is used as a distance-like field: 1 is on a fold line,
    // 0 is away from it. Boundary Width controls how far that field reaches.
    highp float boundaryDistance = 1.0 - mappedConcentration;
    highp float boundaryInfluence = 1.0 - smoothstep(0.0, boundaryWidth, boundaryDistance);
    highp float lineMask = pow(boundaryInfluence, max(sharpness * 0.65, 0.5));

    highp float gradientLength = length(gradient);
    highp vec2 direction = gradientLength > CAUSTICS_EPSILON
      ? gradient / gradientLength
      : vec2(0.0);
    highp vec2 tangent = vec2(-direction.y, direction.x);
    highp float tangentMix = clamp(causticsFinite(u_causticsWaveSpread, 0.75), 0.0, 1.0) * 0.68;
    highp vec2 flow = direction + tangent * tangentMix;
    highp float flowLength = length(flow);
    flow = flowLength > CAUSTICS_EPSILON ? flow / flowLength : vec2(0.0);
    highp float foldDirection = detJ < 0.0 ? -1.0 : 1.0;
    // Keep a low-amplitude field active inside every cell so the source
    // gradient does not remain as a large untouched area. Boundary Width
    // then expands the stronger fold displacement around each caustic line.
    highp float broadField = 0.18 + boundaryInfluence * (0.72 + mappedConcentration * 0.28);
    highp float lineField = lineMask * (0.75 + mappedConcentration * 0.25);
    highp float intensity = (broadField + lineField) * refraction * depth;
    return flow * foldDirection * min(intensity * 0.42, 0.9);
  }

  float fbm3D(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * simplex3D(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }

  // Classic 3D gradient Perlin noise (Gustavson GLSL port, quintic fade).
  // Unlike simplex, the eight-corner trilinear blend with the C2 quintic fade
  // produces broad, rounded lobes and continuous second derivatives, so the
  // displacement reads as soft gradation rather than cell/vein structure.
  const int PERLIN_NOISE_TYPE = 11;

  vec3 perlinFade(vec3 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  float perlin3D(vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289v3(Pi0);
    Pi1 = mod289v3(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute4(permute4(ix) + iy);
    vec4 ixy0 = permute4(ixy + iz0);
    vec4 ixy1 = permute4(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
    vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
    vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
    vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
    vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
    vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
    vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
    vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

    vec4 norm0 = taylorInvSqrt4(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt4(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fadeXYZ = perlinFade(Pf0);
    vec4 nZ = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fadeXYZ.z);
    vec2 nYZ = mix(nZ.xy, nZ.zw, fadeXYZ.y);
    return 2.2 * mix(nYZ.x, nYZ.y, fadeXYZ.x);
  }

  vec4 perlinFade4(vec4 t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  // Classic 4D gradient Perlin noise (Gustavson GLSL port). Used by the
  // Perlin 4D (Loop) mode: XY = image plane, ZW = a circle traced by time, so
  // one trip around the circle returns to exactly the same field.
  float perlin4D(vec4 P) {
    vec4 Pi0 = floor(P);
    vec4 Pi1 = Pi0 + 1.0;
    Pi0 = mod289v4(Pi0);
    Pi1 = mod289v4(Pi1);
    vec4 Pf0 = fract(P);
    vec4 Pf1 = Pf0 - 1.0;
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = vec4(Pi0.zzzz);
    vec4 iz1 = vec4(Pi1.zzzz);
    vec4 iw0 = vec4(Pi0.wwww);
    vec4 iw1 = vec4(Pi1.wwww);

    vec4 ixy = permute4(permute4(ix) + iy);
    vec4 ixy0 = permute4(ixy + iz0);
    vec4 ixy1 = permute4(ixy + iz1);
    vec4 ixy00 = permute4(ixy0 + iw0);
    vec4 ixy01 = permute4(ixy0 + iw1);
    vec4 ixy10 = permute4(ixy1 + iw0);
    vec4 ixy11 = permute4(ixy1 + iw1);

    vec4 gx00 = ixy00 * (1.0 / 7.0);
    vec4 gy00 = floor(gx00) * (1.0 / 7.0);
    vec4 gz00 = floor(gy00) * (1.0 / 6.0);
    gx00 = fract(gx00) - 0.5;
    gy00 = fract(gy00) - 0.5;
    gz00 = fract(gz00) - 0.5;
    vec4 gw00 = vec4(0.75) - abs(gx00) - abs(gy00) - abs(gz00);
    vec4 sw00 = step(gw00, vec4(0.0));
    gx00 -= sw00 * (step(0.0, gx00) - 0.5);
    gy00 -= sw00 * (step(0.0, gy00) - 0.5);

    vec4 gx01 = ixy01 * (1.0 / 7.0);
    vec4 gy01 = floor(gx01) * (1.0 / 7.0);
    vec4 gz01 = floor(gy01) * (1.0 / 6.0);
    gx01 = fract(gx01) - 0.5;
    gy01 = fract(gy01) - 0.5;
    gz01 = fract(gz01) - 0.5;
    vec4 gw01 = vec4(0.75) - abs(gx01) - abs(gy01) - abs(gz01);
    vec4 sw01 = step(gw01, vec4(0.0));
    gx01 -= sw01 * (step(0.0, gx01) - 0.5);
    gy01 -= sw01 * (step(0.0, gy01) - 0.5);

    vec4 gx10 = ixy10 * (1.0 / 7.0);
    vec4 gy10 = floor(gx10) * (1.0 / 7.0);
    vec4 gz10 = floor(gy10) * (1.0 / 6.0);
    gx10 = fract(gx10) - 0.5;
    gy10 = fract(gy10) - 0.5;
    gz10 = fract(gz10) - 0.5;
    vec4 gw10 = vec4(0.75) - abs(gx10) - abs(gy10) - abs(gz10);
    vec4 sw10 = step(gw10, vec4(0.0));
    gx10 -= sw10 * (step(0.0, gx10) - 0.5);
    gy10 -= sw10 * (step(0.0, gy10) - 0.5);

    vec4 gx11 = ixy11 * (1.0 / 7.0);
    vec4 gy11 = floor(gx11) * (1.0 / 7.0);
    vec4 gz11 = floor(gy11) * (1.0 / 6.0);
    gx11 = fract(gx11) - 0.5;
    gy11 = fract(gy11) - 0.5;
    gz11 = fract(gz11) - 0.5;
    vec4 gw11 = vec4(0.75) - abs(gx11) - abs(gy11) - abs(gz11);
    vec4 sw11 = step(gw11, vec4(0.0));
    gx11 -= sw11 * (step(0.0, gx11) - 0.5);
    gy11 -= sw11 * (step(0.0, gy11) - 0.5);

    vec4 g0000 = vec4(gx00.x, gy00.x, gz00.x, gw00.x);
    vec4 g1000 = vec4(gx00.y, gy00.y, gz00.y, gw00.y);
    vec4 g0100 = vec4(gx00.z, gy00.z, gz00.z, gw00.z);
    vec4 g1100 = vec4(gx00.w, gy00.w, gz00.w, gw00.w);
    vec4 g0010 = vec4(gx10.x, gy10.x, gz10.x, gw10.x);
    vec4 g1010 = vec4(gx10.y, gy10.y, gz10.y, gw10.y);
    vec4 g0110 = vec4(gx10.z, gy10.z, gz10.z, gw10.z);
    vec4 g1110 = vec4(gx10.w, gy10.w, gz10.w, gw10.w);
    vec4 g0001 = vec4(gx01.x, gy01.x, gz01.x, gw01.x);
    vec4 g1001 = vec4(gx01.y, gy01.y, gz01.y, gw01.y);
    vec4 g0101 = vec4(gx01.z, gy01.z, gz01.z, gw01.z);
    vec4 g1101 = vec4(gx01.w, gy01.w, gz01.w, gw01.w);
    vec4 g0011 = vec4(gx11.x, gy11.x, gz11.x, gw11.x);
    vec4 g1011 = vec4(gx11.y, gy11.y, gz11.y, gw11.y);
    vec4 g0111 = vec4(gx11.z, gy11.z, gz11.z, gw11.z);
    vec4 g1111 = vec4(gx11.w, gy11.w, gz11.w, gw11.w);

    vec4 norm00 = taylorInvSqrt4(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100)));
    g0000 *= norm00.x; g0100 *= norm00.y; g1000 *= norm00.z; g1100 *= norm00.w;
    vec4 norm01 = taylorInvSqrt4(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101)));
    g0001 *= norm01.x; g0101 *= norm01.y; g1001 *= norm01.z; g1101 *= norm01.w;
    vec4 norm10 = taylorInvSqrt4(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110)));
    g0010 *= norm10.x; g0110 *= norm10.y; g1010 *= norm10.z; g1110 *= norm10.w;
    vec4 norm11 = taylorInvSqrt4(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111)));
    g0011 *= norm11.x; g0111 *= norm11.y; g1011 *= norm11.z; g1111 *= norm11.w;

    float n0000 = dot(g0000, Pf0);
    float n1000 = dot(g1000, vec4(Pf1.x, Pf0.yzw));
    float n0100 = dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw));
    float n1100 = dot(g1100, vec4(Pf1.xy, Pf0.zw));
    float n0010 = dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w));
    float n1010 = dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w));
    float n0110 = dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w));
    float n1110 = dot(g1110, vec4(Pf1.xyz, Pf0.w));
    float n0001 = dot(g0001, vec4(Pf0.xyz, Pf1.w));
    float n1001 = dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w));
    float n0101 = dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w));
    float n1101 = dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w));
    float n0011 = dot(g0011, vec4(Pf0.xy, Pf1.zw));
    float n1011 = dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw));
    float n0111 = dot(g0111, vec4(Pf0.x, Pf1.yzw));
    float n1111 = dot(g1111, Pf1);

    vec4 fadeXYZW = perlinFade4(Pf0);
    vec4 n0W = mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fadeXYZW.w);
    vec4 n1W = mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fadeXYZW.w);
    vec4 nZW = mix(n0W, n1W, fadeXYZW.z);
    vec2 nYZW = mix(nZW.xy, nZW.zw, fadeXYZW.y);
    return 2.2 * mix(nYZW.x, nYZW.y, fadeXYZW.x);
  }

  // Material Maker style folded Perlin fBm in 3D:
  //   octave = |perlin| (one "fold" of the [0,1] noise: abs(2n - 1))
  // Folding turns every zero crossing of the Perlin field into a soft valley,
  // so after inversion each crossing becomes a smooth, glowing line. Octaves
  // are rotated so the lattice axes never line up between layers, and the sum
  // is normalized by the total amplitude (range stays [0,1]).
  float perlinFoldedFbm3D(vec3 p, int octaves, float persistence) {
    const mat3 octaveRot = mat3( 0.00,  0.80,  0.60,
                                -0.80,  0.36, -0.48,
                                -0.60, -0.48,  0.64);
    float value = 0.0;
    float amplitude = 1.0;
    float total = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * min(abs(perlin3D(p)), 1.0);
      total += amplitude;
      p = octaveRot * p * 2.0;
      amplitude *= persistence;
    }
    return value / max(total, 0.0001);
  }

  // 4D variant of perlinFoldedFbm3D. XYZ is rotated per octave exactly like
  // the 3D version (W is carried along); every transform is linear, so a
  // periodic ZW input stays periodic at every octave.
  float perlinFoldedFbm4D(vec4 p, int octaves, float persistence) {
    const mat3 octaveRot = mat3( 0.00,  0.80,  0.60,
                                -0.80,  0.36, -0.48,
                                -0.60, -0.48,  0.64);
    float value = 0.0;
    float amplitude = 1.0;
    float total = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      value += amplitude * min(abs(perlin4D(p)), 1.0);
      total += amplitude;
      p = vec4(octaveRot * p.xyz, p.w) * 2.0;
      amplitude *= persistence;
    }
    return value / max(total, 0.0001);
  }

  // Smeary Perlin shaping in [0,1], equivalent to the Material Maker graph
  //   FBM(Perlin, folds 1, persistence=Roughness) -> Invert -> Tonality
  //   FBM(Perlin, folds 1, persistence 1) -> Translate -> Invert
  //   Blend(Lighten, opacity=Layer Mix) -> Tonality
  // and close to After Effects Fractal Noise "Smeary": dark, smooth regions
  // crossed by soft bright filaments that fade out with a glow.
  // baseFbm/layerFbm are the two folded fBm values (layer uses persistence 1).
  float perlinSmearyShape(float baseFbm, float layerFbm) {
    float sharpness = clamp(u_perlinSharpness, 1.0, 8.0);
    float layerMix = clamp(u_perlinLayerMix, 0.0, 1.0);
    float base = pow(1.0 - baseFbm, sharpness);
    float layer = 1.0 - layerFbm;
    float blended = mix(base, max(base, layer), layerMix);
    return pow(blended, 1.0 + sharpness * 0.5);
  }

  float perlinSmearyField(vec3 q, int octaves) {
    float roughness = clamp(u_perlinRoughness, 0.0, 1.0);
    return perlinSmearyShape(
      perlinFoldedFbm3D(q, octaves, roughness),
      perlinFoldedFbm3D(q + vec3(-0.59, 1.145, 7.31), octaves, 1.0)
    );
  }

  float perlinSmearyField4D(vec4 q, int octaves) {
    float roughness = clamp(u_perlinRoughness, 0.0, 1.0);
    return perlinSmearyShape(
      perlinFoldedFbm4D(q, octaves, roughness),
      perlinFoldedFbm4D(q + vec4(-0.59, 1.145, 7.31, 3.77), octaves, 1.0)
    );
  }

  // Loop path for Perlin 4D. With Loop Wobble = 0 it is a plain circle in ZW.
  // Wobble bends it into an organic closed curve while keeping every term a
  // function of integer multiples of the loop angle, so it still closes
  // exactly once per Loop Period:
  //   - a static low-frequency spatial field offsets the loop angle per
  //     region, so different areas move out of sync instead of in lockstep;
  //   - radius and angular speed breathe with 2nd/3rd harmonics (surges and
  //     pauses rather than a constant rate);
  //   - XY follows a small periodic swirl, so the filaments sway sideways.
  vec4 perlinLoopCoord(vec2 p, float phase, float radius) {
    float wobble = clamp(u_perlinLoopWobble, 0.0, 1.0);
    if (wobble <= 0.0001) {
      return vec4(p, cos(phase) * radius, sin(phase) * radius);
    }
    float regionPhase = perlin3D(vec3(p * 0.35, 17.3)) * 2.4 * wobble;
    float theta = phase + regionPhase;
    theta += wobble * (0.45 * sin(2.0 * theta + 1.3) + 0.25 * sin(3.0 * theta + 4.1));
    float r = radius * (1.0 + wobble * (0.35 * sin(2.0 * theta + 0.6) + 0.2 * cos(3.0 * theta + 2.2)));
    vec2 sway = wobble * 0.3 * vec2(
      sin(theta + 0.7) + 0.5 * sin(2.0 * theta + 2.9),
      cos(theta + 1.9) + 0.5 * cos(3.0 * theta + 0.4)
    );
    return vec4(p + sway, cos(theta) * r, sin(theta) * r);
  }

  // Perlin displacement. XY is the image plane.
  //   3D: Z is time, so animation morphs the filaments in place; Direction
  //       adds a gentle drift and Seamless loop mode cross-fades at the wrap.
  //   4D (Loop): time travels around a closed path in ZW that is covered once
  //       per Loop Period, so the field returns exactly to its start without
  //       any cross-fade. The base radius keeps the same evolution speed as
  //       3D; drift is omitted because it is not periodic. See
  //       perlinLoopCoord() for the Loop Wobble path.
  // The scalar field pushes the UV along one direction (Angle) so the
  // gradient reproduces the texture itself; two independent X/Y fields would
  // mix two unrelated textures and wash the filaments out. The field is
  // mostly dark, so it is not re-centered: dark regions keep the source
  // gradient untouched and only the glowing filaments displace it (centering
  // would turn the dark majority into a constant shift of the whole image).
  vec2 perlinDistortion(vec2 uv, float scale, float evolution, int octaves) {
    vec2 p = uv * scale + vec2(u_noiseSeed * 127.1, u_noiseSeed * 311.7);
    float field;
    if (u_perlinDimension == 1) {
      float period = max(u_noiseLoopPeriod, 0.0001);
      float phase = KG_TAU * fract(evolution / period);
      float radius = period * 0.6 / KG_TAU;
      field = perlinSmearyField4D(perlinLoopCoord(p, phase, radius), octaves);
    } else {
      p += linearDrift(noiseAnimDir(), evolution, 0.25);
      field = perlinSmearyField(vec3(p, evolution * 0.6), octaves);
    }
    float angle = radians(u_perlinAngle);
    return vec2(cos(angle), sin(angle)) * field;
  }

  // A divergence-free 2D vector field from the perpendicular of an analytic
  // scalar-field gradient. This replaces the four finite-difference fBM calls
  // used by Legacy Curl with one derivative simplex evaluation per octave.
  vec2 fastCurlField(vec2 uv, float scale, float evolution, int octaves) {
    vec2 p = uv * max(scale, 0.001) + vec2(u_curlSeed * 0.173, u_curlSeed * 0.271);
    float loopPeriod = max(u_noiseLoopPeriod, 0.0001);
    // The wrapper supplies time-adjusted evolution at every call site.
    // Keep this shared field independent from uniforms declared by the
    // generator/stack wrapper that is appended after noise.glsl.
    float phase = u_noiseLoopMode == 1
      ? KG_TAU * fract(evolution / loopPeriod)
      : evolution;
    vec2 derivative = vec2(0.0);
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      vec3 sample = psrdnoise2D(p * frequency, phase + float(i) * 0.731);
      derivative += sample.yz * (amplitude * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return vec2(derivative.y, -derivative.x) * max(u_curlSpeed, 0.0);
  }

  vec2 noiseDisplaceRaw(vec2 uv, float scale, float evolution, int noiseType, int octaves) {
    vec2 p = uv * scale + linearDrift(noiseAnimDir(), evolution, 1.0);
    p += vec2(u_noiseSeed * 127.1, u_noiseSeed * 311.7);
    float nx, ny;
    if (noiseType == 0) {
      nx = simplex2D(p);
      ny = simplex2D(p + vec2(43.7, 17.3));
    } else if (noiseType == 1) {
      nx = fbm(p, octaves);
      ny = fbm(p + vec2(43.7, 17.3), octaves);
    } else if (noiseType == 2) {
      float v1 = voronoiScalar(p);
      float v2 = voronoiScalar(p + vec2(17.9, 43.5));
      nx = v1 * 2.0 - 1.0;
      ny = v2 * 2.0 - 1.0;
    } else if (noiseType == 3) {
      float eps = 0.01;
      float phi_r = fbm(p + vec2( eps, 0.0), octaves);
      float phi_l = fbm(p + vec2(-eps, 0.0), octaves);
      float phi_u = fbm(p + vec2(0.0,  eps), octaves);
      float phi_d = fbm(p + vec2(0.0, -eps), octaves);
      nx =  (phi_u - phi_d) / (2.0 * eps);
      ny = -(phi_r - phi_l) / (2.0 * eps);
    } else if (noiseType == 4) {
      mat2 dwRot = mat2(cos(u_dwRotAngle1),  sin(u_dwRotAngle1),
                        -sin(u_dwRotAngle2), cos(u_dwRotAngle2));
      vec2 drift = vec2(cos(u_dwDriftAngle), sin(u_dwDriftAngle));
      vec2 st = p + linearDrift(drift, evolution, u_dwDist1);
      vec2 q = vec2(
        fbmDW(st + vec2(0.0, 0.0), octaves, dwRot),
        fbmDW(st + vec2(5.2, 1.3), octaves, dwRot)
      );
      vec2 r = vec2(
        fbmDW(st + u_dwInitAmp * q + vec2(1.7, 9.2) + linearDrift(drift, evolution, u_dwDist2), octaves, dwRot),
        fbmDW(st + u_dwInitAmp * q + vec2(8.3, 2.8) + linearDrift(drift, evolution, u_dwDist2), octaves, dwRot)
      );
      vec2 s = vec2(
        fbmDW(st + u_dwInitAmp * r + vec2(2.8, 4.6) + linearDrift(drift, evolution, u_dwDist3), octaves, dwRot),
        fbmDW(st + u_dwInitAmp * r + vec2(6.2, 3.8) + linearDrift(drift, evolution, u_dwDist3), octaves, dwRot)
      );
      nx = fbmDW(st + u_dwInitVal * s,                   octaves, dwRot) * 2.0 - 1.0;
      ny = fbmDW(st + u_dwInitVal * s + vec2(43.7, 17.3), octaves, dwRot) * 2.0 - 1.0;
    } else if (noiseType == 6) {
      // Ridged fBm: 明るい稜線が流れるオーラ状テクスチャ
      nx = ridgedFbm(p, octaves) * 2.0 - 1.0;
      ny = ridgedFbm(p + vec2(43.7, 17.3), octaves) * 2.0 - 1.0;
    } else if (noiseType == 7) {
      // AE Fractal Noise: 各オクターブに累積回転を適用したfbm
      nx = aeFractalNoise(p, octaves) * 2.0 - 1.0;
      ny = aeFractalNoise(p + vec2(43.7, 17.3), octaves) * 2.0 - 1.0;
    } else if (noiseType == PERLIN_NOISE_TYPE) {
      // Perlin samples XY + time-Z itself with its own reduced drift.
      return perlinDistortion(uv, scale, evolution, octaves);
    } else if (noiseType == PHASOR_NOISE_TYPE) {
      // Phasor is already a phase-gradient vector field; do not duplicate its
      // scalar line signal into X/Y like the legacy scalar noise types.
      return phasorDistortion(uv, evolution, scale, octaves);
    } else if (noiseType == CAUSTICS_NOISE_TYPE) {
      // Caustics is already a vector field; keep it out of scalar duplication.
      return causticsDistortion(uv, evolution, scale, octaves);
    } else {
      float aspect = u_resolution.x / u_resolution.y;
      vec2 ctr = uv - 0.5;
      ctr.x *= aspect;
      float r_raw = length(ctr);
      float theta = atan(ctr.y, ctr.x) + r_raw * u_seamlessTwist;
      float R_major = scale * 1.5;
      float R_minor = scale * 0.8;
      float loopAngle = u_noiseLoopMode == 1 ? loopPhase() * KG_TAU : evolution;
      float phi;
      vec3 p_offset;
      if (u_seamlessAnimation == 1) {
        phi = r_raw * 2.0 * KG_TAU - loopAngle;
        p_offset = vec3(evolution * 0.1, 0.0, 0.0);
      } else {
        phi = r_raw * 2.0 * KG_TAU;
        p_offset = vec3(evolution, 0.0, 0.0);
      }
      float tx = (R_major + R_minor * cos(phi)) * cos(theta);
      float ty = (R_major + R_minor * cos(phi)) * sin(theta);
      float tz = R_minor * sin(phi);
      vec3 p3d = vec3(tx, ty, tz) + p_offset + vec3(u_noiseSeed * 17.3, u_noiseSeed * 7.1, u_noiseSeed * 43.5);
      if (u_noiseSeamlessType == 1) {
        nx = fbm3D(p3d, octaves) * 1.5;
        ny = fbm3D(p3d + vec3(43.7, 17.3, 7.1), octaves) * 1.5;
      } else if (u_noiseSeamlessType == 2) {
        float eps = 0.05;
        float phi_r = fbm3D(p3d + vec3( eps, 0.0, 0.0), octaves);
        float phi_l = fbm3D(p3d + vec3(-eps, 0.0, 0.0), octaves);
        float phi_u = fbm3D(p3d + vec3(0.0,  eps, 0.0), octaves);
        float phi_d = fbm3D(p3d + vec3(0.0, -eps, 0.0), octaves);
        nx =  (phi_u - phi_d) / (2.0 * eps);
        ny = -(phi_r - phi_l) / (2.0 * eps);
      } else {
        nx = simplex3D(p3d);
        ny = simplex3D(p3d + vec3(43.7, 17.3, 7.1));
      }
    }
    return vec2(nx, ny);
  }

  vec2 noiseDisplace(vec2 uv, float scale, float evolution, int noiseType, int octaves) {
    vec2 current = noiseDisplaceRaw(uv, scale, evolution, noiseType, octaves);
    float blend = loopBlendWeight();
    if (blend <= 0.0001) return current;
    if (noiseType == PHASOR_NOISE_TYPE && u_noiseLoopMode == 1) return current;
    // Perlin 4D loops exactly on its own; a cross-fade would only blur it.
    if (noiseType == PERLIN_NOISE_TYPE && u_perlinDimension == 1) return current;
    float wrapPeriod = noiseType == CAUSTICS_NOISE_TYPE
      ? u_noiseLoopPeriod * clamp(causticsFinite(u_noiseSpeed, 0.5), 0.0, 4.0)
      : u_noiseLoopPeriod;
    vec2 wrapped = noiseDisplaceRaw(uv, scale, evolution - wrapPeriod, noiseType, octaves);
    return mix(current, wrapped, blend);
  }
#endif
// KGG_BOOTSTRAP_NOISE_END
