import { expect, test } from '@playwright/test';

type FieldRender = {
  width: number;
  height: number;
  /** Raw RGBA rows, bottom row first (readPixels order). */
  pixels: number[];
};

type FieldCase = {
  width: number;
  height: number;
  tile?: { offset: [number, number]; viewport: [number, number] };
  source: 'thickness' | 'cracks';
  influence?: number;
  seed?: number;
  time?: number;
  cycles?: number;
  morph?: number;
  cracks?: number;
  ramp?: 'gray' | 'inverted';
};

// Renders the Material Field Generator variant with a linear gradient in a
// bare WebGL2 context. With influence 1 the ramp input is the field value, so
// a gray ramp exposes the component directly as RGBA.
async function renderFieldCases(page: import('@playwright/test').Page, cases: FieldCase[]): Promise<FieldRender[]> {
  return page.evaluate(async (fieldCases): Promise<FieldRender[]> => {
    // Module paths are served by Vite in the page, not resolved by TypeScript.
    const modulePaths = ['/src/lib/webglShaderSources.ts', '/src/lib/materialField.ts', '/src/types/materialField.ts'];
    const [shaderSources, materialField, materialFieldTypes] = await Promise.all(modulePaths.map(path => import(path)));
    const { getMaterialFieldGeneratorSource } = shaderSources as { getMaterialFieldGeneratorSource: () => { vertex: string; fragment: string } };
    const { getMaterialFieldUniforms, resolveMaterialPhase, MATERIAL_FIELD_INPUT_SOURCE_INDEX } = materialField as typeof import('../../src/lib/materialField');
    const { normalizeMaterialFieldConfig } = materialFieldTypes as typeof import('../../src/types/materialField');
    const source = getMaterialFieldGeneratorSource();
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error('WebGL2 is unavailable');
    const compile = (type: number, text: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'compile failed');
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, source.vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source.fragment));
    gl.bindAttribLocation(program, 0, 'a_position');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);

    const ramps = {
      gray: new Uint8Array(256 * 4).map((_, index) => (index % 4 === 3 ? 255 : Math.floor(index / 4))),
      inverted: new Uint8Array(256 * 4).map((_, index) => (index % 4 === 3 ? 255 : 255 - Math.floor(index / 4))),
    };
    const rampTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, rampTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u('u_gradientRamp'), 1);

    return fieldCases.map((fieldCase) => {
      const viewport = fieldCase.tile?.viewport ?? [fieldCase.width, fieldCase.height];
      const offset = fieldCase.tile?.offset ?? [0, 0];
      canvas.width = viewport[0];
      canvas.height = viewport[1];
      gl.viewport(0, 0, viewport[0], viewport[1]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ramps[fieldCase.ramp ?? 'gray']);
      const field = normalizeMaterialFieldConfig({
        seed: fieldCase.seed ?? 11,
        scale: 4,
        cracks: fieldCase.cracks ?? 0.8,
        cycles: fieldCase.cycles ?? 1,
        morph: fieldCase.morph ?? 0,
        thicknessVariation: 1,
      });
      const uniforms = getMaterialFieldUniforms(field, resolveMaterialPhase(fieldCase.time ?? 0, field.cycles, field.phase));
      gl.uniform2f(u('u_resolution'), fieldCase.width, fieldCase.height);
      gl.uniform2f(u('u_tileOffset'), offset[0], offset[1]);
      gl.uniform2f(u('u_tileSize'), viewport[0], viewport[1]);
      gl.uniform1i(u('u_gradientType'), 0);
      gl.uniform2f(u('u_gradAnchor0'), 0, 0.5);
      gl.uniform2f(u('u_gradAnchor1'), 1, 0.5);
      gl.uniform1f(u('u_rampRepeat'), 1);
      gl.uniform1i(u('u_mfInputSource'), MATERIAL_FIELD_INPUT_SOURCE_INDEX[fieldCase.source]);
      gl.uniform1f(u('u_mfInfluence'), fieldCase.influence ?? 1);
      gl.uniform1f(u('u_mfSeedZ'), uniforms.seedZ);
      gl.uniform2f(u('u_mfSeedOffset'), uniforms.seedOffset[0], uniforms.seedOffset[1]);
      gl.uniform1f(u('u_mfScale'), uniforms.scale);
      gl.uniform1f(u('u_mfThickness'), uniforms.thickness);
      gl.uniform1f(u('u_mfThicknessVariation'), uniforms.thicknessVariation);
      gl.uniform1f(u('u_mfCracks'), uniforms.cracks);
      gl.uniform1f(u('u_mfWarp'), uniforms.warp);
      gl.uniform1f(u('u_mfMorph'), uniforms.morph);
      gl.uniform1f(u('u_mfAngle'), uniforms.angle);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const pixels = new Uint8Array(viewport[0] * viewport[1] * 4);
      gl.readPixels(0, 0, viewport[0], viewport[1], gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return { width: viewport[0], height: viewport[1], pixels: Array.from(pixels) };
    });
  }, cases);
}

function maxChannelDifference(a: number[], b: number[]): number {
  expect(a).toHaveLength(b.length);
  let max = 0;
  for (let index = 0; index < a.length; index += 1) max = Math.max(max, Math.abs(a[index] - b[index]));
  return max;
}

function redChannel(render: FieldRender): number[] {
  return render.pixels.filter((_, index) => index % 4 === 0);
}

test.beforeEach(async ({ page }) => {
  // Any same-origin document lets the page import the shader modules.
  await page.goto('/favicon.png');
});

test('the shared field is a pure function of position, Seed, and loop phase', async ({ page }) => {
  const size = { width: 96, height: 64 };
  const [a1, b1, b2, a2, closedStart, closedEnd, moved, otherSeed] = await renderFieldCases(page, [
    { ...size, source: 'cracks', time: 0.7, morph: 0.6 },
    { ...size, source: 'cracks', time: 0.1, morph: 0.6 },
    { ...size, source: 'cracks', time: 0.1, morph: 0.6 },
    { ...size, source: 'cracks', time: 0.7, morph: 0.6 },
    { ...size, source: 'thickness', time: 0, cycles: 2, morph: 0.6 },
    { ...size, source: 'thickness', time: 1, cycles: 2, morph: 0.6 },
    { ...size, source: 'thickness', time: 0.25, cycles: 2, morph: 0.6 },
    { ...size, source: 'thickness', time: 0, cycles: 2, morph: 0.6, seed: 12 },
  ]);
  // Evaluation order and repetition never change a frame.
  expect(a2.pixels).toEqual(a1.pixels);
  expect(b2.pixels).toEqual(b1.pixels);
  // Integer cycles close the loop exactly while intermediate phases move.
  expect(closedEnd.pixels).toEqual(closedStart.pixels);
  expect(maxChannelDifference(moved.pixels, closedStart.pixels)).toBeGreaterThan(4);
  // The Seed selects a different structure.
  expect(maxChannelDifference(otherSeed.pixels, closedStart.pixels)).toBeGreaterThan(16);
});

test('tiles reproduce the full-output field and ramp edits never move the structure', async ({ page }) => {
  const width = 96;
  const height = 64;
  const tiles = [
    { offset: [0, 0], viewport: [48, 32] },
    { offset: [48, 0], viewport: [48, 32] },
    { offset: [0, 32], viewport: [48, 32] },
    { offset: [48, 32], viewport: [48, 32] },
  ] as const;
  for (const source of ['thickness', 'cracks'] as const) {
    const [full, inverted, ...tileRenders] = await renderFieldCases(page, [
      { width, height, source, time: 0.3, morph: 0.4 },
      { width, height, source, time: 0.3, morph: 0.4, ramp: 'inverted' },
      ...tiles.map(tile => ({ width, height, source, time: 0.3, morph: 0.4, tile: { offset: [...tile.offset] as [number, number], viewport: [...tile.viewport] as [number, number] } })),
    ]);
    const stitched = new Array<number>(width * height * 4).fill(-1);
    tiles.forEach((tile, tileIndex) => {
      const render = tileRenders[tileIndex];
      for (let y = 0; y < tile.viewport[1]; y += 1) {
        for (let x = 0; x < tile.viewport[0]; x += 1) {
          for (let channel = 0; channel < 4; channel += 1) {
            stitched[((tile.offset[1] + y) * width + tile.offset[0] + x) * 4 + channel] = render.pixels[(y * tile.viewport[0] + x) * 4 + channel];
          }
        }
      }
    });
    expect(maxChannelDifference(stitched, full.pixels), `${source} tile seams`).toBeLessThanOrEqual(1);
    // An inverted ramp maps the same field value to the opposite color.
    const gray = redChannel(full);
    const flipped = redChannel(inverted);
    expect(maxChannelDifference(flipped, gray.map(value => 255 - value)), `${source} ramp invariance`).toBeLessThanOrEqual(2);
  }
});

test('influence 0 keeps the plain gradient and cracks 0 removes crack color', async ({ page }) => {
  const size = { width: 64, height: 48 };
  const [thicknessOff, cracksOff, noCracks] = await renderFieldCases(page, [
    { ...size, source: 'thickness', influence: 0 },
    { ...size, source: 'cracks', influence: 0 },
    { ...size, source: 'cracks', cracks: 0 },
  ]);
  expect(thicknessOff.pixels).toEqual(cracksOff.pixels);
  // A linear gradient from left to right: the first column is darker than the last.
  const red = redChannel(thicknessOff);
  expect(red[size.width - 1]).toBeGreaterThan(red[0] + 200);
  expect(Math.max(...redChannel(noCracks))).toBeLessThanOrEqual(1);
});

test('the structure keeps its relative position across output resolutions', async ({ page }) => {
  const [small, large] = await renderFieldCases(page, [
    { width: 96, height: 64, source: 'thickness' },
    { width: 192, height: 128, source: 'thickness' },
  ]);
  const smallRed = redChannel(small);
  const largeRed = redChannel(large);
  let total = 0;
  for (let y = 0; y < 64; y += 1) {
    for (let x = 0; x < 96; x += 1) {
      const sum = largeRed[(2 * y) * 192 + 2 * x] + largeRed[(2 * y) * 192 + 2 * x + 1]
        + largeRed[(2 * y + 1) * 192 + 2 * x] + largeRed[(2 * y + 1) * 192 + 2 * x + 1];
      total += Math.abs(sum / 4 - smallRed[y * 96 + x]);
    }
  }
  // Smooth thickness only differs by sub-pixel sampling positions.
  expect(total / (96 * 64)).toBeLessThan(3);
});

type IceCase = {
  width: number;
  height: number;
  /** Rendered region in full-output pixels (bottom-left origin), default the whole frame. */
  region?: { x: number; y: number; width: number; height: number };
  source: 'gray' | 'stripes' | 'transparentHalf';
  field?: Record<string, number>;
  ice?: Record<string, number | string>;
  /** Surface-noise motion phase in turns. */
  surfacePhase?: number;
};

// Renders the Ice program over a synthetic source in a bare WebGL2 context.
// A region renders exactly like a padded tile: only that part of the source
// is uploaded, and u_tileOffset maps it back to full-output pixels.
async function renderIceCases(page: import('@playwright/test').Page, cases: IceCase[]): Promise<{ input: number[]; output: number[] }[]> {
  return page.evaluate(async (iceCases) => {
    const modulePaths = ['/src/lib/webglShaderSources.ts', '/src/lib/materialField.ts', '/src/types/materialField.ts', '/src/types/ice.ts', '/src/lib/ice.ts'];
    const [sources, field, fieldTypes, iceTypes, iceLib] = await Promise.all(modulePaths.map(path => import(path)));
    const source = (sources as { getProgramSource: (key: string) => { vertex: string; fragment: string } }).getProgramSource('ice');
    const { getMaterialFieldUniforms } = field as typeof import('../../src/lib/materialField');
    const { normalizeMaterialFieldConfig } = fieldTypes as typeof import('../../src/types/materialField');
    const { normalizeIceConfig } = iceTypes as typeof import('../../src/types/ice');
    const { getIceUniformValues } = iceLib as typeof import('../../src/lib/ice');
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL2 is unavailable');
    const compile = (type: number, text: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, text);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'compile failed');
      return shader;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, source.vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, source.fragment));
    gl.bindAttribLocation(program, 0, 'a_position');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? 'link failed');
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = (name: string) => gl.getUniformLocation(program, name);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(u('u_sourceTex'), 3);
    const sourcePixel = (kind: string, x: number, y: number, width: number): number[] => {
      if (kind === 'gray') return [128, 128, 128, 255];
      if (kind === 'transparentHalf') return x < width / 2 ? [128, 128, 128, 255] : [255, 0, 255, 0];
      const band = Math.floor(x / 7) % 3;
      return [band === 0 ? 220 : 40, band === 1 ? 200 : 60, (y * 5) % 256, 255];
    };

    return iceCases.map((iceCase) => {
      const region = iceCase.region ?? { x: 0, y: 0, width: iceCase.width, height: iceCase.height };
      const input = new Uint8Array(region.width * region.height * 4);
      for (let y = 0; y < region.height; y += 1) {
        for (let x = 0; x < region.width; x += 1) {
          input.set(sourcePixel(iceCase.source, region.x + x, region.y + y, iceCase.width), (y * region.width + x) * 4);
        }
      }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, region.width, region.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, input);
      canvas.width = region.width;
      canvas.height = region.height;
      gl.viewport(0, 0, region.width, region.height);
      const mf = normalizeMaterialFieldConfig({ seed: 5, scale: 4, cracks: 0.8, ...iceCase.field });
      const ice = normalizeIceConfig({ enabled: true, ...iceCase.ice });
      const f = getMaterialFieldUniforms(mf, 0.2);
      gl.uniform2f(u('u_resolution'), region.width, region.height);
      gl.uniform2f(u('u_fullResolution'), iceCase.width, iceCase.height);
      gl.uniform2f(u('u_tileOffset'), region.x, region.y);
      const values = getIceUniformValues(ice, f, 0.11, iceCase.surfacePhase ?? 0, iceCase.height);
      for (const [name, value] of Object.entries(values.floats)) gl.uniform1f(u(name), value);
      for (const [name, value] of Object.entries(values.vec2s)) gl.uniform2f(u(name), value[0], value[1]);
      for (const [name, value] of Object.entries(values.vec3s)) gl.uniform3f(u(name), value[0], value[1], value[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      const output = new Uint8Array(region.width * region.height * 4);
      gl.readPixels(0, 0, region.width, region.height, gl.RGBA, gl.UNSIGNED_BYTE, output);
      return { input: Array.from(input), output: Array.from(output) };
    });
  }, cases);
}

const luminance = (pixels: number[], index: number) => (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;

test('Ice keeps the input alpha and never lets hidden transparent colour bleed in', async ({ page }) => {
  const [result] = await renderIceCases(page, [{
    width: 96, height: 64, source: 'transparentHalf',
    ice: { refraction: 1, roughness: 1, absorption: 0, scattering: 0, reflection: 0, backlight: 0 },
  }]);
  for (let index = 0; index < result.output.length; index += 4) {
    expect(result.output[index + 3]).toBe(result.input[index + 3]);
    if (result.input[index + 3] === 255) {
      // Neutral gray stays neutral: no magenta from the transparent half.
      expect(Math.abs(result.output[index] - result.output[index + 1])).toBeLessThanOrEqual(2);
      expect(Math.abs(result.output[index + 2] - result.output[index + 1])).toBeLessThanOrEqual(2);
    }
  }
});

test('frosted haze stays white without absorption and the old crack pattern is gone', async ({ page }) => {
  const size = { width: 128, height: 80, source: 'gray' as const };
  // A flat surface without lights isolates the haze and the absorption.
  const flat = { bump: 0, microBump: 0, roughness: 0, roughnessVariation: 0, highlight: 0, backlight: 0, reflection: 0, refraction: 0 };
  const [cracked, uncracked, frosted, identity, zeroMix] = await renderIceCases(page, [
    { ...size, field: { cracks: 1 }, ice: { ...flat, absorption: 0, scattering: 4 } },
    { ...size, field: { cracks: 0 }, ice: { ...flat, absorption: 0, scattering: 4 } },
    { ...size, ice: { ...flat, roughness: 0.8, absorption: 0, scattering: 4 } },
    { ...size, field: { thickness: 0 }, ice: { ...flat, absorption: 4, scattering: 4 } },
    { ...size, ice: { mix: 0 } },
  ]);
  const maxLuminance = (pixels: number[]) => {
    let max = 0;
    for (let index = 0; index < pixels.length; index += 4) max = Math.max(max, luminance(pixels, index));
    return max;
  };
  const maxDifference = (a: number[], b: number[]) => {
    let max = 0;
    for (let index = 0; index < a.length; index += 1) max = Math.max(max, Math.abs(a[index] - b[index]));
    return max;
  };
  // Cracks belong to the Gradient input only; they leave no pattern in Ice.
  expect(maxDifference(cracked.output, uncracked.output)).toBe(0);
  expect(maxLuminance(uncracked.output)).toBeLessThanOrEqual(130);
  // Rough patches turn white with zero absorption.
  expect(maxLuminance(frosted.output)).toBeGreaterThan(128 + 20);
  // Zero thickness removes absorption; Mix 0 is the input.
  for (const result of [identity, zeroMix]) {
    expect(maxDifference(result.output, result.input)).toBeLessThanOrEqual(1);
  }
});

test('the surface noise evolves, flows, and grows in closed loops', async ({ page }) => {
  const size = { width: 160, height: 90, source: 'stripes' as const };
  const motion = { surfaceCycles: 1, evolution: 1, flow: 0.6, flowAngle: 30, growth: 0.6, lightCycles: 0 };
  const [start, end, quarter, still] = await renderIceCases(page, [
    { ...size, ice: motion, surfacePhase: 0 },
    // resolveMaterialPhase maps time 1 back to phase 0 for whole cycles.
    { ...size, ice: motion, surfacePhase: 1 },
    { ...size, ice: motion, surfacePhase: 0.25 },
    { ...size, ice: { ...motion, evolution: 0, flow: 0, growth: 0 }, surfacePhase: 0.25 },
  ]);
  const [stillStart] = await renderIceCases(page, [{ ...size, ice: { ...motion, evolution: 0, flow: 0, growth: 0 }, surfacePhase: 0 }]);
  let loopDifference = 0;
  let motionDifference = 0;
  let stillDifference = 0;
  for (let index = 0; index < start.output.length; index += 1) {
    loopDifference = Math.max(loopDifference, Math.abs(start.output[index] - end.output[index]));
    motionDifference = Math.max(motionDifference, Math.abs(start.output[index] - quarter.output[index]));
    stillDifference = Math.max(stillDifference, Math.abs(still.output[index] - stillStart.output[index]));
  }
  expect(loopDifference).toBeLessThanOrEqual(1);
  expect(motionDifference).toBeGreaterThan(20);
  // Without evolution, flow, or growth the surface holds still.
  expect(stillDifference).toBe(0);
});

test('padded tiles reproduce the full Ice frame at the screen edges and seams', async ({ page }) => {
  const width = 160;
  const height = 96;
  const padding = await page.evaluate(async (outputHeight) => {
    const path = '/src/lib/ice.ts';
    const { getIceTilePadding } = await import(path) as typeof import('../../src/lib/ice');
    return getIceTilePadding(outputHeight);
  }, height);
  const ice = { refraction: 1, roughness: 1, reflection: 0.6, bump: 1, bevel: 0, microBump: 1, highlight: 1, backlight: 1 };
  const cores = [
    { x: 0, y: 0, width: 80, height: 48 },
    { x: 80, y: 0, width: 80, height: 48 },
    { x: 0, y: 48, width: 80, height: 48 },
    { x: 80, y: 48, width: 80, height: 48 },
  ];
  const regions = cores.map(core => {
    const x = Math.max(0, core.x - padding);
    const y = Math.max(0, core.y - padding);
    return { x, y, width: Math.min(width, core.x + core.width + padding) - x, height: Math.min(height, core.y + core.height + padding) - y };
  });
  const [full, ...tiles] = await renderIceCases(page, [
    { width, height, source: 'stripes', ice },
    ...regions.map(region => ({ width, height, source: 'stripes' as const, ice, region })),
  ]);
  let maxDifference = 0;
  cores.forEach((core, tileIndex) => {
    const region = regions[tileIndex];
    for (let y = 0; y < core.height; y += 1) {
      for (let x = 0; x < core.width; x += 1) {
        const tileOffset = ((core.y - region.y + y) * region.width + (core.x - region.x + x)) * 4;
        const fullOffset = ((core.y + y) * width + core.x + x) * 4;
        for (let channel = 0; channel < 4; channel += 1) {
          maxDifference = Math.max(maxDifference, Math.abs(tiles[tileIndex].output[tileOffset + channel] - full.output[fullOffset + channel]));
        }
      }
    }
  });
  expect(maxDifference).toBeLessThanOrEqual(1);
});

test('the surface noise drives refraction, glossy and frosted patches, and highlights', async ({ page }) => {
  const flat = { bump: 0, microBump: 0, roughness: 0, roughnessVariation: 0, highlight: 0, backlight: 0, reflection: 0, absorption: 0, scattering: 0 };
  const structure = { cracks: 0 };
  const stripes = { width: 192, height: 108, source: 'stripes' as const, field: structure };
  const gray = { width: 192, height: 108, source: 'gray' as const, field: structure };
  const [flatStripes, bumpedStripes, uniformHaze, patchyHaze, noHighlight, highlight] = await renderIceCases(page, [
    { ...stripes, ice: { ...flat, refraction: 1 } },
    { ...stripes, ice: { ...flat, refraction: 1, bump: 1, bevel: 0.2 } },
    { ...gray, ice: { ...flat, roughness: 0.4, roughnessVariation: 0, scattering: 1.5 } },
    { ...gray, ice: { ...flat, roughness: 0.4, roughnessVariation: 1, scattering: 1.5 } },
    { ...gray, ice: { ...flat, bump: 1, bevel: 0.1, microBump: 1 } },
    { ...gray, ice: { ...flat, bump: 1, bevel: 0.1, microBump: 1, highlight: 1 } },
  ]);
  const luminanceRange = (pixels: number[]) => {
    let min = 255;
    let max = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const value = luminance(pixels, index);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    return { min, max, span: max - min };
  };
  const maxDifference = (a: number[], b: number[]) => {
    let max = 0;
    for (let index = 0; index < a.length; index += 1) max = Math.max(max, Math.abs(a[index] - b[index]));
    return max;
  };

  // A flat sheet without lights or structure shows the input; raised areas bend it.
  expect(maxDifference(flatStripes.output, flatStripes.input)).toBeLessThanOrEqual(1);
  expect(maxDifference(bumpedStripes.output, flatStripes.output)).toBeGreaterThan(40);
  // Roughness Variation turns a uniform haze into glossy and frosted patches.
  expect(luminanceRange(patchyHaze.output).span).toBeGreaterThan(luminanceRange(uniformHaze.output).span + 15);
  // The highlight lands on slopes facing the light and only when enabled.
  expect(luminanceRange(noHighlight.output).max).toBeLessThan(170);
  expect(luminanceRange(highlight.output).max).toBeGreaterThan(220);
});
