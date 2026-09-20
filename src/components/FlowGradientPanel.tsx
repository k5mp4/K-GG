import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { SliderField } from './SliderField';
import { useLanguage } from '../i18n/LanguageProvider';

export function FlowGradientPanel() {
  const { t } = useLanguage();
  const { gradient, flowGradient, animation } = useGradientStore();
  const { setFlowGradient } = applicationCommands;
  const rampStops = [...gradient.stops].sort((a, b) => a.position - b.position);
  const rampPreview = rampStops.length > 0
    ? rampStops.map((stop) => `${stop.color} ${stop.position * 100}%`).join(', ')
    : '#ffffff 0%, #ffffff 100%';

  return (
    <div className="space-y-4" data-flow-gradient-panel>
      <div className="border border-cyan-200/20 bg-cyan-300/[0.04] px-3 py-2 text-[10px] leading-relaxed text-cream/70">
        {t('sandbox.flowHint')}
      </div>
      <div className="grid grid-cols-1 gap-2.5">
        <SliderField
          label="Seed"
          value={flowGradient.seed}
          onChange={(value) => setFlowGradient({ seed: value })}
          limitKey="flow.seed"
          format={(value) => Math.round(value).toString()}
        />
        <SliderField
          label="Particle Count"
          value={flowGradient.particleCount}
          onChange={(value) => setFlowGradient({ particleCount: value })}
          limitKey="flow.particleCount"
          format={(value) => Math.round(value).toLocaleString()}
        />
        <SliderField
          label="Particle Opacity"
          value={flowGradient.particleOpacity}
          onChange={(value) => setFlowGradient({ particleOpacity: value })}
          limitKey="flow.particleOpacity"
          format={(value) => Math.round(value * 100).toString() + '%'}
        />
        <SliderField
          label="Particle Size"
          value={flowGradient.particleSize}
          onChange={(value) => setFlowGradient({ particleSize: value })}
          limitKey="flow.particleSize"
          format={(value) => value.toFixed(2) + 'x'}
        />
        <SliderField
          label="Flow Opacity"
          value={flowGradient.flowOpacity}
          onChange={(value) => setFlowGradient({ flowOpacity: value })}
          limitKey="flow.flowOpacity"
          format={(value) => Math.round(value * 100).toString() + '%'}
        />
        <SliderField
          label="Curl Scale"
          value={flowGradient.curlScale}
          onChange={(value) => setFlowGradient({ curlScale: value })}
          limitKey="flow.curlScale"
          format={(value) => value.toFixed(1)}
        />
        <SliderField
          label="Curl Strength"
          value={flowGradient.curlStrength}
          onChange={(value) => setFlowGradient({ curlStrength: value })}
          limitKey="flow.curlStrength"
          format={(value) => value.toFixed(2)}
        />
        <SliderField
          label="Speed"
          value={flowGradient.speed}
          onChange={(value) => setFlowGradient({ speed: value })}
          limitKey="flow.speed"
          format={(value) => value.toFixed(2)}
        />
        <SliderField
          label="Ribbon Width"
          value={flowGradient.ribbonWidth}
          onChange={(value) => setFlowGradient({ ribbonWidth: value })}
          limitKey="flow.ribbonWidth"
          format={(value) => value.toFixed(1) + 'px'}
        />
        <SliderField
          label="Stretch"
          value={flowGradient.stretch}
          onChange={(value) => setFlowGradient({ stretch: value })}
          limitKey="flow.stretch"
          format={(value) => value.toFixed(2)}
        />
        <SliderField
          label="Density"
          value={flowGradient.density}
          onChange={(value) => setFlowGradient({ density: value })}
          limitKey="flow.density"
          format={(value) => value.toFixed(2)}
        />
        <SliderField
          label="Trail"
          value={flowGradient.trail}
          onChange={(value) => setFlowGradient({ trail: value })}
          limitKey="flow.trail"
          format={(value) => Math.round(value * 100).toString() + '%'}
        />
        <SliderField
          label="Contrast"
          value={flowGradient.contrast}
          onChange={(value) => setFlowGradient({ contrast: value })}
          limitKey="flow.contrast"
          format={(value) => value.toFixed(2)}
        />
      </div>
      <div className="border border-cream/15 bg-black/10 px-3 py-2.5" data-flow-gradient-ramp-preview>
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[9px] uppercase tracking-[0.14em] text-tab-inactive">
          <span>Gradient Ramp</span>
          <span className="text-[8px] normal-case tracking-normal text-cream/50">Current Ramp</span>
        </div>
        <div
          className="h-3 w-full border border-cream/20"
          style={{ background: `linear-gradient(90deg, ${rampPreview})` }}
          aria-label="Flow Gradient Ramp preview"
          role="img"
        />
        <p className="mt-1.5 text-[9px] leading-relaxed text-cream/60">
          Flow density is mapped to this Ramp. Edit the Gradient Ramp to reassign its colors.
        </p>
      </div>
      <div className="border-t border-cream/15 pt-3 text-[9px] uppercase tracking-[0.14em] text-tab-inactive">
        {t('sandbox.flowLoop')}: {animation.previewLoop ? t('common.on') : t('common.off')} · {t('animation.duration')}: {animation.duration.toFixed(2)}s
      </div>
    </div>
  );
}
