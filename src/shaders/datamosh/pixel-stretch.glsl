// Pixel Stretch source: pixels whose luma reaches the threshold are anchors.
// Each logical frame the history is pulled one motion step along the fixed
// direction, so a streak grows from every anchor, and stretched pixels stay
// drawn instead of settling back to the layer input.
const int PIXEL_STRETCH_STEPS = 64;

float dmStretchLuma(vec3 color) {
  return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

// True when a live anchor of the layer input lies within the streak reach
// behind this pixel. Bands across the direction are Block Size wide and each
// has its own reach, so streaks end raggedly instead of on one straight line.
bool dmPixelStretchReachable(vec2 fragCoord) {
  vec2 direction = u_pixelStretchDirection;
  float band = floor(dot(fragCoord, vec2(-direction.y, direction.x)) / max(u_blockSize, 1.0));
  float reach = u_pixelStretchLength * (1.0 - u_pixelStretchVariance * dmHash12(vec2(band, 83.0)));
  float stepLength = max(reach / float(PIXEL_STRETCH_STEPS), 1.0);
  for (int i = 1; i <= PIXEL_STRETCH_STEPS; i++) {
    float distance = float(i) * stepLength;
    if (distance > reach) break;
    vec2 samplePosition = fragCoord - direction * distance;
    // Nothing beyond the frame edge can anchor a streak.
    if (any(lessThan(samplePosition, vec2(0.0))) || any(greaterThanEqual(samplePosition, u_resolution))) break;
    if (dmStretchLuma(texture2D(u_currentTex, samplePosition / u_resolution).rgb) >= u_pixelStretchThreshold) {
      return true;
    }
  }
  return false;
}

// current: layer input. pulled: history one motion step behind this pixel.
// held: this pixel's own history. settled: the regular Feedback combine of
// current and held, used where no streak is drawn.
vec4 dmPixelStretchCombine(vec2 fragCoord, vec4 current, vec4 pulled, vec4 held, vec4 settled) {
  // Live anchors show the layer input, so streaks pass behind bright content.
  if (dmStretchLuma(current.rgb) >= u_pixelStretchThreshold) return current;
  // The streak grows by one step while a live anchor is within reach.
  if (dmStretchLuma(pulled.rgb) >= u_pixelStretchThreshold && dmPixelStretchReachable(fragCoord)) return pulled;
  // Stretched pixels stay drawn until Refresh rebuilds their block.
  if (dmStretchLuma(held.rgb) >= u_pixelStretchThreshold) return held;
  return settled;
}
