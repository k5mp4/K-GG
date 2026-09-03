import type { LatestState } from './latestState';

/** Tile coordinates are expressed in final-output pixel space. */
export type TileRenderOptions = {
  viewport: [number, number];
  offset: [number, number];
};

/**
 * Fully named input for one low-level frame render.
 *
 * The renderer still owns the implementation, but callers no longer need to
 * rely on a long positional argument list.  The fields intentionally mirror
 * the existing render() contract one-for-one so this is a structural seam,
 * not a new rendering policy.
 */
export type RenderFrameRequest = {
  gradient: LatestState['gradient'];
  noiseDistortion: LatestState['noiseDistortion'];
  diffuse: LatestState['diffuse'];
  slitScan: LatestState['slitScan'];
  stretch: LatestState['stretch'];
  normalMap: LatestState['normalMap'];
  radon: LatestState['radon'];
  iridescence: LatestState['iridescence'];
  manualDistort: LatestState['manualDistort'];
  postprocess: LatestState['postprocess'];
  matcap: LatestState['matcap'];
  width: LatestState['width'];
  height: LatestState['height'];
  time?: number;
  animDirection?: number;
  slitAnimTimeOverride?: number | null;
  stretchScanOverride?: number | null;
  tile?: TileRenderOptions;
  sourceImageCanvas?: LatestState['sourceImageCanvas'];
  imageGradientSource?: LatestState['imageGradientSource'];
  imageGradient: LatestState['imageGradient'];
  noiseLoopPeriod?: number;
  animationSpeed?: number;
  imageMaskSource?: LatestState['imageMaskSource'];
  imageMaskEnabled?: LatestState['imageMaskEnabled'];
  effectPipeline?: LatestState['effectPipeline'];
  clothGradient?: LatestState['clothGradient'];
  clothTime?: number;
  clothLoopPeriod?: number;
  seamless?: LatestState['seamless'];
  flowGradient?: LatestState['flowGradient'];
  flowNormalizedTime?: number;
  flowLoopEnabled?: boolean;
  flowSessionId?: string;
};
