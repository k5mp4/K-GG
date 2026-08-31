import * as THREE from 'three';
import type { ClothGradientConfig } from '../types/clothGradient';
import type { TileRenderOptions } from './webgl';
import { disableWebGLContextValidation } from './webglPerformance';
import { createWebGL2Context, WebGL2UnavailableError } from './webglCapability';

// ---------------------------------------------------------------------------
// GLSL Shaders for 3D Cloth Wave & Gradient Ramp Lighting
// ---------------------------------------------------------------------------

const VERTEX_SHADER = `
uniform float uTime;
uniform vec2 uDirection1;
uniform vec2 uDirection2;
uniform float uAmplitude1;
uniform float uAmplitude2;
uniform float uFrequency1;
uniform float uFrequency2;
uniform float uSpeed1;
uniform float uSpeed2;

uniform float uWarpStrength;
uniform float uNoiseScale;
uniform float uNoiseAmplitude;
uniform float uNoiseSpeed;
uniform float uNormalStrength;

uniform vec2 uTileOffset;
uniform vec2 uTileScale;

// Seamless loop
uniform int uLoopEnabled;
uniform float uLoopPeriod;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vHeight;
varying float vFlowNoise;

// Simple 2D Simplex-like noise helper
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i  = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// Seamless loop phase (0..1) and smooth blend weight near the loop end.
float loopPhase() {
  if (uLoopEnabled == 0) return 0.0;
  return fract(uTime / max(uLoopPeriod, 0.0001));
}

// 6th-order smoothstep used to crossfade non-periodic noise at the loop seam.
float loopBlend(float t) {
  if (uLoopEnabled == 0) return 0.0;
  float blendWidth = 0.2;
  float x = clamp((t - (1.0 - blendWidth)) / blendWidth, 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

// Wave components at uv. phase1/phase2 are the temporal phases for each wave;
// when seamless looping is enabled each advances by 2PI * integerCycles over
// the loop period, so the wave returns to its starting shape at the seam.
vec2 waveComponents(vec2 uv, float phase1, float phase2) {
  vec2 dir1 = normalize(uDirection1 + vec2(0.0001));
  vec2 dir2 = normalize(uDirection2 + vec2(0.0001));

  float dot1 = dot(uv, dir1);
  float dot2 = dot(uv, dir2);

  float wave1 = sin(dot1 * uFrequency1 + phase1) * uAmplitude1;
  float wave2 = cos(dot2 * uFrequency2 + phase2) * uAmplitude2;
  return vec2(wave1, wave2);
}

// Flow (noise) displacement. Crossfades at the loop seam because noise has no
// intrinsic periodicity.
float flowDisplacement(vec2 uv) {
  float t = uTime;
  if (uLoopEnabled != 0) {
    float loopT = loopPhase();
    float blend = loopBlend(loopT);
    vec2 offsetA = vec2(loopT * uNoiseSpeed * 0.1, 0.0);
    vec2 offsetB = vec2((loopT - 1.0) * uNoiseSpeed * 0.1, 0.0);
    float a = snoise(uv * uNoiseScale + offsetA);
    float b = snoise(uv * uNoiseScale + offsetB);
    return mix(a, b, blend) * uNoiseAmplitude;
  }
  vec2 noiseUv = uv * uNoiseScale + vec2(t * uNoiseSpeed * 0.1, 0.0);
  return snoise(noiseUv) * uNoiseAmplitude;
}

void main() {
  // Tile scale / offset transform for UVs
  vec2 tiledUv = uv * uTileScale + uTileOffset;
  vUv = tiledUv;

  float phase1;
  float phase2;
  if (uLoopEnabled != 0) {
    // 0..2PI over the loop period; cycles are quantized so each wave returns
    // to its starting shape exactly at the loop seam. GLSL ES 1.0 has no
    // round(), so quantize with floor(x + 0.5).
    float loopT = loopPhase();
    float cycles1 = max(floor(uFrequency1 * uSpeed1 + 0.5), 1.0);
    float cycles2 = max(floor(uFrequency2 * uSpeed2 + 0.5), 1.0);
    phase1 = 6.28318530718 * loopT * cycles1;
    phase2 = 6.28318530718 * loopT * cycles2;
  } else {
    phase1 = uTime * uSpeed1;
    phase2 = uTime * uSpeed2;
  }

  vec2 wave = waveComponents(tiledUv, phase1, phase2);
  // flow/warp noise is evaluated once and shared by the finite-difference
  // samples below, avoiding 3x snoise cost per vertex.
  float flow = flowDisplacement(tiledUv);
  float warp = snoise(tiledUv * 1.5 + vec2(wave.x, wave.y) * uWarpStrength) * 0.2;

  vec3 pos = position;
  float disp = wave.x + wave.y + flow + warp;
  pos.z += disp;
  vHeight = disp;

  // Finite Difference normal calculation. Only the cheap wave terms are
  // re-evaluated at the offset positions; noise terms are shared.
  float eps = 0.01;
  vec2 waveX = waveComponents(tiledUv + vec2(eps, 0.0), phase1, phase2);
  float dispX = waveX.x + waveX.y + flow + warp;
  vec2 waveY = waveComponents(tiledUv + vec2(0.0, eps), phase1, phase2);
  float dispY = waveY.x + waveY.y + flow + warp;

  vec3 tangentX = vec3(eps, 0.0, (dispX - disp) * uNormalStrength);
  vec3 tangentY = vec3(0.0, eps, (dispY - disp) * uNormalStrength);
  vec3 norm = normalize(cross(tangentX, tangentY));

  vNormal = normalMatrix * norm;
  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPosition.xyz;
  vFlowNoise = snoise(tiledUv * uNoiseScale);

  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const FRAGMENT_SHADER = `
uniform sampler2D uGradientRamp;
uniform sampler2D uSourceTexture;
uniform int uUseSourceTexture;

uniform vec3 uLightDirection;
uniform vec3 uSkyLightColor;
uniform vec3 uGroundLightColor;
uniform float uAmbientIntensity;
uniform float uLightIntensity;

uniform float uSpecularStrength;
uniform float uSpecularPower;
uniform vec3 uSpecularColor;

uniform float uFresnelPower;
uniform vec3 uFresnelColor;
uniform float uFresnelColorStrength;

uniform float uRampOffset;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying float vHeight;
varying float vFlowNoise;

void main() {
  vec3 N = normalize(vNormal);
  vec3 L = normalize(uLightDirection);
  vec3 V = normalize(cameraPosition - vWorldPosition);
  vec3 H = normalize(L + V);

  // 白黒シェーディング: ライティング + スペキュラー + フレネルを輝度として計算する。
  float NdotL = max(dot(N, L), 0.0);

  // Hemisphere Ambient
  float hemi = N.y * 0.5 + 0.5;
  vec3 ambient = mix(uGroundLightColor, uSkyLightColor, hemi) * uAmbientIntensity;

  // Specular Blinn-Phong
  float NdotH = max(dot(N, H), 0.0);
  float spec = pow(NdotH, uSpecularPower) * uSpecularStrength;

  // Fresnel
  float NdotV = max(dot(N, V), 0.0);
  float fresnel = pow(1.0 - NdotV, uFresnelPower);

  // ライティングの輝度 (Rec.709)
  vec3 lighting = ambient + vec3(NdotL * uLightIntensity);
  float shade = dot(lighting, vec3(0.299, 0.587, 0.114))
              + spec * dot(uSpecularColor, vec3(0.299, 0.587, 0.114))
              + fresnel * uFresnelColorStrength * dot(uFresnelColor, vec3(0.299, 0.587, 0.114))
              + uRampOffset;

  // 白黒シェーディングの輝度をランプのインデックスとしてグラデーションを適用する。
  float rampT = clamp(shade, 0.0, 1.0);
  vec4 rampColor = texture2D(uGradientRamp, vec2(rampT, 0.5));

  if (uUseSourceTexture != 0) {
    // The processed 2D Canvas is the color source. The texture stays
    // attached to vUv while the vertex shader deforms the cloth, so
    // curl/noise/distortion follows the surface instead of being rendered
    // as a second, unrelated cloth pass.
    vec4 sourceColor = texture2D(uSourceTexture, clamp(vUv, vec2(0.0), vec2(1.0)));
    vec3 surfaceLight = max(ambient + vec3(NdotL * uLightIntensity), vec3(0.08));
    vec3 litSource = sourceColor.rgb * surfaceLight;
    litSource += sourceColor.rgb * spec * uSpecularColor * 0.35;
    litSource += fresnel * uFresnelColor * uFresnelColorStrength * 0.25;
    gl_FragColor = vec4(litSource, sourceColor.a);
  } else {
    gl_FragColor = vec4(rampColor.rgb, 1.0);
  }
}
`;

// ---------------------------------------------------------------------------
// Offscreen Renderer Class
// ---------------------------------------------------------------------------

function hexToRgbVec3(hex: string): THREE.Vector3 {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
}

export class ClothGradientRenderer {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private rampTexture: THREE.DataTexture;
  private sourceTexture: THREE.CanvasTexture | null = null;
  private currentQuality: string = 'medium';
  private geometryMode: 'base' | 'texture' = 'base';
  private geometryWidth = 8;
  private geometryHeight = 8;

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

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      context: gl,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 1.0);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.debug.checkShaderErrors = true;
    disableWebGLContextValidation(this.renderer.getContext());

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 1.0, 0.1, 100);
    this.camera.position.set(0, 0, 4.5);
    this.camera.lookAt(0, 0, 0);

    // Initial 256x1 dummy ramp
    const initialRampData = new Uint8Array(256 * 4);
    for (let i = 0; i < 256; i++) {
      initialRampData[i * 4 + 0] = i;
      initialRampData[i * 4 + 1] = i;
      initialRampData[i * 4 + 2] = i;
      initialRampData[i * 4 + 3] = 255;
    }
    this.rampTexture = new THREE.DataTexture(initialRampData, 256, 1, THREE.RGBAFormat);
    this.rampTexture.needsUpdate = true;
    this.rampTexture.minFilter = THREE.LinearFilter;
    this.rampTexture.magFilter = THREE.LinearFilter;

    this.material = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: false,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uDirection1: { value: new THREE.Vector2(1, 0) },
        uDirection2: { value: new THREE.Vector2(0, 1) },
        uAmplitude1: { value: 0.4 },
        uAmplitude2: { value: 0.25 },
        uFrequency1: { value: 1.5 },
        uFrequency2: { value: 2.2 },
        uSpeed1: { value: 0.8 },
        uSpeed2: { value: 1.2 },
        uWarpStrength: { value: 0.35 },
        uNoiseScale: { value: 2.5 },
        uNoiseAmplitude: { value: 0.15 },
        uNoiseSpeed: { value: 0.5 },
        uNormalStrength: { value: 1.2 },
        uLoopEnabled: { value: 0 },
        uLoopPeriod: { value: 1.0 },
        uTileOffset: { value: new THREE.Vector2(0, 0) },
        uTileScale: { value: new THREE.Vector2(1, 1) },

        uGradientRamp: { value: this.rampTexture },
        uSourceTexture: { value: this.rampTexture },
        uUseSourceTexture: { value: 0 },
        uLightDirection: { value: new THREE.Vector3(0.5, 1.0, 0.8).normalize() },
        uSkyLightColor: { value: new THREE.Vector3(0.9, 0.9, 1.0) },
        uGroundLightColor: { value: new THREE.Vector3(0.1, 0.1, 0.3) },
        uAmbientIntensity: { value: 0.25 },
        uLightIntensity: { value: 1.8 },

        uSpecularStrength: { value: 0.8 },
        uSpecularPower: { value: 32.0 },
        uSpecularColor: { value: new THREE.Vector3(1, 1, 1) },

        uFresnelPower: { value: 3.0 },
        uFresnelColor: { value: new THREE.Vector3(1, 1, 1) },
        uFresnelColorStrength: { value: 0.4 },

        uRampOffset: { value: 0.0 },
      },
    });

    const segments = this.getSegmentsForQuality(this.currentQuality);
    const geometry = new THREE.PlaneGeometry(8.0, 8.0, segments, segments);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  private getSegmentsForQuality(quality: string): number {
    if (quality === 'low') return 40;
    if (quality === 'high') return 128;
    return 72; // medium
  }

  private replaceGeometry(width: number, height: number, segments: number): void {
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    this.geometryWidth = width;
    this.geometryHeight = height;
  }

  private configureGeometry(mappedTexture: boolean, targetWidth: number, targetHeight: number): void {
    const segments = this.getSegmentsForQuality(this.currentQuality);
    if (mappedTexture) {
      const planeHeight = 2.35;
      const planeWidth = planeHeight * Math.max(1, targetWidth) / Math.max(1, targetHeight);
      if (
        this.geometryMode !== 'texture' ||
        Math.abs(this.geometryWidth - planeWidth) > 0.001 ||
        Math.abs(this.geometryHeight - planeHeight) > 0.001
      ) {
        this.replaceGeometry(planeWidth, planeHeight, segments);
        this.geometryMode = 'texture';
      }
      const fovRadians = (this.camera.fov * Math.PI) / 180;
      const verticalDistance = (planeHeight * 0.5) / Math.tan(fovRadians * 0.5);
      const horizontalDistance = (planeWidth * 0.5) / (Math.tan(fovRadians * 0.5) * this.camera.aspect);
      this.camera.position.z = Math.max(verticalDistance, horizontalDistance) * 1.24 + 0.35;
    } else {
      if (this.geometryMode !== 'base') {
        this.replaceGeometry(8, 8, segments);
        this.geometryMode = 'base';
      }
      this.camera.position.z = 4.5;
    }
    this.camera.lookAt(0, 0, 0);
  }

  public updateRampData(rampData: Uint8Array): void {
    if (!rampData || rampData.length < 4 || rampData.length % 4 !== 0) return;
    const width = rampData.length / 4;
    if (!Number.isInteger(width) || width < 1) return;
    this.rampTexture.dispose();
    this.rampTexture = new THREE.DataTexture(new Uint8Array(rampData), width, 1, THREE.RGBAFormat);
    this.rampTexture.minFilter = THREE.LinearFilter;
    this.rampTexture.magFilter = THREE.LinearFilter;
    this.rampTexture.needsUpdate = true;
    this.material.uniforms.uGradientRamp.value = this.rampTexture;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  private updateSourceTexture(sourceCanvas: HTMLCanvasElement): void {
    if (!this.sourceTexture || this.sourceTexture.image !== sourceCanvas) {
      this.sourceTexture?.dispose();
      this.sourceTexture = new THREE.CanvasTexture(sourceCanvas);
      this.sourceTexture.colorSpace = THREE.SRGBColorSpace;
      this.sourceTexture.minFilter = THREE.LinearFilter;
      this.sourceTexture.magFilter = THREE.LinearFilter;
      this.sourceTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.sourceTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.sourceTexture.generateMipmaps = false;
      this.material.uniforms.uSourceTexture.value = this.sourceTexture;
    }
    this.sourceTexture.needsUpdate = true;
  }

  public renderMappedTexture(
    sourceCanvas: HTMLCanvasElement,
    config: ClothGradientConfig,
    time: number,
    targetWidth: number,
    targetHeight: number,
    loopPeriod = 1,
  ): HTMLCanvasElement {
    this.updateSourceTexture(sourceCanvas);
    this.material.uniforms.uUseSourceTexture.value = 1;
    return this.renderInternal(config, time, targetWidth, targetHeight, undefined, loopPeriod, true);
  }

  public render(
    config: ClothGradientConfig,
    time: number,
    targetWidth: number,
    targetHeight: number,
    tileOptions?: TileRenderOptions,
    loopPeriod = 1,
  ): HTMLCanvasElement {
    this.material.uniforms.uUseSourceTexture.value = 0;
    return this.renderInternal(config, time, targetWidth, targetHeight, tileOptions, loopPeriod);
  }

  private renderInternal(
    config: ClothGradientConfig,
    time: number,
    targetWidth: number,
    targetHeight: number,
    tileOptions?: TileRenderOptions,
    loopPeriod = 1,
    mappedTexture = false,
  ): HTMLCanvasElement {
    // Quality update
    if (config.quality !== this.currentQuality) {
      this.currentQuality = config.quality;
      const seg = this.getSegmentsForQuality(this.currentQuality);
      this.replaceGeometry(8, 8, seg);
    }

    // Resize canvas if needed
    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      this.renderer.setSize(targetWidth, targetHeight, false);
      this.camera.aspect = targetWidth / targetHeight;
      this.camera.updateProjectionMatrix();
    }
    this.configureGeometry(mappedTexture, targetWidth, targetHeight);

    // Uniform updates
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uLoopEnabled.value = config.loopEnabled ? 1 : 0;
    u.uLoopPeriod.value = Math.max(Math.abs(loopPeriod), 0.0001);
    u.uDirection1.value.set(config.direction1[0], config.direction1[1]);
    u.uDirection2.value.set(config.direction2[0], config.direction2[1]);
    u.uAmplitude1.value = config.amplitude1;
    u.uAmplitude2.value = config.amplitude2;
    u.uFrequency1.value = config.frequency1;
    u.uFrequency2.value = config.frequency2;
    u.uSpeed1.value = config.speed1;
    u.uSpeed2.value = config.speed2;
    u.uWarpStrength.value = config.warpStrength;
    u.uNoiseScale.value = config.noiseScale;
    u.uNoiseAmplitude.value = config.noiseAmplitude;
    u.uNoiseSpeed.value = config.noiseSpeed;
    u.uNormalStrength.value = config.normalStrength;

    // Light orientation from Azimuth & Elevation
    const azRad = (config.lightAzimuth * Math.PI) / 180;
    const elRad = (config.lightElevation * Math.PI) / 180;
    const lx = Math.cos(elRad) * Math.sin(azRad);
    const ly = Math.sin(elRad);
    const lz = Math.cos(elRad) * Math.cos(azRad);
    u.uLightDirection.value.set(lx, ly, lz).normalize();

    u.uSkyLightColor.value.copy(hexToRgbVec3(config.skyLightColor));
    u.uGroundLightColor.value.copy(hexToRgbVec3(config.groundLightColor));
    u.uAmbientIntensity.value = config.ambientIntensity;
    u.uLightIntensity.value = config.lightIntensity;

    u.uSpecularStrength.value = config.specularStrength;
    u.uSpecularPower.value = config.specularPower;
    u.uSpecularColor.value.copy(hexToRgbVec3(config.specularColor));

    u.uFresnelPower.value = config.fresnelPower;
    u.uFresnelColor.value.copy(hexToRgbVec3(config.fresnelColor));
    u.uFresnelColorStrength.value = config.fresnelColorStrength;

    u.uRampOffset.value = config.rampOffset;

    // Tile Export handling
    if (tileOptions && targetWidth > 0 && targetHeight > 0) {
      const offsetX = tileOptions.offset[0] / targetWidth;
      const offsetY = tileOptions.offset[1] / targetHeight;
      const scaleX = tileOptions.viewport[0] / targetWidth;
      const scaleY = tileOptions.viewport[1] / targetHeight;

      u.uTileOffset.value.set(offsetX, offsetY);
      u.uTileScale.value.set(scaleX, scaleY);
    } else {
      u.uTileOffset.value.set(0, 0);
      u.uTileScale.value.set(1, 1);
    }

    this.renderer.render(this.scene, this.camera);
    return this.canvas;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.rampTexture.dispose();
    this.sourceTexture?.dispose();
    this.renderer.dispose();
  }
}
