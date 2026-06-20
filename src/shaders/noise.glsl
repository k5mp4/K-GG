
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

  uniform float u_ridgeSharpness;
  uniform float u_ridgeGain;
  uniform float u_ridgeLacunarity;
  uniform float u_ridgePersistence;
  uniform float u_ridgeOffset;
  uniform float u_ridgeWarp;

  // AE Fractal Noise パラメータ
  uniform int   u_aeFractalType;     // 0=Basic, 1=Turbulent
  uniform float u_aeSubInfluence;    // persistence per octave
  uniform float u_aeSubScaling;      // frequency multiplier per octave
  uniform float u_aeSubRotation;     // rotation per octave (radians)
  uniform float u_aeContrast;        // output contrast
  uniform float u_aeBrightness;      // output brightness shift

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
    vec2 wrapped = noiseDisplaceRaw(uv, scale, evolution - u_noiseLoopPeriod, noiseType, octaves);
    return mix(current, wrapped, blend);
  }
