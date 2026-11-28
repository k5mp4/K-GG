import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { gradientRampPresets } from '../lib/gradientRampUtils';
import { useGradientStore } from '../store/gradientStore';
import { applicationCommands } from '../application/commands';
import { useLanguage } from '../i18n/LanguageProvider';
import { ClothGradientPanel } from './ClothGradientPanel';
import { ControllerPanel } from './ControllerPanel';
import { useOscReceiverStatus } from '../features/native/controllerReceiver';
import { getControllerSettings, subscribeControllerSettings, updateControllerSettings } from '../lib/controllerSettings';
import { FlowGradientPanel } from './FlowGradientPanel';
import { NormalMapPanel } from './NormalMapPanel';
import { PostprocessPanel } from './PostprocessPanel';
import { SeamlessPanel } from './SeamlessPanel';
import { ShapesPanel } from './ShapesPanel';
import { Toggle } from './Toggle';
import type { RenderViewMode } from '../types/renderView';

type SandboxProgramKey = 'normalMap' | 'prism' | 'particles' | 'flowGradient' | 'flowSplat' | 'flowTrail' | 'flowComposite' | 'cloth' | 'seamless' | 'shapes';
type SandboxProgramStatus = 'loading' | 'ready' | 'failed' | 'fallback';
type SandboxModuleKey = 'cloth' | 'normal' | 'prism' | 'particles' | 'flowGradient' | 'seamless' | 'shapes' | 'controller';

type SandboxModuleProps = {
  id: SandboxModuleKey;
  label: string;
  description: string;
  enabled: boolean;
  status: { label: string; className: string; quiet?: boolean };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleEnabled: (enabled: boolean) => void;
  badge?: ReactNode;
  children: ReactNode;
};

/**
 * One SANDBOX module as a borderless accordion row: the header carries the
 * name, an exceptional state (loading, unavailable, …) and the on/off switch;
 * only the open row renders its controls.
 */
function SandboxModule({
  id,
  label,
  description,
  enabled,
  status,
  open,
  onOpenChange,
  onToggleEnabled,
  badge,
  children,
}: SandboxModuleProps) {
  const contentId = `sandbox-module-${id}-content`;
  return (
    <section data-sandbox-module={id} data-open={open ? 'true' : 'false'} className="border-t border-panel-border first:border-t-0">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
          aria-controls={contentId}
          title={description}
          className="group flex min-w-0 flex-1 items-center gap-2 bg-transparent px-0 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-fire"
        >
          <svg
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-fire' : 'text-tab-inactive group-hover:text-k-text'}`}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m4 6 4 4 4-4" />
          </svg>
          <span className={`flex min-w-0 items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[0.15em] ${enabled || open ? 'text-k-text' : 'text-tab-inactive group-hover:text-k-text'}`}>
            <span className="truncate">{label}</span>
            {badge}
          </span>
        </button>
        {!status.quiet && (
          <span className={`shrink-0 text-[8px] font-display font-bold uppercase tracking-wider ${status.className}`}>
            {status.label}
          </span>
        )}
        <Toggle
          variant="switch"
          size="xs"
          checked={enabled}
          ariaLabel={`${label} ${enabled ? 'on' : 'off'}`}
          onChange={onToggleEnabled}
        />
      </div>
      {open && (
        <div id={contentId} className="pb-4 pt-1">
          {children}
        </div>
      )}
    </section>
  );
}

function moduleStatus(
  key: SandboxProgramKey,
  enabled: boolean,
  programStatus: Partial<Record<SandboxProgramKey, SandboxProgramStatus>>,
  t: (key: 'stack.status.off' | 'stack.status.loading' | 'stack.status.unavailable' | 'stack.status.fallback' | 'stack.status.applied' | 'stack.status.preparing') => string,
) {
  if (!enabled) return { label: t('stack.status.off'), className: 'text-cream/40', quiet: true };
  const status = programStatus[key];
  if (status === 'loading') return { label: t('stack.status.loading'), className: 'text-amber-300' };
  if (status === 'failed') return { label: t('stack.status.unavailable'), className: 'text-red-300' };
  if (status === 'fallback') return { label: t('stack.status.fallback'), className: 'text-cyan-300' };
  if (status === 'ready' || (key === 'cloth' && status === undefined)) return { label: t('stack.status.applied'), className: 'text-emerald-300', quiet: true };
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
    shapes,
  } = useGradientStore();
  const { setNormalMap, setClothGradient, setGradient, setEffectPipeline, setSeamless, setShapes } = applicationCommands;
  const controllerSettings = useSyncExternalStore(subscribeControllerSettings, getControllerSettings, getControllerSettings);
  const oscReceiver = useOscReceiverStatus();
  const [openModule, setOpenModule] = useState<SandboxModuleKey | null>('cloth');
  const moduleOpenProps = (key: SandboxModuleKey) => ({
    open: openModule === key,
    onOpenChange: (open: boolean) => setOpenModule(open ? key : null),
  });
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
  const shapesStatus = moduleStatus('shapes', shapes.enabled, programStatus, t);

  const controllerStatus: SandboxModuleProps['status'] = !oscReceiver.supported
    ? { label: t('stack.status.unavailable'), className: 'text-cream/40' }
    : !controllerSettings.enabled
      ? { label: t('stack.status.off'), className: 'text-cream/40', quiet: true }
      : oscReceiver.error
        ? { label: t('stack.status.unavailable'), className: 'text-red-300' }
        : oscReceiver.listening
          ? { label: t('stack.status.applied'), className: 'text-emerald-300', quiet: true }
          : { label: t('stack.status.preparing'), className: 'text-amber-300' };

  const setNormalEnabled = (enabled: boolean) => {
    setNormalMap({ enabled });
    if (enabled) setGradient({ stops: [...gradientRampPresets.mono] });
  };

  const betaBadge = <span className="text-[8px] font-medium tracking-normal text-amber-300/80" title={t('beta.experimental')}>Beta</span>;

  return (
    <div className="space-y-4" data-sandbox-panel>
      <h2 className="w-fit font-display text-sm font-bold uppercase tracking-[0.2em] text-k-text hint-label" title={t('sandbox.description')}>{t('effect.sandbox')}</h2>

      <div>
        <SandboxModule
          id="cloth"
          label="Cloth"
          {...moduleOpenProps('cloth')}
          description="3D wave cloth mesh mapped to Gradient Ramp lighting."
          enabled={clothGradient.enabled}
          status={clothStatus}
          onToggleEnabled={(enabled) => {
            setClothGradient({ enabled });
            onRenderViewModeChange(enabled ? 'cloth' : 'canvas');
          }}
          badge={betaBadge}
        >
          <ClothGradientPanel />
        </SandboxModule>
        <SandboxModule
          id="normal"
          label={t('effect.normal')}
          {...moduleOpenProps('normal')}
          description={t('sandbox.normalDescription')}
          enabled={normalMap.enabled}
          status={normalStatus}
          onToggleEnabled={setNormalEnabled}
          badge={betaBadge}
        >
          <NormalMapPanel embedded />
        </SandboxModule>
        <SandboxModule
          id="prism"
          label="Prism"
          {...moduleOpenProps('prism')}
          description={t('sandbox.prismDescription')}
          enabled={effectPipeline.prismEnabled}
          status={prismStatus}
          onToggleEnabled={(prismEnabled) => setEffectPipeline({ prismEnabled })}
        >
          <PostprocessPanel sandboxMode="prism" embedded />
        </SandboxModule>
        <SandboxModule
          id="particles"
          label="Particles"
          {...moduleOpenProps('particles')}
          description={t('sandbox.particlesDescription')}
          enabled={effectPipeline.particlesEnabled}
          status={particlesStatus}
          onToggleEnabled={(particlesEnabled) => setEffectPipeline({ particlesEnabled })}
        >
          <PostprocessPanel sandboxMode="particles" embedded />
        </SandboxModule>
        <SandboxModule
          id="flowGradient"
          label="Flow Gradient"
          {...moduleOpenProps('flowGradient')}
          description={t('sandbox.flowDescription')}
          enabled={Boolean(effectPipeline.flowGradientEnabled)}
          status={flowStatus}
          onToggleEnabled={(flowGradientEnabled) => setEffectPipeline({ flowGradientEnabled })}
        >
          <FlowGradientPanel />
        </SandboxModule>
        <SandboxModule
          id="seamless"
          label="Seamless"
          {...moduleOpenProps('seamless')}
          description={t('sandbox.seamlessDescription')}
          enabled={seamless.enabled}
          status={seamlessStatus}
          onToggleEnabled={(enabled) => setSeamless({ enabled })}
        >
          <SeamlessPanel />
        </SandboxModule>
        <SandboxModule
          id="shapes"
          label="Shapes"
          {...moduleOpenProps('shapes')}
          description={t('sandbox.shapesDescription')}
          enabled={shapes.enabled}
          status={shapesStatus}
          onToggleEnabled={(enabled) => setShapes({ enabled })}
          badge={betaBadge}
        >
          <ShapesPanel />
        </SandboxModule>
        <SandboxModule
          id="controller"
          label="Controller"
          {...moduleOpenProps('controller')}
          description={t('sandbox.controllerDescription')}
          enabled={controllerSettings.enabled}
          status={controllerStatus}
          onToggleEnabled={(enabled) => updateControllerSettings({ enabled })}
        >
          <ControllerPanel />
        </SandboxModule>

      </div>
    </div>
  );
}
