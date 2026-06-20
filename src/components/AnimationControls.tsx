import { useGradientStore } from '../store/gradientStore';
import { BEAT_SYNC_BEATS_PER_LOOP, STORE_DEFAULTS } from '../store/gradientStore';
import { SliderField } from './SliderField';
import { AngleDial } from './AngleDial';
import { AnimatedButton } from './AnimatedButton';
import { Toggle } from './Toggle';

const D = STORE_DEFAULTS.animation;

export function AnimationControls() {
  const { animation, setAnimation, noiseDistortion, setNoiseDistortion, slitScan, setSlitScan, stretch, setStretch, iridescence, keyframeTracks } = useGradientStore();

  const hasRampTracks = Object.values(keyframeTracks).some(t => t.enabled && (t.propertyId.startsWith('gradientStop.') || t.propertyId.startsWith('opacityStop.')));
  const canAnimate = noiseDistortion.enabled || iridescence.enabled || slitScan.animEnabled || stretch.enabled || hasRampTracks;
  const beatSyncEnabled = animation.easing.beatSync?.enabled ?? false;

  if (!canAnimate) {
    return (
      <div className="pt-2">
        <p className="text-xs text-deep">Noise Distortion / Slit / Stretch を有効化、またはグラデーションストップのタイマーを記録するとアニメーション可能です</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 pt-2 transition-opacity duration-200 ${animation.enabled ? 'opacity-100' : 'opacity-0'}`}>
      <div>
        <label className="block text-xs mb-1 text-deep">Affect</label>
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Toggle size="sm" checked={animation.affectNoise} onChange={(v) => setAnimation({ affectNoise: v })} />
            <span className="text-xs text-k-text/80">Noise</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Toggle
              size="sm"
              checked={animation.affectSlit}
              onChange={(v) => {
                setAnimation({ affectSlit: v });
                if (v) setSlitScan({ animEnabled: true });
              }}
            />
            <span className="text-xs text-k-text/80">Slit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Toggle
              size="sm"
              checked={animation.affectRamp}
              onChange={(v) => setAnimation({ affectRamp: v })}
            />
            <span className="text-xs text-k-text/80">Ramp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Toggle
              size="sm"
              checked={animation.affectStretch}
              onChange={(v) => {
                setAnimation({ affectStretch: v });
                if (v) setStretch({ enabled: true });
              }}
            />
            <span className="text-xs text-k-text/80">Stretch</span>
          </div>
        </div>
      </div>

      {beatSyncEnabled ? (
        <div>
          <label className="block text-xs mb-1 text-deep">Duration</label>
          <div className="flex h-8 items-center justify-between border border-fire/40 bg-fire/10 px-2 text-xs text-k-text">
            <span>{animation.duration.toFixed(2)}s</span>
            <span className="text-[10px] uppercase tracking-wider text-fire">{BEAT_SYNC_BEATS_PER_LOOP} Beats</span>
          </div>
        </div>
      ) : (
        <SliderField
          label="Duration"
          min={1} max={30} step={1}
          value={animation.duration}
          onChange={(v) => setAnimation({ duration: v })}
          format={(v) => v + 's'}
          defaultValue={D.duration}
        />
      )}

      <SliderField
        label="Speed"
        min={0.01} max={3} step={0.01}
        value={animation.speed}
        onChange={(v) => setAnimation({ speed: v })}
        format={(v) => v.toFixed(2) + 'x'}
        defaultValue={D.speed}
      />

      <AngleDial
        label="Direction"
        value={animation.direction}
        onChange={(v) => setAnimation({ direction: v })}
        defaultValue={D.direction}
      />

      <div>
        <label className="block text-xs mb-1 text-deep">Noise Loop Mode</label>
        <div className="flex gap-2">
          {([
            ['legacy', 'normal'],
            ['seamless', 'LOOP'],
          ] as const).map(([mode, label]) => (
            <AnimatedButton
              key={mode}
              onClick={() => setNoiseDistortion({ noiseLoopMode: mode })}
              isActive={(noiseDistortion.noiseLoopMode ?? 'legacy') === mode}
              className="flex-1 py-1"
            >
              {label}
            </AnimatedButton>
          ))}
        </div>
      </div>

      {(noiseDistortion.noiseLoopMode ?? 'legacy') === 'seamless' && (
        <SliderField
          label="Loop Blend"
          min={0.05} max={1} step={0.01}
          value={noiseDistortion.noiseLoopBlend ?? 0.75}
          onChange={(v) => setNoiseDistortion({ noiseLoopBlend: v })}
          format={(v) => `${Math.round(v * 100)}%`}
          defaultValue={0.75}
          trackId="noiseDistortion.noiseLoopBlend"
        />
      )}

      <div>
        <label className="block text-xs mb-1 text-deep">FPS</label>
        <div className="flex gap-2">
          {([24, 30, 60] as const).map((fps) => (
            <AnimatedButton
              key={fps}
              onClick={() => setAnimation({ fps })}
              isActive={animation.fps === fps}
              className="flex-1 py-1"
            >
              {fps}
            </AnimatedButton>
          ))}
        </div>
      </div>
    </div>
  );
}
