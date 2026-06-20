import type { BezierPath } from '../types/distortion';

export const bezierPresets: Record<string, BezierPath[]> = {
  // ── 横方向（左→右）パス ──
  wave: [
    {
      id: 'wave-1',
      closed: false,
      anchors: [
        { x: 0.0, y: 0.5, cp1: [0.0, 0.5], cp2: [0.25, 0.2] },
        { x: 0.5, y: 0.5, cp1: [0.25, 0.8], cp2: [0.75, 0.2] },
        { x: 1.0, y: 0.5, cp1: [0.75, 0.8], cp2: [1.0, 0.5] },
      ],
    }
  ],
  sCurve: [
    {
      id: 'scurve-1',
      closed: false,
      anchors: [
        { x: 0.0, y: 0.3, cp1: [0.0, 0.3], cp2: [0.3, 0.3] },
        { x: 0.5, y: 0.5, cp1: [0.2, 0.7], cp2: [0.8, 0.3] },
        { x: 1.0, y: 0.7, cp1: [0.7, 0.7], cp2: [1.0, 0.7] },
      ],
    }
  ],
  diagonal: [
    {
      id: 'diag-1',
      closed: false,
      anchors: [
        { x: 0.0, y: 0.0, cp1: [0.0, 0.0], cp2: [0.33, 0.0] },
        { x: 1.0, y: 1.0, cp1: [0.66, 1.0], cp2: [1.0, 1.0] },
      ],
    }
  ],
  height: [
    {
      id: 'height-1',
      closed: false,
      anchors: [
        { x: 0.0, y: 0.5, cp1: [0.0, 0.5], cp2: [0.33, 0.5] },
        { x: 1.0, y: 0.5, cp1: [0.67, 0.5], cp2: [1.0, 0.5] },
      ],
    }
  ],
  vWave: [
    {
      id: 'vwave-1',
      closed: false,
      anchors: [
        { x: 0.5, y: 0.0, cp1: [0.5, 0.0], cp2: [0.85, 0.25] },
        { x: 0.5, y: 0.5, cp1: [0.15, 0.25], cp2: [0.85, 0.75] },
        { x: 0.5, y: 1.0, cp1: [0.15, 0.75], cp2: [0.5, 1.0] },
      ],
    }
  ],
  zigzag: [
    {
      id: 'zigzag-1',
      closed: false,
      anchors: [
        { x: 0.5, y: 0.0, cp1: [0.5, 0.0], cp2: [0.82, 0.15] },
        { x: 0.82, y: 0.3, cp1: [0.82, 0.15], cp2: [0.18, 0.5] },
        { x: 0.18, y: 0.6, cp1: [0.18, 0.45], cp2: [0.82, 0.8] },
        { x: 0.5, y: 1.0, cp1: [0.82, 0.85], cp2: [0.5, 1.0] },
      ],
    }
  ],
  width: [
    {
      id: 'width-1',
      closed: false,
      anchors: [
        { x: 0.5, y: 0.0, cp1: [0.5, 0.0], cp2: [0.5, 0.33] },
        { x: 0.5, y: 1.0, cp1: [0.5, 0.67], cp2: [0.5, 1.0] },
      ],
    }
  ],
  circle: [
    {
      id: 'circle-1',
      closed: true,
      anchors: [
        { x: 0.5, y: 0.1, cp1: [0.2791, 0.1], cp2: [0.7209, 0.1] },
        { x: 0.9, y: 0.5, cp1: [0.9, 0.2791], cp2: [0.9, 0.7209] },
        { x: 0.5, y: 0.9, cp1: [0.7209, 0.9], cp2: [0.2791, 0.9] },
        { x: 0.1, y: 0.5, cp1: [0.1, 0.7209], cp2: [0.1, 0.2791] },
      ],
    }
  ],
};
