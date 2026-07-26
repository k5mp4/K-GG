import { useRef, type KeyboardEvent } from 'react';
import type { GradientType } from '../types/gradient';
import { useLanguage } from '../i18n/LanguageProvider';
import type { MessageKey } from '../i18n/messages';

const TYPES: Array<{ value: GradientType; label: MessageKey; description: MessageKey }> = [
  { value: 'linear', label: 'gradient.type.linear', description: 'gradient.type.linearDescription' },
  { value: 'radial', label: 'gradient.type.radial', description: 'gradient.type.radialDescription' },
  { value: 'fourcolor', label: 'gradient.type.fourcolor', description: 'gradient.type.fourcolorDescription' },
  { value: 'diamond', label: 'gradient.type.diamond', description: 'gradient.type.diamondDescription' },
  { value: 'angle', label: 'gradient.type.angle', description: 'gradient.type.angleDescription' },
  { value: 'bezier', label: 'gradient.type.bezier', description: 'gradient.type.bezierDescription' },
];

function Anchor({ x, y, control = false }: { x: number; y: number; control?: boolean }) {
  return <circle cx={x} cy={y} r={control ? 2.2 : 3} fill={control ? 'var(--color-k-bg)' : 'currentColor'} stroke="currentColor" strokeWidth="1.4" />;
}

function TypeDiagram({ type }: { type: GradientType }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 56 38" className="h-9 w-full" aria-hidden="true" focusable="false">
      <rect x=".7" y=".7" width="54.6" height="36.6" rx="1" stroke="currentColor" strokeOpacity=".18" fill="var(--color-k-bg)" fillOpacity=".32" />
      {type === 'linear' && <><path d="M28 7v24" {...common} /><Anchor x={28} y={7} /><Anchor x={28} y={31} /></>}
      {type === 'radial' && <><circle cx="25" cy="19" r="12" {...common} /><path d="M25 19h12" {...common} /><Anchor x={25} y={19} /><Anchor x={37} y={19} /></>}
      {type === 'fourcolor' && <><path d="M13 9h30v20H13z" {...common} strokeOpacity=".45" /><Anchor x={13} y={9} /><Anchor x={43} y={9} /><Anchor x={13} y={29} /><Anchor x={43} y={29} /></>}
      {type === 'diamond' && <><path d="m28 6 17 13-17 13-17-13Z" {...common} /><path d="M28 19h14" {...common} /><Anchor x={28} y={19} /><Anchor x={42} y={19} /></>}
      {type === 'angle' && <><path d="M28 19h15" {...common} /><path d="M39 15l4 4-4 4" {...common} /><path d="M19 28a13 13 0 0 1 0-18" {...common} strokeOpacity=".55" /><Anchor x={28} y={19} /><Anchor x={43} y={19} /></>}
      {type === 'bezier' && <><path d="M12 30C22 30 34 8 44 8" {...common} /><path d="M12 30 22 30M44 8 34 8" {...common} strokeOpacity=".5" /><Anchor x={12} y={30} /><Anchor x={44} y={8} /><Anchor x={22} y={30} control /><Anchor x={34} y={8} control /></>}
    </svg>
  );
}

type GradientTypeSelectorProps = { value: GradientType; onChange: (value: GradientType) => void; disabled?: boolean };

export function GradientTypeSelector({ value, onChange, disabled = false }: GradientTypeSelectorProps) {
  const { t } = useLanguage();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const choose = (index: number) => {
    const normalized = (index + TYPES.length) % TYPES.length;
    onChange(TYPES[normalized].value);
    refs.current[normalized]?.focus();
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); choose(index + 1); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); choose(index - 1); }
    if (event.key === 'Home') { event.preventDefault(); choose(0); }
    if (event.key === 'End') { event.preventDefault(); choose(TYPES.length - 1); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(index); }
  };
  return (
    <div>
      <p className="mb-1 text-xs font-display uppercase tracking-wider text-deep">{t('gradient.type')}</p>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t('gradient.type')}>
        {TYPES.map((type, index) => {
          const checked = value === type.value;
          const label = t(type.label);
          const description = t(type.description);
          return (
            <button key={type.value} ref={element => { refs.current[index] = element; }} type="button" role="radio"
              aria-checked={checked} aria-label={`${label}: ${description}`} title={`${label} — ${description}`}
              tabIndex={checked ? 0 : -1} disabled={disabled} onClick={() => onChange(type.value)}
              onKeyDown={event => handleKeyDown(event, index)}
              className={`group min-w-0 border px-1.5 pb-1.5 pt-1 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fire disabled:cursor-not-allowed disabled:opacity-35 ${checked ? 'border-fire bg-fire/12 text-fire' : 'border-panel-border/70 bg-k-surface text-tab-inactive hover:border-cream/45 hover:text-k-text'}`}>
              <TypeDiagram type={type.value} />
              <span className="block truncate text-center text-[8px] font-display font-semibold uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
