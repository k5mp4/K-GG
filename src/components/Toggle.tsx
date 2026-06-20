interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'checkbox' | 'switch';
  className?: string;
}

export function Toggle({ checked, onChange, size = 'md', variant = 'checkbox', className = '' }: ToggleProps) {
  if (variant === 'switch') {
    const trackSize = size === 'xs'
      ? 'h-5 w-10'
      : size === 'sm'
      ? 'h-5 w-11'
      : 'h-6 w-[58px]';
    const knobSize = size === 'xs' || size === 'sm'
      ? 'h-4 w-4'
      : 'h-5 w-5';
    const knobTranslate = size === 'xs'
      ? 'translate-x-[20px]'
      : size === 'sm'
      ? 'translate-x-[23px]'
      : 'translate-x-[33px]';
    const labelClass = size === 'xs' ? 'text-[7px]' : 'text-[8px]';
    const labelPosition = checked
      ? (size === 'xs' ? 'left-1.5 text-cream' : 'left-2 text-cream')
      : (size === 'xs' ? 'right-1.5 text-deep' : 'right-2 text-deep');
    const arrowSize = size === 'xs'
      ? 'border-y-[3px] border-l-[4px]'
      : 'border-y-[4px] border-l-[5px]';

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`group relative shrink-0 inline-flex items-center rounded-full border px-0 py-0 transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-fire focus-visible:ring-offset-1 focus-visible:ring-offset-black ${
          trackSize
        } ${
          checked
            ? 'border-fire bg-fire shadow-[0_0_18px_rgba(209,20,2,0.28)]'
            : 'border-cream/35 bg-k-surface shadow-[inset_0_0_0_1px_rgba(0,0,0,0.65)] hover:border-cream/70'
        } ${className}`}
      >
        <span
          className={`absolute inset-y-0 flex items-center font-display ${labelClass} font-bold uppercase leading-none transition-colors ${labelPosition}`}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
        <span
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-cream text-k-bg shadow-[0_1px_5px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out ${
            knobSize
          } ${checked ? knobTranslate : 'translate-x-0'}`}
        >
          <span
            className={`absolute left-1/2 top-1/2 h-0 w-0 -translate-x-[35%] -translate-y-1/2 ${arrowSize} border-y-transparent border-l-current transition-transform duration-200 ${
              checked ? 'rotate-180' : ''
            }`}
          />
        </span>
      </button>
    );
  }

  const box = size === 'sm' ? 16 : 20;
  const icon = size === 'sm' ? 9 : 11;

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{ width: box, height: box, padding: 0, background: 'none' }}
      className={`shrink-0 inline-flex items-center justify-center cursor-pointer rounded-none border-2 transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-fire focus-visible:ring-offset-1 focus-visible:ring-offset-black ${
        checked
          ? 'bg-fire border-fire'
          : 'bg-transparent border-k-muted hover:border-k-text'
      } ${className}`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 10 8"
        fill="none"
        style={{ opacity: checked ? 1 : 0, transition: 'opacity 0.1s ease' }}
      >
        <polyline
          points="1,4 3.5,6.5 9,1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
