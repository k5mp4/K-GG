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
  int('u_threeDProjection', params.projection);
  float('u_fisheyeHalfAngle', params.fisheyeHalfAngle);
  float('u_lensDistortion', params.lensDistortion);
  float('u_cameraDolly', params.camera.dolly);
  float('u_torusAim', params.torusAim);
  float('u_threeDDistance', params.distance);
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
  float('u_terrainHeight', params.terrain.height);
  float('u_terrainAltitude', params.terrain.altitude);
  float('u_extrudeCells', params.extrusion.cells);
  float('u_extrudeHeight', params.extrusion.height);
  float('u_extrudeGap', params.extrusion.gap);
  float('u_ribbonHalfTwists', params.ribbon.halfTwists);
  float('u_ribbonWidth', params.ribbon.width);
  int('u_ringsPattern', params.rings.pattern);
  int('u_ringsMapping', params.rings.mapping);
  float('u_ringsPerTile', params.rings.perTile);
  float('u_ringsSpacing', params.rings.spacing);
  float('u_ringsThickness', params.rings.thickness);
  float('u_ringsDepth', params.rings.depth);
  float('u_ringsTwist', params.rings.twistRadians);
  float('u_ringsSpin', params.rings.spinRadians);
  float('u_ringsPulse', params.rings.pulse);
  float('u_ringsPulsePhase', params.rings.pulsePhase);
  float('u_ringsAmount', params.rings.amount);
  int('u_fieldGeometry', params.field.geometry);
  int('u_fieldRender', params.field.render);
  float('u_fieldLoopCells', params.field.loopCells);
  float('u_fieldDensity', params.field.density);
  float('u_fieldSize', params.field.size);
  float('u_fieldClearance', params.field.clearance);
  float('u_fieldSpread', params.field.spread);
  float('u_fieldWire', params.field.wire);
  float('u_fieldSpin', params.field.spinRadians);
  float('u_fieldVariation', params.field.variation);
}
