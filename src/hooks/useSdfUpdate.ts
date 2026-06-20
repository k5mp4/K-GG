import { useEffect, useRef } from 'react';
import { generateDistanceMap, uploadDistanceMap } from '../lib/bezierAxis';
import { debounce } from '../lib/debounce';
import { SDF_MAP_SIZE, SDF_DEBOUNCE_MS } from '../lib/constants';
import type { WebGLContext } from '../lib/webgl';
import type { BezierPath } from '../types/distortion';
import type { LatestState } from '../types/latestState';

export function useSdfUpdate(
  webglRef: React.MutableRefObject<WebGLContext | null>,
  sdfReadyRef: React.MutableRefObject<boolean>,
  latestRef: React.RefObject<LatestState | null>,
  paths: BezierPath[],
  bezierEnabled: boolean,
  canvasWidth: number,
  canvasHeight: number,
  onSdfReady?: () => void,
) {
  const onSdfReadyRef = useRef(onSdfReady);
  onSdfReadyRef.current = onSdfReady;

  const debouncedSdfRef = useRef(debounce(() => {
    const ctx = webglRef.current;
    const latest = latestRef.current;
    if (!ctx || !latest) return;
    const paths = latest.bezierAxis.paths;
    if (!paths || paths.length === 0 || paths.every(p => p.anchors.length < 2)) return;
    const mapData = generateDistanceMap(paths, SDF_MAP_SIZE, SDF_MAP_SIZE, latest.width, latest.height);
    uploadDistanceMap(ctx.gl, mapData, SDF_MAP_SIZE, SDF_MAP_SIZE, ctx.distanceTexture);
    sdfReadyRef.current = true;
    onSdfReadyRef.current?.();
  }, SDF_DEBOUNCE_MS));

  useEffect(() => {
    if (!webglRef.current) return;
    if (!paths) return;
    if (paths.length === 0 || paths.every(p => p.anchors.length < 2)) {
      sdfReadyRef.current = false;
      return;
    }
    if (!bezierEnabled) return;
    debouncedSdfRef.current();
  }, [paths, bezierEnabled, canvasWidth, canvasHeight]); // eslint-disable-line react-hooks/exhaustive-deps
}
