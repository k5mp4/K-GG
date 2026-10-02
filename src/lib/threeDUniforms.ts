import type { ThreeDRenderParams } from './coneView';
import type { FieldModel } from './fieldModelRuntime';

type UniformLocations = Record<string, WebGLUniformLocation | null>;

/** Texture unit of the Geometry Field model atlas; no other pass uses it. */
export const FIELD_MODEL_TEXTURE_UNIT = 13;

/**
 * Binds the Geometry Field model atlas and sets its uniforms. The atlas is
 * uploaded only when the model's version differs from the one this context
 * last uploaded; returns the version now held by the texture.
 */
export function bindFieldModelTexture(
  gl: WebGL2RenderingContext,
  uniforms: UniformLocations,
  texture: WebGLTexture,
  model: FieldModel | null,
  uploadedVersion: number,
): number {
  gl.activeTexture(gl.TEXTURE0 + FIELD_MODEL_TEXTURE_UNIT);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  let version = uploadedVersion;
  if (model && model.version !== uploadedVersion) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    // Half floats keep the distances near the surface precise and filter
    // linearly in core WebGL2.
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.RG16F,
      model.resolution * model.tilesX, model.resolution * model.tilesY, 0,
      gl.RG, gl.FLOAT, model.data,
    );
    version = model.version;
  }
  const sampler = uniforms.u_fieldModelTex;
  if (sampler) gl.uniform1i(sampler, FIELD_MODEL_TEXTURE_UNIT);
  const ready = uniforms.u_fieldModelReady;
  if (ready) gl.uniform1f(ready, model ? 1 : 0);
  const grid = uniforms.u_fieldModelGrid;
  if (grid) gl.uniform3f(grid, model?.resolution ?? 1, model?.tilesX ?? 1, model?.tilesY ?? 1);
  return version;
}

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
  float('u_coneTwist', params.coneTwist);
  int('u_coneCameraMode', params.coneCameraMode);
  float('u_torusMajorRadius', params.torus.majorRadius);
  float('u_ringRepeat', params.torus.ringRepeat);
  float('u_torusTwistTurns', params.torus.twistTurns);
  int('u_latticeType', params.lattice.type);
  float('u_latticeScale', params.lattice.scale);
  float('u_latticeThickness', params.lattice.thickness);
  float('u_terrainHeight', params.terrain.height);
  float('u_terrainAltitude', params.terrain.altitude);
  float('u_ribbonCount', params.ribbon.count);
  float('u_ribbonRadius', params.ribbon.radius);
  float('u_ribbonStagger', params.ribbon.stagger);
  float('u_ribbonTwistTurns', params.ribbon.twistTurns);
  float('u_ribbonLoopLength', params.ribbon.loopLength);
  float('u_ribbonHalfTwists', params.ribbon.halfTwists);
  float('u_ribbonWidth', params.ribbon.width);
  float('u_ribbonSpin', params.ribbon.spinRadians);
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
  float('u_fieldArms', params.field.arms);
  float('u_fieldTwist', params.field.twistPerCell);
  float('u_fieldArmWidth', params.field.armWidth);
  float('u_fieldWire', params.field.wire);
  float('u_fieldSpin', params.field.spinRadians);
  float('u_fieldVariation', params.field.variation);
  int('u_discsForm', params.discs.form);
  float('u_discsCount', params.discs.count);
  float('u_discsGap', params.discs.gap);
  float('u_discsThickness', params.discs.thickness);
  float('u_discsSpread', params.discs.spread);
  float('u_discsWaves', params.discs.waves);
  float('u_discsScatter', params.discs.scatter);
  int('u_discsSpinPattern', params.discs.spinPattern);
  float('u_discsSpin', params.discs.spin);
  float('u_discsTwist', params.discs.twistRadians);
  float('u_discsOffset', params.discs.offset);
  float('u_discsTilt', params.discs.tiltRadians);
  float('u_discsTiltTurns', params.discs.tiltTurns);
  float('u_discsView', params.discs.viewRadians);
  float('u_discsOrbit', params.discs.orbitRadians);
  float('u_discsTime', params.discs.time);
  float('u_discsFrameDistance', params.discs.frameDistance);
  float('u_discsOuterRadius', params.discs.outerRadius);
  int('u_crystalCount', params.crystal.count);
  const crystalCenter = uniforms.u_crystalCenter;
  if (crystalCenter) gl.uniform4fv(crystalCenter, params.crystal.centers);
  const crystalRotation = uniforms.u_crystalRotation;
  if (crystalRotation) gl.uniformMatrix3fv(crystalRotation, false, params.crystal.rotations);
  const crystalShape = uniforms.u_crystalShape;
  if (crystalShape) gl.uniform4fv(crystalShape, params.crystal.shapes);
  int('u_crystalMaterial', params.crystal.material);
  float('u_crystalFaceOpacity', params.crystal.faceOpacity);
  float('u_crystalIor', params.crystal.ior);
  float('u_crystalDispersion', params.crystal.dispersion);
  int('u_crystalDispersionSteps', params.crystal.dispersionSteps);
  float('u_crystalDispersionBlur', params.crystal.dispersionBlur);
  float('u_crystalReflection', params.crystal.reflection);
  float('u_crystalCameraDistance', params.crystal.cameraDistance);
  float('u_crystalBackdropZ', params.crystal.backdropZ);
  float('u_crystalBackdropHalfHeight', params.crystal.backdropHalfHeight);
}
