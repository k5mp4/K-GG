import { useLayoutEffect, useRef } from 'react';
import type { Preset } from '../lib/presetModel';
import { renderFallbackPreview } from '../lib/presetPreview';

type PresetPreviewProps = {
  preset: Preset;
  className?: string;
};

export function PresetPreview({ preset, className = '' }: PresetPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const width = preset.state.resolution?.width ?? 800;
  const height = preset.state.resolution?.height ?? 800;

  useLayoutEffect(() => {
    if (preset.thumbnail) return;
    if (!canvasRef.current || !preset.state.gradient) return;
    renderFallbackPreview(canvasRef.current, preset.state.gradient, width, height);
  }, [height, preset.state.gradient, preset.thumbnail, width]);

  if (preset.thumbnail) {
    return <img src={preset.thumbnail} alt="" aria-hidden="true" loading="lazy" className={`block h-full w-full object-cover ${className}`} />;
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full object-cover ${className}`}
      style={{ background: 'repeating-conic-gradient(#353a39 0% 25%, #202523 0% 50%) 50% / 12px 12px' }}
    />
  );
}
