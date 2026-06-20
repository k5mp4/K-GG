
  precision mediump float;
  uniform sampler2D u_tex;
  uniform vec2 u_resolution;
  uniform vec2 u_blurDir;
  uniform float u_blurSigma;
  uniform int u_blurRadius;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float sigma = max(u_blurSigma, 0.01);
    float inv2sig2 = 1.0 / (2.0 * sigma * sigma);
    vec2 texStep = u_blurDir / u_resolution;
    float totalWeight = 0.0;
    vec4 result = vec4(0.0);
    float fr = float(u_blurRadius);
    for (int i = -32; i <= 32; i++) {
      float fi = float(i);
      if (abs(fi) > fr) { continue; }
      float w = exp(-fi * fi * inv2sig2);
      vec2 sampleUv = clamp(uv + texStep * fi, vec2(0.0), vec2(1.0));
      result += texture2D(u_tex, sampleUv) * w;
      totalWeight += w;
    }
    gl_FragColor = result / totalWeight;
  }
