import { getEnumParameterLimit } from './parameterLimits';
import type { VoronoiDistanceMetric, VoronoiFeature } from '../types/distortion';

const VORONOI_METRIC_LABELS: Record<VoronoiDistanceMetric, string> = {
  euclidean: 'Euclidean',
  manhattan: 'Manhattan',
  chebyshev: 'Chebyshev',
  minkowski: 'Minkowski',
};

const VORONOI_FEATURE_LABELS: Record<VoronoiFeature, string> = {
  f1: 'F1',
  f2: 'F2',
  distance_to_edge: 'Edge',
};

export const VORONOI_METRICS: Array<{ value: VoronoiDistanceMetric; label: string }> = [
  ...getEnumParameterLimit('postprocess.voronoiDistMetric').values,
].map((value) => ({ value, label: VORONOI_METRIC_LABELS[value] }));

export const VORONOI_FEATURES: ReadonlyArray<readonly [VoronoiFeature, string]> = [
  ...getEnumParameterLimit('postprocess.voronoiFeature').values,
].map((value) => [value, VORONOI_FEATURE_LABELS[value]] as const);

export const VORONOI_DISTANCE_MAP: Record<VoronoiDistanceMetric, number> = {
  euclidean: 0,
  manhattan: 1,
  chebyshev: 2,
  minkowski: 3,
};

export const VORONOI_FEATURE_MAP: Record<VoronoiFeature, number> = {
  f1: 0,
  f2: 1,
  distance_to_edge: 2,
};
