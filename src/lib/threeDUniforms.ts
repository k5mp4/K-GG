import type { ThreeDRenderParams } from './coneView';

type UniformLocations = Record<string, WebGLUniformLocation | null>;

/**
 * Uploads every uniform of the dedicated 3D program. Kept separate from the
 * renderer so the upload contract can be exercised without its context.
 */
export function uploadThreeDUniforms(
  gl: WebGL2RenderingContext,
  uniforms: UniformLocations,
  params: ThreeDRenderParams,
): void {
  const float = (name: string, value: number) => {
    const location = uniforms[name];
    if (location) gl.uniform1f(location, value);
  };
  const int = (name: string, value: number) => {
    const location = uniforms[name];
    if (location) gl.uniform1i(location, value);
  };
  const vec2 = (name: string, value: readonly [number, number]) => {
    const location = uniforms[name];
    if (location) gl.uniform2f(location, value[0], value[1]);
  };
  int('u_threeDShape', params.shape);
  int('u_threeDMapping', params.surfaceMapping);
  float('u_threeDFog', params.fog);
  float('u_threeDShade', params.shade);
  float('u_threeDTravel', params.travel);
  float('u_coneTangentHalfFov', params.tangentHalfFov);
  float('u_coneTextureRepeat', params.textureRepeat);
  vec2('u_coneTextureOffset', params.textureOffset);
  float('u_coneSeamBlend', params.seamBlend);
  int('u_coneSeamMode', params.seamMode);
  float('u_cameraRoll', params.camera.rollRadians);
  float('u_cameraYaw', params.camera.yawRadians);
  float('u_cameraPitch', params.camera.pitchRadians);
  vec2('u_cameraOffset', [params.camera.offsetX, params.camera.offsetY]);
  float('u_coneCameraDistance', params.cone.cameraDistance);
  float('u_coneDepth', params.cone.depth);
  float('u_coneApertureRadius', params.cone.apertureRadius);
  vec2('u_coneApexOffset', params.cone.apexOffset);
  float('u_torusMajorRadius', params.torus.majorRadius);
  float('u_ringRepeat', params.torus.ringRepeat);
  float('u_torusTwistTurns', params.torus.twistTurns);
  int('u_latticeType', params.lattice.type);
  float('u_latticeScale', params.lattice.scale);
  float('u_latticeThickness', params.lattice.thickness);
  int('u_roomShape', params.room.shape);
  int('u_roomBounces', params.room.bounces);
  float('u_roomReflectivity', params.room.reflectivity);
  int('u_roomCanvasFaces', params.room.canvasFaces);
}
