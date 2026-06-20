import type { PostprocessConfig } from '../types/distortion';
import type React from 'react';

type Props = {
  active: boolean;
  width: number;
  height: number;
  postprocess: PostprocessConfig;
};

type Point = {
  x: number;
  y: number;
};

const GUIDE_FILL = 'rgba(99, 179, 237, 0.07)';
const GUIDE_FILL_ALT = 'rgba(240, 234, 217, 0.045)';
const GUIDE_STROKE = 'rgba(240, 234, 217, 0.52)';
const GUIDE_ACCENT = 'rgba(99, 179, 237, 0.68)';
const GUIDE_TEXT = 'rgba(240, 234, 217, 0.74)';

function wedgePath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const startPoint = polarPoint(cx, cy, radius, start);
  const endPoint = polarPoint(cx, cy, radius, end);
  const largeArc = Math.abs(end - start) > Math.PI ? 1 : 0;
  const sweep = end > start ? 0 : 1;
  return `M ${cx} ${cy} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endPoint.x} ${endPoint.y} Z`;
}

function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy - Math.sin(angle) * radius,
  };
}

function labelStyle(x: number, y: number): React.CSSProperties {
  return {
    position: 'absolute',
    left: x,
    top: y,
    transform: 'translate(-50%, -50%)',
    padding: '2px 5px',
    color: GUIDE_TEXT,
    background: 'rgba(0, 0, 0, 0.26)',
    border: '1px solid rgba(240, 234, 217, 0.12)',
    fontSize: 9,
    fontFamily: 'monospace',
    lineHeight: 1.2,
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  };
}

function MirrorGuide({ width, height, mode }: { width: number; height: number; mode: PostprocessConfig['mirrorMode'] }) {
  const midX = width / 2;
  const midY = height / 2;
  const labelOffset = Math.max(18, Math.min(width, height) * 0.08);

  return (
    <>
      <svg className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <pattern id="mirror-guide-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(240,234,217,0.09)" strokeWidth="3" />
          </pattern>
          <marker id="mirror-guide-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill={GUIDE_STROKE} />
          </marker>
        </defs>

        {(mode === 'horizontal' || mode === 'quad') && (
          <>
            <rect x={midX} y="0" width={midX} height={height} fill={GUIDE_FILL} />
            <rect x={midX} y="0" width={midX} height={height} fill="url(#mirror-guide-hatch)" />
            <line x1={midX} y1="0" x2={midX} y2={height} stroke={GUIDE_ACCENT} strokeWidth="1.5" strokeDasharray="7 5" />
            <path
              d={`M ${midX - labelOffset} ${midY} C ${midX - labelOffset * 0.4} ${midY - labelOffset * 0.4}, ${midX + labelOffset * 0.4} ${midY - labelOffset * 0.4}, ${midX + labelOffset} ${midY}`}
              fill="none"
              stroke={GUIDE_STROKE}
              strokeWidth="1.3"
              markerEnd="url(#mirror-guide-arrow)"
            />
          </>
        )}

        {(mode === 'vertical' || mode === 'quad') && (
          <>
            <rect x="0" y="0" width={width} height={midY} fill={GUIDE_FILL_ALT} />
            <rect x="0" y="0" width={width} height={midY} fill="url(#mirror-guide-hatch)" />
            <line x1="0" y1={midY} x2={width} y2={midY} stroke={GUIDE_ACCENT} strokeWidth="1.5" strokeDasharray="7 5" />
            <path
              d={`M ${midX} ${midY + labelOffset} C ${midX + labelOffset * 0.4} ${midY + labelOffset * 0.4}, ${midX + labelOffset * 0.4} ${midY - labelOffset * 0.4}, ${midX} ${midY - labelOffset}`}
              fill="none"
              stroke={GUIDE_STROKE}
              strokeWidth="1.3"
              markerEnd="url(#mirror-guide-arrow)"
            />
          </>
        )}
      </svg>

      {(mode === 'horizontal' || mode === 'quad') && <div style={labelStyle(midX + labelOffset * 1.15, midY - labelOffset * 0.45)}>MIRROR</div>}
      {(mode === 'vertical' || mode === 'quad') && <div style={labelStyle(midX + labelOffset * 0.55, midY - labelOffset * 1.1)}>MIRROR</div>}
      {mode === 'quad' && <div style={labelStyle(midX + labelOffset * 1.15, midY - labelOffset * 1.1)}>MIRROR x2</div>}
    </>
  );
}

function KaleidoscopeGuide({ width, height, postprocess }: { width: number; height: number; postprocess: PostprocessConfig }) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.hypot(width, height);
  const slices = Math.max(2, Math.min(64, Math.round(postprocess.kaleidoscopeSlices || 8)));
  const sector = (Math.PI * 2) / slices;
  const rotation = ((postprocess.kaleidoscopeRotation || 0) * Math.PI) / 180;
  const start = -rotation - sector * 0.5;
  const sourceStart = -rotation;
  const sourceEnd = sourceStart + sector * 0.5;
  const sourceMid = (sourceStart + sourceEnd) * 0.5;
  const zoomRadius = Math.min(width, height) * 0.5 / Math.max(postprocess.kaleidoscopeZoom || 1, 0.001);

  return (
    <>
      <svg className="pointer-events-none absolute inset-0" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="kaleido-guide-soft">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        {Array.from({ length: slices }).map((_, idx) => {
          const a0 = start + idx * sector;
          const a1 = a0 + sector;
          return (
            <path
              key={idx}
              d={wedgePath(cx, cy, radius, a0, a1)}
              fill={idx % 2 === 0 ? GUIDE_FILL : GUIDE_FILL_ALT}
              stroke="rgba(240,234,217,0.13)"
              strokeWidth={0.75}
            />
          );
        })}

        <path
          d={wedgePath(cx, cy, radius, sourceStart, sourceEnd)}
          fill="rgba(99,179,237,0.14)"
          stroke={GUIDE_ACCENT}
          strokeWidth={1.4}
        />

        {Array.from({ length: slices }).map((_, idx) => {
          const angle = start + idx * sector;
          const p = polarPoint(cx, cy, radius, angle);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke={idx === 0 ? GUIDE_ACCENT : 'rgba(240,234,217,0.38)'}
              strokeOpacity={idx === 0 ? 1 : 0.72}
              strokeWidth={idx === 0 ? 1.4 : 0.8}
              strokeDasharray={idx === 0 ? 'none' : '7 6'}
            />
          );
        })}

        <circle cx={cx} cy={cy} r={Math.max(4, Math.min(width, height) * 0.008)} fill={GUIDE_TEXT} />
        <circle cx={cx} cy={cy} r={Math.max(zoomRadius, 8)} fill="none" stroke="rgba(240,234,217,0.36)" strokeWidth="1" strokeDasharray="5 6" filter="url(#kaleido-guide-soft)" />
      </svg>

      <div style={labelStyle(cx, cy - Math.min(height * 0.28, 90))}>{`${slices} SLICES`}</div>
      <div style={labelStyle(cx + Math.cos(sourceMid) * Math.min(width, height) * 0.22, cy - Math.sin(sourceMid) * Math.min(width, height) * 0.22)}>
        SOURCE
      </div>
    </>
  );
}

export function PostprocessOverlay({ active, width, height, postprocess }: Props) {
  if (!active || !postprocess.enabled || !postprocess.showOverlay) return null;
  if (postprocess.effectMode !== 'mirror' && postprocess.effectMode !== 'kaleidoscope') return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-screen">
      {postprocess.effectMode === 'mirror' ? (
        <MirrorGuide width={width} height={height} mode={postprocess.mirrorMode} />
      ) : (
        <KaleidoscopeGuide width={width} height={height} postprocess={postprocess} />
      )}
    </div>
  );
}
