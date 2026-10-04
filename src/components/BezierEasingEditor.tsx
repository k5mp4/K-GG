import { useRef, useCallback, useEffect, useState } from 'react';
import { InputCubicBezierPicker, type CubicBezierValue } from 'tweeq';
import { BEAT_SYNC_BEATS_PER_LOOP, getBeatSyncDurationSeconds, useGradientStore } from '../store/gradientStore';
import { BEAT_SYNC_RATES, normalizeBeatSyncBpm, normalizeBeatSyncRate } from '../lib/animationConfig';
import { applicationCommands } from '../application/commands';
import { EASING_PRESETS, type EasingPreset } from '../lib/easingBezier';
import { applyCubicBezierLink } from '../lib/linkedCubicBezier';
import { Toggle } from './Toggle';
import { Collapsible } from './Collapsible';
import { createDebouncedCommit, type DebouncedCommit } from '../lib/debouncedCommit';
import { useLanguage } from '../i18n/LanguageProvider';
import { localizeUiLabel } from '../i18n/uiLabels';

const MAX_BPM_TAPS = 16;
/** ベジェ編集を止めてからストアへ反映するまでの待ち時間。反映のたびにアプリ全体が再描画されるため、入力ごとには反映しない。 */
const CURVE_COMMIT_DELAY_MS = 150;

const BEAT_RATE_LABELS: Record<(typeof BEAT_SYNC_RATES)[number], string> = { 0.25: '×1/4', 0.5: '×1/2', 1: '×1', 2: '×2' };

const PRESET_LABELS: { key: EasingPreset; label: string }[] = [
  { key: 'linear', label: 'Linear' },
  { key: 'ease-in', label: 'Ease In' },
  { key: 'ease-out', label: 'Ease Out' },
  { key: 'ease-in-out', label: 'In-Out' },
];

export function BezierEasingEditor({ compact = false }: { compact?: boolean }) {
  const { language, t } = useLanguage();
  const { animation } = useGradientStore();
  const { setAnimation } = applicationCommands;
  const { easing } = animation;
  const beatSync = easing.beatSync ?? { enabled: false, bpm: 120, beatsPerBar: 4, subdivision: 4 as 3 | 4, rate: 1 as const };
  const beatRate = normalizeBeatSyncRate(beatSync.rate);
  const timeRemapActive = easing.enabled || beatSync.enabled;
  const bpmInputRef = useRef<HTMLInputElement>(null);
  const [bpmDraft, setBpmDraft] = useState(String(beatSync.bpm));
  const [tapCount, setTapCount] = useState(0);
  const [curveOpen, setCurveOpen] = useState(false);
  // ドラッグ中の値。ストアへの反映は間引き、パッド自体は手元の値で即座に描画する。
  const [curveDraft, setCurveDraft] = useState<CubicBezierValue | null>(null);
  const curveCommit = useRef<DebouncedCommit<CubicBezierValue> | null>(null);
  const cancelBpmRef = useRef(false);
  const bpmTapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    setBpmDraft(String(beatSync.bpm));
  }, [beatSync.bpm]);

  const applyPreset = useCallback((key: EasingPreset) => {
    const preset = EASING_PRESETS[key];
    setAnimation({ easing: { ...easing, p1: preset.p1, p2: preset.p2 } });
  }, [easing, setAnimation]);

  const updateBeatSync = useCallback((next: Partial<typeof beatSync>) => {
    const nextBeatSync = { ...beatSync, ...next };
    setAnimation({
      ...(nextBeatSync.enabled ? { duration: getBeatSyncDurationSeconds(nextBeatSync.bpm, nextBeatSync.rate) } : {}),
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
    const bpm = normalizeBeatSyncBpm(60000 / avgInterval);
    updateBeatSync({ bpm });
    setBpmDraft(String(bpm));
  }, [updateBeatSync]);

  const commitBpm = useCallback(() => {
    if (cancelBpmRef.current) {
      cancelBpmRef.current = false;
      return;
    }
    const bpm = normalizeBeatSyncBpm(Number(bpmDraft) || beatSync.bpm || 120);
    updateBeatSync({ bpm });
    setBpmDraft(String(bpm));
  }, [beatSync.bpm, bpmDraft, updateBeatSync]);

  useEffect(() => {
    const input = bpmInputRef.current;
    if (!input) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // 既定は1、Shiftで10、Altで0.1（小数の微調整）。
      const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      const bpm = normalizeBeatSyncBpm(beatSync.bpm + (e.deltaY < 0 ? step : -step));
      updateBeatSync({ bpm });
      setBpmDraft(String(bpm));
    };
    input.addEventListener('wheel', onWheel, { passive: false });
    return () => input.removeEventListener('wheel', onWheel);
  }, [beatSync.bpm, updateBeatSync]);

  const bezierValue: CubicBezierValue = curveDraft ?? [...easing.p1, ...easing.p2];

  curveCommit.current ??= createDebouncedCommit<CubicBezierValue>(CURVE_COMMIT_DELAY_MS, (next) => {
    const current = useGradientStore.getState().animation.easing;
    setAnimation({ easing: { ...current, p1: [next[0], next[1]], p2: [next[2], next[3]] } });
  });
  const curveDebounce = curveCommit.current;

  useEffect(() => () => curveDebounce.cancel(), [curveDebounce]);

  // プリセットなど、ドラッグ以外の理由でカーブが変わった時は、手元の値を捨ててストアの値に従う。
  useEffect(() => {
    if (curveDebounce.hasPending()) return;
    setCurveDraft(draft => (
      draft && (draft[0] !== easing.p1[0] || draft[1] !== easing.p1[1] || draft[2] !== easing.p2[0] || draft[3] !== easing.p2[1])
        ? null
        : draft
    ));
  }, [curveDebounce, easing.p1, easing.p2]);

  return (
    <div className="space-y-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-start gap-2 pr-6">
        <div>
          <span className="block text-xs text-deep">{t('animation.loopTiming')}</span>
          <span className="block text-[9px] text-tab-inactive">{t('animation.autoTracksOnly')}</span>
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

      {/* ポップアップではなく、パネル内で展開する（枠の外へはみ出さない） */}
      <div className={`py-1 ${compact ? 'scale-90 origin-top' : ''}`}>
        <button
          type="button"
          disabled={!timeRemapActive}
          aria-expanded={curveOpen}
          aria-controls="loop-timing-curve-editor"
          aria-label={t('animation.cubicBezier')}
          title={t('animation.cubicBezier')}
          onClick={() => setCurveOpen(open => !open)}
          className={`mx-auto flex h-9 w-9 items-center justify-center border bg-fire/10 transition-colors disabled:opacity-40 ${curveOpen ? 'border-fire' : 'border-fire/50 hover:border-fire'}`}
        >
          <svg viewBox="0 0 1 1" aria-hidden="true" className="h-6 w-6 overflow-visible">
            <path
              d={`M0 1 C${easing.p1[0]} ${1 - easing.p1[1]} ${easing.p2[0]} ${1 - easing.p2[1]} 1 0`}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.09"
              strokeLinecap="round"
              className="text-fire"
            />
          </svg>
        </button>
        <Collapsible isOpen={curveOpen && timeRemapActive}>
          <div id="loop-timing-curve-editor" className="pt-2">
            <div className="mx-auto h-40 w-40 border border-panel-border/70 bg-k-surface/60 p-[9px]">
              <InputCubicBezierPicker
                value={bezierValue}
                onChange={(candidate) => {
                  const next = applyCubicBezierLink(bezierValue, candidate, easing.linkMode);
                  setCurveDraft(next);
                  curveDebounce.schedule(next);
                }}
                onConfirm={() => {
                  curveDebounce.flush();
                  setCurveDraft(null);
                }}
                disabled={!timeRemapActive}
                aria-label={t('animation.cubicBezier')}
              />
            </div>
          </div>
        </Collapsible>
      </div>

      {/* Control point values */}
      <div className={`flex justify-between text-[10px] text-tab-inactive ${!timeRemapActive ? 'opacity-40' : ''}`}>
        <span>P1 ({easing.p1[0].toFixed(2)}, {easing.p1[1].toFixed(2)})</span>
        <span>P2 ({easing.p2[0].toFixed(2)}, {easing.p2[1].toFixed(2)})</span>
      </div>

      {/* Link mode */}
      <div className={`flex gap-1 ${!easing.enabled ? 'opacity-40 pointer-events-none' : ''}`}>
        {([
          { key: 'none',      label: t('animation.link.none') },
          { key: 'symmetric', label: t('animation.link.symmetric') },
          { key: 'coincide',  label: t('animation.link.coincide') },
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
              {localizeUiLabel(label, language)}
            </button>
          );
        })}
      </div>}

      <div className="space-y-2 border-t border-panel-border/30 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-deep">{t('animation.beatSync')}</span>
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
                step="any"
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

          <div>
            <div className="mb-1 text-[10px] text-tab-inactive">Beat</div>
            <div className="grid grid-cols-4 gap-1">
              {BEAT_SYNC_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  aria-pressed={beatRate === rate}
                  onClick={() => updateBeatSync({ rate })}
                  className={`py-1 rounded-none text-[10px] ${
                    beatRate === rate
                      ? 'bg-fire text-k-text'
                      : 'bg-k-surface hover:bg-k-muted text-k-text/80'
                  }`}
                >
                  {BEAT_RATE_LABELS[rate]}
                </button>
              ))}
            </div>
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
