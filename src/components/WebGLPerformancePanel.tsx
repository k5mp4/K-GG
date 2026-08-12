import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { WebGLPerformanceProfiler } from '../lib/webglPerformance';
import {
  benchmarkResultJson,
  cancelWebGLFrame,
  captureWebGLFrame,
  isWebGLFrameCaptureActive,
  WEBGL_SPECTOR_CAPTURE_STATE_EVENT,
} from '../lib/webglPerformance';
import type { PerformanceSnapshot, PerformanceTab } from '../types/webglPerformance';

type Props = {
  profiler: WebGLPerformanceProfiler | null;
  canvas: HTMLCanvasElement | null;
  onBenchmarkFrame: () => void;
};

const tabs: Array<[PerformanceTab, string]> = [
  ['performance', 'Performance'],
  ['gpu', 'GPU Profiler'],
  ['resources', 'Resources'],
  ['validation', 'WebGL Validation'],
  ['capture', 'Capture Frame'],
  ['benchmark', 'Benchmark'],
];

function useProfilerSnapshot(profiler: WebGLPerformanceProfiler | null): PerformanceSnapshot | null {
  return useSyncExternalStore(
    profiler ? listener => profiler.subscribe(listener) : () => () => undefined,
    profiler ? () => profiler.getSnapshot() : () => null,
    () => null,
  );
}

function formatMs(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)} ms`;
}

function formatCount(value: number | null): string {
  return value === null ? 'Unavailable' : value.toFixed(0);
}

function downloadJson(value: string, filename: string): void {
  const blob = new Blob([value], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function WebGLPerformancePanel({ profiler, canvas, onBenchmarkFrame }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PerformanceTab>('performance');
  const [captureStarted, setCaptureStarted] = useState(() => isWebGLFrameCaptureActive());
  const snapshot = useProfilerSnapshot(profiler);
  const effectRows = useMemo(() => Object.entries(snapshot?.effects ?? {}).sort((a, b) => (b[1].averageMs ?? -1) - (a[1].averageMs ?? -1)), [snapshot]);

  useEffect(() => {
    const handleCaptureState = (event: Event) => {
      const active = (event as CustomEvent<{ active?: boolean }>).detail?.active;
      if (typeof active === 'boolean') setCaptureStarted(active);
    };
    window.addEventListener(WEBGL_SPECTOR_CAPTURE_STATE_EVENT, handleCaptureState);
    return () => window.removeEventListener(WEBGL_SPECTOR_CAPTURE_STATE_EVENT, handleCaptureState);
  }, []);

  const cancelCapture = () => {
    cancelWebGLFrame();
    setCaptureStarted(false);
  };

  if (!import.meta.env.DEV || !profiler || !snapshot) return null;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100000, pointerEvents: 'none', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        style={{ pointerEvents: 'auto', position: 'absolute', top: 10, right: 10, border: '1px solid rgba(123,255,209,0.35)', borderRadius: 4, background: 'rgba(5, 21, 18, 0.92)', color: '#a9ffe4', padding: '6px 8px', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
        aria-expanded={open}
      >
        {open ? 'Close Profiler' : 'Profiler'}
      </button>
      {captureStarted && !(open && tab === 'capture') && (
        <button
          type="button"
          onClick={cancelCapture}
          style={{ ...buttonStyle, pointerEvents: 'auto', position: 'absolute', top: 10, right: 92, zIndex: 1, background: 'rgba(112, 42, 32, 0.94)', borderColor: 'rgba(255, 180, 166, 0.62)', color: '#ffd9d1', boxShadow: '0 8px 20px rgba(0,0,0,0.2)' }}
        >
          Cancel Spector Capture
        </button>
      )}
      {open && (
        <section style={{ pointerEvents: 'auto', position: 'absolute', top: 42, right: 10, width: 'min(380px, calc(100% - 20px))', maxHeight: 'min(72vh, 600px)', overflow: 'auto', border: '1px solid rgba(123,255,209,0.24)', borderRadius: 6, background: 'rgba(5, 12, 14, 0.9)', backdropFilter: 'blur(8px)', color: '#dcfff4', boxShadow: '0 18px 48px rgba(0,0,0,0.38)', fontSize: 11 }}>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', padding: 7, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            {tabs.map(([value, label]) => (
              <button key={value} type="button" onClick={() => setTab(value)} style={{ border: 0, borderRadius: 3, background: tab === value ? '#a9ffe4' : 'rgba(255,255,255,0.07)', color: tab === value ? '#061410' : '#b5cfc7', padding: '5px 7px', fontSize: 10, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
          <div style={{ padding: 12 }}>
            {tab === 'performance' && <PerformanceView snapshot={snapshot} profiler={profiler} />}
            {tab === 'gpu' && <GpuView rows={effectRows} />}
            {tab === 'resources' && <ResourcesView snapshot={snapshot} />}
            {tab === 'validation' && <ValidationView snapshot={snapshot} profiler={profiler} />}
            {tab === 'capture' && <CaptureView canvas={canvas} profiler={profiler} captureStarted={captureStarted} onCaptureStarted={setCaptureStarted} onCancel={cancelCapture} />}
            {tab === 'benchmark' && <BenchmarkView snapshot={snapshot} profiler={profiler} onBenchmarkFrame={onBenchmarkFrame} />}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricGrid({ items }: { items: Array<[string, string]> }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>{items.map(([label, value]) => <div key={label} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 8, background: 'rgba(255,255,255,0.035)' }}><div style={{ color: '#7c9c92', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div><strong style={{ display: 'block', marginTop: 4, color: '#effff9', fontSize: 14 }}>{value}</strong></div>)}</div>;
}

function PerformanceView({ snapshot, profiler }: { snapshot: PerformanceSnapshot; profiler: WebGLPerformanceProfiler }) {
  const statsHostRef = useRef<HTMLDivElement>(null);
  const [statsAvailable, setStatsAvailable] = useState(false);

  useEffect(() => {
    const hasStatsOverlay = (profiler as WebGLPerformanceProfiler & {
      hasStatsOverlay?: () => boolean;
    }).hasStatsOverlay;
    setStatsAvailable(typeof hasStatsOverlay === 'function' && hasStatsOverlay.call(profiler));
    const mountStatsOverlay = (target: HTMLElement | null) => {
      // Keep the panel renderable across a Fast Refresh boundary where the
      // profiler instance may have been created by the previous module copy.
      const mount = (profiler as WebGLPerformanceProfiler & {
        mountStatsOverlay?: (mountTarget: HTMLElement | null) => boolean;
      }).mountStatsOverlay;
      return typeof mount === 'function' ? mount.call(profiler, target) : false;
    };
    setStatsAvailable(mountStatsOverlay(statsHostRef.current));
    return () => {
      mountStatsOverlay(null);
    };
  }, [profiler]);

  return <>
    <MetricGrid items={[
      ['FPS', snapshot.fps === null ? '—' : snapshot.fps.toFixed(1)],
      ['CPU frame', formatMs(snapshot.cpuFrameMs)],
      ['GPU frame', formatMs(snapshot.gpuFrameMs)],
      ['Draw calls', `${snapshot.drawCalls}`],
      ['Render passes', `${snapshot.renderPasses}`],
      ['Timer query', snapshot.timerQuerySupported ? 'Ready' : 'Unavailable'],
    ]} />
    <div style={{ marginTop: 12, border: '1px solid rgba(169,255,228,0.14)', borderRadius: 4, background: 'rgba(255,255,255,0.025)', overflow: 'hidden' }}>
      <div style={{ padding: '7px 8px', color: '#b9ffea', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase' }}>stats-gl · docked performance monitor</div>
      <div ref={statsHostRef} style={{ minHeight: 58, display: 'flex', alignItems: 'center', padding: '0 8px 8px', color: '#8eaaa1' }}>
        {!statsAvailable && <span>stats-gl is unavailable in this development session.</span>}
      </div>
    </div>
  </>;
}

function GpuView({ rows }: { rows: Array<[string, PerformanceSnapshot['effects'][string]]> }) {
  return <>
    <p style={hintStyle}>Asynchronous EXT_disjoint_timer_query_webgl2. Moving Average: last 60 valid samples.</p>
    <div style={tableStyle}><div style={headerStyle}><span>Effect</span><span>Current</span><span>Avg GPU</span><span>Peak</span><span>Ratio</span><span>Draw / Pass</span></div>{rows.length === 0 ? <div style={emptyStyle}>Waiting for valid GPU query samples…</div> : rows.map(([label, effect]) => <div key={label} style={rowStyle}><span style={{ color: '#e8fff8' }}>{label}</span><span>{formatMs(effect.currentMs)}</span><span>{formatMs(effect.averageMs)}</span><span>{formatMs(effect.peakMs)}</span><span>{effect.ratio === null ? '—' : `${(effect.ratio * 100).toFixed(1)}%`}</span><span>{effect.drawCalls} / {effect.renderPasses}</span></div>)}</div>
  </>;
}

function ResourcesView({ snapshot }: { snapshot: PerformanceSnapshot }) {
  const resources = snapshot.resources;
  return <><p style={hintStyle}>webgl-memory reports approximate live allocation information when GMAN_webgl_memory is available.</p><MetricGrid items={[
    ['Textures', formatCount(resources.textures)], ['Buffers', formatCount(resources.buffers)], ['Renderbuffers', formatCount(resources.renderbuffers)], ['Framebuffers', formatCount(resources.framebuffers)], ['Shaders', formatCount(resources.shaders)], ['Programs', formatCount(resources.programs)], ['Vertex arrays', formatCount(resources.vertexArrays)], ['Memory', resources.memoryBytes === null ? 'Unavailable' : `${(resources.memoryBytes / 1024 / 1024).toFixed(1)} MiB`],
  ]} /></>;
}

function ValidationView({ snapshot, profiler }: { snapshot: PerformanceSnapshot; profiler: WebGLPerformanceProfiler }) {
  return <><p style={hintStyle}>Validation is independent from Performance and is automatically disabled during Benchmark.</p><label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#d9fff1' }}><input type="checkbox" checked={snapshot.validationEnabled} disabled={!snapshot.validationAvailable} onChange={event => profiler.setValidationEnabled(event.target.checked)} /> Enable webgl-lint{!snapshot.validationAvailable && ' (Unavailable)'}</label>{snapshot.validationError && <pre style={{ marginTop: 10, padding: 8, whiteSpace: 'pre-wrap', color: '#ffb4a6', background: 'rgba(110,30,20,0.22)' }}>{snapshot.validationError}</pre>}</>;
}

function CaptureView({
  canvas,
  profiler,
  captureStarted,
  onCaptureStarted,
  onCancel,
}: {
  canvas: HTMLCanvasElement | null;
  profiler: WebGLPerformanceProfiler;
  captureStarted: boolean;
  onCaptureStarted: (active: boolean) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState('Capture only when needed; Spector.js adds inspection overhead.');
  const captureRequestRef = useRef(0);
  return <>
    <p style={hintStyle}>Capture the existing WebGL Canvas once. No second context or render loop is created.</p>
    <p style={hintStyle}>K-GG already targets <code>kgg-preview-canvas</code>. If you use Spector.js&apos;s <code>Choose Canvas...</code>, select <code>Id: kgg-preview-canvas</code>; ignore the small UI canvases.</p>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button
        type="button"
        style={primaryButtonStyle}
        onClick={() => {
          const requestId = ++captureRequestRef.current;
          void captureWebGLFrame(canvas!, profiler).then(ok => {
            if (captureRequestRef.current !== requestId) return;
            onCaptureStarted(ok);
            setStatus(ok ? 'Spector capture started. Cancel it here when finished.' : 'Spector.js is unavailable.');
          });
        }}
        disabled={!canvas || captureStarted}
      >
        Capture WebGL Frame
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => {
          captureRequestRef.current += 1;
          const cancelled = isWebGLFrameCaptureActive();
          onCancel();
          setStatus(cancelled ? 'Spector capture cancelled; preview and Effect Stack controls restored.' : 'No active Spector capture.');
        }}
        disabled={!captureStarted}
      >
        Cancel Spector Capture
      </button>
    </div>
    <p style={hintStyle}>{status}</p>
  </>;
}

function BenchmarkView({ snapshot, profiler, onBenchmarkFrame }: { snapshot: PerformanceSnapshot; profiler: WebGLPerformanceProfiler; onBenchmarkFrame: () => void }) {
  const running = snapshot.benchmarkStatus === 'running';
  return <><p style={hintStyle}>300 frames, current Preview state. Validation is disabled while collecting.</p><div style={{ display: 'flex', gap: 8 }}><button type="button" style={primaryButtonStyle} disabled={running} onClick={() => profiler.startBenchmark(onBenchmarkFrame, 300)}>Start 300-frame Benchmark</button>{running && <button type="button" style={buttonStyle} onClick={() => profiler.cancelBenchmark()}>Cancel</button>}</div>{snapshot.benchmark && <><div style={{ marginTop: 12 }}><MetricGrid items={[
    ['Frames', `${snapshot.benchmark.frameCount}`], ['Average FPS', snapshot.benchmark.averageFps === null ? '—' : snapshot.benchmark.averageFps.toFixed(1)], ['Average CPU', formatMs(snapshot.benchmark.averageCpuFrameMs)], ['Average GPU', formatMs(snapshot.benchmark.averageGpuFrameMs)], ['Peak frame', formatMs(snapshot.benchmark.peakFrameMs)], ['1% low frame', formatMs(snapshot.benchmark.onePercentLowFrameMs)], ['Draw calls', formatCount(snapshot.benchmark.averageDrawCalls)], ['Render passes', formatCount(snapshot.benchmark.averageRenderPasses)],
  ]} /></div><button type="button" style={{ ...buttonStyle, marginTop: 10 }} onClick={() => downloadJson(benchmarkResultJson(snapshot.benchmark!), 'kgg-webgl-benchmark.json')}>Download JSON</button></>}</>;
}

const buttonStyle = { border: '1px solid rgba(169,255,228,0.25)', borderRadius: 3, background: 'rgba(169,255,228,0.08)', color: '#b9ffea', padding: '5px 8px', fontSize: 10, cursor: 'pointer' };
const primaryButtonStyle = { ...buttonStyle, background: '#a9ffe4', color: '#061410', fontWeight: 700 };
const hintStyle = { color: '#8eaaa1', lineHeight: 1.5, margin: '0 0 10px' };
const tableStyle = { overflowX: 'auto' as const, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 };
const headerStyle = { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr .8fr 1fr', gap: 8, padding: '7px 8px', color: '#7c9c92', fontSize: 9, textTransform: 'uppercase' as const };
const rowStyle = { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr .8fr 1fr', gap: 8, padding: '8px', borderTop: '1px solid rgba(255,255,255,0.07)', whiteSpace: 'nowrap' as const };
const emptyStyle = { padding: 12, color: '#8eaaa1' };
