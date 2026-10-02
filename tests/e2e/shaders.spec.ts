import { expect, test } from '@playwright/test';

type CompileResult = {
  program: string;
  ok: boolean;
  vertexLog: string;
  fragmentLog: string;
  linkLog: string;
  ms: number;
};

// Compiles and links every WebGL program the renderer can request, exactly as
// `getProgramSource` / `getInitialProgramSource` assemble them. This replaces
// source-string assertions as the guard against GLSL syntax, missing
// declarations, duplicate uniforms, and broken #if guards.
test('every WebGL program compiles and links in a real WebGL2 context', async ({ page }) => {
  // Any same-origin document works; a static asset avoids booting the app.
  await page.goto('/favicon.png');

  const results = await page.evaluate(async (): Promise<CompileResult[]> => {
    const sourcesPath = '/src/lib/webglShaderSources.ts';
    const {
      getProgramSource,
      getInitialProgramSource,
      NOISE_TYPE_MAP,
      NOISE_VARIANT_PROGRAM_KEYS,
    } = await import(sourcesPath);
    type Source = { vertex: string; fragment: string };
    const programs: Array<[string, Source]> = [
      ['initial', getInitialProgramSource()],
      ...[
        'generator', 'blur', 'normalMap', 'stretch', 'stackCore', 'noiseStack',
        'noiseDiffuseStack', 'glass', 'glassV2', 'glassTile', 'prism', 'postprocess',
        'prismComposite', 'particles', 'seamless', 'flowSplat', 'flowTrail',
        'flowComposite', 'datamosh', 'texture', 'shapes',
        // One program per 3D shape.
        'threeDCone', 'threeDTorus', 'threeDLattice', 'threeDTerrain',
        'threeDRibbon', 'threeDRings', 'threeDField', 'threeDDiscs',
      ].map(key => [key, getProgramSource(key)] as [string, Source]),
      // The renderer compiles Noise-dependent programs once per Noise type.
      ...(NOISE_VARIANT_PROGRAM_KEYS as readonly string[]).flatMap(key => (
        (Object.values(NOISE_TYPE_MAP) as number[]).map(noiseVariant => (
          [`${key}:${noiseVariant}`, getProgramSource(key, { noiseVariant })] as [string, Source]
        ))
      )),
    ];

    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) throw new Error('WebGL2 is unavailable');
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    return programs.map(([program, source]) => {
      const startedAt = performance.now();
      const vertex = compile(gl.VERTEX_SHADER, source.vertex);
      const fragment = compile(gl.FRAGMENT_SHADER, source.fragment);
      const linked = gl.createProgram()!;
      gl.attachShader(linked, vertex);
      gl.attachShader(linked, fragment);
      gl.bindAttribLocation(linked, 0, 'a_position');
      gl.linkProgram(linked);
      const result = {
        program,
        ok: Boolean(gl.getProgramParameter(linked, gl.LINK_STATUS)),
        vertexLog: gl.getShaderInfoLog(vertex) ?? '',
        fragmentLog: gl.getShaderInfoLog(fragment) ?? '',
        linkLog: gl.getProgramInfoLog(linked) ?? '',
        ms: Math.round(performance.now() - startedAt),
      };
      gl.deleteProgram(linked);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return result;
    });
  });

  for (const result of results) console.log(`[shader] ${result.program}: ${result.ok ? 'ok' : 'FAILED'} (${result.ms}ms)`);
  const failures = results.filter(result => !result.ok);
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
  // 30 base programs (3D has one per shape) plus 13 Noise types for each of the 3 Noise-dependent programs.
  expect(results).toHaveLength(30 + 13 * 3);
});
