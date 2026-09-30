import { useEffect, useState, type ReactNode } from 'react';
import { gradientRampPresets } from '../lib/gradientRampUtils';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { ClothGradientPanel } from './ClothGradientPanel';
import { CustomSelect } from './CustomSelect';
import { FlowGradientPanel } from './FlowGradientPanel';
import { Icon } from './Icon';
import { NormalMapPanel } from './NormalMapPanel';
import { PostprocessPanel } from './PostprocessPanel';
import { SeamlessPanel } from './SeamlessPanel';
import { Toggle } from './Toggle';
import type { RenderViewMode } from '../types/renderView';

type SandboxProgramKey = 'normalMap' | 'prism' | 'particles' | 'flowGradient' | 'flowSplat' | 'flowTrail' | 'flowComposite' | 'cloth' | 'seamless';
type SandboxProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback';
type SandboxModuleKey = 'cloth' | 'normal' | 'prism' | 'particles' | 'flowGradient' | 'seamless';

type SandboxModuleProps = {
  id: SandboxModuleKey;
  label: string;
  description: string;
  enabled: boolean;
  status: { label: string; className: string };
  onToggleEnabled: (enabled: boolean) => void;
  badge?: ReactNode;
  children: ReactNode;
};

function SandboxModule({
  id,
  label,
  description,
  enabled,
  status,
  onToggleEnabled,
  badge,
  children,
}: SandboxModuleProps) {
  return (
    <section
      data-sandbox-module={id}
      className="overflow-hidden border border-cream/20 bg-k-surface/35 shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-stretch bg-cyan-300/[0.06]">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-cyan-200/45 bg-cyan-300/10 text-cyan-100" aria-hidden="true">
            <Icon name="grid" className="text-[13px]" />
          </span>
          <span className="min-w-0">
            <span className="hint-label flex w-fit items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.15em] text-k-text" title={description}>
              {label}
              {badge}
            </span>
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2 px-3">
          <span className={`text-[8px] font-display font-bold uppercase tracking-wider ${status.className}`}>
            {status.label}
          </span>
          <Toggle
            variant="switch"
            size="xs"
            checked={enabled}
            ariaLabel={`${label} ${enabled ? 'on' : 'off'}`}
            onChange={onToggleEnabled}
          />
        </div>
      </div>
      <div className="border-t border-cream/15 px-3 pb-4 pt-3">
        {children}
      </div>
    </section>
  );
}

function moduleStatus(
  key: SandboxProgramKey,
  enabled: boolean,
  programStatus: Partial<Record<SandboxProgramKey, SandboxProgramStatus>>,
  t: (key: 'stack.status.off' | 'stack.status.loading' | 'stack.status.unavailable' | 'stack.status.fallback' | 'stack.status.applied' | 'stack.status.preparing') => string,
) {
  if (!enabled) return { label: t('stack.status.off'), className: 'text-cream/40' };
  const status = programStatus[key];
  if (status === 'loading') return { label: t('stack.status.loading'), className: 'text-amber-300' };
  if (status === 'failed') return { label: t('stack.status.unavailable'), className: 'text-red-300' };
  if (status === 'fallback') return { label: t('stack.status.fallback'), className: 'text-cyan-300' };
  if (status === 'ready' || (key === 'cloth' && status === undefined)) return { label: t('stack.status.applied'), className: 'text-emerald-300' };
  return { label: t('stack.status.preparing'), className: 'text-amber-300' };
}

type SandboxPanelProps = {
  onRenderViewModeChange: (mode: Exclude<RenderViewMode, 'cone'>) => void;
};

export function SandboxPanel({ onRenderViewModeChange }: SandboxPanelProps) {
  const { t } = useLanguage();
  const {
    normalMap,
    clothGradient,
    effectPipeline,
    seamless,
  } = useGradientStore();
  const { setNormalMap, setClothGradient, setGradient, setEffectPipeline, setSeamless } = applicationCommands;
  const [selectedModule, setSelectedModule] = useState<SandboxModuleKey>('cloth');
  const [programStatus, setProgramStatus] = useState<Partial<Record<SandboxProgramKey, SandboxProgramStatus>>>({});

  useEffect(() => {
    const handleProgramState = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: SandboxProgramKey; state?: SandboxProgramStatus }>).detail;
      if (!detail?.key || !detail.state) return;
      const key = detail.key.startsWith('flow') ? 'flowGradient' : detail.key;
      setProgramStatus(current => ({ ...current, [key]: detail.state }));
    };
    window.addEventListener('kgg:webgl-lazy-program-state', handleProgramState);
    return () => window.removeEventListener('kgg:webgl-lazy-program-state', handleProgramState);
  }, []);

  const clothStatus = moduleStatus('cloth', clothGradient.enabled, programStatus, t);
  const normalStatus = moduleStatus('normalMap', normalMap.enabled, programStatus, t);
  const prismStatus = moduleStatus('prism', effectPipeline.prismEnabled, programStatus, t);
  const particlesStatus = moduleStatus('particles', effectPipeline.particlesEnabled, programStatus, t);
  const flowStatus = moduleStatus('flowGradient', Boolean(effectPipeline.flowGradientEnabled), programStatus, t);
  const seamlessStatus = moduleStatus('seamless', seamless.enabled, programStatus, t);
  const activeCount = [clothGradient.enabled, normalMap.enabled, effectPipeline.prismEnabled, effectPipeline.particlesEnabled, Boolean(effectPipeline.flowGradientEnabled), seamless.enabled]
    .filter(Boolean).length;

  const setNormalEnabled = (enabled: boolean) => {
    setNormalMap({ enabled });
    if (enabled) setGradient({ stops: [...gradientRampPresets.mono] });
  };

  const selectedLabel = selectedModule === 'cloth'
    ? 'Cloth'
    : selectedModule === 'normal'
      ? t('effect.normal')
    : selectedModule === 'prism' ? 'Prism' : selectedModule === 'particles' ? 'Particles' : selectedModule === 'flowGradient' ? 'Flow Gradient' : 'Seamless';

  return (
    <div className="space-y-4" data-sandbox-panel>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-k-text hint-label" title={t('sandbox.description')}>{t('effect.sandbox')}</h2>
        <span className="font-display text-[10px] font-bold text-cyan-100 hint-label" title={t('sandbox.active')}>{activeCount}<span className="text-cyan-100/40">/6</span></span>
      </div>

      <div className="space-y-3">
        <CustomSelect
          label="Edit Layer"
          value={selectedModule}
          localizeOptions={false}
          options={[
            { value: 'cloth', label: 'Cloth' },
            { value: 'normal', label: t('effect.normal') },
            { value: 'prism', label: 'Prism' },
            { value: 'particles', label: 'Particles' },
            { value: 'flowGradient', label: 'Flow Gradient' },
            { value: 'seamless', label: 'Seamless' },
          ]}
          onChange={(value) => setSelectedModule(value as SandboxModuleKey)}
        />

        {selectedModule === 'cloth' && (
          <SandboxModule
            id="cloth"
            label={selectedLabel}
            description="3D wave cloth mesh mapped to Gradient Ramp lighting."
            enabled={clothGradient.enabled}
            status={clothStatus}
            onToggleEnabled={(enabled) => {
              setClothGradient({ enabled });
              onRenderViewModeChange(enabled ? 'cloth' : 'canvas');
            }}
            badge={<span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-medium tracking-normal text-amber-300" title={t('beta.experimental')}>🧪 Beta</span>}
          >
            <ClothGradientPanel />
          </SandboxModule>
        )}

        {selectedModule === 'normal' && (
          <SandboxModule
            id="normal"
            label={selectedLabel}
            description={t('sandbox.normalDescription')}
            enabled={normalMap.enabled}
            status={normalStatus}
            onToggleEnabled={setNormalEnabled}
            badge={<span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-medium tracking-normal text-amber-300" title={t('beta.experimental')}>🧪 Beta</span>}
          >
            <NormalMapPanel embedded />
          </SandboxModule>
        )}

        {selectedModule === 'prism' && (
          <SandboxModule
            id="prism"
            label={selectedLabel}
            description={t('sandbox.prismDescription')}
            enabled={effectPipeline.prismEnabled}
            status={prismStatus}
            onToggleEnabled={(prismEnabled) => setEffectPipeline({ prismEnabled })}
          >
            <PostprocessPanel sandboxMode="prism" embedded />
          </SandboxModule>
        )}

        {selectedModule === 'particles' && (
          <SandboxModule
            id="particles"
            label={selectedLabel}
            description={t('sandbox.particlesDescription')}
            enabled={effectPipeline.particlesEnabled}
            status={particlesStatus}
            onToggleEnabled={(particlesEnabled) => setEffectPipeline({ particlesEnabled })}
          >
            <PostprocessPanel sandboxMode="particles" embedded />
          </SandboxModule>
        )}

        {selectedModule === 'flowGradient' && (
          <SandboxModule
            id="flowGradient"
            label={selectedLabel}
            description={t('sandbox.flowDescription')}
            enabled={Boolean(effectPipeline.flowGradientEnabled)}
            status={flowStatus}
            onToggleEnabled={(flowGradientEnabled) => setEffectPipeline({ flowGradientEnabled })}
          >
            <FlowGradientPanel />
          </SandboxModule>
        )}

        {selectedModule === 'seamless' && (
          <SandboxModule
            id="seamless"
            label={selectedLabel}
            description={t('sandbox.seamlessDescription')}
            enabled={seamless.enabled}
            status={seamlessStatus}
            onToggleEnabled={(enabled) => setSeamless({ enabled })}
          >
            <SeamlessPanel />
          </SandboxModule>
        )}

      </div>
    </div>
  );
}
