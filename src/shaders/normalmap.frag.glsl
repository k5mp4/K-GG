
  precision mediump float;

  uniform sampler2D u_gradientTex;   // レンダリング済みグラデーションテクスチャ
  uniform vec2 u_resolution;
  uniform float u_normalMapStrength;
  uniform float u_normalMapAngle;
  uniform float u_normalMapBevelSize;
  uniform bool u_normalMapInvert;
  uniform bool u_matcapEnabled;

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float bpx = max(u_normalMapBevelSize, 0.1);
    vec2 stp = vec2(bpx / u_resolution.x, bpx / u_resolution.y);

    // 隣接4点のルミナンスをグラデーションテクスチャからサンプリング
    float tR = dot(texture2D(u_gradientTex, uv + vec2( stp.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float tL = dot(texture2D(u_gradientTex, uv + vec2(-stp.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float tU = dot(texture2D(u_gradientTex, uv + vec2(0.0,  stp.y)).rgb, vec3(0.299, 0.587, 0.114));
    float tD = dot(texture2D(u_gradientTex, uv + vec2(0.0, -stp.y)).rgb, vec3(0.299, 0.587, 0.114));

    float dx = (tR - tL) / (2.0 * stp.x) * u_normalMapStrength;
    float dy = (tU - tD) / (2.0 * stp.y) * u_normalMapStrength;

    if (u_normalMapInvert) { dx = -dx; dy = -dy; }

    float cosA = cos(u_normalMapAngle);
    float sinA = sin(u_normalMapAngle);
    float rdx = dx * cosA - dy * sinA;
    float rdy = dx * sinA + dy * cosA;
    vec3 normal = normalize(vec3(-rdx, -rdy, 1.0));
    gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);

    // Matcap: 円形アルファマスク（メインシェーダーと同じ挙動を維持）
    if (u_matcapEnabled) {
      vec2 centered = gl_FragCoord.xy / u_resolution * 2.0 - 1.0;
      float dist = length(centered);
      float alpha = 1.0 - smoothstep(0.97, 1.0, dist);
      gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
    }
  }
