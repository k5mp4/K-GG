import { useRef, useCallback, useEffect, useState } from 'react';
import { BEAT_SYNC_BEATS_PER_LOOP, getBeatSyncDurationSeconds, useGradientStore } from '../store/gradientStore';
import { evaluateCubicBezier, EASING_PRESETS, type EasingPreset } from '../lib/easingBezier';
import { Toggle } from './Toggle';

const SIZE_FULL = 160;
const SIZE_COMPACT = 120;
const PAD_FULL = 16;
const PAD_COMPACT = 12;
const MAX_BPM_TAPS = 16;

function toSvg(x: number, y: number, pad: number, inner: number): [number, number] {
  return [pad + x * inner, pad + (1 - y) * inner];
}

const PRESET_LABELS: { key: EasingPreset; label: string }[] = [
  { key: 'linear', label: 'Linear' },
  { key: 'ease-in', label: 'Ease In' },
  { key: 'ease-out', label: 'Ease Out' },
  { key: 'ease-in-out', label: 'In-Out' },
];

export function BezierEasingEditor({ compact = false }: { compact?: boolean }) {
  const SIZE = compact ? SIZE_COMPACT : SIZE_FULL;
  const PAD = compact ? PAD_COMPACT : PAD_FULL;
  const INNER = SIZE - PAD * 2;

  const { animation, setAnimation } = useGradientStore();
  const { easing } = animation;
  const beatSync = easing.beatSync ?? { enabled: false, bpm: 120, beatsPerBar: 4, subdivision: 4 as 3 | 4 };
  const timeRemapActive = easing.enabled || beatSync.enabled;
  const svgRef = useRef<SVGSVGElement>(null);
  const bpmInputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef<'p1' | 'p2' | null>(null);
  const [bpmDraft, setBpmDraft] = useState(String(beatSync.bpm));
  const [tapCount, setTapCount] = useState(0);
  const cancelBpmRef = useRef(false);
  const bpmTapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setBpmDraft(String(beatSync.bpm));
  }, [beatSync.bpm]);

  const getSvgPos = useCallback((e: MouseEvent | PointerEvent | React.PointerEvent): [number, number] => {
    const svg = svgRef.current;
    if (!svg) return [0, 0];
    const rect = svg.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left - PAD) / INNER));
    const y = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top - PAD) / INNER));
    return [x, y];
  }, []);

  const onPointerDown = useCallback((point: 'p1' | 'p2') => (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = point;

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const [x, y] = getSvgPos(ev);
      const rx = Math.round(x * 100) / 100;
      const ry = Math.round(y * 100) / 100;
      let newP1 = easing.p1;
      let newP2 = easing.p2;
      if (draggingRef.current === 'p1') {
        newP1 = [rx, ry];
        if (easing.linkMode === 'symmetric') {
          newP2 = [Math.round((1 - rx) * 100) / 100, Math.round((1 - ry) * 100) / 100];
        } else if (easing.linkMode === 'coincide') {
          newP2 = [rx, ry];
        }
      } else {
        newP2 = [rx, ry];
        if (easing.linkMode === 'symmetric') {
          newP1 = [Math.round((1 - rx) * 100) / 100, Math.round((1 - ry) * 100) / 100];
        } else if (easing.linkMode === 'coincide') {
          newP1 = [rx, ry];
        }
      }
      setAnimation({ easing: { ...easing, p1: newP1, p2: newP2 } });
    };
    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      e.currentTarget?.releasePointerCapture?.(e.pointerId);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [easing, getSvgPos, setAnimation]);

  const applyPreset = useCallback((key: EasingPreset) => {
    const preset = EASING_PRESETS[key];
    setAnimation({ easing: { ...easing, p1: preset.p1, p2: preset.p2 } });
  }, [easing, setAnimation]);

  const updateBeatSync = useCallback((next: Partial<typeof beatSync>) => {
    const nextBeatSync = { ...beatSync, ...next };
    setAnimation({
      ...(nextBeatSync.enabled ? { duration: getBeatSyncDurationSeconds(nextBeatSync.bpm) } : {}),
      easing: { ...easing, enabled: nextBeatSync.enabled ? true : easing.enabled, beatSync: nextBeatSync },
    });
  }, [beatSync, easing, setAnimation]);

  const tapBpm = useCallback(() => {
    const now = performance.now();
    const previous = bpmTapTimesRef.current[bpmTapTimesRef.current.length - 1];
    const times = previous && now - previous > 2000 ? [now] : [...bpmTapTimesRef.current, now].slice(-MAX_BPM_TAPS);
    bpmTapTimesRef.current = times;
    setTapCount(times.length);
    if (times.length < 2) return;

    const intervals = times.slice(1).map((time, index) => time - times[index]);
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const bpm = Math.max(1, Math.min(999, Math.round(60000 / avgInterval)));
    updateBeatSync({ bpm });
    setBpmDraft(String(bpm));
  }, [updateBeatSync]);

  const commitBpm = useCallback(() => {
    if (cancelBpmRef.current) {
      cancelBpmRef.current = false;
      return;
    }
    const bpm = Math.max(1, Math.min(999, Number(bpmDraft) || beatSync.bpm || 120));
    updateBeatSync({ bpm });
    setBpmDraft(String(bpm));
  }, [beatSync.bpm, bpmDraft, updateBeatSync]);

  useEffect(() => {
    const input = bpmInputRef.current;
    if (!input) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const bpm = Math.max(1, Math.min(999, beatSync.bpm + (e.deltaY < 0 ? step : -step)));
      updateBeatSync({ bpm });
      setBpmDraft(String(bpm));
    };
    input.addEventListener('wheel', onWheel, { passive: false });
    return () => input.removeEventListener('wheel', onWheel);
  }, [beatSync.bpm, updateBeatSync]);

  // 編集グラフは Beat Sync の反復分割ではなく、1区間分のベジェ形状を表示する
  const curvePath = (() => {
    const pts: string[] = [];
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const x = i / steps;
      const y = evaluateCubicBezier(x, easing.p1[0], easing.p1[1], easing.p2[0], easing.p2[1]);
      const [sx, sy] = toSvg(x, y, PAD, INNER);
      pts.push(i === 0 ? `M ${sx} ${sy}` : `L ${sx} ${sy}`);
    }
    return pts.join(' ');
  })();

  const [p1x, p1y] = toSvg(easing.p1[0], easing.p1[1], PAD, INNER);
  const [p2x, p2y] = toSvg(easing.p2[0], easing.p2[1], PAD, INNER);
  const [o0x, o0y] = toSvg(0, 0, PAD, INNER);
  const [o1x, o1y] = toSvg(1, 1, PAD, INNER);

  return (
    <div className="space-y-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-start gap-2 pr-6">
        <div>
          <span className="block text-xs text-deep">Loop Timing</span>
          <span className="block text-[9px] text-tab-inactive">Auto tracks only</span>
        </div>
        <Toggle
          variant="switch"
          size="xs"
          checked={easing.enabled}
          onChange={(v) => setAnimation({
            easing: {
              ...easing,
              enabled: v,
              beatSync: beatSync.enabled && !v ? { ...beatSync, enabled: false } : beatSync,
            },
          })}
        />
      </div>

      {/* SVG editor */}
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width={SIZE}
          height={SIZE}
          className={`rounded-none border border-cream/40 bg-k-bg select-none touch-none ${!timeRemapActive ? 'opacity-40 pointer-events-none' : ''}`}
          style={{ cursor: 'default' }}
        >
          {/* Grid lines */}
          <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + INNER} stroke="#1A1A1A" strokeWidth="1" />
          <line x1={PAD} y1={PAD + INNER} x2={PAD + INNER} y2={PAD + INNER} stroke="#1A1A1A" strokeWidth="1" />
          <line x1={PAD} y1={PAD + INNER / 2} x2={PAD + INNER} y2={PAD + INNER / 2} stroke="#141414" strokeWidth="1" strokeDasharray="3,3" />
          <line x1={PAD + INNER / 2} y1={PAD} x2={PAD + INNER / 2} y2={PAD + INNER} stroke="#141414" strokeWidth="1" strokeDasharray="3,3" />

          {/* Handle lines: origin→P1, destination→P2 */}
          <line x1={o0x} y1={o0y} x2={p1x} y2={p1y} stroke="#2E2E2E" strokeWidth="1" strokeDasharray="3,2" />
          <line x1={o1x} y1={o1y} x2={p2x} y2={p2y} stroke="#2E2E2E" strokeWidth="1" strokeDasharray="3,2" />

          {/* Bezier curve */}
          <path d={curvePath} fill="none" stroke="#D11402" strokeWidth="2" strokeLinecap="round" />

          {/* P1 control point (deep blue) */}
          <circle
            cx={p1x} cy={p1y} r={8}
            fill="#6075A4" stroke="#ECDBBE" strokeWidth="1.5"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown('p1')}
          />
          {/* P2 control point (fire red) */}
          <circle
            cx={p2x} cy={p2y} r={8}
            fill="#D11402" stroke="#ECDBBE" strokeWidth="1.5"
            style={{ cursor: 'grab' }}
            onPointerDown={onPointerDown('p2')}
          />

          {/* Corner anchors */}
          <circle cx={o0x} cy={o0y} r={3} fill="#2E2E2E" />
          <circle cx={o1x} cy={o1y} r={3} fill="#2E2E2E" />
        </svg>
      </div>

      {/* Control point values */}
      <div className={`flex justify-between text-[10px] text-tab-inactive ${!timeRemapActive ? 'opacity-40' : ''}`}>
        <span>P1 ({easing.p1[0].toFixed(2)}, {easing.p1[1].toFixed(2)})</span>
        <span>P2 ({easing.p2[0].toFixed(2)}, {easing.p2[1].toFixed(2)})</span>
      </div>

      {/* Link mode */}
      <div className={`flex gap-1 ${!easing.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {([
          { key: 'none',      label: 'None' },
          { key: 'symmetric', label: '点対称' },
          { key: 'coincide',  label: '一致' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              let newP2 = easing.p2;
              if (key === 'symmetric') {
                newP2 = [Math.round((1 - easing.p1[0]) * 100) / 100, Math.round((1 - easing.p1[1]) * 100) / 100];
              } else if (key === 'coincide') {
                newP2 = [easing.p1[0], easing.p1[1]];
              }
              setAnimation({ easing: { ...easing, p2: newP2, linkMode: key } });
            }}
            className={`flex-1 py-1 rounded-none text-[10px] ${
              easing.linkMode === key ? 'bg-fire text-k-text' : 'bg-k-surface hover:bg-k-muted text-k-text/80'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Presets (compact モード時は非表示) */}
      {!compact && <div className={`grid grid-cols-4 gap-1 ${!easing.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {PRESET_LABELS.map(({ key, label }) => {
          const preset = EASING_PRESETS[key];
          const isActive =
            Math.abs(easing.p1[0] - preset.p1[0]) < 0.01 &&
            Math.abs(easing.p1[1] - preset.p1[1]) < 0.01 &&
            Math.abs(easing.p2[0] - preset.p2[0]) < 0.01 &&
            Math.abs(easing.p2[1] - preset.p2[1]) < 0.01;
          return (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`text-[10px] py-1 rounded-none transition-colors ${
                isActive ? 'bg-fire text-k-text' : 'bg-k-surface hover:bg-k-muted text-k-text/80'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>}

      <div className="space-y-2 border-t border-panel-border/30 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-deep">Beat Sync</span>
          <Toggle
            variant="switch"
            size="xs"
            checked={beatSync.enabled}
            onChange={(v) => updateBeatSync({ enabled: v })}
          />
        </div>

        <div className={`space-y-2 ${!beatSync.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-[1fr_72px] gap-2">
            <label className="block text-[10px] text-tab-inactive">
              BPM
              <input
                ref={bpmInputRef}
                type="number"
                min={1}
                max={999}
                step={1}
                value={bpmDraft}
                onChange={(e) => setBpmDraft(e.target.value)}
                onBlur={commitBpm}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { commitBpm(); e.currentTarget.blur(); }
                  if (e.key === 'Escape') {
                    cancelBpmRef.current = true;
                    setBpmDraft(String(beatSync.bpm));
                    e.currentTarget.blur();
                  }
                }}
                className="mt-1 w-full bg-k-bg border border-k-muted/50 px-2 py-1 text-xs text-k-text outline-none focus:border-fire"
              />
            </label>
            <button
              type="button"
              onClick={tapBpm}
              className="mt-4 flex h-[26px] items-center justify-center border border-fire/50 bg-fire/10 px-2 text-[10px] font-display uppercase tracking-wider text-fire transition-colors hover:bg-fire hover:text-k-text focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
              title="Tap BPM"
            >
              {tapCount > 1 ? `${tapCount} Tap` : 'Tap'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="block text-[10px] text-tab-inactive">
              Loop
              <div className="mt-1 flex h-[26px] items-center border border-k-muted/50 bg-k-bg px-2 text-xs text-k-text">
                {BEAT_SYNC_BEATS_PER_LOOP} beats
              </div>
            </div>

            <div>
              <div className="mb-1 text-[10px] text-tab-inactive">Divide</div>
              <div className="grid grid-cols-2 gap-1">
                {([4, 3] as const).map((subdivision) => (
                  <button
                    key={subdivision}
                    onClick={() => updateBeatSync({ subdivision })}
                    className={`py-1 rounded-none text-[10px] ${
                      beatSync.subdivision === subdivision
                        ? 'bg-fire text-k-text'
                        : 'bg-k-surface hover:bg-k-muted text-k-text/80'
                    }`}
                  >
                    /{subdivision}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
