/**
 * Normal Map is a surface pass, not a second Diffuse pass. Both rendering
 * pipelines use the same legacy rule: Diffuse owns the luminance field while
 * it is enabled, so the normal pass must stay out of that frame.
 */
export function shouldRenderNormalMap(normalMapEnabled: boolean, diffuseEnabled: boolean): boolean {
  return normalMapEnabled && !diffuseEnabled;
}
