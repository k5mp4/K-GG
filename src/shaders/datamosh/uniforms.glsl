precision highp float;

// Stage input (Main Stack output) and the previous Datamosh output.
uniform sampler2D u_currentTex;
uniform sampler2D u_historyTex;
// RGBA8 Video Motion field: RG = direction, B = magnitude, A = frame change.
uniform sampler2D u_motionField;
uniform sampler2D u_gradientRamp;
uniform vec2 u_resolution;
uniform float u_time;
// Advances once per logical frame; drives the per-block corruption rolls.
uniform float u_frameSeed;
uniform bool u_historyPrimed;
// 0: procedural, 1: video
uniform int u_motionSource;
// 0: mix, 1: lighten, 2: difference, 3: rampLock
uniform int u_mixMode;
uniform float u_strength;
uniform float u_refresh;
uniform float u_feedback;
uniform float u_blockSize;
uniform float u_blockVariance;
uniform float u_lumaStretch;
uniform float u_saturationStretch;
uniform float u_motionScale;
uniform float u_motionSpeed;
uniform float u_glitchAmount;
uniform float u_glitchThreshold;
uniform float u_neighborMix;
uniform float u_jitter;
uniform bool u_colorDrift;
