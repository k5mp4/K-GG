import * as THREE from 'three';
import {
  CONE_SEAM_BLEND_MAX,
  CONE_SEAM_BLEND_MIN,
  CONE_SEAM_MODE_INDEX,
  type ConeViewConfig,
} from '../types/coneView';
import {
  CONE_CAMERA_DISTANCE,
  CONE_CAMERA_FOV,
  getConeApertureRadius,
  getConeApexOffset,
  getConeSeamModeIndex,
  getConeTextureTransform,
} from './coneView';
import { CONE_GRADIENT_REAPPLY_SHADER } from './coneSeam';
import { disableWebGLContextValidation } from './webglPerformance';
import { createWebGL2Context, WebGL2UnavailableError } from './webglCapability';

const RADIAL_SEGMENTS = 128;

type CanvasSourceDimensions = Pick<HTMLCanvasElement, 'width' | 'height'>;

export function isConeSourceTextureStale(
  previousCanvas: CanvasSourceDimensions | null,
  previousSize: readonly [number, number] | null,
  sourceCanvas: CanvasSourceDimensions,
): boolean {
  return previousCanvas !== sourceCanvas
    || previousSize === null
    || previousSize[0] !== sourceCanvas.width
    || previousSize[1] !== sourceCanvas.height;
}

export class ConeViewRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly material: THREE.MeshBasicMaterial;
  private readonly mesh: THREE.Mesh;
  private readonly textureUniforms = {
    coneTextureRepeat: { value: new THREE.Vector2(1, 1) },
    coneTextureOffset: { value: new THREE.Vector2(0, 0) },
    coneTextureSeamBlend: { value: CONE_SEAM_BLEND_MIN },
    coneTextureSeamMode: { value: 1 },
  };
  private sourceTexture: THREE.CanvasTexture | null = null;
  private sourceTextureSize: readonly [number, number] | null = null;
  private geometrySignature = '';
  private disposed = false;
  private contextLost = false;
  private readonly handleContextLost = () => {
    this.contextLost = true;
    this.geometrySignature = '';

    // Three.js rebuilds its internal WebGL caches after context restore, but
    // the old geometry dispose listener can otherwise retain buffers from the
    // lost context. Dispose while the context is lost so the wrapper is a
    // no-op, then force the next frame to allocate fresh resources.
    if (this.sourceTexture) this.disposeResource(this.sourceTexture, 'source texture after context loss');
    this.sourceTexture = null;
    this.sourceTextureSize = null;
    this.material.map = null;
    this.disposeResource(this.material, 'material after context loss');
    this.disposeResource(this.mesh.geometry, 'geometry after context loss');
  };
  private readonly handleContextRestored = () => {
    this.contextLost = false;
    this.geometrySignature = '';
    this.material.needsUpdate = true;
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 512;
    this.canvas.height = 512;

    const gl = createWebGL2Context(this.canvas, {
      alpha: false,
      antialias: true,
      depth: true,
      stencil: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new WebGL2UnavailableError();
    if (gl.isContextLost()) throw new Error('WebGL context is currently lost');

    // This context belongs exclusively to Three.js. Remove the development
    // validator before Three initializes its program and VAO caches.
    disableWebGLContextValidation(gl);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: gl,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.debug.checkShaderErrors = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CONE_CAMERA_FOV, 1, 0.01, 64);
    this.camera.position.set(0, 0, CONE_CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, -1);

    this.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.BackSide,
      transparent: false,
      toneMapped: false,
    });
    this.material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.textureUniforms);
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
  vec2 coneUnwrappedUv = vMapUv * coneTextureRepeat + coneTextureOffset;
  vec2 coneSampleUv = fract(coneUnwrappedUv);
  float coneBlendWidth = clamp(coneTextureSeamBlend, 0.0, ${CONE_SEAM_BLEND_MAX});
  vec4 sampledDiffuseColor;
  if (coneTextureSeamMode < ${CONE_SEAM_MODE_INDEX.weld - 0.5}) {
    sampledDiffuseColor = coneMirrorRepeatSample(coneUnwrappedUv, coneBlendWidth);
  } else if (coneTextureSeamMode < ${CONE_SEAM_MODE_INDEX.reapply - 0.5}) {
    sampledDiffuseColor = coneEdgeWeldSample(coneSampleUv, coneBlendWidth);
  } else {
    sampledDiffuseColor = coneGradientReapplySample(coneSampleUv, coneBlendWidth);
  }
  diffuseColor *= sampledDiffuseColor;
#endif`,
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_pars_fragment>',
        `#include <map_pars_fragment>
uniform vec2 coneTextureRepeat;
uniform vec2 coneTextureOffset;
uniform float coneTextureSeamBlend;
uniform float coneTextureSeamMode;

#ifdef USE_MAP
float coneSeamWeight(float coordinate, float blendWidth) {
  float distanceToSeam = min(coordinate, 1.0 - coordinate);
  return 1.0 - smoothstep(0.0, max(blendWidth, 0.00001), distanceToSeam);
}

vec2 coneMirrorRepeatUv(vec2 uv) {
  // Both sides of every tile boundary resolve to the same edge texel.
  return abs(fract(uv) * 2.0 - 1.0);
}

vec4 coneMirrorRepeatSample(vec2 uv, float blendWidth) {
  vec2 tiledUv = fract(uv);
  float seamWeight = max(coneSeamWeight(tiledUv.x, blendWidth), coneSeamWeight(tiledUv.y, blendWidth));
  vec4 normal = texture2D(map, tiledUv);
  if (seamWeight <= 0.0) return normal;
  vec4 mirrored = texture2D(map, coneMirrorRepeatUv(uv));
  return mix(normal, mirrored, seamWeight);
}

vec4 coneEdgeWeldSample(vec2 uv, float blendWidth) {
  float seamX = coneSeamWeight(uv.x, blendWidth);
  float seamY = coneSeamWeight(uv.y, blendWidth);
  vec4 center = texture2D(map, uv);
  vec4 welded = center;
  if (seamX > 0.0) {
    vec4 edgeX = 0.5 * (
      texture2D(map, vec2(0.0, uv.y)) +
      texture2D(map, vec2(1.0, uv.y))
    );
    welded = mix(welded, edgeX, seamX);
  }
  if (seamY > 0.0) {
    vec4 edgeY = 0.5 * (
      texture2D(map, vec2(uv.x, 0.0)) +
      texture2D(map, vec2(uv.x, 1.0))
    );
    welded = mix(welded, edgeY, seamY);
  }
  if (seamX > 0.0 && seamY > 0.0) {
    vec4 corners = 0.25 * (
      texture2D(map, vec2(0.0, 0.0)) +
      texture2D(map, vec2(1.0, 0.0)) +
      texture2D(map, vec2(0.0, 1.0)) +
      texture2D(map, vec2(1.0, 1.0))
    );
    welded = mix(welded, corners, seamX * seamY);
  }
  return welded;
}

${CONE_GRADIENT_REAPPLY_SHADER}

#endif`,
      );
    };
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.material);
    this.scene.add(this.mesh);
    this.canvas.addEventListener('webglcontextlost', this.handleContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestored, false);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private updateSourceTexture(sourceCanvas: HTMLCanvasElement): void {
    if (
      !this.sourceTexture
      || isConeSourceTextureStale(this.sourceTexture?.image ?? null, this.sourceTextureSize, sourceCanvas)
    ) {
      const previousTexture = this.sourceTexture;
      if (previousTexture) this.disposeResource(previousTexture, 'source texture');

      const nextTexture = new THREE.CanvasTexture(sourceCanvas);
      nextTexture.colorSpace = THREE.SRGBColorSpace;
      nextTexture.minFilter = THREE.LinearFilter;
      nextTexture.magFilter = THREE.LinearFilter;
      nextTexture.wrapS = THREE.ClampToEdgeWrapping;
      nextTexture.wrapT = THREE.ClampToEdgeWrapping;
      nextTexture.generateMipmaps = false;
      this.sourceTexture = nextTexture;
      this.sourceTextureSize = [sourceCanvas.width, sourceCanvas.height];
      this.material.map = nextTexture;
      this.material.needsUpdate = true;
    }
    if (this.sourceTexture) this.sourceTexture.needsUpdate = true;
  }

  private disposeResource(resource: { dispose: () => void }, label: string): void {
    try {
      resource.dispose();
    } catch (error) {
      // A stale WebGL object must not take down the React tree during fallback
      // or unmount. The renderer is discarded immediately after this path.
      console.warn(`[Cone view] Failed to dispose ${label}; discarding renderer.`, error);
    }
  }

  private isContextLost(): boolean {
    try {
      const context = this.renderer.getContext();
      return this.contextLost || context.isContextLost();
    } catch {
      return true;
    }
  }

  private configureGeometry(config: ConeViewConfig, aspect: number): void {
    const apexOffset = getConeApexOffset(
      CONE_CAMERA_DISTANCE,
      config.depth,
      aspect,
      config.apexX,
      config.apexY,
    );
    const radius = getConeApertureRadius(
      CONE_CAMERA_DISTANCE,
      aspect,
    );
    const signature = `${config.depth}:${config.apexX}:${config.apexY}:${aspect.toFixed(6)}:${radius.toFixed(6)}`;
    if (signature !== this.geometrySignature) {
      const geometry = new THREE.ConeGeometry(radius, config.depth, RADIAL_SEGMENTS, 1, true);
      geometry.rotateX(-Math.PI / 2);
      const positions = geometry.getAttribute('position');
      const apexZ = -config.depth / 2;
      for (let index = 0; index < positions.count; index += 1) {
        if (Math.abs(positions.getZ(index) - apexZ) < 1e-5) {
          positions.setX(index, positions.getX(index) + apexOffset.x);
          positions.setY(index, positions.getY(index) + apexOffset.y);
        }
      }
      positions.needsUpdate = true;
      geometry.computeBoundingSphere();
      const previousGeometry = this.mesh.geometry;
      this.mesh.geometry = geometry;
      this.disposeResource(previousGeometry, 'geometry');
      this.mesh.position.set(0, 0, -config.depth / 2);
      this.geometrySignature = signature;
    }

    this.camera.fov = CONE_CAMERA_FOV;
    this.camera.aspect = aspect;
    this.camera.near = 0.01;
    this.camera.far = config.depth + CONE_CAMERA_DISTANCE + 1;
    this.camera.position.set(0, 0, CONE_CAMERA_DISTANCE);
    this.camera.lookAt(0, 0, -config.depth);
    this.camera.updateProjectionMatrix();
  }

  public renderMappedTexture(
    sourceCanvas: HTMLCanvasElement,
    config: ConeViewConfig,
    normalizedTime: number,
    targetWidth: number,
    targetHeight: number,
  ): HTMLCanvasElement {
    if (this.disposed) throw new Error('Cone renderer has already been disposed');
    if (this.isContextLost()) throw new Error('WebGL context lost');

    const width = Math.max(1, Math.round(targetWidth));
    const height = Math.max(1, Math.round(targetHeight));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.renderer.setSize(width, height, false);
      // Changing canvas dimensions resets the WebGL state, while Three.js
      // keeps cached program/VAO bindings. Reconcile both before drawElements.
      this.renderer.resetState();
    }

    this.updateSourceTexture(sourceCanvas);
    this.configureGeometry(config, width / height);

    const transform = getConeTextureTransform(config, normalizedTime);
    this.textureUniforms.coneTextureRepeat.value.set(transform.repeatU, 1);
    this.textureUniforms.coneTextureOffset.value.set(transform.offsetU, transform.offsetV);
    this.textureUniforms.coneTextureSeamBlend.value = transform.seamBlend;
    this.textureUniforms.coneTextureSeamMode.value = getConeSeamModeIndex(transform.seamMode);

    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.handleContextLost, false);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestored, false);

    if (!this.isContextLost()) {
      this.disposeResource(this.mesh.geometry, 'geometry');
      this.disposeResource(this.material, 'material');
      if (this.sourceTexture) this.disposeResource(this.sourceTexture, 'source texture');
    }
    this.sourceTexture = null;
    this.sourceTextureSize = null;
    this.disposeResource(this.renderer, 'renderer');
  }
}
