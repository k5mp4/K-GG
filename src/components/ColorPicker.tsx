import { InputColor } from 'tweeq';

interface Props {
  color: string;
  onChange: (newColor: string) => void;
  onClose?: () => void;
}

export function ColorPicker({ color, onChange, onClose }: Props) {
  return (
    <div className="k-color-picker relative flex flex-col gap-3 p-4 bg-[#1A1A1A]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-visible group">
      <div className="flex items-center justify-between mb-1">
        <span className="k-color-picker__title text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 select-none">
          Color Picker
        </span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="k-color-picker__close w-8 h-8 p-0 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full z-10"
            title="閉じる"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              xmlns="http://www.w3.org/2000/svg"
              style={{ display: 'block', pointerEvents: 'none' }}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="tq-color-input min-w-[240px]">
        <InputColor
          value={color || '#FFFFFF'}
          onChange={onChange}
          alpha={false}
          aria-label="Color picker"
        />
      </div>
    </div>
  );
}
