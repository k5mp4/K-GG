export type ParameterLimit = {
  min: number;
  max: number;
  step: number;
  /** Initial value used by the document model and resettable UI controls. */
  defaultValue?: number;
  integer?: boolean;
  angleUnit?: 'degrees' | 'radians';
  wrapAngle?: boolean;
};

export type EnumParameterLimit<T extends string = string> = {
  values: readonly T[];
  defaultValue: T;
};

export const PARAMETER_LIMITS = {
  angleDegrees: { min: 0, max: 360, step: 1, angleUnit: 'degrees', wrapAngle: true },
  angleRadians: { min: 0, max: Math.PI * 2, step: Math.PI / 180, angleUnit: 'radians', wrapAngle: true },
  'gradient.angle': { min: 0, max: 360, step: 1, defaultValue: 180, angleUnit: 'degrees', wrapAngle: true },
  'gradient.rampRepeat': { min: 1, max: 20, step: 1, defaultValue: 1, integer: true },
  'gradient.rampVariable': { min: -1, max: 1, step: 0.001, defaultValue: 0 },
  'gradient.rampOffset': { min: -1, max: 1, step: 0.001, defaultValue: 0 },
  'imageGradient.anchorInfluence': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'paletteGenerator.colorIntensity': { min: 0, max: 1, step: 0.01, defaultValue: 0.62 },
  'paletteGenerator.brightness': { min: 0, max: 1, step: 0.01, defaultValue: 0.55 },
  'paletteGenerator.contrast': { min: 0, max: 1, step: 0.01, defaultValue: 0.58 },
  'paletteGenerator.stopCount': { min: 3, max: 10, step: 1, defaultValue: 5, integer: true },
  'paletteGenerator.accentPosition': { min: 0.1, max: 0.9, step: 0.01, defaultValue: 0.58 },
  'paletteGenerator.accentWidth': { min: 0.04, max: 0.5, step: 0.01, defaultValue: 0.18 },

  'noise.amount': { min: 0, max: 1.0, step: 0.01, defaultValue: 0.15 },
  'noise.scale': { min: 0.01, max: 5, step: 0.01, defaultValue: 3 },
  'noise.causticsScale': { min: 0, max: 3, step: 0.01, defaultValue: 2.4 },
  'noise.seed': { min: 0, max: 100, step: 0.1, defaultValue: 0 },
  'noise.octaves': { min: 1, max: 8, step: 1, defaultValue: 3, integer: true },
  'noise.evolution': { min: 0, max: 10, step: 0.01, defaultValue: 0 },
  'noise.speed': { min: 0, max: 2, step: 0.01, defaultValue: 0.5 },
  'noise.curlSteps': { min: 1, max: 8, step: 1, defaultValue: 4, integer: true },
  'noise.curlSpeed': { min: 0, max: 2, step: 0.01, defaultValue: 0.5 },
  'noise.curlEps': { min: 0.001, max: 0.2, step: 0.001, defaultValue: 0.01 },
  'noise.noiseLoopBlend': { min: 0, max: 1, step: 0.01, defaultValue: 0.75 },
  'noise.seamlessTwist': { min: -20, max: 20, step: 0.1, defaultValue: 0 },
  'noise.voronoiRandomness': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'noise.voronoiMinkowskiExp': { min: 0.5, max: 8, step: 0.1, defaultValue: 2 },
  'noise.ridgeWarp': { min: 0, max: 4, step: 0.05, defaultValue: 1 },
  'noise.ridgeSharpness': { min: 0.5, max: 6, step: 0.1, defaultValue: 2 },
  'noise.ridgeOffset': { min: 0, max: 2, step: 0.05, defaultValue: 1 },
  'noise.ridgeLacunarity': { min: 1.1, max: 4, step: 0.05, defaultValue: 2 },
  'noise.ridgePersistence': { min: 0.1, max: 1, step: 0.01, defaultValue: 0.6 },
  'noise.ridgeGain': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'noise.perlinRoughness': { min: 0, max: 1, step: 0.01, defaultValue: 0.29 },
  'noise.perlinSharpness': { min: 1, max: 8, step: 0.1, defaultValue: 4 },
  'noise.perlinLayerMix': { min: 0, max: 1, step: 0.01, defaultValue: 0.56 },
  'noise.perlinAngle': { min: 0, max: 360, step: 1, defaultValue: 90, angleUnit: 'degrees', wrapAngle: true },
  'noise.perlinLoopWobble': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'noise.aeSubInfluence': { min: 0.01, max: 1, step: 0.01, defaultValue: 0.7 },
  'noise.aeSubScaling': { min: 1.01, max: 4, step: 0.01, defaultValue: 1.78 },
  'noise.aeContrast': { min: 0.5, max: 4, step: 0.05, defaultValue: 1 },
  'noise.aeBrightness': { min: -1, max: 1, step: 0.01, defaultValue: 0 },
  'noise.dwInitAmp': { min: 0.1, max: 8, step: 0.05, defaultValue: 1 },
  'noise.dwInitVal': { min: 0.01, max: 2, step: 0.01, defaultValue: 0.1 },
  'noise.dwDist1': { min: 0, max: 0.001, step: 0.00001, defaultValue: 0.00001 },
  'noise.dwDist2': { min: 0, max: 0.1, step: 0.001, defaultValue: 0.005 },
  'noise.dwDist3': { min: 0, max: 0.5, step: 0.005, defaultValue: 0.12 },
  'noise.dwRotAngle1': { min: 0, max: Math.PI * 2, step: Math.PI / 180, defaultValue: 0.5, angleUnit: 'radians', wrapAngle: true },
  'noise.dwRotAngle2': { min: 0, max: Math.PI * 2, step: Math.PI / 180, defaultValue: 0.1, angleUnit: 'radians', wrapAngle: true },
  'noise.dwDriftAngle': { min: 0, max: 360, step: 1, defaultValue: 45, angleUnit: 'degrees', wrapAngle: true },
  'noise.aeSubRotation': { min: 0, max: 360, step: 1, defaultValue: 45, angleUnit: 'degrees', wrapAngle: true },
  'noise.causticsDepth': { min: 0.05, max: 3, step: 0.01, defaultValue: 0.65 },
  'noise.causticsRefraction': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'noise.causticsSharpness': { min: 0.5, max: 8, step: 0.05, defaultValue: 2.5 },
  'noise.causticsComplexity': { min: 2, max: 8, step: 1, defaultValue: 4, integer: true },
  'noise.causticsWaveSpread': { min: 0, max: 1, step: 0.01, defaultValue: 0.75 },
  'noise.causticsBoundaryWidth': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.75 },
  'noise.phasorFrequency': { min: 0.5, max: 20, step: 0.05, defaultValue: 5 },
  'noise.phasorBandwidth': { min: 0.1, max: 2, step: 0.01, defaultValue: 0.8 },
  'noise.phasorDirection': { min: 0, max: 360, step: 1, defaultValue: 28, angleUnit: 'degrees', wrapAngle: true },
  'noise.phasorDirectionSpread': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'noise.phasorSharpness': { min: 0.5, max: 10, step: 0.05, defaultValue: 3 },
  'noise.phasorWarpStrength': { min: 0, max: 1, step: 0.01, defaultValue: 0.18 },
  'noise.phasorTangentMix': { min: 0, max: 1, step: 0.01, defaultValue: 0.65 },
  'noise.phasorKernelDensity': { min: 0.25, max: 2, step: 0.01, defaultValue: 1 },
  'noise.chladniPatternCount': { min: 2, max: 4, step: 1, defaultValue: 3, integer: true },
  'noise.chladniComplexity': { min: 1, max: 8, step: 1, defaultValue: 4, integer: true },
  'noise.chladniLineWidth': { min: 0.01, max: 1, step: 0.01, defaultValue: 0.1 },
  'noise.chladniSharpness': { min: 0.5, max: 8, step: 0.05, defaultValue: 2 },
  'noise.chladniWarpStrength': { min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
  'noise.chladniRotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'noise.chladniMapAngle': { min: 0, max: 360, step: 1, defaultValue: 90, angleUnit: 'degrees', wrapAngle: true },
  'noise.chladniModeMix': { min: -1, max: 1, step: 0.01, defaultValue: 1 },
  'noise.chladniEdge': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'noise.chladniDetune': { min: 0, max: 1, step: 0.01, defaultValue: 0 },

  'diffuse.scatter': { min: 0, max: 300, step: 1, defaultValue: 70 },
  'diffuse.grain': { min: 0.01, max: 5, step: 0.01, defaultValue: 2 },
  'diffuse.ditherGrain': { min: 0.01, max: 12, step: 0.01, defaultValue: 2 },
  'diffuse.halftoneGrain': { min: 2, max: 64, step: 1, defaultValue: 2, integer: true },
  'diffuse.asciiGrain': { min: 4, max: 64, step: 1, defaultValue: 4, integer: true },
  'diffuse.seed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'diffuse.ditherThreshold': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'diffuse.halftoneSize': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.82 },
  'diffuse.grainAdaptiveAmount': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'diffuse.asciiFontSize': { min: 8, max: 128, step: 1, defaultValue: 29, integer: true },
  'diffuse.asciiRotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },

  'flow.seed': { min: 0, max: 9999, step: 1, defaultValue: 42, integer: true },
  'flow.particleCount': { min: 10000, max: 500000, step: 1000, defaultValue: 100000, integer: true },
  'flow.curlScale': { min: 0.1, max: 20, step: 0.1, defaultValue: 2.5 },
  'flow.curlStrength': { min: 0, max: 2, step: 0.01, defaultValue: 1 },
  'flow.speed': { min: 0, max: 2, step: 0.01, defaultValue: 0.6 },
  'flow.ribbonWidth': { min: 0.5, max: 128, step: 0.5, defaultValue: 8 },
  'flow.stretch': { min: 0, max: 8, step: 0.05, defaultValue: 1.5 },
  'flow.density': { min: 0, max: 4, step: 0.01, defaultValue: 1 },
  'flow.trail': { min: 0, max: 1, step: 0.01, defaultValue: 0.85 },
  'flow.contrast': { min: 0.1, max: 4, step: 0.01, defaultValue: 1.2 },
  'flow.flowOpacity': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'flow.particleOpacity': { min: 0, max: 1, step: 0.01, defaultValue: 0.82 },
  'flow.particleSize': { min: 0.25, max: 2, step: 0.01, defaultValue: 1 },

  'slit.angle': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'slit.offsetAngle': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'slit.offset': { min: 0, max: 1, step: 0.001, defaultValue: 1 },
  'slit.waveHeight': { min: -500, max: 500, step: 1, defaultValue: 80 },
  'slit.polygonSides': { min: 3, max: 32, step: 1, defaultValue: 6, integer: true },
  'slit.slitWidth': { min: 1, max: 500, step: 1, defaultValue: 80, integer: true },
  'slit.offsetSpeed': { min: -2, max: 2, step: 0.01, defaultValue: 0.3 },
  'slit.variance': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'slit.edgeSize': { min: 0, max: 250, step: 1, defaultValue: 40 },
  'slit.edgeLength': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.25 },
  'slit.edgeLengthVariance': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'slit.edgeSpeedVariance': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'slit.seed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },

  'stretch.bandHeight': { min: 1, max: 600, step: 1, defaultValue: 18, integer: true },
  'stretch.bandHeightVariance': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'stretch.variation': { min: 0, max: 1, step: 0.01, defaultValue: 0.42 },
  'stretch.seed': { min: 0, max: 99, step: 1, defaultValue: 12, integer: true },
  'stretch.glowIntensity': { min: 0, max: 3, step: 0.01, defaultValue: 0.6 },
  'stretch.glowRadius': { min: 1, max: 80, step: 1, defaultValue: 18, integer: true },
  'stretch.glowThreshold': { min: 0, max: 1, step: 0.01, defaultValue: 0.55 },

  'normalMap.strength': { min: 0.01, max: 3, step: 0.01, defaultValue: 0.3 },
  'normalMap.blur': { min: 0, max: 20, step: 0.5, defaultValue: 2 },
  'normalMap.angle': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'normalMap.bevelSize': { min: 0, max: 100, step: 0.01, defaultValue: 1 },

  'cloth.amplitude1': { min: 0, max: 3, step: 0.01, defaultValue: 0.4 },
  'cloth.amplitude2': { min: 0, max: 3, step: 0.01, defaultValue: 0.25 },
  'cloth.frequency1': { min: 0.01, max: 20, step: 0.1, defaultValue: 1.5 },
  'cloth.frequency2': { min: 0.01, max: 20, step: 0.1, defaultValue: 2.2 },
  'cloth.speed1': { min: -10, max: 10, step: 0.1, defaultValue: 0.8 },
  'cloth.speed2': { min: -10, max: 10, step: 0.1, defaultValue: 1.2 },
  'cloth.normalStrength': { min: 0, max: 5, step: 0.05, defaultValue: 1.2 },
  'cloth.warpStrength': { min: 0, max: 3, step: 0.05, defaultValue: 0.35 },
  'cloth.noiseScale': { min: 0.01, max: 20, step: 0.1, defaultValue: 2.5 },
  'cloth.noiseAmplitude': { min: 0, max: 3, step: 0.01, defaultValue: 0.15 },
  'cloth.noiseSpeed': { min: -10, max: 10, step: 0.1, defaultValue: 0.5 },
  'cloth.ambientIntensity': { min: 0, max: 5, step: 0.05, defaultValue: 0.25 },
  'cloth.lightIntensity': { min: 0, max: 10, step: 0.1, defaultValue: 1.8 },
  'cloth.lightAzimuth': { min: -360, max: 360, step: 1, defaultValue: 45 },
  'cloth.lightElevation': { min: -90, max: 90, step: 1, defaultValue: 60 },
  'cloth.specularStrength': { min: 0, max: 5, step: 0.05, defaultValue: 0.8 },
  'cloth.specularPower': { min: 1, max: 256, step: 1, defaultValue: 32, integer: true },
  'cloth.fresnelPower': { min: 0.1, max: 32, step: 0.1, defaultValue: 3 },
  'cloth.fresnelColorStrength': { min: 0, max: 5, step: 0.05, defaultValue: 0.4 },
  'cloth.rampOffset': { min: -2, max: 2, step: 0.01, defaultValue: 0 },

  'cone.depth': { min: 2, max: 30, step: 0.1, defaultValue: 6 },
  'cone.rotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'cone.textureRepeat': { min: 1, max: 8, step: 1, defaultValue: 1, integer: true },
  'cone.flowCycles': { min: -30, max: 30, step: 1, defaultValue: 1, integer: true },
  'cone.apexX': { min: -2, max: 2, step: 0.01, defaultValue: 0 },
  'cone.apexY': { min: -2, max: 2, step: 0.01, defaultValue: 0 },
  'cone.seamBlend': { min: 0, max: 0.5, step: 0.01, defaultValue: 0.25 },
  'cone.fog': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'cone.shade': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'cone.latticeScale': { min: 0.5, max: 8, step: 0.05, defaultValue: 2 },
  'cone.latticeThickness': { min: 0.02, max: 0.9, step: 0.01, defaultValue: 0.25 },
  'cone.terrainHeight': { min: 0, max: 2, step: 0.01, defaultValue: 0.6 },
  'cone.terrainAltitude': { min: 0.1, max: 3, step: 0.01, defaultValue: 1 },
  'cone.coneTwist': { min: -4, max: 4, step: 0.05, defaultValue: 0 },
  'cone.ribbonCount': { min: 1, max: 12, step: 1, defaultValue: 6, integer: true },
  'cone.ribbonRadius': { min: 0.2, max: 2, step: 0.01, defaultValue: 0.7 },
  'cone.ribbonStagger': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'cone.ribbonTwist': { min: -8, max: 8, step: 1, defaultValue: 1, integer: true },
  'cone.ribbonLength': { min: 4, max: 64, step: 0.5, defaultValue: 16 },
  'cone.ribbonHalfTwists': { min: 0, max: 12, step: 1, defaultValue: 1, integer: true },
  'cone.ribbonWidth': { min: 0.05, max: 0.6, step: 0.01, defaultValue: 0.15 },
  'cone.discsCount': { min: 2, max: 48, step: 1, defaultValue: 12, integer: true },
  'cone.discsGap': { min: 0, max: 0.9, step: 0.01, defaultValue: 0.2 },
  'cone.discsThickness': { min: 0.01, max: 0.5, step: 0.01, defaultValue: 0.06 },
  'cone.discsSpread': { min: 0, max: 2, step: 0.01, defaultValue: 0.5 },
  'cone.discsWaves': { min: 0, max: 4, step: 0.05, defaultValue: 1 },
  'cone.discsScatter': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'cone.discsSpin': { min: -8, max: 8, step: 1, defaultValue: 1, integer: true },
  'cone.discsTwist': { min: -45, max: 45, step: 0.5, defaultValue: 0 },
  'cone.discsOffset': { min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
  'cone.discsTilt': { min: 0, max: 75, step: 0.5, defaultValue: 12 },
  'cone.discsTiltTurns': { min: -4, max: 4, step: 1, defaultValue: 1, integer: true },
  'cone.discsView': { min: 0, max: 85, step: 0.5, defaultValue: 35 },
  'cone.discsOrbit': { min: -4, max: 4, step: 1, defaultValue: 1, integer: true },
  'cone.crystalCount': { min: 1, max: 24, step: 1, defaultValue: 12, integer: true },
  'cone.crystalSize': { min: 0.3, max: 2, step: 0.01, defaultValue: 1.2 },
  'cone.crystalLength': { min: 1, max: 5, step: 0.05, defaultValue: 2.6 },
  'cone.crystalSpread': { min: 0.2, max: 2, step: 0.01, defaultValue: 1 },
  'cone.crystalSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'cone.crystalIor': { min: 1, max: 2.4, step: 0.01, defaultValue: 1.6 },
  'cone.crystalDispersion': { min: 0, max: 0.3, step: 0.005, defaultValue: 0.08 },
  'cone.crystalDispersionSteps': { min: 1, max: 10, step: 1, defaultValue: 3, integer: true },
  'cone.crystalFaceOpacity': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'cone.crystalReflection': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'cone.crystalBackdrop': { min: 0.1, max: 4, step: 0.01, defaultValue: 1 },
  'cone.crystalSpin': { min: -8, max: 8, step: 1, defaultValue: 1, integer: true },
  'cone.crystalRevolve': { min: -4, max: 4, step: 1, defaultValue: 0, integer: true },
  'cone.abstractCount': { min: 2, max: 8, step: 1, defaultValue: 5, integer: true },
  'cone.abstractSize': { min: 0.3, max: 1.6, step: 0.01, defaultValue: 1 },
  'cone.abstractDisplace': { min: 0, max: 1, step: 0.01, defaultValue: 0.45 },
  'cone.abstractFrequency': { min: 0.5, max: 4, step: 0.01, defaultValue: 1.4 },
  'cone.abstractTwist': { min: -360, max: 360, step: 1, defaultValue: 30 },
  'cone.abstractMorph': { min: -4, max: 4, step: 1, defaultValue: 1, integer: true },
  'cone.abstractPulse': { min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
  'cone.abstractSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'cone.abstractIor': { min: 1, max: 2.4, step: 0.01, defaultValue: 1.45 },
  'cone.abstractDispersion': { min: 0, max: 0.3, step: 0.005, defaultValue: 0.12 },
  'cone.abstractDispersionSteps': { min: 1, max: 10, step: 1, defaultValue: 6, integer: true },
  'cone.abstractReflection': { min: 0, max: 1, step: 0.01, defaultValue: 0.6 },
  'cone.abstractThinFilm': { min: 0, max: 1, step: 0.01, defaultValue: 0.4 },
  'cone.abstractFilmThickness': { min: 100, max: 1200, step: 10, defaultValue: 420 },
  'cone.abstractLights': { min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
  'cone.abstractBackground': { min: 0, max: 1, step: 0.01, defaultValue: 0.25 },
  'cone.abstractBackdrop': { min: 0.1, max: 4, step: 0.01, defaultValue: 1 },
  'cone.abstractSpin': { min: -4, max: 4, step: 1, defaultValue: 1, integer: true },
  'cone.abstractElevation': { min: -90, max: 90, step: 1, defaultValue: 0 },
  'cone.abstractTumble': { min: -4, max: 4, step: 1, defaultValue: 0, integer: true },
  'cone.ringsPerTile': { min: 1, max: 32, step: 1, defaultValue: 8, integer: true },
  'cone.ringsSpacing': { min: 0.3, max: 4, step: 0.01, defaultValue: 1 },
  'cone.ringsThickness': { min: 0.02, max: 0.6, step: 0.01, defaultValue: 0.12 },
  'cone.ringsDepth': { min: 0.01, max: 1, step: 0.01, defaultValue: 0.06 },
  'cone.ringsTwist': { min: -45, max: 45, step: 0.5, defaultValue: 0 },
  'cone.ringsPulse': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'cone.ringsBeats': { min: 0, max: 16, step: 1, defaultValue: 4, integer: true },
  'cone.ringsAmount': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'cone.fieldLoopCells': { min: 4, max: 64, step: 1, defaultValue: 16, integer: true },
  'cone.fieldDensity': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.3 },
  'cone.fieldSize': { min: 0.2, max: 1, step: 0.01, defaultValue: 0.75 },
  'cone.fieldClearance': { min: 1, max: 5, step: 0.05, defaultValue: 1.5 },
  'cone.fieldSpread': { min: 2, max: 12, step: 0.1, defaultValue: 5 },
  'cone.fieldArms': { min: 0, max: 8, step: 1, defaultValue: 0, integer: true },
  'cone.fieldTwist': { min: -8, max: 8, step: 1, defaultValue: 1, integer: true },
  'cone.fieldArmWidth': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.35 },
  'cone.fieldWire': { min: 0.005, max: 0.12, step: 0.005, defaultValue: 0.03 },
  'cone.fieldVariation': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'cone.cameraFov': { min: 15, max: 150, step: 1, defaultValue: 60 },
  'cone.fisheyeAngle': { min: 90, max: 360, step: 1, defaultValue: 180 },
  'cone.lensDistortion': { min: -0.5, max: 0.5, step: 0.01, defaultValue: 0 },
  'cone.cameraDolly': { min: -1, max: 1, step: 0.01, defaultValue: 0 },
  'cone.torusAim': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'cone.torusBend': { min: 0.05, max: 0.9, step: 0.01, defaultValue: 0.3 },
  'cone.ringRepeat': { min: 1, max: 64, step: 1, defaultValue: 12, integer: true },
  'cone.cameraX': { min: -0.8, max: 0.8, step: 0.01, defaultValue: 0 },
  'cone.cameraY': { min: -0.8, max: 0.8, step: 0.01, defaultValue: 0 },
  'cone.cameraYaw': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'cone.cameraPitch': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'cone.cameraRollLoop': { min: -8, max: 8, step: 1, defaultValue: 0, integer: true },
  'cone.cameraYawLoop': { min: -8, max: 8, step: 1, defaultValue: 0, integer: true },
  'cone.cameraPitchLoop': { min: -8, max: 8, step: 1, defaultValue: 0, integer: true },
  'cone.torusTwist': { min: -4, max: 4, step: 0.05, defaultValue: 0 },
  'cone.spin': { min: -8, max: 8, step: 1, defaultValue: 0, integer: true },
  'cone.wiggleAmount': { min: 0, max: 2, step: 0.01, defaultValue: 1 },
  'cone.wiggleSpeed': { min: 1, max: 8, step: 1, defaultValue: 1, integer: true },

  'seamless.blendWidth': { min: 0.02, max: 0.5, step: 0.01, defaultValue: 0.25 },

  'texture.strength': { min: 0, max: 1, step: 0.01, defaultValue: 0.85 },
  'texture.scale': { min: 0.25, max: 8, step: 0.05, defaultValue: 1 },
  'texture.rotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'texture.bump': { min: -2, max: 2, step: 0.01, defaultValue: 0.6 },
  'texture.centerX': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'texture.centerY': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'texture.roughness': { min: 0.05, max: 1, step: 0.01, defaultValue: 0.3 },
  'texture.anisotropy': { min: 0, max: 1, step: 0.01, defaultValue: 0.75 },
  'texture.metallic': { min: 0, max: 1, step: 0.01, defaultValue: 0.7 },
  'texture.specular': { min: 0, max: 2, step: 0.01, defaultValue: 1 },
  'texture.lightAngle': { min: 0, max: 360, step: 1, defaultValue: 40, angleUnit: 'degrees', wrapAngle: true },
  'texture.lightHeight': { min: 0.15, max: 2, step: 0.01, defaultValue: 0.55 },
  'texture.lightSweep': { min: -4, max: 4, step: 1, defaultValue: 0, integer: true },
  'texture.diffraction': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'texture.diffractionSpread': { min: 0.25, max: 4, step: 0.05, defaultValue: 1 },

  // Distort Chroma. Amount is in output pixels; Bump scales the Lens luminance slope.
  'distortChroma.amountX': { min: -300, max: 300, step: 0.5, defaultValue: 24 },
  'distortChroma.amountY': { min: -300, max: 300, step: 0.5, defaultValue: 24 },
  'distortChroma.warpRed': { min: -3, max: 3, step: 0.01, defaultValue: 0.5 },
  'distortChroma.warpBlue': { min: -3, max: 3, step: 0.01, defaultValue: 1 },
  'distortChroma.steps': { min: 3, max: 32, step: 1, defaultValue: 12, integer: true },
  'distortChroma.bump': { min: 0, max: 200, step: 0.1, defaultValue: 20 },
  'distortChroma.rotate': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'distortChroma.lensBlur': { min: 0, max: 32, step: 0.5, defaultValue: 2 },

  // SANDBOX Shapes. Lengths are fractions of the shape's shorter content side,
  // so the look stays the same when the SVG or the canvas size changes.
  'shapes.scale': { min: 0.1, max: 1.5, step: 0.01, defaultValue: 0.7 },
  'shapes.offsetX': { min: -1, max: 1, step: 0.01, defaultValue: 0 },
  'shapes.offsetY': { min: -1, max: 1, step: 0.01, defaultValue: 0 },
  'shapes.rotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'shapes.softness': { min: 0, max: 0.1, step: 0.001, defaultValue: 0.015 },
  'shapes.innerShadow': { min: 0, max: 1, step: 0.01, defaultValue: 0.9 },
  'shapes.innerShadowSize': { min: 0.01, max: 0.5, step: 0.005, defaultValue: 0.2 },
  'shapes.shadowOffset': { min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
  'shapes.lightAngle': { min: 0, max: 360, step: 1, defaultValue: 135, angleUnit: 'degrees', wrapAngle: true },
  'shapes.fillAmount': { min: 0, max: 1, step: 0.01, defaultValue: 0.65 },
  'shapes.fillScale': { min: 0.05, max: 2, step: 0.01, defaultValue: 0.45 },
  'shapes.fillWarp': { min: 0, max: 2, step: 0.01, defaultValue: 0.8 },
  'shapes.fillAngle': { min: 0, max: 360, step: 1, defaultValue: 45, angleUnit: 'degrees', wrapAngle: true },
  'shapes.fillCycles': { min: -8, max: 8, step: 1, defaultValue: 1, integer: true },
  'shapes.glowRadius': { min: 0, max: 0.3, step: 0.005, defaultValue: 0.1 },
  'shapes.glowIntensity': { min: 0, max: 2, step: 0.01, defaultValue: 1.2 },
  'shapes.contrast': { min: 0.25, max: 4, step: 0.01, defaultValue: 1 },
  'shapes.grain': { min: 0, max: 0.5, step: 0.01, defaultValue: 0.04 },
  'shapes.revealCycles': { min: 1, max: 8, step: 1, defaultValue: 1, integer: true },
  'shapes.revealTransition': { min: 0.02, max: 0.5, step: 0.01, defaultValue: 0.2 },
  'shapes.revealHidden': { min: 0, max: 0.9, step: 0.01, defaultValue: 0.2 },
  'shapes.revealOffset': { min: 0, max: 1, step: 0.01, defaultValue: 0 },

  'manualDistort.brushSize': { min: 8, max: 640, step: 1, defaultValue: 120, integer: true },
  'manualDistort.strength': { min: 0.05, max: 4, step: 0.01, defaultValue: 1 },
  'manualDistort.falloff': { min: 0.25, max: 5, step: 0.05, defaultValue: 1.8 },
  'manualDistort.maxDisplacement': { min: 0.02, max: 2, step: 0.01, defaultValue: 1 },

  'postprocess.kaleidoscopeSlices': { min: 2, max: 24, step: 1, defaultValue: 8, integer: true },
  'postprocess.kaleidoscopeRotation': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.kaleidoscopeZoom': { min: 0.25, max: 4, step: 0.01, defaultValue: 1 },
  'postprocess.prismRayCount': { min: 1, max: 96, step: 1, defaultValue: 24, integer: true },
  'postprocess.prismLength': { min: 0.05, max: 1.5, step: 0.01, defaultValue: 0.65 },
  'postprocess.prismLengthRandomness': { min: 0, max: 1, step: 0.01, defaultValue: 0.45 },
  'postprocess.prismWidth': { min: 0.001, max: 0.08, step: 0.001, defaultValue: 0.018 },
  'postprocess.prismRandomness': { min: 0, max: 1, step: 0.01, defaultValue: 0.45 },
  'postprocess.prismBlur': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'postprocess.prismIntensity': { min: 0, max: 3, step: 0.01, defaultValue: 0.9 },
  'postprocess.prismGlowRadius': { min: 0, max: 80, step: 1, defaultValue: 18, integer: true },
  'postprocess.prismChromaticAberration': { min: 0, max: 40, step: 0.1, defaultValue: 4 },
  'postprocess.prismInnerRadius': { min: 0, max: 0.8, step: 0.01, defaultValue: 0.16 },
  'postprocess.prismCenterX': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'postprocess.prismCenterY': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'postprocess.prismSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'postprocess.voronoiScale': { min: 1, max: 48, step: 0.1, defaultValue: 8 },
  'postprocess.voronoiRandomness': { min: 0, max: 1, step: 0.01, defaultValue: 0.85 },
  'postprocess.voronoiAngle': { min: 0, max: 360, step: 1, defaultValue: 35, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.voronoiMinkowskiExp': { min: 0.5, max: 8, step: 0.1, defaultValue: 2 },
  'postprocess.voronoiGradientScale': { min: 0.25, max: 4, step: 0.01, defaultValue: 1.15 },
  'postprocess.voronoiEdgeWidth': { min: 0, max: 0.2, step: 0.001, defaultValue: 0.025 },
  'postprocess.voronoiSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'postprocess.glassScale': { min: 0.5, max: 12, step: 0.1, defaultValue: 3.2 },
  'postprocess.glassStretch': { min: 0.25, max: 8, step: 0.05, defaultValue: 4 },
  'postprocess.glassRotation': { min: 0, max: 360, step: 1, defaultValue: 12, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.glassComplexity': { min: 1, max: 5, step: 1, defaultValue: 4, integer: true },
  'postprocess.glassWarp': { min: 0, max: 1, step: 0.01, defaultValue: 0.55 },
  'postprocess.glassSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'postprocess.glassNoiseInfluence': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'postprocess.glassRippleFrequency': { min: 0.5, max: 18, step: 0.1, defaultValue: 6 },
  'postprocess.glassRippleDepth': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'postprocess.glassRippleSpeed': { min: 1, max: 8, step: 1, defaultValue: 1, integer: true },
  'postprocess.glassRefraction': { min: 0, max: 120, step: 0.5, defaultValue: 32 },
  'postprocess.glassIor': { min: 1, max: 2.5, step: 0.01, defaultValue: 1.5 },
  'postprocess.glassChromaticAberration': { min: 0, max: 80, step: 0.1, defaultValue: 4 },
  'postprocess.glassChromaticSteps': { min: 1, max: 3, step: 1, defaultValue: 1, integer: true },
  'postprocess.glassRoughness': { min: 0, max: 12, step: 0.1, defaultValue: 1.5 },
  'postprocess.glassHighlight': { min: 0, max: 2, step: 0.01, defaultValue: 0.45 },
  'postprocess.glassMix': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'postprocess.glassV2ChromaticHue': { min: -180, max: 180, step: 1, defaultValue: 0 },
  'postprocess.glassV2ChromaticSaturation': { min: 0, max: 2, step: 0.01, defaultValue: 1 },
  'postprocess.glassEvolution': { min: 0, max: 1, step: 0.001, defaultValue: 0 },
  'postprocess.glassMotion': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'postprocess.glassTileSize': { min: 1, max: 100, step: 0.1, defaultValue: 12, integer: true },
  'postprocess.glassTileFacetDensity': { min: 1, max: 16, step: 0.1, defaultValue: 5 },
  'postprocess.glassTileFacetDepth': { min: 0, max: 1, step: 0.01, defaultValue: 0.48 },
  'postprocess.glassTileBevel': { min: 0.01, max: 0.5, step: 0.01, defaultValue: 0.18 },
  'postprocess.glassTileSurfaceHeight': { min: 0, max: 1, step: 0.01, defaultValue: 0.45 },
  'postprocess.glassTileCurvature': { min: 0, max: 1, step: 0.01, defaultValue: 0.75 },
  'postprocess.glassTileRefraction': { min: 0, max: 256, step: 0.5, defaultValue: 28 },
  'postprocess.glassTileDispersion': { min: 0, max: 1, step: 0.01, defaultValue: 0.06 },
  'postprocess.glassTileRoughness': { min: 0, max: 1, step: 0.01, defaultValue: 0.12 },
  'postprocess.glassTileDetailScale': { min: 0.1, max: 16, step: 0.1, defaultValue: 2 },
  'postprocess.glassTileRotation': { min: -180, max: 180, step: 1, defaultValue: 0 },
  'postprocess.glassTileMix': { min: 0, max: 1, step: 0.01, defaultValue: 1 },
  'postprocess.glassTileSeed': { min: 0, max: 1000000, step: 1, defaultValue: 17, integer: true },
  'postprocess.particleEmitterPointX': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'postprocess.particleEmitterPointY': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'postprocess.particleCount': { min: 1000, max: 500000, step: 1000, defaultValue: 180000, integer: true },
  'postprocess.particleSeed': { min: 0, max: 99, step: 1, defaultValue: 0, integer: true },
  'postprocess.particleSize': { min: 0.5, max: 18, step: 0.1, defaultValue: 2.8 },
  'postprocess.particleSizeRandomness': { min: 0, max: 1, step: 0.01, defaultValue: 0.65 },
  'postprocess.particleFeather': { min: 0, max: 1, step: 0.01, defaultValue: 0.82 },
  'postprocess.particleCore': { min: 0, max: 1, step: 0.01, defaultValue: 0.35 },
  'postprocess.particleLifeCycle': { min: 0.25, max: 20, step: 0.05, defaultValue: 4 },
  'postprocess.particleLifeRandom': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'postprocess.particleSizeOverLife': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'postprocess.particleSpeed': { min: 0, max: 2, step: 0.01, defaultValue: 0.48 },
  'postprocess.particleDirection': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'postprocess.particleSpread': { min: 0, max: 1, step: 0.01, defaultValue: 0.72 },
  'postprocess.particleTurbulence': { min: 0, max: 1, step: 0.01, defaultValue: 0.72 },
  'postprocess.particleCurlScale': { min: 0.5, max: 16, step: 0.1, defaultValue: 5.5 },
  'postprocess.particleCurlStrength': { min: 0, max: 2, step: 0.01, defaultValue: 0.88 },
  'postprocess.particleCurlSpeed': { min: 0, max: 3, step: 0.01, defaultValue: 0.9 },
  'postprocess.particleCurlEvolution': { min: 0, max: 10, step: 0.01, defaultValue: 0 },
  'postprocess.particleRadialForce': { min: -2, max: 2, step: 0.01, defaultValue: 0.18 },
  'postprocess.particleRadialFalloff': { min: 0.1, max: 3, step: 0.01, defaultValue: 0.85 },
  'postprocess.particleDepth': { min: 0, max: 2, step: 0.01, defaultValue: 0.75 },
  'postprocess.particleBrightness': { min: 0.1, max: 4, step: 0.01, defaultValue: 1.25 },
  'postprocess.particleOpacity': { min: 0, max: 1, step: 0.01, defaultValue: 0.86 },
  'postprocess.particleColorVariance': { min: 0, max: 0.5, step: 0.01, defaultValue: 0.12 },
  'postprocess.particleColorOverLife': { min: 0, max: 1, step: 0.01, defaultValue: 0 },
  'postprocess.particleEdgeFade': { min: 0, max: 1, step: 0.01, defaultValue: 0 },

  'animation.direction': { min: 0, max: 360, step: 1, defaultValue: 0, angleUnit: 'degrees', wrapAngle: true },
  'animation.speed': { min: 0.01, max: 8, step: 0.01, defaultValue: 1 },
  'animation.rampOffsetSpeed': { min: -8, max: 8, step: 1, defaultValue: 0, integer: true },
  'animation.intensity': { min: 0, max: 1, step: 0.01, defaultValue: 0.5 },
  'animation.duration': { min: 1, max: 10, step: 0.1, defaultValue: 5 },
} as const satisfies Record<string, ParameterLimit>;

/** Shared Voronoi choices are used by Noise and Postprocess. */
const VORONOI_DISTANCE_METRIC_LIMIT = {
  values: ['euclidean', 'manhattan', 'chebyshev', 'minkowski'],
  defaultValue: 'euclidean',
} as const satisfies EnumParameterLimit;
const VORONOI_FEATURE_LIMIT = {
  values: ['f1', 'f2', 'distance_to_edge'],
  defaultValue: 'f1',
} as const satisfies EnumParameterLimit;

/** Defaults and valid values for selectable parameters that are not numeric. */
export const ENUM_PARAMETER_LIMITS = {
  'noise.voronoiDistMetric': VORONOI_DISTANCE_METRIC_LIMIT,
  'noise.voronoiFeature': VORONOI_FEATURE_LIMIT,
  'noise.perlinDimension': {
    values: ['3d', '4d'],
    defaultValue: '3d',
  },
  'noise.chladniMode': {
    values: ['warp', 'map'],
    defaultValue: 'warp',
  },
  'noise.chladniMapProfile': {
    values: ['signed', 'folded'],
    defaultValue: 'signed',
  },
  'texture.source': {
    values: ['procedural', 'image'],
    defaultValue: 'procedural',
  },
  'texture.preset': {
    values: ['brushedMetal', 'spunMetal', 'cdGroove', 'paper'],
    defaultValue: 'brushedMetal',
  },
  'texture.imageFit': {
    values: ['cover', 'tile'],
    defaultValue: 'cover',
  },
  'distortChroma.lensSource': {
    values: ['source', 'image'],
    defaultValue: 'source',
  },
  'distortChroma.wrap': {
    values: ['clamp', 'repeat', 'mirror'],
    defaultValue: 'clamp',
  },
  'shapes.source': {
    values: ['circle', 'star', 'text', 'custom'],
    defaultValue: 'star',
  },
  'shapes.fillSource': {
    values: ['flow', 'ripple', 'stripes', 'render'],
    defaultValue: 'flow',
  },
  'shapes.reveal': {
    values: ['none', 'fadeGlow', 'wipe', 'flicker'],
    defaultValue: 'fadeGlow',
  },
  'slit.edgeSide': {
    values: ['none', 'start', 'end', 'both', 'random'],
    defaultValue: 'none',
  },
  'slit.edgeShape': {
    values: ['round', 'bevel'],
    defaultValue: 'round',
  },
  'postprocess.voronoiDistMetric': VORONOI_DISTANCE_METRIC_LIMIT,
  'postprocess.voronoiFeature': VORONOI_FEATURE_LIMIT,
  'postprocess.glassSurfaceType': {
    values: ['organic', 'ripple'],
    defaultValue: 'organic',
  },
  'postprocess.glassTileEdgeMode': {
    values: ['clamp', 'tile', 'mirror', 'transparent'],
    defaultValue: 'mirror',
  },
} as const satisfies Record<string, EnumParameterLimit>;

export type EnumParameterLimitKey = keyof typeof ENUM_PARAMETER_LIMITS;
export type EnumParameterValue<K extends EnumParameterLimitKey> = (typeof ENUM_PARAMETER_LIMITS)[K]['values'][number];

export function getEnumParameterLimit<K extends EnumParameterLimitKey>(key: K): typeof ENUM_PARAMETER_LIMITS[K] {
  return ENUM_PARAMETER_LIMITS[key];
}

export function getEnumParameterDefault<K extends EnumParameterLimitKey>(
  key: K,
): EnumParameterValue<K> {
  return ENUM_PARAMETER_LIMITS[key].defaultValue as EnumParameterValue<K>;
}

export function normalizeEnumParameter<K extends EnumParameterLimitKey>(
  key: K,
  value: unknown,
): EnumParameterValue<K> {
  const limit = ENUM_PARAMETER_LIMITS[key] as EnumParameterLimit;
  return (
    typeof value === 'string' && limit.values.includes(value)
      ? value
      : limit.defaultValue
  ) as EnumParameterValue<K>;
}
export type ParameterLimitKey = keyof typeof PARAMETER_LIMITS;

export function getParameterLimit(key: ParameterLimitKey): ParameterLimit {
  return PARAMETER_LIMITS[key];
}

export function getParameterDefault(key: ParameterLimitKey, fallback?: number): number {
  const limit = PARAMETER_LIMITS[key] as ParameterLimit;
  return limit.defaultValue ?? fallback ?? limit.min;
}

export function wrapAngleDegrees(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

export function wrapAngleRadians(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const tau = Math.PI * 2;
  return ((value % tau) + tau) % tau;
}

export function clampParameter(value: unknown, fallback: number, limit: ParameterLimit): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  if (limit.wrapAngle) {
    return limit.angleUnit === 'radians' ? wrapAngleRadians(value) : wrapAngleDegrees(value);
  }
  const clamped = Math.min(limit.max, Math.max(limit.min, value));
  return limit.integer ? Math.round(clamped) : clamped;
}

export function normalizePartialNumericConfig<T extends Record<string, unknown>>(
  value: T,
  defaults: T,
  limitKeys: Partial<Record<keyof T, ParameterLimitKey>>,
): T {
  const next = { ...defaults, ...value } as T;
  for (const key of Object.keys(limitKeys) as Array<keyof T>) {
    const limitKey = limitKeys[key];
    if (!limitKey) continue;
    next[key] = clampParameter(next[key], defaults[key] as number, getParameterLimit(limitKey)) as T[keyof T];
  }
  return next;
}

const TRACK_LIMIT_KEYS: Record<string, ParameterLimitKey> = {
  'gradient.angle': 'gradient.angle',
  'noiseDistortion.dwRotAngle1': 'noise.dwRotAngle1',
  'noiseDistortion.dwRotAngle2': 'noise.dwRotAngle2',
  'noiseDistortion.dwDriftAngle': 'noise.dwDriftAngle',
  'noiseDistortion.aeSubRotation': 'noise.aeSubRotation',
  'noiseDistortion.causticsDepth': 'noise.causticsDepth',
  'noiseDistortion.causticsRefraction': 'noise.causticsRefraction',
  'noiseDistortion.causticsSharpness': 'noise.causticsSharpness',
  'noiseDistortion.causticsComplexity': 'noise.causticsComplexity',
  'noiseDistortion.causticsWaveSpread': 'noise.causticsWaveSpread',
  'noiseDistortion.causticsBoundaryWidth': 'noise.causticsBoundaryWidth',
  'noiseDistortion.phasorFrequency': 'noise.phasorFrequency',
  'noiseDistortion.phasorBandwidth': 'noise.phasorBandwidth',
  'noiseDistortion.phasorDirection': 'noise.phasorDirection',
  'noiseDistortion.phasorDirectionSpread': 'noise.phasorDirectionSpread',
  'noiseDistortion.phasorSharpness': 'noise.phasorSharpness',
  'noiseDistortion.phasorWarpStrength': 'noise.phasorWarpStrength',
  'noiseDistortion.phasorTangentMix': 'noise.phasorTangentMix',
  'noiseDistortion.phasorKernelDensity': 'noise.phasorKernelDensity',
  'noiseDistortion.perlinRoughness': 'noise.perlinRoughness',
  'noiseDistortion.perlinSharpness': 'noise.perlinSharpness',
  'noiseDistortion.perlinLayerMix': 'noise.perlinLayerMix',
  'noiseDistortion.perlinAngle': 'noise.perlinAngle',
  'noiseDistortion.perlinLoopWobble': 'noise.perlinLoopWobble',
  'noiseDistortion.chladniPatternCount': 'noise.chladniPatternCount',
  'noiseDistortion.chladniComplexity': 'noise.chladniComplexity',
  'noiseDistortion.chladniLineWidth': 'noise.chladniLineWidth',
  'noiseDistortion.chladniSharpness': 'noise.chladniSharpness',
  'noiseDistortion.chladniWarpStrength': 'noise.chladniWarpStrength',
  'noiseDistortion.chladniRotation': 'noise.chladniRotation',
  'noiseDistortion.chladniMapAngle': 'noise.chladniMapAngle',
  'noiseDistortion.chladniModeMix': 'noise.chladniModeMix',
  'noiseDistortion.chladniEdge': 'noise.chladniEdge',
  'noiseDistortion.chladniDetune': 'noise.chladniDetune',
  'slitScan.angle': 'slit.angle',
  'slitScan.offsetAngle': 'slit.offsetAngle',
  'normalMap.angle': 'normalMap.angle',
  'postprocess.kaleidoscopeRotation': 'postprocess.kaleidoscopeRotation',
  'postprocess.voronoiAngle': 'postprocess.voronoiAngle',
  'postprocess.glassRotation': 'postprocess.glassRotation',
  'postprocess.particleDirection': 'postprocess.particleDirection',
  'animation.direction': 'animation.direction',
  'animation.speed': 'animation.speed',
};

export function normalizeTrackValue(trackId: string, value: number): number {
  const key = TRACK_LIMIT_KEYS[trackId];
  return key ? clampParameter(value, 0, PARAMETER_LIMITS[key]) : Number.isFinite(value) ? value : 0;
}
