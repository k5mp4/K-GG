const int RAMP_SEARCH_STEPS = 32;

vec2 dmClampUv(vec2 uv) {
  return clamp(uv, vec2(0.5) / u_resolution, vec2(1.0) - vec2(0.5) / u_resolution);
}

vec3 dmProjectToGradientRamp(vec3 color) {
  vec3 closest = texture2D(u_gradientRamp, vec2(0.0, 0.5)).rgb;
  vec3 delta = closest - color;
  float closestDistance = dot(delta, delta);
  for (int index = 1; index < RAMP_SEARCH_STEPS; index++) {
    float position = float(index) / float(RAMP_SEARCH_STEPS - 1);
    vec3 candidate = texture2D(u_gradientRamp, vec2(position, 0.5)).rgb;
    vec3 candidateDelta = candidate - color;
    float candidateDistance = dot(candidateDelta, candidateDelta);
    if (candidateDistance < closestDistance) {
      closest = candidate;
      closestDistance = candidateDistance;
    }
  }
  return closest;
}

vec4 dmSampleHistory(vec2 historyUv, vec2 offset) {
  vec4 center = texture2D(u_historyTex, dmClampUv(historyUv));
  if (!u_colorDrift) return center;
  // Chroma planes drift apart along the motion, like mis-predicted chroma.
  vec2 drift = offset * 0.5 + sign(offset) * (1.5 / u_resolution);
  float red = texture2D(u_historyTex, dmClampUv(historyUv + drift)).r;
  float blue = texture2D(u_historyTex, dmClampUv(historyUv - drift)).b;
  return vec4(red, center.g, blue, center.a);
}

// Irregular macroblock partition, like a codec choosing 32/16/8 and
// rectangular partitions per region. Parents may merge, then each block may
// split along x, y, or both, up to two levels. The layout changes every few
// frames instead of every frame so blocks read as blocks, not noise.
vec2 dmPartitionBlockCount(vec2 uv, vec2 baseCount, float seed) {
  float layoutSeed = floor(seed / 6.0);
  vec2 blockCount = baseCount;
  vec2 parentCount = max(floor(baseCount * 0.5), vec2(1.0));
  if (dmHash12(floor(uv * parentCount) + vec2(layoutSeed * 1.71, 53.0)) < u_blockVariance * 0.35) {
    return parentCount;
  }
  for (int level = 0; level < 2; level++) {
    vec2 blockId = floor(uv * blockCount);
    float splitRoll = dmHash12(blockId + vec2(layoutSeed * 3.1 + float(level) * 17.0, 29.0));
    if (splitRoll >= u_blockVariance) break;
    float axisRoll = dmHash12(blockId + vec2(71.0 + float(level), layoutSeed * 0.37));
    vec2 split = axisRoll < 0.34 ? vec2(2.0, 1.0) : axisRoll < 0.67 ? vec2(1.0, 2.0) : vec2(2.0);
    blockCount *= split;
  }
  return blockCount;
}

// Per-pixel drag length from the held image: bright and/or saturated
// pixels are dragged further (or less with negative values), so a block
// tears into streaks instead of translating rigidly.
float dmStretchFactor(vec3 color) {
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  float maxChannel = max(color.r, max(color.g, color.b));
  float minChannel = min(color.r, min(color.g, color.b));
  float saturation = maxChannel > 0.0001 ? (maxChannel - minChannel) / maxChannel : 0.0;
  float stretch = 1.0
    + u_lumaStretch * (luma - 0.5) * 2.0
    + u_saturationStretch * (saturation - 0.5) * 2.0;
  return clamp(stretch, 0.0, 4.0);
}

vec4 dmCombine(vec4 current, vec4 predicted, float historyWeight) {
  if (u_mixMode == 1) {
    return mix(current, max(current, predicted), historyWeight);
  }
  if (u_mixMode == 2) {
    vec4 difference = vec4(abs(predicted.rgb - current.rgb), max(predicted.a, current.a));
    return mix(current, difference, historyWeight);
  }
  vec4 mixed = mix(current, predicted, historyWeight);
  // Ramp Lock keeps repeated blending from drifting into off-ramp colors.
  if (u_mixMode == 3) mixed.rgb = dmProjectToGradientRamp(mixed.rgb);
  return mixed;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec4 current = texture2D(u_currentTex, uv);
  // An unprimed history is the missing I-frame: start from the current frame.
  if (!u_historyPrimed) {
    gl_FragColor = current;
    return;
  }

  // Macroblock quantization: every pixel of a block shares one motion vector.
  float seed = u_frameSeed;
  vec2 baseBlockCount = max(floor(u_resolution / max(u_blockSize, 1.0)), vec2(1.0));
  vec2 blockCount = dmPartitionBlockCount(uv, baseBlockCount, seed);
  vec2 blockId = floor(uv * blockCount);
  vec2 blockCenter = (blockId + 0.5) / blockCount;

  vec2 blockWindow = 1.0 / blockCount;
  vec2 motion = datamoshMotionField(blockCenter, blockWindow);
  vec2 neighborStep = step(0.5, dmHash22(blockId + vec2(41.0, 7.0))) * 2.0 - 1.0;
  vec2 neighborOffset = dmHash12(blockId + vec2(9.1, 3.7)) < 0.5
    ? vec2(neighborStep.x, 0.0)
    : vec2(0.0, neighborStep.y);
  vec2 neighborMotion = datamoshMotionField((blockId + neighborOffset + 0.5) / blockCount, blockWindow);
  motion = mix(motion, neighborMotion, u_neighborMix);
  // Block Lock below 1 lets pixels follow their own motion, so the drag
  // traces the animation instead of translating whole blocks.
  if (u_blockLock < 0.999) {
    vec2 pixelMotion = datamoshMotionField(uv, 6.0 / u_resolution);
    motion = mix(pixelMotion, motion, u_blockLock);
  }

  vec2 jitterRoll = dmHash22(blockId + vec2(seed * 0.917, 17.0)) - 0.5;
  vec2 referenceShift = jitterRoll * u_jitter / blockCount;

  // Corrupted blocks: zero vector, borrowed neighbor vector, skipped update,
  // or a displaced reference block.
  float stall = 0.0;
  float glitchRoll = dmHash12(blockId * 1.37 + vec2(11.7, seed * 3.71));
  if (u_glitchAmount > 0.0 && glitchRoll > u_glitchThreshold) {
    float operation = dmHash12(blockId * 2.11 + vec2(seed * 1.93, 5.3));
    if (operation < 0.25) {
      motion = mix(motion, vec2(0.0), u_glitchAmount);
    } else if (operation < 0.5) {
      motion = mix(motion, neighborMotion * (1.0 + u_glitchAmount), u_glitchAmount);
    } else if (operation < 0.75) {
      stall = u_glitchAmount;
    } else {
      referenceShift += jitterRoll * 4.0 * u_glitchAmount / blockCount;
    }
  }

  float stretch = dmStretchFactor(texture2D(u_historyTex, uv).rgb);
  vec2 offset = motion * u_strength * stretch * (1.0 - stall);
  vec4 predicted = dmSampleHistory(uv - offset + referenceShift * (1.0 - stall), offset);
  // A stalled block receives no residual: it holds the history as-is.
  vec4 moshed = dmCombine(current, predicted, mix(u_feedback, 1.0, stall));

  // Intra refresh: a random subset of blocks is rebuilt from the current frame.
  float refreshRoll = dmHash12(blockId + vec2(seed * 7.13, 3.1));
  float refreshed = stall > 0.0 ? 0.0 : step(refreshRoll, u_refresh - 0.0001);
  gl_FragColor = mix(moshed, current, refreshed);
}
